import { useState, useEffect } from "react";
import api from "../api";

function CaseManagement() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingCase, setViewingCase] = useState(null);
  const [editingCase, setEditingCase] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  
  // Comments and attachments state
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);
  const [attachments, setAttachments] = useState([]);
  
  // File upload/link state
  const [attachmentType, setAttachmentType] = useState("file"); // 'file' or 'link'
  const [fileLink, setFileLink] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  
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

  const fetchCaseDetails = async (caseId) => {
    try {
      const res = await api.get(`/api/cases/${caseId}/`);
      setViewingCase(res.data);
      setComments(res.data.comments || []);
      setAttachments(res.data.attachments || []);
    } catch (error) {
      console.error("Error fetching case details:", error);
    }
  };

  const handleRowClick = (caseItem) => {
    fetchCaseDetails(caseItem.id);
    setShowViewModal(true);
    setEditingCase(caseItem);
    setFormData({
      name: caseItem.name || "",
      location: caseItem.location || "",
      status: caseItem.status || "Open",
      priority: caseItem.priority || "Medium",
      description: caseItem.description || "",
      assigned_to: caseItem.assigned_to || ""
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Prepare form data - only send editable fields
      const submitData = {
        name: formData.name || "",
        location: formData.location || "",
        status: formData.status || "Open",
        description: formData.description || "",
        priority: formData.priority || "Medium",
        assigned_to: formData.assigned_to ? parseInt(formData.assigned_to) : null
      };
      
      console.log("Submitting case data:", submitData);
      
      let caseId;
      if (editingCase) {
        const res = await api.put(`/api/cases/${editingCase.id}/`, submitData);
        caseId = editingCase.id;
      } else {
        const res = await api.post("/api/cases/", submitData);
        caseId = res.data.id;
      }
      
      // Handle attachment upload/link (only for new cases)
      if (!editingCase && attachmentType === "file" && selectedFile) {
        const formDataFile = new FormData();
        formDataFile.append("file", selectedFile);
        // Note: file_name, file_path, file_type are extracted from the uploaded file by the backend
        await api.post(`/api/cases/${caseId}/attachments/`, formDataFile);
      } else if (!editingCase && attachmentType === "link" && fileLink) {
        const formDataLink = new FormData();
        formDataLink.append("file_name", fileLink.split("/").pop() || "External Link");
        formDataLink.append("file_path", fileLink);
        formDataLink.append("file_type", "link");
        await api.post(`/api/cases/${caseId}/attachments/`, formDataLink);
      }
      
      setShowModal(false);
      setShowViewModal(true);
      // Fetch the newly created case details to show in view modal
      const newCaseRes = await api.get(`/api/cases/${caseId}/`);
      setViewingCase(newCaseRes.data);
      setEditingCase(null);
      resetForm();
      fetchCases();
    } catch (error) {
      console.error("Error saving case:", error);
      if (error.response) {
        console.error("Server response:", error.response.data);
      }
      alert("Error saving case. Please try again.");
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      alert("Please enter a comment.");
      return;
    }
    if (!viewingCase) {
      alert("No case selected.");
      return;
    }
    
    setCommentLoading(true);
    try {
      // Only send comment field - case and user are auto-set by the backend
      await api.post(`/api/cases/${viewingCase.id}/comments/`, {
        comment: newComment
      });
      setNewComment("");
      fetchCaseDetails(viewingCase.id);
    } catch (error) {
      console.error("Error adding comment:", error);
      if (error.response) {
        console.error("Server response:", error.response.data);
      }
      alert("Error adding comment. Please try again.");
    } finally {
      setCommentLoading(false);
    }
  };

  const handleEdit = (caseItem) => {
    setEditingCase(caseItem);
    setFormData({
      name: caseItem.name || "",
      location: caseItem.location || "",
      status: caseItem.status || "Open",
      priority: caseItem.priority || "Medium",
      description: caseItem.description || "",
      assigned_to: caseItem.assigned_to || ""
    });
    setShowModal(true);
    setShowViewModal(false);
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
    setFileLink("");
    setSelectedFile(null);
    setAttachmentType("file");
  };

  const openNewCaseModal = () => {
    setEditingCase(null);
    resetForm();
    setShowModal(true);
    setShowViewModal(false);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
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
          placeholder="Search by case number, name, or location..."
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

      {/* Cases Table - Clickable rows */}
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
              <tr 
                key={caseItem.id} 
                onClick={() => handleRowClick(caseItem)}
                className="clickable-row"
              >
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
                <td onClick={(e) => e.stopPropagation()}>
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

      {/* View Case Modal */}
      {showViewModal && viewingCase && (
        <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Case Details: {viewingCase.case_number}</h2>
              <button className="modal-close" onClick={() => setShowViewModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="case-details">
                <div className="detail-row">
                  <strong>Name:</strong> <span>{viewingCase.name}</span>
                </div>
                <div className="detail-row">
                  <strong>Location:</strong> <span>{viewingCase.location}</span>
                </div>
                <div className="detail-row">
                  <strong>Status:</strong> 
                  <span className={`status-badge status-${viewingCase.status.toLowerCase().replace(' ', '-')}`}>
                    {viewingCase.status}
                  </span>
                </div>
                <div className="detail-row">
                  <strong>Priority:</strong> 
                  <span className={`priority-badge priority-${viewingCase.priority.toLowerCase()}`}>
                    {viewingCase.priority}
                  </span>
                </div>
                <div className="detail-row">
                  <strong>Assigned To:</strong> <span>{viewingCase.assigned_to_username || "Unassigned"}</span>
                </div>
                <div className="detail-row">
                  <strong>Created By:</strong> <span>{viewingCase.created_by_username}</span>
                </div>
                <div className="detail-row">
                  <strong>Description:</strong> 
                  <p>{viewingCase.description}</p>
                </div>
                
                {/* Attachments Section */}
                {attachments.length > 0 && (
                  <div className="detail-section">
                    <h3>Attachments</h3>
                    <ul className="attachment-list">
                      {attachments.map((att) => (
                        <li key={att.id}>
                          <a href={att.file_path} target="_blank" rel="noopener noreferrer">
                            {att.file_name}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {/* Comments Section */}
                <div className="comments-section">
                  <h3>Comments</h3>
                  <div className="comments-list">
                    {comments.length === 0 ? (
                      <p className="no-comments">No comments yet.</p>
                    ) : (
                      comments.map((comment) => (
                        <div key={comment.id} className="comment-item">
                          <div className="comment-header">
                            <strong>{comment.user_username}</strong>
                            <span className="comment-date">
                              {new Date(comment.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <p>{comment.comment}</p>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="add-comment">
                    <textarea
                      placeholder="Add a comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      rows="3"
                    />
                    <button 
                      className="btn-primary" 
                      onClick={handleAddComment}
                      disabled={commentLoading}
                    >
                      {commentLoading ? "Adding..." : "Add Comment"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowViewModal(false)}>
                Close
              </button>
              <button className="btn-primary" onClick={() => handleEdit(viewingCase)}>
                Edit Case
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New/Edit Case Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingCase ? "Edit Case" : "New Case"}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label>Case Name <span className="required-mark">*required</span></label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="Enter case name"
                />
              </div>
              <div className="form-group">
                <label>Location <span className="required-mark">*required</span></label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  required
                  placeholder="Enter location"
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
                <label>Description <span className="required-mark">*required</span></label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="4"
                  required
                  placeholder="Enter description"
                />
              </div>
              
              {/* Attachment Option - Only for new cases */}
              {!editingCase && (
                <div className="form-group">
                  <label>Attachment</label>
                  <div className="attachment-options">
                    <div className="attachment-type-select">
                      <label>
                        <input
                          type="radio"
                          name="attachmentType"
                          value="file"
                          checked={attachmentType === "file"}
                          onChange={(e) => setAttachmentType(e.target.value)}
                        />
                        Upload File
                      </label>
                      <label>
                        <input
                          type="radio"
                          name="attachmentType"
                          value="link"
                          checked={attachmentType === "link"}
                          onChange={(e) => setAttachmentType(e.target.value)}
                        />
                        Link to File
                      </label>
                    </div>
                    {attachmentType === "file" ? (
                      <input
                        type="file"
                        onChange={handleFileChange}
                        className="file-input"
                      />
                    ) : (
                      <input
                        type="url"
                        placeholder="Enter file URL (e.g., https://example.com/file.pdf)"
                        value={fileLink}
                        onChange={(e) => setFileLink(e.target.value)}
                        className="file-link-input"
                      />
                    )}
                  </div>
                </div>
              )}
              
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
