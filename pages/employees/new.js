import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabaseClient';

export default function AddEmployee() {
  const router = useRouter();
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    department_id: '',
    role: '',
    job_title: '',
    join_date: '',
    image_url: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [departments, setDepartments] = useState([]); // ✅ dynamic departments

  // ✅ Fetch department list from Supabase
  useEffect(() => {
    const fetchDepartments = async () => {
      const { data, error } = await supabase
        .from('departments')
        .select('id, name')
        .order('name', { ascending: true });

      if (error) console.error('Error fetching departments:', error);
      else setDepartments(data || []);
    };
    fetchDepartments();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Restrict phone to 10 digits
    if (name === 'phone') {
      if (!/^\d{0,10}$/.test(value)) return;
    }

    setForm({ ...form, [name]: value });
    if (errors[name]) setErrors({ ...errors, [name]: '' });
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched({ ...touched, [name]: true });
    validateField(name, form[name]);
  };

  const validateField = (name, value) => {
    let error = '';

    switch (name) {
      case 'full_name':
        if (!value.trim()) error = 'Full name is required';
        else if (value.trim().length < 2) error = 'Name must be at least 2 characters';
        break;
      case 'email':
        if (!value) error = 'Email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
          error = 'Enter a valid email (must include @)';
        break;
      case 'phone':
        if (!value) error = 'Phone number is required';
        else if (!/^\d{10}$/.test(value)) error = 'Phone must be exactly 10 digits';
        break;
      case 'department_id':
        if (!value) error = 'Department is required';
        break;
      case 'role':
        if (!value) error = 'Role is required';
        break;
      case 'join_date':
        if (!value) error = 'Join date is required';
        break;
      default:
        break;
    }

    setErrors({ ...errors, [name]: error });
    return !error;
  };

  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

    if (!form.full_name.trim()) {
      newErrors.full_name = 'Full name is required';
      isValid = false;
    }

    if (!form.email) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Enter a valid email (must include @)';
      isValid = false;
    }

    if (!form.phone) {
      newErrors.phone = 'Phone number is required';
      isValid = false;
    } else if (!/^\d{10}$/.test(form.phone)) {
      newErrors.phone = 'Phone must be exactly 10 digits';
      isValid = false;
    }

    if (!form.department_id) {
      newErrors.department_id = 'Department is required';
      isValid = false;
    }

    if (!form.role) {
      newErrors.role = 'Role is required';
      isValid = false;
    }

    if (!form.join_date) {
      newErrors.join_date = 'Join date is required';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const allTouched = Object.keys(form).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {});
    setTouched(allTouched);

    if (!validateForm()) return;

    setLoading(true);

    try {
      const { error } = await supabase.from('employees').insert([form]);

      if (error) {
        alert('Error adding employee: ' + error.message);
      } else {
        alert('Employee added successfully!');
        router.push('/employees');
      }
    } catch (error) {
      alert('An unexpected error occurred: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => router.push('/employees');

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button
          style={styles.backButton}
          onClick={() => router.push('/employees')}
          title="Back to employees"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M19 12H5M5 12L12 19M5 12L12 5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <h1 style={styles.heading}>Add New Employee</h1>
      </div>

      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.formGrid}>
          {/* Full Name */}
          <div style={styles.formGroup}>
            <label htmlFor="full_name" style={styles.label}>
              Full Name <span style={styles.required}>*</span>
            </label>
            <input
              type="text"
              id="full_name"
              name="full_name"
              placeholder="Enter full name"
              value={form.full_name}
              onChange={handleChange}
              onBlur={handleBlur}
              style={{
                ...styles.input,
                ...(errors.full_name && touched.full_name ? styles.inputError : {}),
              }}
              disabled={loading}
            />
            {errors.full_name && touched.full_name && (
              <span style={styles.errorText}>{errors.full_name}</span>
            )}
          </div>

          {/* Email */}
          <div style={styles.formGroup}>
            <label htmlFor="email" style={styles.label}>
              Email <span style={styles.required}>*</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="Enter email address"
              value={form.email}
              onChange={handleChange}
              onBlur={handleBlur}
              style={{
                ...styles.input,
                ...(errors.email && touched.email ? styles.inputError : {}),
              }}
              disabled={loading}
            />
            {errors.email && touched.email && (
              <span style={styles.errorText}>{errors.email}</span>
            )}
          </div>

          {/* Phone */}
          <div style={styles.formGroup}>
            <label htmlFor="phone" style={styles.label}>
              Phone <span style={styles.required}>*</span>
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              placeholder="Enter 10-digit phone number"
              value={form.phone}
              onChange={handleChange}
              onBlur={handleBlur}
              style={{
                ...styles.input,
                ...(errors.phone && touched.phone ? styles.inputError : {}),
              }}
              disabled={loading}
            />
            {errors.phone && touched.phone && (
              <span style={styles.errorText}>{errors.phone}</span>
            )}
          </div>

          {/* Department */}
          <div style={styles.formGroup}>
            <label htmlFor="department_id" style={styles.label}>
              Department <span style={styles.required}>*</span>
            </label>
            <select
              id="department_id"
              name="department_id"
              value={form.department_id}
              onChange={handleChange}
              onBlur={handleBlur}
              style={{
                ...styles.input,
                ...(errors.department_id && touched.department_id
                  ? styles.inputError
                  : {}),
              }}
              disabled={loading}
            >
              <option value="">Select Department</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
            {errors.department_id && touched.department_id && (
              <span style={styles.errorText}>{errors.department_id}</span>
            )}
          </div>

          {/* Role */}
          <div style={styles.formGroup}>
            <label htmlFor="role" style={styles.label}>
              Role <span style={styles.required}>*</span>
            </label>
            <select
              type="text"
              id="role"
              name="role"
              placeholder="Enter job role"
              value={form.role}
              onChange={handleChange}
              onBlur={handleBlur}
              style={{
                ...styles.input,
                ...(errors.role && touched.role ? styles.inputError : {}),
              }}
              disabled={loading}
            >
              <option value="">Select Role</option>
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="employee">Employee</option>
            </select>
            {errors.role && touched.role && (
              <span style={styles.errorText}>{errors.role}</span>
            )}
          </div>

          {/* Job Title */}
          <div style={styles.formGroup}>
            <label htmlFor="job_title" style={styles.label}>
              Job Title
            </label>
            <input
              type="text"
              id="job_title"
              name="job_title"
              placeholder="Enter job title (e.g., Developer, HR Executive)"
              value={form.job_title || ''}
              onChange={handleChange}
              onBlur={handleBlur}
              style={styles.input}
              disabled={loading}
            />
          </div>

          {/* Join Date */}
          <div style={styles.formGroup}>
            <label htmlFor="join_date" style={styles.label}>
              Join Date <span style={styles.required}>*</span>
            </label>
            <input
              type="date"
              id="join_date"
              name="join_date"
              value={form.join_date}
              onChange={handleChange}
              onBlur={handleBlur}
              style={{
                ...styles.input,
                ...(errors.join_date && touched.join_date ? styles.inputError : {}),
              }}
              disabled={loading}
            />
            {errors.join_date && touched.join_date && (
              <span style={styles.errorText}>{errors.join_date}</span>
            )}
          </div>

          {/* Image URL */}
          <div style={styles.formGroup}>
            <label htmlFor="image_url" style={styles.label}>
              Profile Image URL
            </label>
            <input
              type="url"
              id="image_url"
              name="image_url"
              placeholder="Enter image URL (optional)"
              value={form.image_url}
              onChange={handleChange}
              onBlur={handleBlur}
              style={styles.input}
              disabled={loading}
            />
          </div>
        </div>

        {/* Actions */}
        <div style={styles.formActions}>
          <button
            type="button"
            onClick={handleCancel}
            style={styles.cancelButton}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            style={
              loading
                ? { ...styles.submitButton, ...styles.submitButtonLoading }
                : styles.submitButton
            }
            disabled={loading}
          >
            {loading ? (
              <div style={styles.buttonLoading}>
                <div style={styles.buttonSpinner}></div>
                Adding Employee...
              </div>
            ) : (
              'Add Employee'
            )}
          </button>
        </div>
      </form >
    </div >
  );
}

