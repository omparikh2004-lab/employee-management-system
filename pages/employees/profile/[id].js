import { useUser } from '../../../context/UserContext';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../../lib/supabaseClient';

export default function EmployeeProfile() {
  const router = useRouter();
  const { id } = router.query;
  const [employee, setEmployee] = useState(null);
  const [activeTab, setActiveTab] = useState('personal');
  const [selectedImage, setSelectedImage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchEmployee = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('employees')
        .select(`
          *,
          departments(name)
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Fetch error:', error);
      } else {
        setEmployee(data);
      }
      setLoading(false);
    };

    fetchEmployee();
  }, [id]);

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        width: '100%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#f5f5f5'
      }}>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        width: '100%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#f5f5f5'
      }}>
        <div className="error-message">Employee not found</div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      width: '100%', 
      backgroundColor: '#f5f5f5',
      padding: '20px'
    }}>
      <div className="profile-container" style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header Section */}
        <div className="profile-header" style={{ border: '1px solid #d0d0d0', borderRadius: '12px', padding: '20px', backgroundColor: '#fff', marginBottom: '20px' }}>
          <div className="profile-image-container">
            <img
              src={employee.image_url || '/default-avatar.png'}
              alt={employee.full_name}
              className="profile-image"
              onClick={() => setSelectedImage(employee.image_url || '/default-avatar.png')}
            />
          </div>
          <div className="profile-info">
            <h1 className="profile-name">{employee.full_name || 'Employee'}'s Profile</h1>
            <p className="profile-role">
              {employee.job_title || 'No Title'} • {employee.departments?.name || 'Unassigned'}
            </p>
            <div className="profile-stats">
              <div className="stat-item" style={{ borderRight: '1px solid #e0e0e0' }}>
                <span className="stat-value">2.5y</span>
                <span className="stat-label">Tenure</span>
              </div>
              <div className="stat-item" style={{ borderRight: '1px solid #e0e0e0' }}>
                <span className="stat-value">95%</span>
                <span className="stat-label">Attendance</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">12</span>
                <span className="stat-label">Leaves</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs-container" style={{ borderBottom: '2px solid #d0d0d0', marginBottom: '20px' }}>
          {[
            { id: 'personal', label: 'Personal Info', icon: '👨‍💼' },
            { id: 'attendance', label: 'Attendance', icon: '📅' },
            { id: 'salary', label: 'Salary', icon: '💵' },
            { id: 'leaves', label: 'Leaves', icon: '🌴' },
          ].map((tab) => (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              style={{
                borderBottom: activeTab === tab.id ? '2px solid #007bff' : '2px solid transparent',
                padding: '12px 20px',
                background: 'transparent'
              }}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="tab-content" style={{ border: '1px solid #d0d0d0', borderRadius: '8px', padding: '20px', backgroundColor: '#fff' }}>
          {activeTab === 'personal' && <PersonalInfoTab employee={employee} />}
          {activeTab === 'attendance' && <AttendanceTab employeeId={employee.id} />}
          {activeTab === 'salary' && <SalaryTab employee={employee} />}
          {activeTab === 'leaves' && <LeavesTab employee={employee} />}
        </div>

        {/* Image Modal */}
        {selectedImage && (
          <div className="modal-overlay" onClick={() => setSelectedImage(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <img src={selectedImage} alt="Profile" className="modal-image" />
              <button className="modal-close" onClick={() => setSelectedImage(null)}>
                ×
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------- Personal Info ------------------- */
function PersonalInfoTab({ employee }) {

  const generateBioData = async () => {

    const pdf = new jsPDF();

    /* ---------- HEADER ---------- */

    pdf.setFontSize(20);
    pdf.text("ABC CORPORATION LTD.", 105, 15, { align: "center" });

    pdf.setFontSize(11);
    pdf.text("Human Resources Department", 105, 22, { align: "center" });

    pdf.setFontSize(14);
    pdf.text("Employee Bio-Data", 105, 35, { align: "center" });

    /* ---------- PROFILE PHOTO ---------- */

    if (employee.image_url) {
      try {
        const response = await fetch(employee.image_url);
        const blob = await response.blob();

        const reader = new FileReader();

        reader.onloadend = function () {

          const base64data = reader.result;

          pdf.addImage(base64data, "JPEG", 15, 40, 35, 35);

          addContent();
        };

        reader.readAsDataURL(blob);

      } catch (error) {
        addContent();
      }

    } else {
      addContent();
    }

    function addContent() {

      /* ---------- WATERMARK ---------- */

      pdf.setTextColor(230, 230, 230);
      pdf.setFontSize(60);
      pdf.text("ABC", 105, 150, { align: "center", angle: 45 });

      pdf.setTextColor(0, 0, 0);

      /* ---------- EMPLOYEE DETAILS ---------- */

      const details = [
        ["Full Name", employee.full_name || "N/A"],
        ["Email", employee.email || "N/A"],
        ["Phone", employee.phone || "N/A"],
        ["Department", employee.departments?.name || "N/A"],
        ["Job Title", employee.job_title || "N/A"],
        ["Role", employee.role || "N/A"],
        ["Join Date", employee.join_date || "N/A"],
      ];

      autoTable(pdf, {
        startY: 80,
        head: [["Field", "Details"]],
        body: details,
        theme: "grid",
        styles: { fontSize: 11 },
        headStyles: { fillColor: [52, 152, 219] }
      });

      /* ---------- HR SIGNATURE ---------- */

      pdf.setFontSize(10);
      pdf.text("HR Manager", 160, 250);
      pdf.line(150, 245, 200, 245);

      /* ---------- COMPANY STAMP ---------- */

      pdf.circle(40, 250, 18);

      pdf.setFontSize(9);
      pdf.text("ABC COMPANY", 40, 248, { align: "center" });
      pdf.text("OFFICIAL", 40, 253, { align: "center" });

      /* ---------- FOOTER ---------- */

      pdf.setFontSize(9);
      pdf.text(
        "This is a system generated employee bio-data document.",
        105,
        280,
        { align: "center" }
      );

      pdf.save(`Employee_Biodata_${employee.full_name}.pdf`);
    }
  };


  return (
    <div className="personal-info-tab">
      <h2 className="tab-title">Personal Information</h2>

      {/* Download Button */}
      <div style={{ marginBottom: "20px" }}>
        <button
          className="submit-button"
          onClick={generateBioData}
          style={{ border: '1px solid #007bff', padding: '10px 20px', borderRadius: '6px' }}
        >
          Download Bio-Data
        </button>
      </div>

      <div className="info-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px', border: '1px solid #d0d0d0', borderRadius: '8px', padding: '20px' }}>
        <div className="info-item" style={{ padding: '12px', borderBottom: '1px solid #e0e0e0' }}>
          <span className="info-label" style={{ fontWeight: 'bold', color: '#555' }}>Email</span>
          <span className="info-value" style={{ marginLeft: '10px' }}>{employee.email || 'N/A'}</span>
        </div>

        <div className="info-item" style={{ padding: '12px', borderBottom: '1px solid #e0e0e0' }}>
          <span className="info-label" style={{ fontWeight: 'bold', color: '#555' }}>Phone</span>
          <span className="info-value" style={{ marginLeft: '10px' }}>{employee.phone || 'N/A'}</span>
        </div>

        <div className="info-item" style={{ padding: '12px', borderBottom: '1px solid #e0e0e0' }}>
          <span className="info-label" style={{ fontWeight: 'bold', color: '#555' }}>Department</span>
          <span className="info-value" style={{ marginLeft: '10px' }}>{employee.departments?.name || 'Unassigned'}</span>
        </div>

        <div className="info-item" style={{ padding: '12px', borderBottom: '1px solid #e0e0e0' }}>
          <span className="info-label" style={{ fontWeight: 'bold', color: '#555' }}>Job Title</span>
          <span className="info-value" style={{ marginLeft: '10px' }}>{employee.job_title || 'N/A'}</span>
        </div>

        <div className="info-item" style={{ padding: '12px' }}>
          <span className="info-label" style={{ fontWeight: 'bold', color: '#555' }}>Role</span>
          <span className="info-value" style={{ marginLeft: '10px' }}>{employee.role || 'N/A'}</span>
        </div>

        <div className="info-item" style={{ padding: '12px' }}>
          <span className="info-label" style={{ fontWeight: 'bold', color: '#555' }}>Join Date</span>
          <span className="info-value" style={{ marginLeft: '10px' }}>{employee.join_date || 'N/A'}</span>
        </div>
      </div>
    </div>
  );
}

/* ------------------- Attendance Tab ------------------- */
function AttendanceTab({ employeeId }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('Present');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [timeIn, setTimeIn] = useState('');   // optional HH:MM
  const [timeOut, setTimeOut] = useState(''); // optional HH:MM
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!employeeId) return;

    const fetchAttendance = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('employee_id', employeeId)
        .order('date', { ascending: false });

      if (error) {
        console.error('Error loading attendance:', error);
      } else {
        setRecords(data || []);
      }
      setLoading(false);
    };

    fetchAttendance();
  }, [employeeId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!date || !status) return alert('Please provide date and status.');

    setSubmitting(true);

    try {
      // ✅ Step 1: Check if attendance already exists for the same date
      const { data: existing, error: fetchError } = await supabase
        .from('attendance')
        .select('id')
        .eq('employee_id', employeeId)
        .eq('date', date)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        // PGRST116 = no rows found (safe to ignore)
        throw fetchError;
      }

      if (existing) {
        alert('⚠️ Attendance for this date has already been marked. Only one entry allowed per day.');
        setSubmitting(false);
        return;
      }

      // ✅ Step 2: Insert the attendance (only if not already marked)
      const { error: insertError } = await supabase.from('attendance').insert([
        {
          employee_id: employeeId,
          date,
          status,
          time_in: timeIn || null,
          time_out: timeOut || null,
        },
      ]);

      if (insertError) {
        throw insertError;
      }

      // ✅ Step 3: Update UI instantly
      setRecords((prev) => [{ employee_id: employeeId, date, status, time_in: timeIn, time_out: timeOut }, ...prev]);
      alert('✅ Attendance marked successfully');

    } catch (err) {
      console.error('Error:', err);
      alert('Error saving attendance: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };


  return (
    <div className="attendance-tab">
      <h2 className="tab-title">Attendance Records</h2>

      {/* Attendance Form */}
      <form onSubmit={handleSubmit} className="attendance-form" style={{ border: '1px solid #d0d0d0', borderRadius: '8px', padding: '20px', marginBottom: '20px' }}>
        <h3 className="form-title">Mark Attendance</h3>
        <div className="form-fields" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
          <div className="form-group">
            <label className="form-label">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="form-input"
              style={{ border: '1px solid #ccc', padding: '8px', borderRadius: '4px', width: '100%' }}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="form-select"
              style={{ border: '1px solid #ccc', padding: '8px', borderRadius: '4px', width: '100%' }}
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
              style={{ border: '1px solid #ccc', padding: '8px', borderRadius: '4px', width: '100%' }}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Time Out</label>
            <input
              type="time"
              value={timeOut}
              onChange={(e) => setTimeOut(e.target.value)}
              className="form-input"
              style={{ border: '1px solid #ccc', padding: '8px', borderRadius: '4px', width: '100%' }}
            />
          </div>

          <div className="form-group">
            <label className="form-label invisible">Submit</label>
            <button type="submit" className="submit-button" disabled={submitting} style={{ border: '1px solid #007bff', padding: '8px 16px', borderRadius: '4px', background: '#007bff', color: '#fff' }}>
              {submitting ? (
                <>
                  <span className="spinner"></span>
                  Saving...
                </>
              ) : (
                'Mark Attendance'
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Attendance Records */}
      <div className="attendance-records">
        <h3 className="records-title">History</h3>
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner small"></div>
          </div>
        ) : records.length === 0 ? (
          <p className="no-data">No attendance records found.</p>
        ) : (
          <div className="records-table" style={{ border: '1px solid #d0d0d0', borderRadius: '8px', overflow: 'hidden' }}>
            <div className="table-header" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', background: '#f5f5f5', borderBottom: '2px solid #d0d0d0', padding: '12px', fontWeight: 'bold' }}>
              <div className="table-cell">Date</div>
              <div className="table-cell">Status</div>
              <div className="table-cell">Time In</div>
              <div className="table-cell">Time Out</div>
            </div>
            {records.map((record, index) => (
              <div key={record.id ?? index} className="table-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderBottom: '1px solid #e0e0e0', padding: '12px' }}>
                <div className="table-cell">{record.date}</div>
                <div className="table-cell">
                  <span className={`status-badge ${String(record.status).toLowerCase().replace(/\s+/g, '-')}`} style={{ padding: '4px 8px', borderRadius: '4px', background: '#e8f4fd' }}>
                    {record.status}
                  </span>
                </div>
                <div className="table-cell">{record.time_in || '-'}</div>
                <div className="table-cell">{record.time_out || '-'}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------- Salary Tab ------------------- */
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable"; 
function SalaryTab({ employee }) {
  const [salaryData, setSalaryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    base_salary: "",
    bonus: "",
    deductions: "",
    pay_month: "",
  });
  const [submitting, setSubmitting] = useState(false);

  // Fetch salaries
  useEffect(() => {
    if (!employee?.id) return;

    const fetchSalaries = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("salaries")
        .select("*")
        .eq("employee_id", employee.id)
        .order("pay_month", { ascending: false });

      if (error) console.error(error);
      else setSalaryData(data || []);

      setLoading(false);
    };

    fetchSalaries();
  }, [employee?.id]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Submit salary
const handleSubmit = async (e) => {
  e.preventDefault();

  // ✅ ADD THIS LINE HERE
  console.log("ADMIN ADDING SALARY FOR:", employee.id);

  if (!employee?.id) {
    alert("Employee not selected");
    return;
  
  }

  if (!form.base_salary || !form.pay_month) {
    alert("Enter salary and month");
    return;
  }

  setSubmitting(true);

  const formattedMonth = form.pay_month + "-01";

  try {
    console.log("INSERTING FOR EMPLOYEE ID:", employee.id);

    const { data: existing } = await supabase
      .from("salaries")
      .select("id")
      .eq("employee_id", employee.id)
      .eq("pay_month", formattedMonth)
      .maybeSingle();

    if (existing) {
      alert("Salary already exists for this month");
      setSubmitting(false);
      return;
    }

    const payload = {
      employee_id: employee.id,
      base_salary: parseFloat(form.base_salary),
      bonus: parseFloat(form.bonus || 0),
      deductions: parseFloat(form.deductions || 0),
      pay_month: formattedMonth,
    };

    const { error } = await supabase
      .from("salaries")
      .insert([payload]);

    if (error) throw error;

    alert("Salary added successfully");

    setForm({
      base_salary: "",
      bonus: "",
      deductions: "",
      pay_month: "",
    });

    const { data } = await supabase
      .from("salaries")
      .select("*")
      .eq("employee_id", employee.id)
      .order("pay_month", { ascending: false });

    setSalaryData(data || []);

  } catch (err) {
    console.error("ERROR:", err);
    alert(err.message);
  } finally {
    setSubmitting(false);
    
  }

};

  /* -------- PAYSLIP GENERATOR -------- */

  const generatePayslip = (item) => {

    const pdf = new jsPDF();

    const month = new Date(item.pay_month).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });

    const netSalary =
      item.base_salary + item.bonus - item.deductions;

    /* ---------- COMPANY HEADER ---------- */

    pdf.setFontSize(20);
    pdf.setTextColor(40, 40, 40);
    pdf.text("ABC CORPORATION LTD.", 105, 18, { align: "center" });

    pdf.setFontSize(10);
    pdf.text("Corporate Office: Ahmedabad, India", 105, 25, { align: "center" });
    pdf.text("Email: hr@abccompany.com", 105, 30, { align: "center" });

    pdf.setFontSize(14);
    pdf.text("EMPLOYEE PAYSLIP", 105, 40, { align: "center" });

    /* ---------- WATERMARK ---------- */

    pdf.setTextColor(230, 230, 230);
    pdf.setFontSize(60);
    pdf.text("ABC", 105, 150, { align: "center", angle: 45 });

    pdf.setTextColor(0, 0, 0);

    /* ---------- EMPLOYEE DETAILS ---------- */

    pdf.setFontSize(11);

    pdf.text(`Employee Name: ${employee.full_name}`, 15, 60);
    pdf.text(`Employee ID: ${employee.id}`, 15, 66);
    pdf.text(`Department: ${employee.departments?.name || "N/A"}`, 15, 72);

    pdf.text(`Payslip Month: ${month}`, 140, 60);
    pdf.text(`Generated Date: ${new Date().toLocaleDateString()}`, 140, 66);

    /* ---------- SALARY TABLE ---------- */

    autoTable(pdf, {
      startY: 85,
      theme: "grid",
      head: [["Earnings", "Amount ($)", "Deductions", "Amount ($)"]],
      body: [
        ["Base Salary", item.base_salary.toFixed(2), "Deductions", item.deductions.toFixed(2)],
        ["Bonus", item.bonus.toFixed(2), "", ""],
      ],
      styles: {
        halign: "center",
        fontSize: 11
      },
      headStyles: {
        fillColor: [52, 152, 219]
      }
    });

    /* ---------- NET SALARY ---------- */

    pdf.setFontSize(13);
    pdf.text(
      `Net Salary: $${netSalary.toFixed(2)}`,
      15,
      pdf.lastAutoTable.finalY + 15
    );

    /* ---------- HR SIGNATURE ---------- */

    pdf.setFontSize(10);
    pdf.text("HR Manager", 160, 250);
    pdf.line(150, 245, 200, 245);

    /* ---------- COMPANY STAMP ---------- */

    pdf.setDrawColor(100);
    pdf.circle(40, 250, 18);

    pdf.setFontSize(9);
    pdf.text("ABC COMPANY", 40, 248, { align: "center" });
    pdf.text("OFFICIAL", 40, 253, { align: "center" });

    /* ---------- FOOTER ---------- */

    pdf.setFontSize(9);
    pdf.text(
      "This is a system generated payslip and does not require a physical signature.",
      105,
      280,
      { align: "center" }
    );

    pdf.save(`Payslip_${employee.full_name}_${month}.pdf`);
  };

  return (
    <div className="salary-tab">
      <h2 className="tab-title">Salary Information</h2>

      {/* ➕ Add / Update Salary Form */} 
      <div className="add-salary-form" style={{ border: '1px solid #d0d0d0', borderRadius: '8px', padding: '20px', marginBottom: '20px' }}>
        <h3 className="form-title">Add / Update Salary Record</h3> 
        <form onSubmit={handleSubmit} className="salary-form"> 
          <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}> 
            <div className="form-group"> 
              <label className="form-label">Base Salary ($)</label> 
              <input type="number" name="base_salary" value={form.base_salary} onChange={handleChange} className="form-input" placeholder="Enter base salary" required style={{ border: '1px solid #ccc', padding: '8px', borderRadius: '4px', width: '100%' }} /> 
            </div> 
            <div className="form-group"> 
              <label className="form-label">Bonus ($)</label> 
              <input type="number" name="bonus" value={form.bonus} onChange={handleChange} className="form-input" placeholder="Optional" style={{ border: '1px solid #ccc', padding: '8px', borderRadius: '4px', width: '100%' }} /> 
            </div> 
            <div className="form-group"> 
              <label className="form-label">Deductions ($)</label> 
              <input type="number" name="deductions" value={form.deductions} onChange={handleChange} className="form-input" placeholder="Optional" style={{ border: '1px solid #ccc', padding: '8px', borderRadius: '4px', width: '100%' }} /> 
            </div> 
            <div className="form-group"> 
              <label className="form-label">Pay Month</label> 
              <input type="month" name="pay_month" value={form.pay_month} onChange={handleChange} className="form-input" required style={{ border: '1px solid #ccc', padding: '8px', borderRadius: '4px', width: '100%' }} /> 
            </div> 
            <div className="form-group full-width"> 
              <button type="submit" className="submit-button" disabled={submitting} style={{ border: '1px solid #007bff', padding: '8px 16px', borderRadius: '4px', background: '#007bff', color: '#fff' }}> 
                {submitting ? (<> <span className="spinner"></span> Saving... </>) : ('Save Salary')} 
              </button> 
            </div> 
          </div> 
        </form> 
      </div>
      
      {/* Salary History */}
      <h3 className="records-title">Salary History</h3>

      {loading ? (
        <p>Loading...</p>
      ) : salaryData.length === 0 ? (
        <p>No salary records</p>
      ) : (
        <div className="records-table" style={{ border: '1px solid #d0d0d0', borderRadius: '8px', overflow: 'hidden' }}>
          <div className="table-header" style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', background: '#f5f5f5', borderBottom: '2px solid #d0d0d0', padding: '12px', fontWeight: 'bold' }}>
            <div>Month</div>
            <div>Base</div>
            <div>Bonus</div>
            <div>Deductions</div>
            <div>Net</div>
            <div>Payslip</div>
          </div>

          {salaryData.map((item) => {
            const net =
              item.base_salary + item.bonus - item.deductions;

            return (
              <div key={item.id} className="table-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', borderBottom: '1px solid #e0e0e0', padding: '12px' }}>
                <div>
                  {new Date(item.pay_month).toLocaleDateString(
                    "en-US",
                    { month: "long", year: "numeric" }
                  )}
                </div>
                <div>${item.base_salary.toFixed(2)}</div>
                <div>${item.bonus.toFixed(2)}</div>
                <div>${item.deductions.toFixed(2)}</div>
                <div>
                  <strong>${net.toFixed(2)}</strong>
                </div>
                <div>
                  <button
                    className="submit-button"
                    onClick={() => generatePayslip(item)}
                    style={{ border: '1px solid #007bff', padding: '6px 12px', borderRadius: '4px', background: '#007bff', color: '#fff' }}
                  >
                    Download Payslip
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ------------------- Leaves Tab ------------------- */
function LeavesTab({ employee }) {

  const { employee: loggedInEmployee } = useUser();

  const [leaves, setLeaves] = useState([]);
  const [form, setForm] = useState({
    start_date: '',
    end_date: '',
    reason: '',
  });

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadLeaves();
  }, []);

  /* ---------------- LOAD LEAVES ---------------- */

const loadLeaves = async () => {

  const { data, error } = await supabase
    .from("leaves")
    .select(`
      *,
      employees!leaves_employee_id_fkey(full_name,email)
    `)
    .eq("employee_id", employee.id)   // 👈 THIS IS THE FIX
    .order("created_at", { ascending: false });

  console.log("ERROR FULL:", JSON.stringify(error, null, 2));

  if (error) {
    console.error("Error loading leaves:", error);
  } else {
    setLeaves(data || []);
  }

};

  /* ---------------- APPLY LEAVE ---------------- */

  const handleApply = async () => {

    if (!employee?.id) {
      alert("Employee not found.");
      return;
    }

    if (!form.start_date || !form.end_date) {
      alert("Please select both dates.");
      return;
    }

    const start = new Date(form.start_date);
    const end = new Date(form.end_date);

    /* VALIDATION: End date must be after start date */

    if (end < start) {
      alert("End date cannot be before start date.");
      return;
    }

    /* VALIDATION: Reason required */

    if (!form.reason || form.reason.trim().length < 3) {
      alert("Please enter a valid reason.");
      return;
    }

    /* VALIDATION: Prevent duplicate leave request */

    const { data: existing } = await supabase
      .from("leaves")
      .select("id")
      .eq("employee_id", employee.id)
      .eq("start_date", form.start_date)
      .maybeSingle();

    if (existing) {
      alert("You already applied leave for this date.");
      return;
    }

    setSubmitting(true);

    const { error } = await supabase
      .from("leaves")
      .insert([
        {
          employee_id: employee.id,
          start_date: form.start_date,
          end_date: form.end_date,
          reason: form.reason,
          status: "Pending",
        },
      ]);

    if (error) {
      alert("Error: " + error.message);
    } else {

      alert("Leave request submitted successfully.");

      setForm({
        start_date: "",
        end_date: "",
        reason: "",
      });

      loadLeaves();
    }

    setSubmitting(false);
  };

  /* ---------------- APPROVE / REJECT ---------------- */

  const handleStatusChange = async (leaveId, status) => {

    const { error } = await supabase
      .from("leaves")
      .update({ status })
      .eq("id", leaveId);

    if (error) {
      alert("Update failed.");
    } else {
      loadLeaves();
    }

  };

  /* ---------------- UI ---------------- */

  return (

    <div className="leaves-tab">

      <h2 className="tab-title">Leave Management</h2>

      {/* Apply Leave */}

      <div className="leave-application" style={{ border: '1px solid #d0d0d0', borderRadius: '8px', padding: '20px', marginBottom: '20px' }}>
        <h3 className="form-title">Apply for Leave</h3>

        <div className="application-form" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
          <div className="form-group">
            <label className="form-label">Start Date</label>
            <input
              type="date"
              value={form.start_date}
              onChange={(e) => setForm({ ...form, start_date: e.target.value })}
              className="form-input"
              style={{ border: '1px solid #ccc', padding: '8px', borderRadius: '4px', width: '100%' }}
            />
          </div>

          <div className="form-group">
            <label className="form-label">End Date</label>
            <input
              type="date"
              value={form.end_date}
              onChange={(e) => setForm({ ...form, end_date: e.target.value })}
              className="form-input"
              style={{ border: '1px solid #ccc', padding: '8px', borderRadius: '4px', width: '100%' }}
            />
          </div>

          <div className="form-group full-width" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Reason</label>
            <textarea
              placeholder="Reason for leave"
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              className="form-textarea"
              rows="3"
              style={{ border: '1px solid #ccc', padding: '8px', borderRadius: '4px', width: '100%' }}
            />
          </div>

          <div className="form-group full-width" style={{ gridColumn: '1 / -1' }}>
            <button
              onClick={handleApply}
              disabled={submitting}
              className="submit-button"
              style={{ border: '1px solid #007bff', padding: '8px 16px', borderRadius: '4px', background: '#007bff', color: '#fff' }}
            >
              {submitting ? "Submitting..." : "Apply for Leave"}
            </button>
          </div>
        </div>
      </div>

      {/* Leave History */}

      <div className="leave-history">
        <h3 className="records-title">Leave History</h3>

        {leaves.length === 0 ? (
          <p className="no-data">No leave records yet.</p>
        ) : (
          <div className="records-table" style={{ border: '1px solid #d0d0d0', borderRadius: '8px', overflow: 'hidden' }}>
            <div className="table-header" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', background: '#f5f5f5', borderBottom: '2px solid #d0d0d0', padding: '12px', fontWeight: 'bold' }}>
              <div className="table-cell">Employee</div>
              <div className="table-cell">Dates</div>
              <div className="table-cell">Reason</div>
              <div className="table-cell">Status</div>
              <div className="table-cell">Actions</div>
            </div>

            {leaves.map((leave) => (
              <div key={leave.id} className="table-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', borderBottom: '1px solid #e0e0e0', padding: '12px' }}>
                <div className="table-cell">
                  {leave.employees?.full_name || "Unknown"}
                </div>

                <div className="table-cell">
                  {leave.start_date} → {leave.end_date}
                </div>

                <div className="table-cell">
                  {leave.reason || "N/A"}
                </div>

                <div className="table-cell">
                  <span className={`status-badge ${leave.status.toLowerCase()}`} style={{ padding: '4px 8px', borderRadius: '4px', background: leave.status === 'Approved' ? '#d4edda' : leave.status === 'Rejected' ? '#f8d7da' : '#fff3cd' }}>
                    {leave.status}
                  </span>
                </div>

                <div className="table-cell">
                  {leave.status === "Pending" &&
                    (loggedInEmployee?.role === "admin" ||
                      loggedInEmployee?.role === "manager") && (
                      <div className="action-buttons" style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleStatusChange(leave.id, "Approved")}
                          className="action-button approve"
                          style={{ border: '1px solid #28a745', padding: '4px 12px', borderRadius: '4px', background: '#28a745', color: '#fff' }}
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleStatusChange(leave.id, "Rejected")}
                          className="action-button reject"
                          style={{ border: '1px solid #dc3545', padding: '4px 12px', borderRadius: '4px', background: '#dc3545', color: '#fff' }}
                        >
                          Reject
                        </button>
                      </div>
                    )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}