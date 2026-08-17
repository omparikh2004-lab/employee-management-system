import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useRouter } from "next/router";

export default function EmployeeDashboard() {
  const [attendanceCount, setAttendanceCount] = useState(0);
  const [leaveCount, setLeaveCount] = useState(0);
  const [salaryCount, setSalaryCount] = useState(0);
  const [employee, setEmployee] = useState(null);
  const [currentTime, setCurrentTime] = useState(null);
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);
    
    const loadEmployee = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from("employees")
        .select(`
          *,
          departments(name)
        `)
        .eq("email", session.user.email)
        .single();

      if (error) {
        console.error("EMPLOYEE FETCH ERROR:", error);
        return;
      }

      setEmployee(data);

      // ATTENDANCE
      const { data: attendanceData } = await supabase
        .from("attendance")
        .select("*")
        .eq("employee_id", data.id)
        .eq("status", "Present");

      setAttendanceCount(attendanceData?.length || 0);

      // LEAVES
      const { data: leaveData } = await supabase
        .from("leaves")
        .select("*")
        .eq("employee_id", data.id)
        .eq("status", "Approved");

      setLeaveCount(leaveData?.length || 0);

      // SALARY
      const { data: salaryData } = await supabase
        .from("salaries")
        .select("*")
        .eq("employee_id", data.id);

      setSalaryCount(salaryData?.length || 0);
    };

    loadEmployee();

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Fix hydration by setting initial time on client only
  useEffect(() => {
    setCurrentTime(new Date());
  }, []);

  return (
    <div className="dashboard">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo">
            <svg className="logo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>
            <span className="logo-text">Employee Portal</span>
          </div>
        </div>

        <nav className="nav-menu">
          <div className="nav-item active" onClick={() => router.push("/employees/dashboard")}>
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-6 9 6v11a2 2 0 0 1-2 2h-5v-7H9v7H5a2 2 0 0 1-2-2z" />
            </svg>
            <span>Dashboard</span>
          </div>
          <div className="nav-item" onClick={() => router.push("/employees/profile")}>
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <span>Profile</span>
          </div>
          <div className="nav-item" onClick={() => router.push("/employees/attendance")}>
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
              <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01" />
            </svg>
            <span>Attendance</span>
          </div>
          <div className="nav-item" onClick={() => router.push("/employees/leaves")}>
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <path d="M12 22V12" />
              <path d="M9 10.5L12 8L15 10.5" />
            </svg>
            <span>Leaves</span>
          </div>
          <div className="nav-item" onClick={() => router.push("/employees/salary")}>
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            <span>Salary</span>
          </div>
        </nav>

        <button className="logout-btn" onClick={async () => {
          await supabase.auth.signOut();
          router.push("/login");
        }}>
          <svg className="logout-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Logout
        </button>
      </aside>

      {/* Main Content */}
      <main className="main">
        {/* Header */}
        <div className="header">
          <div>
            <h1 className="page-title">
              Welcome back, <span className="highlight">{employee?.full_name?.split(' ')[0] || 'Employee'}</span>
            </h1>
            <p className="page-subtitle">Here's what's happening with your work today.</p>
          </div>
          <div className="time-card">
            <svg className="time-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <div className="time-info">
              <div className="time-date">
                {isMounted && currentTime ? currentTime.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'long', 
                  day: 'numeric' 
                }) : 'Loading...'}
              </div>
              <div className="time-clock">
                {isMounted && currentTime ? currentTime.toLocaleTimeString('en-US', { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  second: '2-digit'
                }) : '--:--:--'}
              </div>
            </div>
          </div>
        </div>

        {/* Profile Card */}
        <div className="profile-card">
          <div className="profile-avatar">
            {employee?.full_name?.charAt(0) || 'E'}
          </div>
          <div className="profile-info">
            <h2 className="profile-name">{employee?.full_name || "Loading..."}</h2>
            <p className="profile-role">{employee?.job_title || "Employee"}</p>
            <p className="profile-email">{employee?.email}</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon attendance">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <div className="stat-content">
              <span className="stat-label">Attendance</span>
              <span className="stat-value">{attendanceCount} Days</span>
              <span className="stat-trend">Present this year</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon leave">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <path d="M12 22V12" />
                <path d="M9 10.5L12 8L15 10.5" />
              </svg>
            </div>
            <div className="stat-content">
              <span className="stat-label">Leave Balance</span>
              <span className="stat-value">{leaveCount} Days</span>
              <span className="stat-trend">Approved leaves</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon department">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              </svg>
            </div>
            <div className="stat-content">
              <span className="stat-label">Department</span>
              <span className="stat-value">{employee?.departments?.name || "N/A"}</span>
              <span className="stat-trend">Current assignment</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon salary">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
            </div>
            <div className="stat-content">
              <span className="stat-label">Salary Records</span>
              <span className="stat-value">{salaryCount}</span>
              <span className="stat-trend">Total payslips</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions">
          <h3 className="section-title">Quick Actions</h3>
          <div className="actions-grid">
            <button className="action-btn" onClick={() => router.push("/employees/attendance")}>
              <svg className="action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span>Clock In/Out</span>
            </button>
            <button className="action-btn" onClick={() => router.push("/employees/leaves")}>
              <svg className="action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span>Apply Leave</span>
            </button>
            <button className="action-btn" onClick={() => router.push("/employees/salary")}>
              <svg className="action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              <span>Download Payslip</span>
            </button>
            <button className="action-btn" onClick={() => router.push("/employees/profile")}>
              <svg className="action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <span>Update Profile</span>
            </button>
          </div>
        </div>
      </main>

      <style jsx>{`
        .dashboard {
          display: flex;
          min-height: 100vh;
          background-color: #f5f7fa;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
        }

        /* Sidebar */
        .sidebar {
          width: 260px;
          background-color: #1e293b;
          color: white;
          display: flex;
          flex-direction: column;
          position: sticky;
          top: 0;
          height: 100vh;
        }

        .sidebar-header {
          padding: 1.5rem;
          border-bottom: 1px solid #334155;
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .logo-icon {
          width: 24px;
          height: 24px;
        }

        .logo-text {
          font-size: 1.1rem;
          font-weight: 600;
        }

        .nav-menu {
          flex: 1;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          color: #cbd5e1;
        }

        .nav-item:hover {
          background-color: #334155;
          color: white;
        }

        .nav-item.active {
          background-color: #2563eb;
          color: white;
        }

        .nav-icon {
          width: 20px;
          height: 20px;
        }

        .logout-btn {
          margin: 1.5rem;
          padding: 0.75rem;
          background-color: #dc2626;
          border: none;
          border-radius: 8px;
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          font-size: 0.9rem;
          font-weight: 500;
          transition: all 0.2s;
        }

        .logout-btn:hover {
          background-color: #b91c1c;
        }

        .logout-icon {
          width: 18px;
          height: 18px;
        }

        /* Main Content */
        .main {
          flex: 1;
          padding: 2rem;
          overflow-y: auto;
        }

        /* Header */
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .page-title {
          font-size: 1.75rem;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 0.25rem 0;
        }

        .highlight {
          color: #2563eb;
        }

        .page-subtitle {
          color: #64748b;
          font-size: 0.9rem;
          margin: 0;
        }

        .time-card {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 0.75rem 1.25rem;
        }

        .time-icon {
          width: 22px;
          height: 22px;
          color: #2563eb;
        }

        .time-info {
          text-align: right;
        }

        .time-date {
          font-size: 0.8rem;
          color: #64748b;
        }

        .time-clock {
          font-size: 1rem;
          font-weight: 600;
          color: #1e293b;
        }

        /* Profile Card */
        .profile-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 1.5rem;
          display: flex;
          align-items: center;
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .profile-avatar {
          width: 70px;
          height: 70px;
          background: linear-gradient(135deg, #2563eb, #1e40af);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 1.8rem;
          font-weight: 600;
        }

        .profile-info {
          flex: 1;
        }

        .profile-name {
          font-size: 1.3rem;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 0.25rem 0;
        }

        .profile-role {
          color: #64748b;
          font-size: 0.9rem;
          margin: 0 0 0.25rem 0;
        }

        .profile-email {
          color: #94a3b8;
          font-size: 0.85rem;
          margin: 0;
        }

        /* Stats Grid */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .stat-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 1.25rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          transition: all 0.2s;
        }

        .stat-card:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }

        .stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .stat-icon svg {
          width: 24px;
          height: 24px;
        }

        .stat-icon.attendance {
          background-color: #eff6ff;
          color: #2563eb;
        }

        .stat-icon.leave {
          background-color: #ecfdf5;
          color: #0f973d;
        }

        .stat-icon.department {
          background-color: #fef3c7;
          color: #b45309;
        }

        .stat-icon.salary {
          background-color: #f3e8ff;
          color: #7c3aed;
        }

        .stat-content {
          flex: 1;
        }

        .stat-label {
          display: block;
          color: #64748b;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.3px;
          margin-bottom: 0.25rem;
        }

        .stat-value {
          display: block;
          font-size: 1.25rem;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 0.25rem;
        }

        .stat-trend {
          display: block;
          color: #94a3b8;
          font-size: 0.7rem;
        }

        /* Quick Actions */
        .quick-actions {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 1.5rem;
        }

        .section-title {
          font-size: 1rem;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 1rem 0;
        }

        .actions-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem;
        }

        .action-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.75rem;
          background-color: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          color: #1e293b;
          cursor: pointer;
          font-size: 0.85rem;
          font-weight: 500;
          transition: all 0.2s;
        }

        .action-btn:hover {
          background-color: #eff6ff;
          border-color: #2563eb;
          color: #2563eb;
        }

        .action-icon {
          width: 16px;
          height: 16px;
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .actions-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 768px) {
          .dashboard {
            flex-direction: column;
          }

          .sidebar {
            width: 100%;
            height: auto;
            position: relative;
          }

          .nav-menu {
            flex-direction: row;
            flex-wrap: wrap;
          }

          .main {
            padding: 1rem;
          }

          .header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .actions-grid {
            grid-template-columns: 1fr;
          }

          .profile-card {
            flex-direction: column;
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
}