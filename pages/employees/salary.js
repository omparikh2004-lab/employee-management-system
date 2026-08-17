import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useRouter } from "next/router";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function EmployeeSalary() {
  const [employee, setEmployee] = useState(null);
  const [salaryData, setSalaryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const loadData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

     const { data: emp, error } = await supabase
  .from("employees")
  .select(`
    *,
    departments(name)
  `)
  .eq("email", session.user.email)
  .single();

if (error) {
  console.error(error);
} else {
  console.log("EMPLOYEE WITH DEPT:", emp);
}

setEmployee(emp);

      const { data: salary, error: salError } = await supabase
        .from("salaries")
        .select("*")
        .eq("employee_id", emp.id)
        .order("pay_month", { ascending: false });

      if (!salError) {
        setSalaryData(salary || []);
      }

      setLoading(false);
    };

    loadData();
  }, []);

  const generatePayslip = (item) => {
    const pdf = new jsPDF();
    
    const month = new Date(item.pay_month).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });

    const netSalary = item.base_salary + item.bonus - item.deductions;

    // Company Header
    pdf.setFillColor(37, 99, 235);
    pdf.rect(0, 0, 210, 40, "F");
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(20);
    pdf.setFont("helvetica", "bold");
    pdf.text("ABC CORPORATION", 105, 25, { align: "center" });
    
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "normal");
    pdf.text(`PAYSLIP - ${month}`, 105, 48, { align: "center" });

    // Employee Details
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "bold");
    pdf.text("EMPLOYEE DETAILS", 15, 65);
    
    pdf.setFont("helvetica", "normal");
    pdf.text(`Name: ${employee.full_name}`, 15, 73);
    pdf.text(`Email: ${employee.email}`, 15, 81);
   pdf.text(`Employee ID: ${employee.id}`, 15, 89);