const styles = {
  container: {
    padding: '2rem',
    maxWidth: '800px',
    margin: '0 auto',
    fontFamily: "'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    color: '#333',
    backgroundColor: '#f8fafc',
    minHeight: '100vh',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '2rem',
    gap: '1rem',
  },
  backButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '40px',
    height: '40px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    backgroundColor: 'white',
    cursor: 'pointer',
    color: '#64748b',
  },
  heading: {
    fontSize: '1.8rem',
    fontWeight: '700',
    color: '#1e293b',
    margin: 0,
  },
  form: {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '12px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '1.5rem',
    marginBottom: '2rem',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
  },
  label: {
    fontSize: '0.9rem',
    fontWeight: '500',
    color: '#374151',
    marginBottom: '0.5rem',
  },
  required: {
    color: '#dc2626',
  },
  input: {
    padding: '0.75rem',
    borderRadius: '6px',
    border: '1px solid #d1d5db',
    fontSize: '0.9rem',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
  },
  inputError: {
    borderColor: '#dc2626',
    boxShadow: '0 0 0 3px rgba(220, 38, 38, 0.1)',
  },
  errorText: {
    fontSize: '0.8rem',
    color: '#dc2626',
    marginTop: '0.5rem',
  },
  formActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '1rem',
    paddingTop: '1rem',
    borderTop: '1px solid #e5e7eb',
  },
  cancelButton: {
    padding: '0.75rem 1.5rem',
    borderRadius: '6px',
    border: '1px solid #d1d5db',
    backgroundColor: 'white',
    color: '#374151',
    fontSize: '0.9rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
  },
  submitButton: {
    padding: '0.75rem 1.5rem',
    borderRadius: '6px',
    border: 'none',
    backgroundColor: '#4a6fa5',
    color: 'white',
    fontSize: '0.9rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
  },
  submitButtonLoading: {
    opacity: 0.8,
    cursor: 'not-allowed',
  },
  buttonLoading: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  buttonSpinner: {
    width: '16px',
    height: '16px',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    borderTop: '2px solid white',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
};

// ✅ Spin animation
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    input:focus, select:focus {
      outline: none;
      border-color: #4a6fa5;
      box-shadow: 0 0 0 3px rgba(74, 111, 165, 0.1);
    }
    .back-button:hover { background-color: #f3f4f6; }
    .cancel-button:hover { background-color: #f9fafb; }
    .submit-button:hover:not(:disabled) { background-color: #3b5b8a; }
  `;
  document.head.appendChild(style);
}




