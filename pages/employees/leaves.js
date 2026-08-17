import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useRouter } from "next/router";

export default function LeavesPage(){
  const router = useRouter();

  const [employee, setEmployee] = useState(null);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    start_date: "",
    end_date: "",
    reason: ""
  });

  useEffect(() => {
    const loadData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if(!session) return;

      const { data: emp } = await supabase
        .from("employees")
        .select("*")
        .eq("email", session.user.email)
        .single();

      setEmployee(emp);

      const { data } = await supabase
        .from("leaves")
        .select("*")
        .eq("employee_id", emp.id)
        .order("created_at", { ascending: false });

      setLeaves(data || []);
      setLoading(false);
    };

    loadData();
  }, []);

  const applyLeave = async () => {
    if(!form.start_date || !form.end_date){
      alert("Please select leave dates");
      return;
    }

    setSubmitting(true);

    const { data, error } = await supabase
      .from("leaves")
      .insert([
        {
          employee_id: employee.id,
          start_date: form.start_date,
          end_date: form.end_date,
          reason: form.reason,
          status: "Pending"
        }
      ])
      .select()
      .single();

    if(!error){
      setLeaves([data, ...leaves]);
      setForm({
        start_date: "",
        end_date: "",
        reason: ""
      });
      alert("Leave applied successfully");
    }

    setSubmitting(false);
  };

  if(loading){
    return(
      <div className="leave-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading leave records...</p>
        </div>
      </div>
    );
  }

  const pendingLeaves = leaves.filter(l => l.status === "Pending").length;
  const approvedLeaves = leaves.filter(l => l.status === "Approved").length;
  const totalDays = leaves.reduce((acc, l) => {
    if(l.status === "Approved" && l.start_date && l.end_date) {
      const start = new Date(l.start_date);
      const end = new Date(l.end_date);
      const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
      return acc + days;
    }
    return acc;
  }, 0);

  return(
    <div className="leave-page">
      {/* Header */}
      <div className="header">
        <div className="header-left">
          <h1 className="page-title">Leave Management</h1>
          <p className="page-subtitle">
            {employee?.full_name} · {employee?.department || 'Employee'}
          </p>
        </div>
        <button className="back-btn" onClick={() => router.push("/employees/dashboard")}>
          <svg className="btn-icon" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Dashboard
        </button>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon pending">⏳</div>
          <div className="stat-content">
            <div className="stat-label">Pending Requests</div>
            <div className="stat-value">{pendingLeaves}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon approved">✅</div>
          <div className="stat-content">
            <div className="stat-label">Approved Leaves</div>
            <div className="stat-value">{approvedLeaves}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon total">📊</div>
          <div className="stat-content">
            <div className="stat-label">Total Days</div>
            <div className="stat-value">{totalDays}</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="content-grid">
        {/* Apply Leave Form */}
        <div className="form-card">
          <div className="card-header">
            <h2>Apply for Leave</h2>
            <span className="card-badge">New Request</span>
          </div>
          
          <div className="form-container">
            <div className="form-group">
              <label>Start Date</label>
              <input
                type="date"
                value={form.start_date}
                onChange={(e) => setForm({...form, start_date: e.target.value})}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="form-group">
              <label>End Date</label>
              <input
                type="date"
                value={form.end_date}
                onChange={(e) => setForm({...form, end_date: e.target.value})}
                min={form.start_date || new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="form-group">
              <label>Reason for Leave</label>
              <textarea
                placeholder="Enter your reason..."
                value={form.reason}
                onChange={(e) => setForm({...form, reason: e.target.value})}
                rows={4}
              />
            </div>

            <button 
              className="submit-btn" 
              onClick={applyLeave} 
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </div>

        {/* Leave History */}
        <div className="history-card">
          <div className="card-header">
            <h2>Leave History</h2>
            <span className="card-badge">{leaves.length} Records</span>
          </div>

          {leaves.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <h3>No records found</h3>
              <p>Apply for leave using the form</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Duration</th>
                    <th>Reason</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {leaves.map((leave) => {
                    const duration = leave.start_date && leave.end_date
                      ? Math.ceil((new Date(leave.end_date) - new Date(leave.start_date)) / (1000 * 60 * 60 * 24)) + 1
                      : 0;

                    return (
                      <tr key={leave.id}>
                        <td>{new Date(leave.start_date).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          year: 'numeric'
                        })}</td>
                        <td>{new Date(leave.end_date).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          year: 'numeric'
                        })}</td>
                        <td>{duration} {duration === 1 ? 'day' : 'days'}</td>
                        <td className="reason-cell" title={leave.reason}>
                          {leave.reason || '-'}
                        </td>
                        <td>
                          <span className={`status-badge ${leave.status.toLowerCase()}`}>
                            {leave.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .leave-page {
          min-height: 100vh;
          background-color: #f5f7fa;
          padding: 2rem;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        /* Loading State */
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
          letter-spacing: -0.02em;
        }

        .page-subtitle {
          color: #64748b;
          font-size: 0.95rem;
          margin: 0;
        }

        .back-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.625rem 1.25rem;
          background-color: white;
          border: 1px solid #d0d0d0;
          border-radius: 8px;
          color: #1e293b;
          font-size: 0.95rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .back-btn:hover {
          background-color: #f8fafc;
          border-color: #2563eb;
        }

        .btn-icon {
          width: 18px;
          height: 18px;
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
          border-radius: 12px;
          padding: 1.5rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          border: 2px solid #d0d0d0;
          transition: box-shadow 0.2s;
        }

        .stat-card:hover {
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          border: 1px solid #d0d0d0;
        }

        .stat-icon.pending {
          background-color: #fffbeb;
          color: #b45309;
        }

        .stat-icon.approved {
          background-color: #ecfdf5;
          color: #059669;
        }

        .stat-icon.total {
          background-color: #eff6ff;
          color: #2563eb;
        }

        .stat-content {
          flex: 1;
        }

        .stat-label {
          color: #64748b;
          font-size: 0.85rem;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 0.25rem;
        }

        .stat-value {
          font-size: 1.75rem;
          font-weight: 600;
          color: #1e293b;
          line-height: 1.2;
        }

        /* Content Grid */
        .content-grid {
          display: grid;
          grid-template-columns: 360px 1fr;
          gap: 1.5rem;
        }

        /* Cards */
        .form-card, .history-card {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          border: 2px solid #d0d0d0;
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 2px solid #d0d0d0;
        }

        .card-header h2 {
          font-size: 1.25rem;
          font-weight: 600;
          color: #1e293b;
          margin: 0;
        }

        .card-badge {
          background-color: #f1f5f9;
          color: #475569;
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 500;
          border: 1px solid #d0d0d0;
        }

        /* Form */
        .form-container {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-group label {
          color: #475569;
          font-size: 0.9rem;
          font-weight: 500;
        }

        .form-group input,
        .form-group textarea {
          padding: 0.625rem 0.875rem;
          border: 1px solid #d0d0d0;
          border-radius: 8px;
          font-size: 0.95rem;
          color: #1e293b;
          background-color: white;
          transition: border-color 0.2s;
        }

        .form-group input:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }

        .form-group input::placeholder,
        .form-group textarea::placeholder {
          color: #94a3b8;
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
          transition: background-color 0.2s;
          margin-top: 0.5rem;
        }

        .submit-btn:hover:not(:disabled) {
          background-color: #1d4ed8;
        }

        .submit-btn:disabled {
          background-color: #94a3b8;
          cursor: not-allowed;
        }

        /* Table */
        .table-responsive {
          overflow-x: auto;
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        th {
          text-align: left;
          padding: 1rem 0.75rem;
          color: #64748b;
          font-weight: 500;
          font-size: 0.85rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-bottom: 2px solid #d0d0d0;
          border-top: 1px solid #d0d0d0;
        }

        td {
          padding: 1rem 0.75rem;
          color: #1e293b;
          font-size: 0.95rem;
          border-bottom: 1px solid #d0d0d0;
        }

        tr:last-child td {
          border-bottom: none;
        }

        .reason-cell {
          max-width: 200px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          color: #475569;
        }

        .status-badge {
          display: inline-block;
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 500;
          text-align: center;
          border: 1px solid #d0d0d0;
        }

        .status-badge.pending {
          background-color: #fffbeb;
          color: #b45309;
        }

        .status-badge.approved {
          background-color: #ecfdf5;
          color: #059669;
        }

        .status-badge.rejected {
          background-color: #fef2f2;
          color: #b91c1c;
        }

        /* Empty State */
        .empty-state {
          text-align: center;
          padding: 3rem 1rem;
        }

        .empty-icon {
          font-size: 3rem;
          color: #94a3b8;
          margin-bottom: 1rem;
        }

        .empty-state h3 {
          color: #1e293b;
          font-size: 1.1rem;
          font-weight: 600;
          margin: 0 0 0.5rem 0;
        }

        .empty-state p {
          color: #64748b;
          font-size: 0.95rem;
          margin: 0;
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .content-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .leave-page {
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
        }
      `}</style>
    </div>
  );
}