pdf.text(
  `Department: ${employee?.departments?.name || "N/A"}`,
  15,
  97
);

    // Salary Table
    autoTable(pdf, {
      startY: 110,
      head: [["EARNINGS", "AMOUNT (USD)", "DEDUCTIONS", "AMOUNT (USD)"]],
      body: [
        ["Base Salary", `$${item.base_salary.toLocaleString()}`, "Tax Deductions", `$${item.deductions.toLocaleString()}`],
        ["Bonus", `$${item.bonus.toLocaleString()}`, "", ""],
      ],
      headStyles: {
        fillColor: [37, 99, 235],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        halign: "center",
      },
      bodyStyles: {
        fontSize: 10,
      },
      columnStyles: {
        0: { halign: "left" },
        1: { halign: "right" },
        2: { halign: "left" },
        3: { halign: "right" },
      },
      margin: { left: 15, right: 15 },
    });

    const finalY = pdf.lastAutoTable.finalY + 10;
    
    // Net Salary
    pdf.setFillColor(245, 247, 250);
    pdf.rect(15, finalY, 180, 20, "F");
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "bold");
    pdf.text("NET SALARY", 20, finalY + 12);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(14);
    pdf.setTextColor(37, 99, 235);
    pdf.text(`$${netSalary.toLocaleString()}`, 170, finalY + 12, { align: "right" });
    
    // Footer
    pdf.setTextColor(128, 128, 128);
    pdf.setFontSize(8);
    pdf.text("This is a computer-generated document and does not require a signature.", 105, finalY + 30, { align: "center" });
    pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, 105, finalY + 38, { align: "center" });

    pdf.save(`Payslip_${employee.full_name}_${month}.pdf`);
  };

  if (loading) {
    return (
      <div className="salary-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading salary records...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="salary-page">
      {/* Header */}
      <div className="header">
        <div className="header-left">
          <h1 className="page-title">Salary Management</h1>
          <p className="page-subtitle">View and download your salary statements</p>
        </div>
        <button className="back-btn" onClick={() => router.push("/employees/dashboard")}>
          <svg className="btn-icon" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Dashboard
        </button>
      </div>

      {/* Employee Info Bar */}
      {employee && (
        <div className="employee-info">
          <div className="info-item">
            <span className="info-label">Employee</span>
            <span className="info-value">{employee.full_name}</span>
          </div>
          <div className="info-divider"></div>
          <div className="info-item">
            <span className="info-label">Department</span>
            <span className="info-value">{employee?.departments?.name || "N/A"}</span>
          </div>
          <div className="info-divider"></div>
          <div className="info-item">
            <span className="info-label">Position</span>
            <span className="info-value">{employee.job_title || "Employee"}</span>
          </div>
        </div>
      )}

      {/* Salary Table */}
      {salaryData.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <h3>No salary records found</h3>
          <p>Your salary information will appear here once available</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="salary-table">
            <thead>
              <tr>
                <th>Month</th>
                <th>Base Salary</th>
                <th>Bonus</th>
                <th>Deductions</th>
                <th>Net Salary</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {salaryData.map((item) => {
                const net = item.base_salary + item.bonus - item.deductions;
                const month = new Date(item.pay_month).toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                });

                return (
                  <tr key={item.id}>
                    <td className="month-cell">
                      <span className="month-icon">📅</span>
                      {month}
                    </td>
                    <td className="amount-cell">${item.base_salary.toLocaleString()}</td>
                    <td className="amount-cell bonus">+${item.bonus.toLocaleString()}</td>
                    <td className="amount-cell deduction">-${item.deductions.toLocaleString()}</td>
                    <td className="amount-cell net">${net.toLocaleString()}</td>
                    <td>
                      <span className={`status-badge ${net > 0 ? "paid" : "pending"}`}>
                        {net > 0 ? "Paid" : "Pending"}
                      </span>
                    </td>
                    <td>
                      <button className="download-btn-table" onClick={() => generatePayslip(item)}>
                        <svg className="download-icon" viewBox="0 0 16 16" fill="currentColor">
                          <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                        Download
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Summary Footer */}
      {salaryData.length > 0 && (
        <div className="summary-footer">
          <div className="footer-left">
            <span className="footer-label">Total Records</span>
            <span className="footer-value">{salaryData.length} months</span>
          </div>
          <div className="footer-divider"></div>
          <div className="footer-left">
            <span className="footer-label">Total Earnings</span>
            <span className="footer-value">
              ${salaryData.reduce((acc, curr) => acc + curr.base_salary + curr.bonus, 0).toLocaleString()}
            </span>
          </div>
          <div className="footer-divider"></div>
          <div className="footer-left">
            <span className="footer-label">Total Deductions</span>
            <span className="footer-value">
              ${salaryData.reduce((acc, curr) => acc + curr.deductions, 0).toLocaleString()}
            </span>
          </div>
          <div className="footer-divider"></div>
          <div className="footer-right">
            <span className="footer-label">Net Received</span>
            <span className="footer-value highlight">
              ${salaryData.reduce((acc, curr) => acc + (curr.base_salary + curr.bonus - curr.deductions), 0).toLocaleString()}
            </span>
          </div>
        </div>
      )}

      <style jsx>{`
        .salary-page {
          min-height: 100vh;
          background-color: #f5f7fa;
          padding: 2rem;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
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
          margin-bottom: 1.5rem;
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

        /* Employee Info Bar */
        .employee-info {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          background: white;
          border: 2px solid #d0d0d0;
          border-radius: 8px;
          padding: 1rem 1.5rem;
          margin-bottom: 1.5rem;
        }

        .info-item {
          display: flex;
          align-items: baseline;
          gap: 0.5rem;
        }

        .info-label {
          color: #64748b;
          font-size: 0.85rem;
          font-weight: 500;
        }

        .info-value {
          color: #1e293b;
          font-weight: 500;
          font-size: 0.9rem;
        }

        .info-divider {
          width: 1px;
          height: 20px;
          background-color: #d0d0d0;
        }

        /* Table Container */
        .table-container {
          background: white;
          border: 2px solid #d0d0d0;
          border-radius: 12px;
          overflow-x: auto;
          margin-bottom: 1.5rem;
        }

        .salary-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.9rem;
        }

        .salary-table th {
          text-align: left;
          padding: 1rem 1rem;
          background-color: #f8fafc;
          color: #1e293b;
          font-weight: 600;
          font-size: 0.85rem;
          text-transform: uppercase;
          letter-spacing: 0.03em;
          border-bottom: 2px solid #d0d0d0;
          border-top: 1px solid #d0d0d0;
        }

        .salary-table td {
          padding: 1rem 1rem;
          color: #1e293b;
          border-bottom: 1px solid #d0d0d0;
        }

        .salary-table tr:last-child td {
          border-bottom: none;
        }

        .month-cell {
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .month-icon {
          font-size: 1rem;
        }

        .amount-cell {
          font-weight: 500;
          font-family: monospace;
          font-size: 0.9rem;
        }

        .amount-cell.bonus {
          color: #059669;
        }

        .amount-cell.deduction {
          color: #b45309;
        }

        .amount-cell.net {
          color: #2563eb;
          font-weight: 600;
        }

        .status-badge {
          display: inline-block;
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 500;
          border: 1px solid #d0d0d0;
        }

        .status-badge.paid {
          background-color: #ecfdf5;
          color: #059669;
        }

        .status-badge.pending {
          background-color: #fffbeb;
          color: #b45309;
        }

        .download-btn-table {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.4rem 1rem;
          background-color: #f8fafc;
          border: 1px solid #d0d0d0;
          border-radius: 6px;
          color: #2563eb;
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .download-btn-table:hover {
          background-color: #eff6ff;
          border-color: #2563eb;
        }

        .download-icon {
          width: 14px;
          height: 14px;
        }

        /* Summary Footer */
        .summary-footer {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 1.5rem;
          background: white;
          border: 2px solid #d0d0d0;
          border-radius: 8px;
          padding: 1rem 1.5rem;
        }

        .footer-left, .footer-right {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.25rem;
        }

        .footer-label {
          color: #64748b;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .footer-value {
          font-weight: 600;
          color: #1e293b;
          font-size: 1rem;
        }

        .footer-value.highlight {
          color: #2563eb;
          font-size: 1.1rem;
        }

        .footer-divider {
          width: 1px;
          height: 35px;
          background-color: #d0d0d0;
        }

        /* Empty State */
        .empty-state {
          text-align: center;
          padding: 4rem 2rem;
          background: white;
          border: 2px solid #d0d0d0;
          border-radius: 12px;
        }

        .empty-icon {
          font-size: 4rem;
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
          font-size: 0.9rem;
          margin: 0;
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .salary-page {
            padding: 1.5rem;
          }

          .employee-info {
            flex-wrap: wrap;
            gap: 1rem;
          }

          .info-divider {
            display: none;
          }
        }

        @media (max-width: 768px) {
          .salary-page {
            padding: 1rem;
          }

          .header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }

          .employee-info {
            flex-direction: column;
            align-items: flex-start;
          }

          .summary-footer {
            flex-direction: column;
            align-items: flex-start;
          }

          .footer-divider {
            display: none;
          }

          .footer-left, .footer-right {
            width: 100%;
            flex-direction: row;
            justify-content: space-between;
          }
        }
      `}</style>
    </div>
  );
}