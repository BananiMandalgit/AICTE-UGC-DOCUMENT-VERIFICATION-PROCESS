import { useAuthStore } from "@/hooks/useAuthStore";
import React from "react";

export default function Settings() {
    const { logout } = useAuthStore();
    const navigate = require('react-router-dom').useNavigate();
    const handleLogout = () => {
        const loginSource = localStorage.getItem('loginSource') || 'aicte';
        logout();
        localStorage.removeItem('loginSource');
        if (loginSource === 'ugc') {
            window.location.replace('/ugc');
        } else {
            navigate('/');
        }
    };
    return <button className="w-full py-2 px-4 bg-red-500 text-white rounded hover:bg-red-600" onClick={handleLogout}>Logout</button>;
}
