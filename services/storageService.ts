import { User, WorkLog } from '../types';

// Constants for LocalStorage keys
const USER_KEY = 'wt_user';
const LOGS_KEY = 'wt_logs';
const DEVICE_ID_KEY = 'wt_device_id';

/**
 * Simulates a MAC Address/Device Binding.
 * Browsers cannot access MAC addresses for security reasons.
 * We use a persistent UUID in LocalStorage instead.
 */
export const getDeviceId = (): string => {
    let deviceId = localStorage.getItem(DEVICE_ID_KEY);
    if (!deviceId) {
        deviceId = crypto.randomUUID();
        localStorage.setItem(DEVICE_ID_KEY, deviceId);
    }
    return deviceId;
};

export const registerUser = (username: string): User => {
    const deviceId = getDeviceId();
    const user: User = { username, deviceId };
    // In a real app, this would POST to a backend to save the binding
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    return user;
};

export const loginUser = (username: string): { success: boolean; message: string; user?: User } => {
    const storedUserStr = localStorage.getItem(USER_KEY);
    
    if (!storedUserStr) {
        return { success: false, message: 'User not found. Please register first.' };
    }

    const storedUser: User = JSON.parse(storedUserStr);
    const currentDeviceId = getDeviceId();

    if (storedUser.username !== username) {
         return { success: false, message: 'Username does not match the registered user on this device.' };
    }

    if (storedUser.deviceId !== currentDeviceId) {
        return { success: false, message: 'Device mismatch. You must use the registered device.' };
    }

    return { success: true, message: 'Login successful', user: storedUser };
};

/**
 * Mocks saving data to Google Sheets.
 * In production, this would fetch() to a Google Apps Script Web App URL.
 */
export const saveCheckIn = async (username: string, jobName: string, lat: number, lng: number): Promise<void> => {
    // Simulate API network delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const newLog: WorkLog = {
        id: crypto.randomUUID(),
        username,
        jobName,
        checkInTime: new Date().toISOString(),
        checkInLocation: { lat, lng },
        status: 'CHECKED_IN'
    };

    const logs = getLogs();
    logs.push(newLog);
    localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
    
    console.log("MOCK: Saved Check-in to Google Sheet", newLog);
};

export const saveCheckOut = async (logId: string, lat: number, lng: number, aiSummary?: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 1000));

    const logs = getLogs();
    const index = logs.findIndex(l => l.id === logId);
    
    if (index !== -1) {
        logs[index] = {
            ...logs[index],
            checkOutTime: new Date().toISOString(),
            checkOutLocation: { lat, lng },
            status: 'CHECKED_OUT',
            aiSummary
        };
        localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
        console.log("MOCK: Updated Check-out in Google Sheet", logs[index]);
    }
};

export const getLogs = (): WorkLog[] => {
    const logsStr = localStorage.getItem(LOGS_KEY);
    return logsStr ? JSON.parse(logsStr) : [];
};

export const getActiveJob = (username: string): WorkLog | undefined => {
    const logs = getLogs();
    // Returns the most recent check-in that hasn't been checked out
    return logs.find(log => log.username === username && log.status === 'CHECKED_IN');
};