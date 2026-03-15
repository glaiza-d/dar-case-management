import { useState } from "react";
import api from "../api";
import { useNavigate } from "react-router-dom";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants";
import "../styles/Form.css"
import LoadingIndicator from "./LoadingIndicator";

function Form({ route, method }) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const name = method === "login" ? "Login" : "Register";

    const handleSubmit = async (e) => {
        setLoading(true);
        e.preventDefault();

        try {
            const res = await api.post(route, { username, password })
            if (method === "login") {
                localStorage.setItem(ACCESS_TOKEN, res.data.access);
                localStorage.setItem(REFRESH_TOKEN, res.data.refresh);
                
                // Fetch current user to get role and full name
                try {
                    const userRes = await api.get("/api/user/me/");
                    const userData = userRes.data;
                    localStorage.setItem("username", userData.username);
                    
                    // Store full name
                    const fullName = `${userData.first_name || ''} ${userData.last_name || ''}`.trim();
                    localStorage.setItem("userFullName", fullName || userData.username);
                    
                    // Get role from profile
                    const roleName = userData.profile?.role_name || 
                                     userData.profile?.role?.name || 
                                     "Viewer";
                    localStorage.setItem("userRole", roleName);
                } catch (userError) {
                    console.error("Error fetching user info:", userError);
                    localStorage.setItem("username", username);
                    localStorage.setItem("userFullName", username);
                    localStorage.setItem("userRole", "Viewer");
                }
                
                navigate("/")
            } else {
                navigate("/login")
            }
        } catch (error) {
            alert(error)
        } finally {
            setLoading(false)
        }
    };

    return (
        <form onSubmit={handleSubmit} className="form-container">
            <h1>{name}</h1>
            <input
                className="form-input"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
            />
            <input
                className="form-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
            />
            {loading && <LoadingIndicator />}
            <button className="form-button" type="submit">
                {name}
            </button>
        </form>
    );
}

export default Form