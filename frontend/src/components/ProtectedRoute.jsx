import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { useState, useEffect } from "react";
import api from "../api";
import { REFRESH_TOKEN, ACCESS_TOKEN } from "../constants";
import Layout from "./Layout";

function ProtectedRoute({ children }) {
    const [isAuthorized, setIsAuthorized] = useState(null);

    useEffect(() => {
        auth().catch(() => setIsAuthorized(false));
    }, []);

    const refreshToken = async () => {
        const refreshToken = localStorage.getItem(REFRESH_TOKEN);
        try {
            const res = await api.post("/api/token/refresh/", { 
                refresh: refreshToken,
             });
             if (res.status === 200) {
                localStorage.setItem(ACCESS_TOKEN, res.data.access);
                
                // Decode and get username
                const decoded = jwtDecode(res.data.access);
                localStorage.setItem("username", decoded.username || "User");
                
                setIsAuthorized(true);
             } else {
                setIsAuthorized(false);
             }
        } catch (error) {
            console.log(error);
            setIsAuthorized(false);
        }
    };

    const auth = async () => {
        const token = localStorage.getItem(ACCESS_TOKEN);
        if (!token) {
            setIsAuthorized(false);
            return;
        }

        const decoded = jwtDecode(token);
        const tokenExpiration = decoded.exp;
        const now = Date.now() / 1000;

        // Store username
        localStorage.setItem("username", decoded.username || "User");

        if (tokenExpiration < now) {
            await refreshToken();
        } else {
            setIsAuthorized(true);   
        }
    };

    if (isAuthorized === null) {
        return <div className="loading-screen"><div className="loading">Loading...</div></div>;
    }

    return isAuthorized ? <Layout>{children}</Layout> : <Navigate to="/login" />;
}

export default ProtectedRoute;
