import React, { useState } from 'react';
import { User } from '../types';
import { loginUser, registerUser } from '../services/storageService';
import { User as UserIcon, Smartphone, ArrowRight } from 'lucide-react';

interface AuthProps {
    onLogin: (user: User) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
    const [isRegistering, setIsRegistering] = useState(false);
    const [username, setUsername] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!username.trim()) {
            setError("Please enter a username.");
            return;
        }

        if (isRegistering) {
            const user = registerUser(username.trim());
            onLogin(user);
        } else {
            const result = loginUser(username.trim());
            if (result.success && result.user) {
                onLogin(result.user);
            } else {
                setError(result.message);
            }
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-full p-6 bg-slate-50">
            <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-8">
                <div className="flex justify-center mb-6">
                    <div className="bg-blue-100 p-3 rounded-full">
                        {isRegistering ? <Smartphone className="w-8 h-8 text-blue-600" /> : <UserIcon className="w-8 h-8 text-blue-600" />}
                    </div>
                </div>
                
                <h1 className="text-2xl font-bold text-center text-slate-800 mb-2">
                    {isRegistering ? 'ลงทะเบียนอุปกรณ์' : 'ลงชื่อเข้าใช้'}
                </h1>
                <p className="text-sm text-center text-slate-500 mb-8">
                    {isRegistering 
                        ? 'การลงทะเบียนจะผูกบัญชีของคุณกับอุปกรณ์นี้' 
                        : 'กรุณาใช้อุปกรณ์ที่ลงทะเบียนไว้'}
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Username (ชื่อผู้ใช้)
                        </label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            placeholder="เช่น somchai.HR"
                        />
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                        {isRegistering ? 'ลงทะเบียนและเข้าสู่ระบบ' : 'เข้าสู่ระบบ'}
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <button
                        onClick={() => {
                            setIsRegistering(!isRegistering);
                            setError(null);
                            setUsername('');
                        }}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                        {isRegistering 
                            ? 'มีบัญชีอยู่แล้ว? เข้าสู่ระบบ' 
                            : 'ใช้งานครั้งแรก? ลงทะเบียนอุปกรณ์'}
                    </button>
                </div>
            </div>
            <p className="mt-8 text-xs text-slate-400 text-center max-w-xs">
                หมายเหตุ: ระบบใช้วิธีการ Device Binding แทน MAC Address เนื่องจากข้อจำกัดด้านความปลอดภัยของ Browser
            </p>
        </div>
    );
};

export default Auth;