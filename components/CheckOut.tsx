import React, { useState, useEffect } from 'react';
import { MapPin, Clock, ArrowLeft, CheckCircle, AlertTriangle } from 'lucide-react';
import { User, WorkLog } from '../types';
import { getActiveJob, saveCheckOut } from '../services/storageService';
import { generateWorkSummary, getLocationName } from '../services/geminiService';
import Loader from './Loader';

interface CheckOutProps {
    user: User;
    onBack: () => void;
    onSuccess: () => void;
}

// Haversine formula to calculate distance in meters
const getDistanceFromLatLonInMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3; // Radius of the earth in meters
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return d;
};

const CheckOut: React.FC<CheckOutProps> = ({ user, onBack, onSuccess }) => {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
    const [address, setAddress] = useState<string | null>(null);
    const [activeJob, setActiveJob] = useState<WorkLog | undefined>(undefined);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [step, setStep] = useState<'LOADING' | 'CONFIRM' | 'SUBMITTING'>('LOADING');
    const [distance, setDistance] = useState<number | null>(null);
    const [allowed, setAllowed] = useState(false);

    const MAX_DISTANCE_METERS = 100;

    // Initial Data Load
    useEffect(() => {
        const job = getActiveJob(user.username);
        setActiveJob(job);
        
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (pos) => {
                    const lat = pos.coords.latitude;
                    const lng = pos.coords.longitude;
                    setLocation({ lat, lng });

                    // Check distance if job exists
                    if (job) {
                        const dist = getDistanceFromLatLonInMeters(
                            job.checkInLocation.lat, 
                            job.checkInLocation.lng, 
                            lat, 
                            lng
                        );
                        setDistance(dist);
                        setAllowed(dist <= MAX_DISTANCE_METERS);
                    }

                    // Get Readable Name
                    const fetchedAddress = await getLocationName(lat, lng);
                    setAddress(fetchedAddress);

                    setStep('CONFIRM');
                },
                (err) => {
                    console.error(err);
                    setStep('CONFIRM'); // Allow render even if loc fails (to show error)
                },
                { enableHighAccuracy: true }
            );
        } else {
            setStep('CONFIRM');
        }

        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, [user.username]);

    const handleCheckOut = async () => {
        if (!activeJob || !location || !allowed) return;
        setStep('SUBMITTING');

        try {
            // Calculate duration for AI summary
            const start = new Date(activeJob.checkInTime).getTime();
            const end = new Date().getTime();
            const hours = ((end - start) / (1000 * 60 * 60)).toFixed(2) + ' hours';

            // Optional: Generate summary using Gemini
            const summary = await generateWorkSummary(activeJob.jobName, hours);

            await saveCheckOut(activeJob.id, location.lat, location.lng, summary);
            onSuccess();
        } catch (e) {
            console.error(e);
            alert("Error checking out");
            setStep('CONFIRM');
        }
    };

    if (step === 'LOADING' || step === 'SUBMITTING') {
        return (
            <div className="flex h-full items-center justify-center bg-slate-50">
                <Loader text={step === 'LOADING' ? "Locating & Verifying..." : "Processing Check Out..."} />
            </div>
        );
    }

    if (!activeJob) {
        return (
            <div className="flex flex-col h-full bg-slate-50 p-6">
                <div className="bg-white rounded-xl p-8 text-center shadow-sm">
                    <div className="bg-yellow-100 p-4 rounded-full inline-block mb-4">
                        <CheckCircle className="w-8 h-8 text-yellow-600" />
                    </div>
                    <h2 className="text-lg font-bold text-slate-800 mb-2">ไม่พบงานที่ค้างอยู่</h2>
                    <p className="text-slate-500 mb-6">คุณไม่มีงานที่ Check In ค้างไว้ในขณะนี้</p>
                    <button onClick={onBack} className="text-blue-600 font-medium hover:underline">
                        กลับสู่หน้าหลัก
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-slate-50">
            <div className="bg-white p-4 shadow-sm flex items-center gap-4">
                <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full text-slate-600">
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <h1 className="text-xl font-bold text-slate-800">ลงเวลาออก (Check Out)</h1>
            </div>

            <div className="p-6 flex-1 overflow-y-auto space-y-6">
                
                {/* Active Job Card */}
                <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-6 rounded-xl shadow-lg text-white">
                    <div className="text-blue-100 text-sm mb-1">Active Job</div>
                    <h2 className="text-2xl font-bold mb-4">{activeJob.jobName}</h2>
                    <div className="flex items-center gap-2 text-blue-100 text-sm opacity-90">
                        <Clock className="w-4 h-4" />
                        Started: {new Date(activeJob.checkInTime).toLocaleTimeString('th-TH')}
                    </div>
                </div>

                {/* Distance Validation Card */}
                {distance !== null && (
                    <div className={`p-4 rounded-xl border ${allowed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                        <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-full ${allowed ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                {allowed ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                            </div>
                            <div>
                                <h3 className={`font-bold ${allowed ? 'text-green-800' : 'text-red-800'}`}>
                                    {allowed ? 'อยู่ในพื้นที่ทำงาน' : 'อยู่นอกพื้นที่ Check In'}
                                </h3>
                                <p className={`text-sm ${allowed ? 'text-green-600' : 'text-red-600'}`}>
                                    ระยะห่างจากจุด Check In: <strong>{distance.toFixed(1)} เมตร</strong>
                                </p>
                                {!allowed && (
                                    <p className="text-xs text-red-500 mt-1">
                                        ต้องอยู่ห่างไม่เกิน {MAX_DISTANCE_METERS} เมตรเพื่อลงเวลาออก
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Location */}
                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-3 mb-3 text-emerald-600">
                        <MapPin className="w-5 h-5" />
                        <span className="font-medium">Location Out</span>
                    </div>
                     {location ? (
                        <div>
                            {address && (
                                <p className="text-slate-900 font-semibold mb-2">
                                    {address}
                                </p>
                            )}
                            <div className="text-slate-500 text-sm font-mono">
                                {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
                            </div>
                        </div>
                    ) : (
                        <div className="text-red-500">Location required</div>
                    )}
                </div>

                {/* Current Time */}
                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-3 mb-2 text-orange-600">
                        <Clock className="w-5 h-5" />
                        <span className="font-medium">Time Out</span>
                    </div>
                    <div className="text-3xl font-bold text-slate-800 tabular-nums">
                        {currentTime.toLocaleTimeString('th-TH')}
                    </div>
                </div>

                <button
                    onClick={handleCheckOut}
                    disabled={!location || !allowed}
                    className="w-full bg-red-500 hover:bg-red-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl shadow-lg shadow-red-100 transition-all mt-4"
                >
                    {allowed ? 'CONFIRM CHECK OUT' : 'CANNOT CHECK OUT (Too Far)'}
                </button>
            </div>
        </div>
    );
};

export default CheckOut;