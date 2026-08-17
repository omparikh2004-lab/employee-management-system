import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useRouter } from "next/router";

export default function AttendancePage() {
  const [employee, setEmployee] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Form state
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [status, setStatus] = useState("Present");
  const [timeIn, setTimeIn] = useState("");
  const [timeOut, setTimeOut] = useState("");

  const router = useRouter();

  useEffect(() => {
    const loadData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      const { data: emp } = await supabase
        .from("employees")
        .select("*")
        .eq("email", session.user.email)
        .single();

      setEmployee(emp);

      // Load attendance history
      const { data: history } = await supabase
        .from("attendance")
        .select("*")
        .eq("employee_id", emp.id)
        .order("date", { ascending: false })
        .limit(20);

      setRecords(history || []);
      setLoading(false);
    };

    loadData();

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!date) {
      alert("Please select a date");
      return;
    }

    setSubmitting(true);

    // Check if attendance already exists for this date
    const { data: existing } = await supabase
      .from("attendance")
      .select("*")
      .eq("employee_id", employee.id)
      .eq("date", date)
      .maybeSingle();

    if (existing) {
      alert("Attendance for this date has already been marked");
      setSubmitting(false);
      return;
    }

    const { data, error } = await supabase
      .from("attendance")
      .insert([
        {
          employee_id: employee.id,
          date: date,
          status: status,
          time_in: timeIn || null,
          time_out: timeOut || null
        }
      ])
      .select()
      .single();

    if (!error) {
      setRecords([data, ...records]);
      // Reset form except date
      setStatus("Present");
      setTimeIn("");
      setTimeOut("");
      alert("Attendance marked successfully");
    } else {
      alert("Error marking attendance");
    }

    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="attendance-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading attendance data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="attendance-page">
      {/* Header */}
      <div className="header">
        <div>
          <h1 className="page-title">Attendance Management</h1>
          <p className="page-subtitle">
            Welcome back, <strong>{employee?.full_name}</strong> · {employee?.department || 'Employee'}
          </p>
        </div>
        <button className="back-btn" onClick={() => router.push("/employees/dashboard")}>
          <svg className="btn-icon" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Dashboard
        </button>
      </div>

      {/* Live Time Display */}
      <div className="time-card">
        <svg className="time-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        <div className="time-info">
          <div className="current-date">
            {currentTime.toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
          <div className="current-time">
            {currentTime.toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit',
              second: '2-digit'
            })}
          </div>
        </div>
      </div>

      {/* Attendance Form */}
      <div className="form-card">
        <h3 className="form-title">Mark Attendance</h3>
        <form onSubmit={handleSubmit} className="attendance-form">
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="form-input"
                required
                max={new Date().toISOString().split("T")[0]}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="form-select"
                required
              >
                <option value="Present">Present</option>
                <option value="Absent">Absent</option>
                <option value="On Leave">On Leave</option>
                <option value="Half Day">Half Day</option>
                <option value="Late">Late</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Time In</label>
              <input
                type="time"
                value={timeIn}
                onChange={(e) => setTimeIn(e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Time Out</label>
              <input
                type="time"
                value={timeOut}
                onChange={(e) => setTimeOut(e.target.value)}
                className="form-input"
              />
            </div>
          </div>

          <button type="submit" className="submit-btn" disabled={submitting}>
            {submitting ? (
              <>
                <span className="btn-spinner"></span>
                Saving...
              </>
            ) : (
              'Mark Attendance'
            )}
          </button>
        </form>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <svg className="stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span className="stat-label">Total Records</span>
          </div>
          <div className="stat-value">{records.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-header">
            <svg className="stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <span className="stat-label">Present Days</span>
          </div>
          <div className="stat-value">{records.filter(r => r.status === "Present").length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-header">
            <svg className="stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 8v4l3 3" />
              <circle cx="12" cy="12" r="10" />
            </svg>
            <span className="stat-label">Completion Rate</span>
          </div>
          <div className="stat-value">
            {records.length > 0 ? 
              Math.round((records.filter(r => r.status === "Present").length / records.length) * 100) : 0}%
          </div>
        </div>
      </div>

      {/* Attendance Records */}
      <div className="records-card">
        <div className="records-header">
          <h3 className="records-title">
            <svg className="records-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            Attendance History
          </h3>
          <span className="records-count">{records.length} Records</span>
        </div>

        {records.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <p className="empty-text">No attendance records found</p>
            <p className="empty-subtext">Mark your attendance using the form above</p>
          </div>
        ) : (
          <div className="records-table">
            <div className="table-header">
              <div className="table-cell">Date</div>
              <div className="table-cell">Status</div>
              <div className="table-cell">Time In</div>
              <div className="table-cell">Time Out</div>
            </div>
            {records.map((record, index) => (
              <div key={record.id ?? index} className="table-row">
                <div className="table-cell date-cell">
                  {new Date(record.date).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </div>
                <div className="table-cell">
                  <span className={`status-badge ${String(record.status).toLowerCase().replace(/\s+/g, '-')}`}>
                    {record.status}
                  </span>
                </div>
                <div className="table-cell time-cell">{record.time_in || '-'}</div>
                <div className="table-cell time-cell">{record.time_out || '-'}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .attendance-page {
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
          font-size: 1.75rem;
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

        /* Loading */
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          color: #1e293b;
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

        /* Time Card */
        .time-card {
          background: white;
          border: 2px solid #d0d0d0;
          border-radius: 12px;
          padding: 1.25rem 1.5rem;
          margin-bottom: 2rem;
          display: flex;
          align-items: center;
          gap: 1.25rem;
        }

        .time-icon {
          width: 32px;
          height: 32px;
          color: #2563eb;
        }

        .time-info {
          flex: 1;
        }

        .current-date {
          color: #64748b;
          font-size: 0.85rem;
          margin-bottom: 0.25rem;
        }

        .current-time {
          color: #1e293b;
          font-size: 1.5rem;
          font-weight: 600;
          font-family: monospace;
        }

        /* Form Card */
        .form-card {
          background: white;
          border: 2px solid #d0d0d0;
          border-radius: 12px;
          padding: 1.5rem;
          margin-bottom: 2rem;
        }

        .form-title {
          font-size: 1.1rem;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 1.25rem 0;
        }

        .attendance-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-label {
          color: #64748b;
          font-size: 0.85rem;
          font-weight: 500;
        }

        .form-input,
        .form-select {
          padding: 0.625rem 0.875rem;
          border: 1px solid #d0d0d0;
          border-radius: 8px;
          font-size: 0.9rem;
          color: #1e293b;
          background-color: white;
          transition: all 0.2s;
        }

        .form-input:focus,
        .form-select:focus {
          outline: none;
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }

        .submit-btn {
          background-color: #2563eb;
          color: white;
          border: none;
          border-radius: 8px;
          padding: 0.75rem;
          font-size: 0.95rem;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          transition: background-color 0.2s;
        }

        .submit-btn:hover:not(:disabled) {
          background-color: #1d4ed8;
        }

        .submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }

        /* Stats Grid */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .stat-card {
          background: white;
          border: 2px solid #d0d0d0;
          border-radius: 12px;
          padding: 1.25rem;
        }

        .stat-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
        }

        .stat-icon {
          width: 20px;
          height: 20px;
          color: #2563eb;
        }

        .stat-label {
          color: #64748b;
          font-size: 0.85rem;
          font-weight: 500;
        }

        .stat-value {
          font-size: 1.75rem;
          font-weight: 600;
          color: #1e293b;
        }

        /* Records Card */
        .records-card {
          background: white;
          border: 2px solid #d0d0d0;
          border-radius: 12px;
          padding: 1.5rem;
        }

        .records-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 2px solid #d0d0d0;
        }

        .records-title {
          font-size: 1rem;
          font-weight: 600;
          color: #1e293b;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .records-icon {
          width: 20px;
          height: 20px;
          color: #2563eb;
        }

        .records-count {
          color: #64748b;
          font-size: 0.85rem;
          background: #f1f5f9;
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          border: 1px solid #d0d0d0;
        }

        /* Records Table */
        .records-table {
          display: flex;
          flex-direction: column;
        }

        .table-header,
        .table-row {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr 1fr;
          gap: 1rem;
          padding: 0.75rem 0;
        }

        .table-header {
          background-color: #f8fafc;
          border-radius: 8px;
          font-weight: 600;
          color: #1e293b;
          font-size: 0.85rem;
          text-transform: uppercase;
          letter-spacing: 0.3px;
          border: 1px solid #d0d0d0;
          margin-bottom: 0.5rem;
        }

        .table-row {
          border-bottom: 1px solid #d0d0d0;
        }

        .table-row:last-child {
          border-bottom: none;
        }

        .table-cell {
          padding: 0 0.5rem;
        }

        .date-cell {
          font-weight: 500;
        }

        .time-cell {
          font-family: monospace;
        }

        .status-badge {
          display: inline-block;
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 500;
          border: 1px solid transparent;
        }

        .status-badge.present {
          background-color: #ecfdf5;
          color: #0f973d;
          border-color: #d0d0d0;
        }

        .status-badge.absent {
          background-color: #fef2f2;
          color: #dc2626;
          border-color: #d0d0d0;
        }

        .status-badge.on-leave {
          background-color: #fffbeb;
          color: #b45309;
          border-color: #d0d0d0;
        }

        .status-badge.half-day {
          background-color: #fef3c7;
          color: #d97706;
          border-color: #d0d0d0;
        }

        .status-badge.late {
          background-color: #fff3e0;
          color: #ed6c02;
          border-color: #d0d0d0;
        }

        /* Empty State */
        .empty-state {
          text-align: center;
          padding: 3rem;
        }

        .empty-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
          opacity: 0.5;
        }

        .empty-text {
          color: #1e293b;
          font-size: 1rem;
          margin-bottom: 0.5rem;
        }

        .empty-subtext {
          color: #64748b;
          font-size: 0.9rem;
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .form-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 768px) {
          .attendance-page {
            padding: 1rem;
          }

          .header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }

          .form-grid {
            grid-template-columns: 1fr;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .table-header,
          .table-row {
            grid-template-columns: 1fr 1fr 1fr 1fr;
            gap: 0.5rem;
            font-size: 0.8rem;
          }

          .time-card {
            flex-direction: column;
            text-align: center;
          }

          .time-info {
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
}