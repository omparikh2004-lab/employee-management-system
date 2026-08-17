import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';

export default function Home() {
  const [user, setUser] = useState(null);
  const [employeeCount, setEmployeeCount] = useState(null);
  const [departmentCount, setDepartmentCount] = useState(null);
  const [projectCount, setProjectCount] = useState(null);
  const [recentHires, setRecentHires] = useState([]);
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingLeave, setUpdatingLeave] = useState(null);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const router = useRouter();
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleString());

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) throw error;

        if (!session) {
          router.push('/login');
          return;
        }

        setUser(session.user);
        await fetchDashboardData();
      } catch (err) {
        console.error("Session error:", err);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    const fetchDashboardData = async () => {
      try {
        const { count: empCount } = await supabase
          .from('employees')
          .select('*', { count: 'exact', head: true });

        const { count: deptCount } = await supabase
          .from('departments')
          .select('*', { count: 'exact', head: true });

        const { count: projCount } = await supabase
          .from('projects')
          .select('*', { count: 'exact', head: true });

        const { data: hires } = await supabase
          .from('employees')
          .select(`id, full_name, role, join_date, departments(name)`)
          .order('join_date', { ascending: false })
          .limit(5);

        const { data: leaves } = await supabase
          .from('leaves')
          .select(`
            *,
            employees!leaves_employee_id_fkey(full_name, email, job_title)
          `)
          .eq('status', 'Pending')
          .order('created_at', { ascending: false })
          .limit(10);

        setEmployeeCount(empCount ?? 0);
        setDepartmentCount(deptCount ?? 0);
        setProjectCount(projCount ?? 0);
        setRecentHires(hires || []);
        setPendingLeaves(leaves || []);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      }
    };

    init();

    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleString());
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  const handleLeaveAction = async (leaveId, status) => {
    setUpdatingLeave(leaveId);
    
    const { error } = await supabase
      .from("leaves")
      .update({ status })
      .eq("id", leaveId);

    if (!error) {
      setPendingLeaves(pendingLeaves.filter(leave => leave.id !== leaveId));
      alert(`Leave request ${status.toLowerCase()} successfully`);
    } else {
      alert("Error updating leave request");
    }
    
    setUpdatingLeave(null);
  };

  if (!user || loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p style={styles.loadingText}>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div>
          <h1 style={styles.heading}>Dashboard</h1>
          <p style={styles.welcome}>Welcome back, <strong>{user.email}</strong></p>
        </div>
        <div style={styles.timeContainer}>
          <svg style={styles.timeIconSvg} viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
          <span style={styles.timeText}>{currentTime}</span>
        </div>
      </header>

      {/* Stats Cards */}
      <div style={styles.statsContainer}>
        <div style={styles.statCard}>
          <div style={styles.statIcon} className="stat-icon-employees">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div style={styles.statContent}>
            <h3 style={styles.statTitle}>Total Employees</h3>
            <p style={styles.statNumber}>{employeeCount ?? '0'}</p>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statIcon} className="stat-icon-departments">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>
          </div>
          <div style={styles.statContent}>
            <h3 style={styles.statTitle}>Departments</h3>
            <p style={styles.statNumber}>{departmentCount ?? '0'}</p>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statIcon} className="stat-icon-projects">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <div style={styles.statContent}>
            <h3 style={styles.statTitle}>Active Projects</h3>
            <p style={styles.statNumber}>{projectCount ?? '0'}</p>
          </div>
        </div>
      </div>

      {/* Recent Hires & Quick Actions */}
      <div style={styles.contentRow}>
        <div style={styles.recentHires}>
          <h3 style={styles.sectionTitle}>Recent Hires</h3>
          {recentHires.length > 0 ? (
            <div style={styles.hiresList}>
              {recentHires.map((hire) => (
                <div
                  key={hire.id}
                  style={styles.hireItem}
                  onClick={() => router.push(`/employees/${hire.id}`)}
                >
                  <div style={styles.hireInfo}>
                    <p style={styles.hireName}>{hire.full_name}</p>
                    <p style={styles.hirePosition}>
                      {hire.role} — {hire.departments?.name || 'No Department'}
                    </p>
                  </div>
                  <span style={styles.hireDate}>
                    {new Date(hire.join_date).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p style={styles.noData}>No recent hires</p>
          )}
        </div>

        <div style={styles.quickActions}>
          <h3 style={styles.sectionTitle}>Quick Actions</h3>
          <div style={styles.actionButtons}>
            <button style={styles.actionButton} onClick={() => router.push('/employees')}>
              <svg style={styles.actionIconSvg} viewBox="0 0 20 20" fill="currentColor">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
              </svg>
              Manage Employees
            </button>
            <button style={styles.actionButton} onClick={() => router.push('/employees/new')}>
              <svg style={styles.actionIconSvg} viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Add New Employee
            </button>
            <button style={styles.actionButton} onClick={() => router.push('/departments')}>
              <svg style={styles.actionIconSvg} viewBox="0 0 20 20" fill="currentColor">
                <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
              </svg>
              View Departments
            </button>
            <button style={styles.actionButton} onClick={() => router.push('/projects')}>
              <svg style={styles.actionIconSvg} viewBox="0 0 20 20" fill="currentColor">
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
              </svg>
              Manage Projects
            </button>
            <button style={{ ...styles.actionButton, ...styles.leaveRequestButton }} onClick={() => setShowLeaveModal(true)}>
              <svg style={styles.actionIconSvg} viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
              Leave Requests
              {pendingLeaves.length > 0 && (
                <span style={styles.badge}>{pendingLeaves.length}</span>
              )}
            </button>
            <button style={{ ...styles.actionButton, ...styles.logoutButton }} onClick={async () => {
              await supabase.auth.signOut();
              router.push('/login');
            }}>
              <svg style={styles.actionIconSvg} viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
              </svg>
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Leave Requests Modal */}
      {showLeaveModal && (
        <div style={styles.modalOverlay} onClick={() => setShowLeaveModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>
                <svg style={styles.modalIconSvg} viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
                Leave Requests
              </h2>
              <button style={styles.modalClose} onClick={() => setShowLeaveModal(false)}>✕</button>
            </div>
            <div style={styles.modalBody}>
              {pendingLeaves.length === 0 ? (
                <div style={styles.modalEmpty}>
                  <svg style={styles.emptyIconLarge} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  <p>No pending leave requests</p>
                  <p style={styles.emptySub}>All leave requests have been processed</p>
                </div>
              ) : (
                <div style={styles.leavesTable}>
                  <div style={styles.tableHeader}>
                    <div style={styles.tableCell}>Employee</div>
                    <div style={styles.tableCell}>Dates</div>
                    <div style={styles.tableCell}>Duration</div>
                    <div style={styles.tableCell}>Reason</div>
                    <div style={styles.tableCell}>Actions</div>
                  </div>
                  {pendingLeaves.map((leave) => {
                    const start = new Date(leave.start_date);
                    const end = new Date(leave.end_date);
                    const duration = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
                    
                    return (
                      <div key={leave.id} style={styles.tableRow}>
                        <div style={styles.tableCell}>
                          <div style={styles.employeeInfoCell}>
                            <div style={styles.employeeAvatarModal}>
                              {leave.employees?.full_name?.charAt(0) || '?'}
                            </div>
                            <div>
                              <div style={styles.employeeNameCell}>{leave.employees?.full_name || 'Unknown'}</div>
                              <div style={styles.employeeEmailCell}>{leave.employees?.email || ''}</div>
                            </div>
                          </div>
                        </div>
                        <div style={styles.tableCell}>
                          <div style={styles.dateRange}>
                            <div>{new Date(leave.start_date).toLocaleDateString()}</div>
                            <div style={styles.dateArrow}>→</div>
                            <div>{new Date(leave.end_date).toLocaleDateString()}</div>
                          </div>
                        </div>
                        <div style={styles.tableCell}>
                          <span style={styles.durationBadgeModal}>{duration} {duration === 1 ? 'day' : 'days'}</span>
                        </div>
                        <div style={styles.tableCell}>
                          <div style={styles.reasonTextModal} title={leave.reason}>
                            {leave.reason || 'No reason provided'}
                          </div>
                        </div>
                        <div style={styles.tableCell}>
                          <div style={styles.actionButtonsModal}>
                            <button
                              style={styles.approveBtnModal}
                              onClick={() => {
                                handleLeaveAction(leave.id, "Approved");
                                if (pendingLeaves.length === 1) setShowLeaveModal(false);
                              }}
                              disabled={updatingLeave === leave.id}
                            >
                              {updatingLeave === leave.id ? '...' : 'Approve'}
                            </button>
                            <button
                              style={styles.rejectBtnModal}
                              onClick={() => {
                                handleLeaveAction(leave.id, "Rejected");
                                if (pendingLeaves.length === 1) setShowLeaveModal(false);
                              }}
                              disabled={updatingLeave === leave.id}
                            >
                              {updatingLeave === leave.id ? '...' : 'Reject'}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div style={styles.modalFooter}>
              <button style={styles.closeModalBtn} onClick={() => setShowLeaveModal(false)}>
                Close
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
        
        .stat-icon-employees {
          color: #4f46e5;
          background-color: #eef2ff;
        }
        
        .stat-icon-departments {
          color: #059669;
          background-color: #ecfdf5;
        }
        
        .stat-icon-projects {
          color: #dc2626;
          background-color: #fef2f2;
        }
        
        .stat-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 15px rgba(0, 0, 0, 0.1);
        }
        
        .hire-item:hover {
          background-color: #f1f5f9 !important;
        }
        
        .action-button:hover {
          background-color: #f1f5f9;
        }
        
        .logout-button:hover {
          background-color: #fee2e2;
        }
      `}</style>
    </div>
  );
}

const styles = {
  container: {
    width: '100%',
    minHeight: '100vh',
    padding: '2rem',
    fontFamily: "'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    color: '#333',
    backgroundColor: '#f8fafc',
    margin: 0,
    boxSizing: 'border-box',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100vh',
    backgroundColor: '#f8fafc',
    margin: 0,
    padding: 0,
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
    alignItems: 'flex-start',
    marginBottom: '2rem',
    flexWrap: 'wrap',
    gap: '1rem',
    width: '100%',
    paddingBottom: '1rem',
    borderBottom: '2px solid #d0d0d0',
  },
  heading: {
    fontSize: '2.5rem',
    fontWeight: '700',
    marginBottom: '0.5rem',
    color: '#1e293b',
  },
  welcome: {
    fontSize: '1.1rem',
    color: '#64748b',
  },
  timeContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 1rem',
    backgroundColor: '#f1f5f9',
    borderRadius: '8px',
    border: '1px solid #d0d0d0',
  },
  timeIconSvg: {
    width: '18px',
    height: '18px',
    color: '#2563eb',
  },
  timeText: {
    fontSize: '0.9rem',
    color: '#475569',
  },
  statsContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '1.5rem',
    marginBottom: '2.5rem',
    width: '100%',
  },
  statCard: {
    backgroundColor: '#ffffff',
    padding: '1.5rem',
    borderRadius: '12px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    width: '100%',
    border: '2px solid #d0d0d0',
  },
  statIcon: {
    width: '50px',
    height: '50px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    border: '1px solid #d0d0d0',
  },
  statContent: {
    flex: 1,
  },
  statTitle: {
    fontSize: '0.9rem',
    fontWeight: '500',
    color: '#64748b',
    margin: '0 0 0.5rem 0',
  },
  statNumber: {
    fontSize: '2rem',
    fontWeight: '700',
    margin: '0',
    color: '#1e293b',
  },
  contentRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '2rem',
    marginBottom: '2rem',
    width: '100%',
  },
  recentHires: {
    backgroundColor: '#ffffff',
    padding: '1.5rem',
    borderRadius: '12px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
    width: '100%',
    border: '2px solid #d0d0d0',
  },
  quickActions: {
    backgroundColor: '#ffffff',
    padding: '1.5rem',
    borderRadius: '12px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
    width: '100%',
    border: '2px solid #d0d0d0',
  },
  sectionTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    margin: '0 0 1.5rem 0',
    color: '#1e293b',
  },
  hiresList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  hireItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.75rem',
    borderRadius: '8px',
    backgroundColor: '#f8fafc',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
    borderBottom: '1px solid #e0e0e0',
  },
  hireItemLast: {
    borderBottom: 'none',
  },
  hireInfo: {
    flex: 1,
  },
  hireName: {
    fontWeight: '500',
    margin: '0 0 0.25rem 0',
  },
  hirePosition: {
    fontSize: '0.875rem',
    color: '#64748b',
    margin: '0',
  },
  hireDate: {
    fontSize: '0.875rem',
    color: '#000',
  },
  noData: {
    textAlign: 'center',
    color: '#94a3b8',
    fontStyle: 'italic',
    padding: '2rem',
  },
  actionButtons: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  actionButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '1rem',
    borderRadius: '8px',
    border: '1px solid #d0d0d0',
    backgroundColor: '#f8fafc',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontSize: '1rem',
    fontWeight: '500',
    color: '#1e293b',
    width: '100%',
    position: 'relative',
  },
  actionIconSvg: {
    width: '18px',
    height: '18px',
  },
  leaveRequestButton: {
    backgroundColor: '#eff6ff',
    borderColor: '#2563eb',
  },
  badge: {
    position: 'absolute',
    top: '-8px',
    right: '-8px',
    background: '#ef4444',
    color: 'white',
    borderRadius: '50%',
    width: '20px',
    height: '20px',
    fontSize: '0.7rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutButton: {
    color: '#dc2626',
    borderColor: '#fecaca',
    backgroundColor: '#fef2f2',
  },
  // Modal Styles
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '16px',
    width: '90%',
    maxWidth: '1000px',
    maxHeight: '85vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    border: '2px solid #d0d0d0',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1.25rem 1.5rem',
    borderBottom: '2px solid #d0d0d0',
    backgroundColor: '#f8fafc',
  },
  modalTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#1e293b',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    margin: 0,
  },
  modalIconSvg: {
    width: '20px',
    height: '20px',
    color: '#2563eb',
  },
  modalClose: {
    background: 'none',
    border: 'none',
    fontSize: '1.5rem',
    cursor: 'pointer',
    color: '#94a3b8',
    transition: 'color 0.2s',
  },
  modalBody: {
    flex: 1,
    overflowY: 'auto',
    padding: '1.5rem',
  },
  modalEmpty: {
    textAlign: 'center',
    padding: '3rem',
  },
  emptyIconLarge: {
    width: '48px',
    height: '48px',
    marginBottom: '1rem',
    opacity: 0.5,
    color: '#10b981',
    margin: '0 auto 1rem auto',
  },
  emptySub: {
    color: '#94a3b8',
    fontSize: '0.85rem',
    marginTop: '0.5rem',
  },
  leavesTable: {
    display: 'flex',
    flexDirection: 'column',
  },
  tableHeader: {
    display: 'grid',
    gridTemplateColumns: '200px 180px 80px 1fr 160px',
    gap: '1rem',
    padding: '0.75rem 1rem',
    background: '#f8fafc',
    borderRadius: '8px',
    fontWeight: '600',
    color: '#1e293b',
    fontSize: '0.85rem',
    marginBottom: '0.5rem',
    border: '1px solid #d0d0d0',
  },
  tableRow: {
    display: 'grid',
    gridTemplateColumns: '200px 180px 80px 1fr 160px',
    gap: '1rem',
    padding: '1rem',
    borderBottom: '1px solid #d0d0d0',
    alignItems: 'center',
  },
  tableRowLast: {
    borderBottom: 'none',
  },
  tableCell: {
    fontSize: '0.9rem',
  },
  employeeInfoCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  employeeAvatarModal: {
    width: '36px',
    height: '36px',
    background: 'linear-gradient(135deg, #2563eb, #1e40af)',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontWeight: '600',
    fontSize: '0.9rem',
    border: '1px solid #d0d0d0',
  },
  employeeNameCell: {
    fontWeight: '500',
    color: '#1e293b',
    fontSize: '0.9rem',
  },
  employeeEmailCell: {
    fontSize: '0.7rem',
    color: '#64748b',
  },
  dateRange: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.85rem',
  },
  dateArrow: {
    color: '#94a3b8',
  },
  durationBadgeModal: {
    background: '#e2e8f0',
    color: '#475569',
    padding: '0.25rem 0.6rem',
    borderRadius: '20px',
    fontSize: '0.75rem',
    fontWeight: '500',
    display: 'inline-block',
    border: '1px solid #d0d0d0',
  },
  reasonTextModal: {
    fontSize: '0.85rem',
    color: '#475569',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  actionButtonsModal: {
    display: 'flex',
    gap: '0.5rem',
  },
  approveBtnModal: {
    background: '#0f973d',
    color: 'white',
    border: '1px solid #0f973d',
    padding: '0.35rem 1rem',
    borderRadius: '6px',
    fontSize: '0.8rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  rejectBtnModal: {
    background: '#dc2626',
    color: 'white',
    border: '1px solid #dc2626',
    padding: '0.35rem 1rem',
    borderRadius: '6px',
    fontSize: '0.8rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  modalFooter: {
    padding: '1rem 1.5rem',
    borderTop: '2px solid #d0d0d0',
    display: 'flex',
    justifyContent: 'flex-end',
    backgroundColor: '#f8fafc',
  },
  closeModalBtn: {
    padding: '0.5rem 1.25rem',
    background: '#f1f5f9',
    border: '1px solid #d0d0d0',
    borderRadius: '8px',
    color: '#64748b',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background 0.2s',
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
    
    .stat-icon-employees {
      color: #4f46e5;
      background-color: #eef2ff;
    }
    
    .stat-icon-departments {
      color: #059669;
      background-color: #ecfdf5;
    }
    
    .stat-icon-projects {
      color: #dc2626;
      background-color: #fef2f2;
    }
    
    .stat-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 15px rgba(0, 0, 0, 0.1);
    }
    
    .hire-item:hover {
      background-color: #f1f5f9 !important;
    }
    
    .action-button:hover {
      background-color: #f1f5f9;
    }
    
    .logout-button:hover {
      background-color: #fee2e2 !important;
    }
    
    .approve-btn-modal:hover {
      background-color: #059669 !important;
    }
    
    .reject-btn-modal:hover {
      background-color: #b91c1c !important;
    }
    
    .modal-close:hover {
      color: #ef4444 !important;
    }
    
    .close-modal-btn:hover {
      background-color: #e2e8f0 !important;
    }
  `;
  document.head.appendChild(style);
}