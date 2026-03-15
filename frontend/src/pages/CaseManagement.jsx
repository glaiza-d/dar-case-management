import { useState, useEffect } from "react";
import api from "../api";

function CaseManagement() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCase, setEditingCase] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    status: "Open",
    priority: "Medium",
    description: "",
    assigned_to: ""
  });

  useEffect(() => {
    fetchCases();
  }, [searchTerm, statusFilter]);

  const fetchCases = async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (statusFilter) params.append("status", statusFilter);
      
      const res = await api.get(`/api/cases/?${params.toString()}`);
      setCases(res.data);
    } catch (error) {
      console.error("Error fetching cases:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCase) {
        await api.put(`/api/cases/${editingCase.id}/`, formData);
      } else {
        await api.post("/api/cases/", formData);
      }
      setShowModal(false);
      setEditingCase(null);
      resetForm();
      fetchCases();
    } catch (error) {
      console.error("Error saving case:", error);
      alert("Error saving case. Please try again.");
    }
  };

  const handleEdit = (caseItem) => {
    setEditingCase(caseItem);
    setFormData({
      name: caseItem.name,
      location: caseItem.location,
      status: caseItem.status,
      priority: caseItem.priority,
      description: caseItem.description,
      assigned_to: caseItem.assigned_to || ""
    });
    setShowModal(true);
  };

  const handleDelete = async (caseId) => {
    if (!window.confirm("Are you sure you want to delete this case?")) return;
    try {
      await api.delete(`/api/cases/${caseId}/`);
      fetchCases();
    } catch (error) {
      console.error("Error deleting case:", error);
      alert("Error deleting case. You may not have permission.");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      location: "",
      status: "Open",
      priority: "Medium",
      description: "",
      assigned_to: ""
    });
  };

  const openNewCaseModal = () => {
    setEditingCase(null);
    resetForm();
    setShowModal(true);
  };

  if (loading) {
    return <div className="loading">Loading cases...</div>;
  }

  return (
    <div className="case-management">
      <div className="page-header">
        <h1>Case Management</h1>
        <button className="btn-primary" onClick={openNewCaseModal}>
          + New Case
        </button>
      </div>

      {/* Filters */}
      <div className="filters">
        <input
          type="text"
          placeholder="Search cases..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="filter-select"
        >
          <option value="">All Status</option>
          <option value="Open">Open</option>
          <option value="In Progress">In Progress</option>
          <option value="Pending">Pending</option>
          <option value="Resolved">Resolved</option>
          <option value="Closed">Closed</option>
        </select>
      </div>

      {/* Cases Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Case Number</th>
              <th>Name</th>
              <th>Location</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Assigned To</th>
              <th>Created Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {cases.map((caseItem) => (
              <tr key={caseItem.id}>
                <td>{caseItem.case_number}</td>
                <td>{caseItem.name}</td>
                <td>{caseItem.location}</td>
                <td>
                  <span className={`status-badge status-${caseItem.status.toLowerCase().replace(' ', '-')}`}>
                    {caseItem.status}
                  </span>
                </td>
                <td>
                  <span className={`priority-badge priority-${caseItem.priority.toLowerCase()}`}>
                    {caseItem.priority}
                  </span>
                </td>
                <td>{caseItem.assigned_to_username || "Unassigned"}</td>
                <td>{new Date(caseItem.created_date).toLocaleDateString()}</td>
                <td>
                  <button className="btn-edit" onClick={() => handleEdit(caseItem)}>
                    Edit
                  </button>
                  <button className="btn-delete" onClick={() => handleDelete(caseItem.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {cases.length === 0 && (
          <div className="empty-state">
            <p>No cases found. Create a new case to get started.</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingCase ? "Edit Case" : "New Case"}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label>Case Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Pending">Pending</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="4"
                />
              </div>
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingCase ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default CaseManagement;
