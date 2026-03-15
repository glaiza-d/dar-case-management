import { useState, useEffect } from "react";
import api from "../api";
import { jwtDecode } from "jwt-decode";
import { ACCESS_TOKEN } from "../constants";

function MyAccount() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    address: ""
  });

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const res = await api.get("/api/user/me/");
      setUser(res.data);
      setFormData({
        first_name: res.data.first_name || "",
        last_name: res.data.last_name || "",
        email: res.data.email || "",
        phone: res.data.profile?.phone || "",
        address: res.data.profile?.address || ""
      });
    } catch (error) {
      console.error("Error fetching user:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: "", text: "" });
    
    try {
      await api.patch("/api/user/me/", formData);
      setMessage({ type: "success", text: "Profile updated successfully!" });
      
      // Update username in localStorage if changed
      const token = localStorage.getItem(ACCESS_TOKEN);
      if (token) {
        const decoded = jwtDecode(token);
        localStorage.setItem("username", formData.first_name || decoded.username);
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      setMessage({ type: "error", text: "Error updating profile. Please try again." });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (loading) {
    return <div className="loading">Loading profile...</div>;
  }

  return (
    <div className="my-account">
      <h1>My Account</h1>
      
      <div className="account-info">
        <div className="account-card">
          <h2>Profile Information</h2>
          
          {message.text && (
            <div className={`message ${message.type}`}>
              {message.text}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="account-form">
            <div className="form-row">
              <div className="form-group">
                <label>Username</label>
                <input
                  type="text"
                  value={user?.username || ""}
                  disabled
                  className="disabled-input"
                />
                <span className="input-hint">Username cannot be changed</span>
              </div>
              <div className="form-group">
                <label>Role</label>
                <input
                  type="text"
                  value={user?.profile?.role?.name || "Viewer"}
                  disabled
                  className="disabled-input"
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>First Name</label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label>Last Name</label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                />
              </div>
            </div>
            
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            
            <div className="form-group">
              <label>Phone</label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Enter phone number"
              />
            </div>
            
            <div className="form-group">
              <label>Address</label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows="3"
                placeholder="Enter address"
              />
            </div>
            
            <div className="form-actions">
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
        
        <div className="account-card">
          <h2>Account Details</h2>
          <div className="detail-item">
            <span className="detail-label">User ID:</span>
            <span className="detail-value">{user?.id}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Username:</span>
            <span className="detail-value">{user?.username}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Role:</span>
            <span className="detail-value">{user?.profile?.role?.name || "Viewer"}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Member Since:</span>
            <span className="detail-value">
              {user?.profile?.created_at 
                ? new Date(user.profile.created_at).toLocaleDateString() 
                : "N/A"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MyAccount;
