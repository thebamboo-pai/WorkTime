import React, { useState, useEffect, useCallback } from 'react';
import { MapPin, Clock, Briefcase, ArrowLeft } from 'lucide-react';
import { User } from '../types';
import { saveCheckIn } from '../services/storageService';
import { getLocationName } from '../services/geminiService';
import Loader from './Loader';

interface CheckInProps {
    user: User;
    onBack: () => void;
    onSuccess: () => void;
}

const CheckIn: React.FC<CheckInProps> = ({ user, onBack, onSuccess }) => {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [jobName, setJobName] = useState('');
    const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
    const [address, setAddress] = useState<string | null>(null);
    const [locError, setLocError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Clock tick
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Get Location on Mount
    useEffect(() => {
        if (!navigator.geolocation) {
            setLocError("Geolocation is not supported by your browser.");
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                
                setLocation({ lat, lng });

                // Fetch address name using Gemini
                const fetchedAddress = await getLocationName(lat, lng);
                setAddress(fetchedAddress);
            },
            (error) => {
                setLocError("Unable to retrieve location. Please enable GPS.");
                console.error(error);
            },
            { enableHighAccuracy: true }
        );
    }, []);

    const handleCheckIn = async () => {
        if (!jobName.trim()) return;
        if (!location) return;

        setIsSubmitting(true);
        try {
            await saveCheckIn(user.username, jobName, location.lat, location.lng);
            onSuccess();
        } catch (e) {
            alert("Failed to check in.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSubmitting) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader text="Saving check-in data to Sheets..." />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-slate-50">
            <div className="bg-white p-4 shadow-sm flex items-center gap-4">
                <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full text-slate-600">
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <h1 className="text-xl font-bold text-slate-800">ลงเวลาเข้างาน (Check In)</h1>
            </div>

            <div className="p-6 flex-1 overflow-y-auto space-y-6">
                
                {/* Time Card */}
                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-3 mb-2 text-blue-600">
                        <Clock className="w-5 h-5" />
                        <span className="font-medium">Current Date & Time</span>
                    </div>
                    <div className="text-3xl font-bold text-slate-800 tabular-nums">
                        {currentTime.toLocaleTimeString('th-TH')}
                    </div>
                    <div className="text-slate-500">
                        {currentTime.toLocaleDateString('th-TH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                    <div className="mt-2 text-xs text-orange-500 bg-orange-50 inline-block px-2 py-1 rounded">
                        * Locked automatically
                    </div>
                </div>

                {/* Location Card */}
                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-3 mb-3 text-emerald-600">
                        <MapPin className="w-5 h-5" />
                        <span className="font-medium">Current Location</span>
                    </div>
                    {location ? (
                        <div className="space-y-1">
                            {address && (
                                <p className="text-slate-900 font-semibold text-lg mb-2">
                                    {address}
                                </p>
                            )}
                            <p className="text-slate-500 text-sm">
                                Coords: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                            </p>
                            <div className="mt-2 text-xs text-emerald-600 bg-emerald-50 inline-block px-2 py-1 rounded">
                                * Verified via GPS
                            </div>
                        </div>
                    ) : (
                        <div className="text-red-500 flex flex-col gap-2">
                            <span>{locError || "Locating..."}</span>
                            {!locError && <div className="animate-pulse h-4 bg-slate-200 rounded w-3/4"></div>}
                        </div>
                    )}
                </div>

                {/* Job Input */}
                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-3 mb-3 text-purple-600">
                        <Briefcase className="w-5 h-5" />
                        <span className="font-medium">Job Details</span>
                    </div>
                    <label className="block text-sm text-slate-600 mb-2">ชื่องาน / Job Name</label>
                    <input 
                        type="text" 
                        value={jobName}
                        onChange={(e) => setJobName(e.target.value)}
                        placeholder="กรอกชื่องานที่นี่..."
                        className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                </div>

                <button
                    onClick={handleCheckIn}
                    disabled={!location || !jobName.trim()}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-200 transition-all mt-4"
                >
                    CONFIRM CHECK IN
                </button>
            </div>
        </div>
    );
};

export default CheckIn;