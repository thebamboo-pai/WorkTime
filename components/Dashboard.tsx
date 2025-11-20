import React, { useEffect, useState } from 'react';
import { User, WorkLog } from '../types';
import { LogIn, LogOut, History } from 'lucide-react';
import { getActiveJob, getLogs } from '../services/storageService';

interface DashboardProps {
    user: User;
    onNavigate: (view: 'CHECK_IN' | 'CHECK_OUT') => void;
    onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onNavigate, onLogout }) => {
    const [activeJob, setActiveJob] = useState<WorkLog | undefined>(undefined);
    const [recentLogs, setRecentLogs] = useState<WorkLog[]>([]);

    useEffect(() => {
        setActiveJob(getActiveJob(user.username));
        const all = getLogs();
        // Filter only this user's logs and sort desc
        const userLogs = all
            .filter(l => l.username === user.username)
            .sort((a, b) => new Date(b.checkInTime).getTime() - new Date(a.checkInTime).getTime())
            .slice(0, 5);
        setRecentLogs(userLogs);
    }, [user.username]);

    return (
        <div className="flex flex-col h-full bg-slate-50">
            {/* Header */}
            <div className="bg-white p-6 pt-8 pb-6 shadow-sm">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-slate-500 text-sm mb-1">Welcome back,</p>
                        <h1 className="text-2xl font-bold text-slate-900">{user.username}</h1>
                    </div>
                    <button 
                        onClick={onLogout}
                        className="text-xs font-medium text-red-500 border border-red-100 bg-red-50 px-3 py-1 rounded-full"
                    >
                        Log out
                    </button>
                </div>
            </div>

            <div className="flex-1 p-6 space-y-6 overflow-y-auto">
                {/* Status Card */}
                {activeJob ? (
                    <div className="bg-green-50 border border-green-200 p-4 rounded-xl flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                            <span className="text-green-700 font-semibold">Working Now</span>
                        </div>
                        <p className="text-slate-700 font-medium">{activeJob.jobName}</p>
                        <p className="text-slate-500 text-xs">Since: {new Date(activeJob.checkInTime).toLocaleTimeString('th-TH')}</p>
                    </div>
                ) : (
                    <div className="bg-slate-200 p-4 rounded-xl text-slate-500 text-center text-sm">
                        You are not currently checked in.
                    </div>
                )}

                {/* Main Actions */}
                <div className="grid grid-cols-2 gap-4">
                    <button 
                        onClick={() => onNavigate('CHECK_IN')}
                        disabled={!!activeJob}
                        className={`p-6 rounded-2xl flex flex-col items-center justify-center gap-3 shadow-sm transition-all ${
                            !!activeJob 
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                            : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200'
                        }`}
                    >
                        <div className="p-3 bg-white/20 rounded-full">
                            <LogIn className="w-8 h-8" />
                        </div>
                        <span className="font-semibold">Check In</span>
                    </button>

                    <button 
                         onClick={() => onNavigate('CHECK_OUT')}
                         disabled={!activeJob}
                         className={`p-6 rounded-2xl flex flex-col items-center justify-center gap-3 shadow-sm transition-all ${
                            !activeJob 
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                            : 'bg-red-500 text-white hover:bg-red-600 shadow-red-200'
                        }`}
                    >
                        <div className="p-3 bg-white/20 rounded-full">
                            <LogOut className="w-8 h-8" />
                        </div>
                        <span className="font-semibold">Check Out</span>
                    </button>
                </div>

                {/* Recent History */}
                <div>
                    <div className="flex items-center gap-2 mb-4 text-slate-700 font-semibold">
                        <History className="w-5 h-5" />
                        <h2>Recent Activity</h2>
                    </div>
                    <div className="space-y-3">
                        {recentLogs.length === 0 ? (
                            <p className="text-slate-400 text-center py-4 text-sm">No history found.</p>
                        ) : (
                            recentLogs.map(log => (
                                <div key={log.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-bold text-slate-800">{log.jobName}</h3>
                                        <span className={`text-xs px-2 py-1 rounded-full ${log.status === 'CHECKED_IN' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                                            {log.status === 'CHECKED_IN' ? 'In Progress' : 'Completed'}
                                        </span>
                                    </div>
                                    <div className="text-xs text-slate-500 grid grid-cols-2 gap-2">
                                        <div>In: {new Date(log.checkInTime).toLocaleTimeString('th-TH', {hour: '2-digit', minute:'2-digit'})}</div>
                                        {log.checkOutTime && (
                                            <div>Out: {new Date(log.checkOutTime).toLocaleTimeString('th-TH', {hour: '2-digit', minute:'2-digit'})}</div>
                                        )}
                                    </div>
                                    {log.aiSummary && (
                                        <div className="mt-2 pt-2 border-t border-slate-50 text-xs text-indigo-600 italic">
                                            ✨ {log.aiSummary}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;