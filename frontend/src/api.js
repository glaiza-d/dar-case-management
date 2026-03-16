import axios from "axios"
import { ACCESS_TOKEN, REFRESH_TOKEN } from "./constants"

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL
})

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem(ACCESS_TOKEN);
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

// Response interceptor to handle 401 errors and refresh token
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config
        
        // If error is 401 and we haven't tried to refresh yet
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true
            
            const refreshToken = localStorage.getItem(REFRESH_TOKEN)
            
            if (refreshToken) {
                try {
                    const response = await axios.post(
                        `${import.meta.env.VITE_API_URL}/api/token/refresh/`,
                        { refresh: refreshToken }
                    )
                    
                    const { access } = response.data
                    localStorage.setItem(ACCESS_TOKEN, access)
                    
                    // Retry the original request
                    originalRequest.headers.Authorization = `Bearer ${access}`
                    return api(originalRequest)
                } catch (refreshError) {
                    // Refresh failed, redirect to login
                    localStorage.removeItem(ACCESS_TOKEN)
                    localStorage.removeItem(REFRESH_TOKEN)
                    localStorage.removeItem("username")
                    localStorage.removeItem("userFullName")
                    localStorage.removeItem("userRole")
                    window.location.href = "/login"
                }
            }
        }
        
        return Promise.reject(error)
    }
)

export default api
