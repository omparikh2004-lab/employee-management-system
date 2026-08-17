import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabaseClient';

export default function EmployeeList() {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [deletingId, setDeletingId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const router = useRouter();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: employeesData, error: employeeError } = await supabase
        .from('employees')
        .select(`
          id,
          full_name,
          email,
          phone,
          role,
          job_title,
          image_url,
          departments(name)
        `)
        .order('full_name', { ascending: true });

      if (employeeError) throw employeeError;

      const employeesWithDept = employeesData.map((emp) => ({
        ...emp,
        department_name: emp.departments?.name || 'Unassigned',
      }));

      setEmployees(employeesWithDept);

      const { data: deptData, error: deptError } = await supabase
        .from('departments')
        .select('id, name')
        .order('name');

      if (deptError) throw deptError;
      setDepartments(deptData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (id, name) => {
    setDeletingId(id);
    setShowModal(name);
  };

  const handleDelete = async () => {
    try {
      const { error } = await supabase.from('employees').delete().eq('id', deletingId);
      if (error) {
        alert(error.message);
      } else {
        setEmployees(employees.filter((emp) => emp.id !== deletingId));
      }
    } catch (error) {
      alert('Error deleting employee');
    } finally {
      setShowModal(false);
      setDeletingId(null);
    }
  };

  const filteredEmployees = employees.filter((employee) => {
    const matchesSearch =
      employee.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.role?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.job_title?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDepartment =
      filterDepartment === 'all' || employee.department_name === filterDepartment;

    return matchesSearch && matchesDepartment;
  });

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p style={styles.loadingText}>Loading employees...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.heading}>Employee Directory</h1>
        <button
          style={styles.addButton}
          onClick={() => router.push('/employees/new')}
        >
          <svg style={styles.plusIconSvg} viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Add Employee
        </button>
      </div>

      {/* Filters */}
      <div style={styles.controls}>
        <div style={styles.searchContainer}>
          <svg style={styles.searchIconSvg} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path
              d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <input
            type="text"
            placeholder="Search employees..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
        </div>

        <select
          value={filterDepartment}
          onChange={(e) => setFilterDepartment(e.target.value)}
          style={styles.filterSelect}
        >
          <option value="all">All Departments</option>
          {departments.map((dept) => (
            <option key={dept.id} value={dept.name}>
              {dept.name}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      {filteredEmployees.length === 0 ? (
        <div style={styles.emptyState}>
          <svg style={styles.emptyIconSvg} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 6L9 17l-5-5" />
          </svg>
          <h3 style={styles.emptyStateTitle}>No employees found</h3>
          <p style={styles.emptyStateText}>
            {employees.length === 0
              ? 'Get started by adding your first employee.'
              : 'Try adjusting your search or filter criteria.'}
          </p>
          {employees.length === 0 && (
            <button
              style={styles.addButton}
              onClick={() => router.push('/employees/new')}
            >
              <svg style={styles.plusIconSvg} viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Add Employee
            </button>
          )}
        </div>
      ) : (
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.tableHeader}>Name</th>
                <th style={styles.tableHeader}>Email</th>
                <th style={styles.tableHeader}>Phone</th>
                <th style={styles.tableHeader}>Department</th>
                <th style={styles.tableHeader}>Role</th>
                <th style={styles.tableHeader}>Job Title</th>
                <th style={styles.tableHeader}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map((emp) => (
                <tr key={emp.id} style={styles.tableRow}>
                  <td style={styles.tableCell}>
                    <div style={styles.employeeInfo}>
                      <div style={styles.avatar}>
                        {emp.image_url ? (
                          <img
                            src={emp.image_url}
                            alt={emp.full_name || 'Avatar'}
                            style={styles.avatarImage}
                          />
                        ) : (
                          emp.full_name?.charAt(0).toUpperCase() || '?'
                        )}
                      </div>
                      <div>
                        <div style={styles.employeeName}>
                          {emp.full_name || 'Unnamed'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={styles.tableCell}>{emp.email || '-'}</td>
                  <td style={styles.tableCell}>{emp.phone || '-'}</td>
                  <td style={styles.tableCell}>
                    <span style={styles.departmentBadge}>
                      {emp.department_name || 'Unassigned'}
                    </span>
                  </td>
                  <td style={styles.tableCell}>{emp.role || '-'}</td>
                  <td style={styles.tableCell}>{emp.job_title || '-'}</td>
                  <td style={styles.tableCell}>
                    <div style={styles.actionButtons}>
                      <button
                        style={{ ...styles.actionButton, ...styles.editButton }}
                        onClick={() => router.push(`/employees/${emp.id}`)}
                        title="Edit Employee"
                      >
                        <svg style={styles.actionIconSvg} viewBox="0 0 20 20" fill="currentColor">
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                      </button>
                      <button
                        style={{ ...styles.actionButton, ...styles.deleteButton }}
                        onClick={() => confirmDelete(emp.id, emp.full_name)}
                        title="Delete Employee"
                      >
                        <svg style={styles.actionIconSvg} viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                      <button
                        style={{ ...styles.actionButton, ...styles.viewButton }}
                        onClick={() => router.push(`/employees/profile/${emp.id}`)}
                        title="View Profile"
                      >
                        <svg style={styles.actionIconSvg} viewBox="0 0 20 20" fill="currentColor">
                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                          <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Modal */}
      {showModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h3 style={styles.modalTitle}>Confirm Delete</h3>
            <p style={styles.modalText}>
              Are you sure you want to delete <strong>{showModal}</strong>? This action cannot be undone.
            </p>
            <div style={styles.modalActions}>
              <button
                style={{ ...styles.modalButton, ...styles.modalCancelButton }}
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button
                style={{ ...styles.modalButton, ...styles.modalDeleteButton }}
                onClick={handleDelete}
              >
                Delete Employee
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

const styles = {
  container: {
    padding: '2rem',
    width: '100%',
    fontFamily: "'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    color: '#333',
    backgroundColor: '#f8fafc',
    minHeight: '100vh',
    boxSizing: 'border-box',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    backgroundColor: '#f8fafc',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #e2e8f0',
    borderTop: '4px solid #4a6fa5',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '1rem',
  },
  loadingText: {
    color: '#64748b',
    fontSize: '1rem',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
    flexWrap: 'wrap',
    gap: '1rem',
    paddingBottom: '1rem',
    borderBottom: '2px solid #d0d0d0',
  },
  heading: {
    fontSize: '2rem',
    fontWeight: '700',
    color: '#1e293b',
    margin: 0,
  },
  addButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.75rem 1.25rem',
    backgroundColor: '#2563eb',
    color: 'white',
    border: '1px solid #2563eb',
    borderRadius: '8px',
    fontSize: '0.9rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
  },
  plusIconSvg: {
    width: '16px',
    height: '16px',
  },
  controls: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '1.5rem',
    flexWrap: 'wrap',
  },
  searchContainer: {
    position: 'relative',
    flex: '1',
    minWidth: '250px',
  },
  searchIconSvg: {
    position: 'absolute',
    left: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    width: '16px',
    height: '16px',
    color: '#94a3b8',
  },
  searchInput: {
    width: '100%',
    padding: '0.75rem 1rem 0.75rem 2.5rem',
    borderRadius: '8px',
    border: '1px solid #d0d0d0',
    fontSize: '0.9rem',
    boxSizing: 'border-box',
    backgroundColor: 'white',
    color: '#1e293b',
    transition: 'all 0.2s',
  },
  filterSelect: {
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    border: '1px solid #d0d0d0',
    fontSize: '0.9rem',
    backgroundColor: 'white',
    color: '#1e293b',
    minWidth: '180px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '3rem',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    textAlign: 'center',
    border: '2px solid #d0d0d0',
  },
  emptyIconSvg: {
    width: '48px',
    height: '48px',
    color: '#94a3b8',
    marginBottom: '1rem',
  },
  emptyStateTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#334155',
    margin: '1rem 0 0.5rem',
  },
  emptyStateText: {
    color: '#64748b',
    margin: '0 0 1.5rem',
  },
  tableContainer: {
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    overflowX: 'auto',
    border: '2px solid #d0d0d0',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    minWidth: '800px',
  },
  tableHeader: {
    padding: '1rem',
    textAlign: 'left',
    fontSize: '0.8rem',
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    borderBottom: '2px solid #d0d0d0',
    backgroundColor: '#f8fafc',
  },
  tableRow: {
    borderBottom: '1px solid #d0d0d0',
    transition: 'background-color 0.2s ease',
  },
  tableCell: {
    padding: '1rem',
    fontSize: '0.9rem',
  },
  employeeInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  avatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #2563eb, #1e40af)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '600',
    fontSize: '0.9rem',
    border: '1px solid #d0d0d0',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    objectFit: 'cover',
    display: 'block',
  },
  employeeName: {
    fontWeight: '500',
    color: '#1e293b',
  },
  departmentBadge: {
    padding: '0.25rem 0.75rem',
    backgroundColor: '#f1f5f9',
    color: '#475569',
    borderRadius: '9999px',
    fontSize: '0.8rem',
    fontWeight: '500',
    border: '1px solid #d0d0d0',
  },
  actionButtons: {
    display: 'flex',
    gap: '0.5rem',
  },
  actionButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    borderRadius: '6px',
    border: '1px solid #d0d0d0',
    backgroundColor: 'white',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  actionIconSvg: {
    width: '16px',
    height: '16px',
  },
  editButton: {
    color: '#2563eb',
  },
  deleteButton: {
    color: '#dc2626',
    borderColor: '#d0d0d0',
  },
  viewButton: {
    color: '#059669',
    borderColor: '#d0d0d0',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '12px',
    maxWidth: '400px',
    width: '100%',
    border: '2px solid #d0d0d0',
  },
  modalTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    margin: '0 0 1rem',
    color: '#1e293b',
  },
  modalText: {
    margin: '0 0 1.5rem',
    color: '#64748b',
    lineHeight: '1.5',
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '0.75rem',
  },
  modalButton: {
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    border: '1px solid #d0d0d0',
    fontSize: '0.9rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
  },
  modalCancelButton: {
    backgroundColor: '#f1f5f9',
    color: '#64748b',
  },
  modalDeleteButton: {
    backgroundColor: '#dc2626',
    color: 'white',
    border: '1px solid #dc2626',
  },
};

// Add CSS for hover effects and animations
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    .add-button:hover {
      background-color: #1d4ed8 !important;
    }
    
    .table-row:hover {
      background-color: #f8fafc;
    }
    
    .action-button:hover {
      background-color: #f1f5f9;
      transform: scale(1.05);
    }
    
    .edit-button:hover {
      background-color: #eff6ff !important;
      border-color: #2563eb !important;
    }
    
    .delete-button:hover {
      background-color: #fef2f2 !important;
      border-color: #dc2626 !important;
    }
    
    .view-button:hover {
      background-color: #ecfdf5 !important;
      border-color: #059669 !important;
    }
    
    .modal-cancel-button:hover {
      background-color: #e2e8f0;
    }
    
    .modal-delete-button:hover {
      background-color: #b91c1c;
    }
    
    .search-input:focus {
      outline: none;
      border-color: #2563eb;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
    }
    
    .filter-select:focus {
      outline: none;
      border-color: #2563eb;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
    }
  `;
  document.head.appendChild(style);
}