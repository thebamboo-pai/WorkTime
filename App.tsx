import React, { useState } from 'react';
import { User, ViewState } from './types';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import CheckIn from './components/CheckIn';
import CheckOut from './components/CheckOut';
import Report from './components/Report';

const App: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [currentView, setCurrentView] = useState<ViewState>(ViewState.AUTH);

    const handleLogin = (loggedInUser: User) => {
        setUser(loggedInUser);
        setCurrentView(ViewState.DASHBOARD);
    };

    const handleLogout = () => {
        setUser(null);
        setCurrentView(ViewState.AUTH);
    };

    const handleNavigate = (view: 'CHECK_IN' | 'CHECK_OUT' | 'REPORT') => {
        if (view === 'CHECK_IN') setCurrentView(ViewState.CHECK_IN);
        if (view === 'CHECK_OUT') setCurrentView(ViewState.CHECK_OUT);
        if (view === 'REPORT') setCurrentView(ViewState.REPORT);
    };

    const handleBackToDashboard = () => {
        setCurrentView(ViewState.DASHBOARD);
    };

    // View Router
    let content;
    if (!user || currentView === ViewState.AUTH) {
        content = <Auth onLogin={handleLogin} />;
    } else {
        switch (currentView) {
            case ViewState.DASHBOARD:
                content = (
                    <Dashboard 
                        user={user} 
                        onNavigate={handleNavigate} 
                        onLogout={handleLogout}
                    />
                );
                break;
            case ViewState.CHECK_IN:
                content = (
                    <CheckIn 
                        user={user} 
                        onBack={handleBackToDashboard} 
                        onSuccess={handleBackToDashboard} 
                    />
                );
                break;
            case ViewState.CHECK_OUT:
                content = (
                    <CheckOut 
                        user={user} 
                        onBack={handleBackToDashboard} 
                        onSuccess={handleBackToDashboard} 
                    />
                );
                break;
            case ViewState.REPORT:
                content = (
                    <Report 
                        user={user} 
                        onBack={handleBackToDashboard} 
                    />
                );
                break;
            default:
                content = <div>Unknown State</div>;
        }
    }

    return (
        <div className="h-full w-full max-w-md mx-auto bg-white shadow-2xl overflow-hidden relative">
            {content}
        </div>
    );
};

export default App;