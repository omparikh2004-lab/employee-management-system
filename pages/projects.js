import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useRouter } from "next/router";

export default function Projects() {
  const router = useRouter();
  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [projectEmployees, setProjectEmployees] = useState([]);

  const [newProject, setNewProject] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("Pending");
  const [deadline, setDeadline] = useState("");

  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchProjects();
    fetchEmployees();
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("projects")
      .select(`
        *,
        employee_projects(count)
      `)
      .order("name");

    setProjects(data || []);
    setLoading(false);
  };

  const fetchEmployees = async () => {
    const { data } = await supabase
      .from("employees")
      .select("id, full_name, role");

    setEmployees(data || []);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newProject.trim()) return alert("Please enter project name");
    setSubmitting(true);

    const { error } = await supabase.from("projects").insert([
      {
        name: newProject.trim(),
        description: description.trim(),
        status,
        deadline: deadline || null,
      },
    ]);

    if (!error) {
      setNewProject("");
      setDescription("");
      setDeadline("");
      setStatus("Pending");
      fetchProjects();
      alert("Project added successfully");
    } else {
      alert("Error adding project: " + error.message);
    }
    setSubmitting(false);
  };

  const handleEdit = async (project) => {
    const name = prompt("Enter new project name:", project.name);
    if (!name || name.trim() === project.name) return;

    const { error } = await supabase
      .from("projects")
      .update({ name: name.trim() })
      .eq("id", project.id);

    if (!error) {
      fetchProjects();
      alert("Project updated successfully");
    }
  };

  const handleDelete = async (id) => {
    const { data } = await supabase
      .from("employee_projects")
      .select("id")
      .eq("project_id", id);

    if (data.length > 0) {
      alert("Cannot delete project with assigned employees. Remove employees first.");
      return;
    }

    if (!confirm("Are you sure you want to delete this project?")) return;

    await supabase.from("projects").delete().eq("id", id);
    fetchProjects();
    alert("Project deleted successfully");
  };

  const handleAssign = async (projectId) => {
    if (!selectedEmployee) return alert("Please select an employee");

    const { error } = await supabase
      .from("employee_projects")
      .insert([
        {
          employee_id: selectedEmployee,
          project_id: projectId,
        },
      ]);

    if (error) {
      if (error.message.includes("duplicate")) {
        alert("Employee is already assigned to this project");
      } else {
        alert("Error assigning employee: " + error.message);
      }
    } else {
      setSelectedEmployee("");
      fetchProjectEmployees(projectId);
      fetchProjects();
      alert("Employee assigned successfully");
    }
  };

  const handleRemove = async (projectId, employeeId) => {
    if (!confirm("Remove this employee from the project?")) return;

    await supabase
      .from("employee_projects")
      .delete()
      .eq("project_id", projectId)
      .eq("employee_id", employeeId);

    fetchProjectEmployees(projectId);
    fetchProjects();
    alert("Employee removed successfully");
  };

  const fetchProjectEmployees = async (projectId) => {
    if (selectedProjectId === projectId) {
      setSelectedProjectId(null);
      return;
    }

    setSelectedProjectId(projectId);

    const { data } = await supabase
      .from("employee_projects")
      .select(`employees (id, full_name, role)`)
      .eq("project_id", projectId);

    const list = data.map(d => d.employees).filter(Boolean);
    setProjectEmployees(list);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Pending": return "status-pending";
      case "In Progress": return "status-progress";
      case "Completed": return "status-completed";
      default: return "status-pending";
    }
  };

  const filtered = projects.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="projects-page">
      {/* Header */}
      <div className="header">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="page-subtitle">Manage your organization's projects and team assignments</p>
        </div>
        <button className="back-btn" onClick={() => router.push('/')}>
          <svg className="btn-icon" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Dashboard
        </button>
      </div>

      {/* Search Bar */}
      <div className="search-section">
        <div className="search-wrapper">
          <svg className="search-icon" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
          </svg>
          <input
            type="text"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {/* Add Project Form */}
      <div className="form-card">
        <h3 className="form-title">
          <svg className="form-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Add New Project
        </h3>
        <form onSubmit={handleAdd} className="add-form">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Project Name</label>
              <input
                type="text"
                placeholder="Enter project name"
                value={newProject}
                onChange={(e) => setNewProject(e.target.value)}
                className="form-input"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="form-select">
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                placeholder="Enter project description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="form-textarea"
                rows="3"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Deadline</label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="form-input"
              />
            </div>
          </div>
          <button type="submit" className="submit-btn" disabled={submitting}>
            {submitting ? 'Adding...' : 'Add Project'}
          </button>
        </form>
      </div>

      {/* Projects List */}
      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading projects...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📁</div>
          <h3>No projects found</h3>
          <p>{search ? "Try a different search term" : "Create your first project using the form above"}</p>
        </div>
      ) : (
        <div className="projects-grid">
          {filtered.map((project) => (
            <div key={project.id} className="project-card">
              <div className="card-header">
                <div 
                  className="project-title" 
                  onClick={() => fetchProjectEmployees(project.id)}
                >
                  <svg className="folder-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                  </svg>
                  <span className="project-name">{project.name}</span>
                  <span className="team-count">{project.employee_projects?.[0]?.count || 0} members</span>
                </div>
                <div className="card-actions">
                  <button onClick={() => handleEdit(project)} className="edit-btn" title="Edit project">
                    <svg className="edit-icon" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                  </button>
                  <button onClick={() => handleDelete(project.id)} className="delete-btn" title="Delete project">
                    <svg className="delete-icon" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="project-details">
                {project.description && (
                  <p className="project-description">{project.description}</p>
                )}
                <div className="project-meta">
                  <div className="meta-item">
                    <span className="meta-label">Status:</span>
                    <span className={`status-badge ${getStatusColor(project.status)}`}>
                      {project.status}
                    </span>
                  </div>
                  {project.deadline && (
                    <div className="meta-item">
                      <span className="meta-label">Deadline:</span>
                      <span className="meta-value">
                        {new Date(project.deadline).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Assign Section */}
              {selectedProjectId === project.id && (
                <div className="assign-section">
                  <div className="assign-header">
                    <h4>Assign Employee</h4>
                  </div>
                  <div className="assign-form">
                    <select
                      value={selectedEmployee}
                      onChange={(e) => setSelectedEmployee(e.target.value)}
                      className="employee-select"
                    >
                      <option value="">-- Select Employee --</option>
                      {employees.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.full_name} ({emp.role || 'Employee'})
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleAssign(project.id)}
                      className="assign-btn"
                    >
                      Assign
                    </button>
                  </div>

                  {/* Team Members */}
                  {projectEmployees.length > 0 && (
                    <div className="team-section">
                      <h4>Team Members ({projectEmployees.length})</h4>
                      <div className="team-list">
                        {projectEmployees.map((emp) => (
                          <div key={emp.id} className="team-member">
                            <div className="member-avatar">
                              {emp.full_name?.charAt(0) || 'E'}
                            </div>
                            <div className="member-info">
                              <div className="member-name">{emp.full_name}</div>
                              <div className="member-role">{emp.role || 'Team Member'}</div>
                            </div>
                            <button
                              onClick={() => handleRemove(project.id, emp.id)}
                              className="remove-btn"
                              title="Remove from project"
                            >
                              <svg className="remove-icon" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .projects-page {
          min-height: 100vh;
          background-color: #f5f7fa;
          padding: 2rem;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
        }

        /* Header */
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          padding-bottom: 1rem;
          border-bottom: 2px solid #d0d0d0;
        }

        .page-title {
          font-size: 2rem;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 0.25rem 0;
        }

        .page-subtitle {
          color: #64748b;
          font-size: 0.9rem;
          margin: 0;
        }

        .back-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1.25rem;
          background-color: white;
          border: 1px solid #d0d0d0;
          border-radius: 8px;
          color: #1e293b;
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .back-btn:hover {
          background-color: #f8fafc;
          border-color: #2563eb;
        }

        .btn-icon {
          width: 16px;
          height: 16px;
        }

        /* Search Section */
        .search-section {
          margin-bottom: 2rem;
        }

        .search-wrapper {
          position: relative;
          max-width: 400px;
        }

        .search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          width: 18px;
          height: 18px;
          color: #94a3b8;
        }

        .search-input {
          width: 100%;
          padding: 0.75rem 1rem 0.75rem 2.5rem;
          border: 1px solid #d0d0d0;
          border-radius: 10px;
          font-size: 0.95rem;
          background-color: white;
          color: #1e293b;
          transition: all 0.2s;
        }

        .search-input::placeholder {
          color: #94a3b8;
        }

        .search-input:focus {
          outline: none;
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }

        /* Form Card */
        .form-card {
          background: white;
          border: 2px solid #d0d0d0;
          border-radius: 16px;
          padding: 1.5rem;
          margin-bottom: 2rem;
        }

        .form-title {
          font-size: 1.1rem;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 1.25rem 0;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .form-icon {
          width: 20px;
          height: 20px;
          color: #2563eb;
        }

        .add-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-label {
          font-size: 0.85rem;
          font-weight: 500;
          color: #64748b;
        }

        .form-input, .form-select, .form-textarea {
          padding: 0.75rem;
          border: 1px solid #d0d0d0;
          border-radius: 8px;
          font-size: 0.9rem;
          transition: all 0.2s;
          background-color: white;
          color: #1e293b;
        }

        .form-input:focus, .form-select:focus, .form-textarea:focus {
          outline: none;
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }

        .form-textarea {
          resize: vertical;
        }

        .submit-btn {
          padding: 0.75rem;
          background-color: #2563eb;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 0.95rem;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .submit-btn:hover:not(:disabled) {
          background-color: #1d4ed8;
        }

        .submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* Projects Grid */
        .projects-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(450px, 1fr));
          gap: 1.5rem;
        }

        .project-card {
          background: white;
          border: 2px solid #d0d0d0;
          border-radius: 16px;
          overflow: hidden;
          transition: all 0.2s;
        }

        .project-card:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.25rem;
          background-color: #f8fafc;
          border-bottom: 2px solid #d0d0d0;
        }

        .project-title {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          cursor: pointer;
          flex: 1;
        }

        .folder-icon {
          width: 20px;
          height: 20px;
          color: #2563eb;
        }

        .project-name {
          font-weight: 600;
          color: #1e293b;
          font-size: 1rem;
        }

        .team-count {
          font-size: 0.75rem;
          color: #64748b;
          background-color: #e2e8f0;
          padding: 0.2rem 0.5rem;
          border-radius: 20px;
          border: 1px solid #d0d0d0;
        }

        .card-actions {
          display: flex;
          gap: 0.5rem;
        }

        .edit-btn, .delete-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 6px;
          transition: all 0.2s;
        }

        .edit-btn:hover {
          background-color: #e2e8f0;
        }

        .delete-btn:hover {
          background-color: #fef2f2;
        }

        .edit-icon, .delete-icon {
          width: 18px;
          height: 18px;
        }

        .edit-icon {
          color: #2563eb;
        }

        .delete-icon {
          color: #dc2626;
        }

        /* Project Details */
        .project-details {
          padding: 1rem 1.25rem;
          border-bottom: 2px solid #d0d0d0;
        }

        .project-description {
          color: #475569;
          font-size: 0.9rem;
          margin: 0 0 0.75rem 0;
          line-height: 1.5;
        }

        .project-meta {
          display: flex;
          gap: 1.5rem;
          flex-wrap: wrap;
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.85rem;
        }

        .meta-label {
          color: #64748b;
        }

        .meta-value {
          color: #1e293b;
          font-weight: 500;
        }

        .status-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 500;
          border: 1px solid #d0d0d0;
        }

        .status-pending {
          background-color: #fffbeb;
          color: #b45309;
        }

        .status-progress {
          background-color: #eff6ff;
          color: #2563eb;
        }

        .status-completed {
          background-color: #ecfdf5;
          color: #0f973d;
        }

        /* Assign Section */
        .assign-section {
          padding: 1rem 1.25rem;
          background-color: #fafcff;
        }

        .assign-header h4 {
          font-size: 0.85rem;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin: 0 0 0.75rem 0;
        }

        .assign-form {
          display: flex;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }

        .employee-select {
          flex: 1;
          padding: 0.6rem 0.75rem;
          border: 1px solid #d0d0d0;
          border-radius: 8px;
          font-size: 0.9rem;
          background-color: white;
          color: #1e293b;
        }

        .assign-btn {
          padding: 0.6rem 1.25rem;
          background-color: #10b981;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .assign-btn:hover {
          background-color: #059669;
        }

        /* Team Section */
        .team-section h4 {
          font-size: 0.85rem;
          font-weight: 600;
          color: #64748b;
          margin: 0 0 0.75rem 0;
        }

        .team-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .team-member {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          background-color: #f8fafc;
          border-radius: 10px;
          transition: background-color 0.2s;
          border: 1px solid #e0e0e0;
        }

        .team-member:hover {
          background-color: #f1f5f9;
        }

        .member-avatar {
          width: 36px;
          height: 36px;
          background: linear-gradient(135deg, #2563eb, #1e40af);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 600;
          font-size: 0.9rem;
          flex-shrink: 0;
          border: 1px solid #d0d0d0;
        }

        .member-info {
          flex: 1;
        }

        .member-name {
          font-weight: 500;
          color: #1e293b;
          font-size: 0.9rem;
        }

        .member-role {
          font-size: 0.75rem;
          color: #64748b;
        }

        .remove-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 6px;
          transition: all 0.2s;
        }

        .remove-btn:hover {
          background-color: #fef2f2;
        }

        .remove-icon {
          width: 16px;
          height: 16px;
          color: #dc2626;
        }

        /* Loading State */
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem;
          color: #64748b;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #e2e8f0;
          border-top-color: #2563eb;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin-bottom: 1rem;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Empty State */
        .empty-state {
          text-align: center;
          padding: 4rem;
          background: white;
          border: 2px solid #d0d0d0;
          border-radius: 16px;
        }

        .empty-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
          opacity: 0.5;
        }

        .empty-state h3 {
          color: #1e293b;
          font-size: 1.1rem;
          margin-bottom: 0.5rem;
        }

        .empty-state p {
          color: #64748b;
          font-size: 0.9rem;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .projects-page {
            padding: 1rem;
          }

          .header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }

          .form-row {
            grid-template-columns: 1fr;
          }

          .projects-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}