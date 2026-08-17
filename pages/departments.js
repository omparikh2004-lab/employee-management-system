import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';

export default function Departments() {
  const router = useRouter();
  const [departments, setDepartments] = useState([]);
  const [newDept, setNewDept] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedDeptId, setSelectedDeptId] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [empLoading, setEmpLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('departments')
      .select(`
        *,
        employees(count)
      `)
      .order('name');
    if (error) console.error(error);
    else setDepartments(data || []);
    setLoading(false);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newDept.trim()) {
      alert('Enter department name');
      return;
    }
    setSubmitting(true);
    const { error } = await supabase
      .from('departments')
      .insert([{ name: newDept.trim() }]);
    if (error) alert(error.message);
    else {
      setNewDept('');
      fetchDepartments();
    }
    setSubmitting(false);
  };

  const handleEdit = async (dept) => {
    const newName = prompt('Enter new name:', dept.name);
    if (!newName) return;
    const { error } = await supabase
      .from('departments')
      .update({ name: newName })
      .eq('id', dept.id);
    if (error) alert(error.message);
    else fetchDepartments();
  };

  const handleDelete = async (id) => {
    const { data: emp } = await supabase
      .from('employees')
      .select('id')
      .eq('department_id', id);
    if (emp.length > 0) {
      alert('Cannot delete department with employees');
      return;
    }
    const { error } = await supabase
      .from('departments')
      .delete()
      .eq('id', id);
    if (error) alert(error.message);
    else fetchDepartments();
  };

  const fetchEmployees = async (deptId) => {
    if (selectedDeptId === deptId) {
      setSelectedDeptId(null);
      return;
    }
    setEmpLoading(true);
    setSelectedDeptId(deptId);
    const { data, error } = await supabase
      .from('employees')
      .select('id, full_name, email, role, job_title, image_url')
      .eq('department_id', deptId)
      .order('full_name');
    if (error) {
      console.error(error);
      setEmployees([]);
    } else {
      setEmployees(data || []);
    }
    setEmpLoading(false);
  };

  const handleEmployeeClick = (employeeId) => {
    router.push(`/employees/${employeeId}`);
  };

  const filteredDepartments = departments.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="departments-container">
      <div className="header-section">
        <div>
          <h1 className="page-title">Departments</h1>
          <p className="page-subtitle">Manage your organization's departments and team members</p>
        </div>
      </div>

      <div className="search-section">
        <div className="search-wrapper">
          <svg className="search-icon" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
          </svg>
          <input
            type="text"
            placeholder="Search departments..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      <div className="form-card">
        <h3 className="form-title">
          <svg className="form-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Add New Department
        </h3>
        <form onSubmit={handleAdd} className="add-form">
          <input
            type="text"
            placeholder="Enter department name"
            value={newDept}
            onChange={(e) => setNewDept(e.target.value)}
            className="form-input"
          />
          <button type="submit" className="submit-btn" disabled={submitting}>
            {submitting ? 'Adding...' : 'Add Department'}
          </button>
        </form>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading departments...</p>
        </div>
      ) : filteredDepartments.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🏢</div>
          <h3>No departments found</h3>
          <p>{search ? "Try a different search term" : "Create your first department using the form above"}</p>
        </div>
      ) : (
        <div className="departments-grid">
          {filteredDepartments.map((dept) => (
            <div key={dept.id} className="department-card">
              <div className="card-header">
                <div 
                  className="department-title" 
                  onClick={() => fetchEmployees(dept.id)}
                >
                  <svg className="folder-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                  </svg>
                  <span className="department-name">{dept.name}</span>
                  <span className="member-count">{dept.employees[0]?.count || 0} members</span>
                </div>
                <div className="card-actions">
                  <button onClick={() => handleEdit(dept)} className="edit-btn" title="Edit department">
                    <svg className="edit-icon" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                  </button>
                  <button onClick={() => handleDelete(dept.id)} className="delete-btn" title="Delete department">
                    <svg className="delete-icon" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>

              {selectedDeptId === dept.id && (
                <div className="employees-section">
                  <div className="employees-header">
                    <h4>Team Members</h4>
                    <span className="employees-count">{employees.length} employees</span>
                  </div>
                  {empLoading ? (
                    <div className="loading-employees">
                      <div className="small-spinner"></div>
                      <span>Loading team members...</span>
                    </div>
                  ) : employees.length === 0 ? (
                    <div className="no-employees">
                      <svg className="empty-emp-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                      <p>No employees in this department</p>
                    </div>
                  ) : (
                    <div className="employees-list">
                      {employees.map(emp => (
                        <div 
                          key={emp.id} 
                          className="employee-card"
                          onClick={() => handleEmployeeClick(emp.id)}
                        >
                          <div className="employee-avatar">
                            {emp.image_url ? (
                              <img src={emp.image_url} alt={emp.full_name} className="avatar-image" />
                            ) : (
                              emp.full_name?.charAt(0) || 'E'
                            )}
                          </div>
                          <div className="employee-info">
                            <div className="employee-name">{emp.full_name}</div>
                            <div className="employee-email">{emp.email}</div>
                            {emp.job_title && (
                              <div className="employee-title">{emp.job_title}</div>
                            )}
                          </div>
                          <span className="role-badge">{emp.role || 'Employee'}</span>
                          <svg className="arrow-icon" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .departments-container {
          min-height: 100vh;
          background: #f5f7fa;
          padding: 2rem;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
        }

        .header-section {
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

        .search-section {
          margin-bottom: 1.5rem;
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
          background: white;
          color: #1e293b;
          transition: all 0.2s;
        }

        .search-input:focus {
          outline: none;
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }

        .search-input::placeholder {
          color: #94a3b8;
        }

        .form-card {
          background: white;
          border: 2px solid #d0d0d0;
          border-radius: 16px;
          padding: 1.5rem;
          margin-bottom: 2rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
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
          gap: 1rem;
        }

        .form-input {
          flex: 1;
          padding: 0.75rem 1rem;
          border: 1px solid #d0d0d0;
          border-radius: 8px;
          font-size: 0.95rem;
          transition: all 0.2s;
          background: white;
          color: #1e293b;
        }

        .form-input:focus {
          outline: none;
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }

        .form-input::placeholder {
          color: #94a3b8;
        }

        .submit-btn {
          padding: 0.75rem 1.5rem;
          background: #2563eb;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 0.95rem;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .submit-btn:hover:not(:disabled) {
          background: #1d4ed8;
        }

        .submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

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

        .departments-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(450px, 1fr));
          gap: 1.5rem;
        }

        .department-card {
          background: white;
          border: 2px solid #d0d0d0;
          border-radius: 16px;
          overflow: hidden;
          transition: all 0.2s;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }

        .department-card:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.25rem;
          background: #f8fafc;
          border-bottom: 2px solid #d0d0d0;
        }

        .department-title {
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

        .department-name {
          font-weight: 600;
          color: #1e293b;
          font-size: 1rem;
        }

        .member-count {
          font-size: 0.75rem;
          color: #64748b;
          background: #e2e8f0;
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
          background: #e2e8f0;
        }

        .delete-btn:hover {
          background: #fef2f2;
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

        .employees-section {
          padding: 1rem 1.25rem;
          background: #fefefe;
          border-top: 2px solid #d0d0d0;
        }

        .employees-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid #d0d0d0;
        }

        .employees-header h4 {
          font-size: 0.85rem;
          font-weight: 600;
          color: #334155;
          margin: 0;
        }

        .employees-count {
          font-size: 0.7rem;
          color: #64748b;
          background: #f1f5f9;
          padding: 0.2rem 0.6rem;
          border-radius: 20px;
          border: 1px solid #d0d0d0;
        }

        .loading-employees {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 1.5rem;
          color: #64748b;
        }

        .small-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid #e2e8f0;
          border-top-color: #2563eb;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }

        .no-employees {
          text-align: center;
          padding: 1.5rem;
          color: #94a3b8;
        }

        .empty-emp-icon {
          width: 32px;
          height: 32px;
          margin-bottom: 0.5rem;
          color: #cbd5e1;
        }

        .employees-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .employee-card {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          background: #f8fafc;
          border-radius: 10px;
          border: 1px solid #d0d0d0;
          transition: all 0.2s;
          cursor: pointer;
        }

        .employee-card:hover {
          background: #f1f5f9;
          border-color: #2563eb;
          transform: translateX(4px);
        }

        .employee-avatar {
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, #2563eb, #1e40af);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 600;
          font-size: 1rem;
          flex-shrink: 0;
          overflow: hidden;
          border: 1px solid #d0d0d0;
        }

        .avatar-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .employee-info {
          flex: 1;
        }

        .employee-name {
          font-weight: 500;
          color: #1e293b;
          font-size: 0.9rem;
        }

        .employee-email {
          font-size: 0.7rem;
          color: #64748b;
        }

        .employee-title {
          font-size: 0.7rem;
          color: #94a3b8;
          margin-top: 0.2rem;
        }

        .role-badge {
          padding: 0.2rem 0.6rem;
          background: #e2e8f0;
          color: #475569;
          border-radius: 20px;
          font-size: 0.7rem;
          font-weight: 500;
          border: 1px solid #d0d0d0;
        }

        .arrow-icon {
          width: 16px;
          height: 16px;
          color: #94a3b8;
          flex-shrink: 0;
          transition: transform 0.2s;
        }

        .employee-card:hover .arrow-icon {
          transform: translateX(4px);
          color: #2563eb;
        }

        @media (max-width: 768px) {
          .departments-container {
            padding: 1rem;
          }
          .departments-grid {
            grid-template-columns: 1fr;
          }
          .add-form {
            flex-direction: column;
          }
          .card-header {
            flex-wrap: wrap;
            gap: 0.5rem;
          }
          .department-title {
            flex-wrap: wrap;
          }
        }
      `}</style>
    </div>
  );
}