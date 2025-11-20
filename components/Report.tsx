import React, { useState, useMemo } from 'react';
import { User } from '../types';
import { getLogs } from '../services/storageService';
import { ArrowLeft, ChevronLeft, ChevronRight, Calendar, Clock, Briefcase, Sparkles, User as UserIcon, Download } from 'lucide-react';

interface ReportProps {
    user: User;
    onBack: () => void;
}

const Report: React.FC<ReportProps> = ({ user, onBack }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const logs = useMemo(() => {
        const allLogs = getLogs();
        return allLogs.filter(log => {
            // If Admin, show all logs. If User, show only their own.
            const isAuthorized = user.role === 'ADMIN' || log.username === user.username;
            return isAuthorized && log.status === 'CHECKED_OUT' && log.checkOutTime;
        });
    }, [user.username, user.role]);

    const monthlyLogs = useMemo(() => {
        return logs.filter(log => {
            const date = new Date(log.checkInTime);
            return date.getMonth() === currentDate.getMonth() &&
                   date.getFullYear() === currentDate.getFullYear();
        }).sort((a, b) => new Date(b.checkInTime).getTime() - new Date(a.checkInTime).getTime());
    }, [logs, currentDate]);

    const stats = useMemo(() => {
        let totalMs = 0;
        const jobStats: Record<string, { count: number, ms: number }> = {};

        monthlyLogs.forEach(log => {
            if (!log.checkOutTime) return;
            const duration = new Date(log.checkOutTime).getTime() - new Date(log.checkInTime).getTime();
            totalMs += duration;

            if (!jobStats[log.jobName]) {
                jobStats[log.jobName] = { count: 0, ms: 0 };
            }
            jobStats[log.jobName].count += 1;
            jobStats[log.jobName].ms += duration;
        });

        return { totalMs, jobStats };
    }, [monthlyLogs]);

    const changeMonth = (offset: number) => {
        const newDate = new Date(currentDate);
        newDate.setMonth(newDate.getMonth() + offset);
        setCurrentDate(newDate);
    };

    const formatDuration = (ms: number) => {
        const hours = Math.floor(ms / (1000 * 60 * 60));
        const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m`;
    };

    const downloadCSV = () => {
        if (monthlyLogs.length === 0) {
            alert("No data to export for this month.");
            return;
        }

        const headers = ['Username', 'Job Name', 'Date', 'Check In', 'Check Out', 'Duration (Min)', 'AI Summary'];
        const rows = monthlyLogs.map(log => {
            const checkIn = new Date(log.checkInTime);
            const checkOut = log.checkOutTime ? new Date(log.checkOutTime) : null;
            const durationMin = checkOut ? Math.floor((checkOut.getTime() - checkIn.getTime()) / 60000) : 0;

            return [
                log.username,
                `"${log.jobName.replace(/"/g, '""')}"`, // Escape quotes for CSV
                checkIn.toLocaleDateString('en-GB'), // DD/MM/YYYY format usually
                checkIn.toLocaleTimeString(),
                checkOut ? checkOut.toLocaleTimeString() : '',
                durationMin,
                `"${(log.aiSummary || '').replace(/"/g, '""')}"`
            ];
        });

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        // Add BOM for Excel/Thai character support
        const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `work_report_${currentDate.getFullYear()}_${currentDate.getMonth() + 1}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="flex flex-col h-full bg-slate-50">
             {/* Header */}
            <div className="bg-white p-4 shadow-sm flex items-center justify-between z-10">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full text-slate-600">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-xl font-bold text-slate-800">
                        {user.role === 'ADMIN' ? 'Admin Report' : 'My Report'}
                    </h1>
                </div>
                {user.role === 'ADMIN' && (
                    <button 
                        onClick={downloadCSV} 
                        className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-full transition-colors"
                        title="Download CSV"
                    >
                        <Download className="w-6 h-6" />
                    </button>
                )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {/* Month Selector */}
                <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                    <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-slate-100 rounded-full text-slate-600">
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <div className="flex items-center gap-2 font-bold text-lg text-slate-800">
                        <Calendar className="w-5 h-5 text-blue-600" />
                        {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </div>
                    <button onClick={() => changeMonth(1)} className="p-2 hover:bg-slate-100 rounded-full text-slate-600">
                        <ChevronRight className="w-6 h-6" />
                    </button>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white p-4 rounded-xl shadow-md">
                        <div className="flex items-center gap-2 opacity-90 mb-2">
                            <Clock className="w-4 h-4" />
                            <span className="text-xs font-medium">Total Hours</span>
                        </div>
                        <div className="text-2xl font-bold">
                            {formatDuration(stats.totalMs)}
                        </div>
                    </div>
                     <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                        <div className="flex items-center gap-2 text-slate-500 mb-2">
                            <Briefcase className="w-4 h-4" />
                            <span className="text-xs font-medium">Jobs Completed</span>
                        </div>
                        <div className="text-2xl font-bold text-slate-800">
                            {monthlyLogs.length}
                        </div>
                    </div>
                </div>

                {/* Job Breakdown */}
                {Object.keys(stats.jobStats).length > 0 && (
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Briefcase className="w-4 h-4 text-slate-500" />
                            Work Breakdown
                        </h3>
                        <div className="space-y-3">
                            {Object.entries(stats.jobStats).map(([job, data]: [string, { count: number, ms: number }]) => (
                                <div key={job} className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                                        <span className="text-slate-700 font-medium">{job}</span>
                                    </div>
                                    <div className="text-slate-500">
                                        {formatDuration(data.ms)} <span className="text-xs text-slate-400">({data.count})</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Activity List */}
                <div className="space-y-4">
                    <h3 className="font-bold text-slate-800 ml-1">Activity Log</h3>
                    {monthlyLogs.length === 0 ? (
                        <div className="text-center py-8 text-slate-400 bg-white rounded-xl border border-slate-100 border-dashed">
                            No records for this month.
                        </div>
                    ) : (
                        monthlyLogs.map(log => (
                            <div key={log.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <div className="font-bold text-slate-800">{log.jobName}</div>
                                        {/* Show username for Admins to distinguish users */}
                                        <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                                            <UserIcon className="w-3 h-3" />
                                            <span>{log.username}</span>
                                        </div>
                                    </div>
                                    <div className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-md font-mono">
                                        {new Date(log.checkInTime).toLocaleDateString()}
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 text-xs text-slate-500 mb-3 mt-3">
                                    <div className="flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                        {new Date(log.checkInTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                                        {log.checkOutTime ? new Date(log.checkOutTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '-'}
                                    </div>
                                    <div className="font-medium text-slate-600">
                                        {log.checkOutTime 
                                            ? formatDuration(new Date(log.checkOutTime).getTime() - new Date(log.checkInTime).getTime())
                                            : '-'}
                                    </div>
                                </div>
                                
                                {log.aiSummary && (
                                    <div className="bg-indigo-50 p-3 rounded-lg flex gap-2 items-start">
                                        <Sparkles className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                                        <p className="text-xs text-indigo-700 leading-relaxed">
                                            {log.aiSummary}
                                        </p>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default Report;