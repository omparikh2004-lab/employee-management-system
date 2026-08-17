// pages/employees/[id].js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabaseClient';

export default function EditEmployee() {
  const router = useRouter();
  const { id } = router.query;

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

  const [departments, setDepartments] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // ✅ Fetch departments and employee details
  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        // Fetch departments
        const { data: deptData, error: deptError } = await supabase
          .from('departments')
          .select('id, name')
          .order('name');
        if (deptError) throw deptError;
        setDepartments(deptData || []);

        // Fetch employee details with department_id
        const { data: empData, error: empError } = await supabase
          .from('employees')
          .select('*')
          .eq('id', id)
          .single();

        if (empError || !empData) {
          alert('Employee not found.');
          router.push('/employees');
        } else {
          setForm(empData);
        }
      } catch (error) {
        console.error('Error fetching employee:', error);
        alert('Error fetching employee.');
        router.push('/employees');
      }
    };

    fetchData();
  }, [id]);

  // ✅ Handle input changes
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
  };

  // ✅ Form validation
  const validateForm = () => {
    let newErrors = {};

    if (!form.full_name.trim()) newErrors.full_name = 'Full name is required.';
    if (!form.email) {
      newErrors.email = 'Email is required.';
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = 'Invalid email format.';
    }
    if (form.phone && !/^\d{10}$/.test(form.phone)) {
      newErrors.phone = 'Phone must be 10 digits.';
    }
    if (!form.department_id) newErrors.department_id = 'Department is required.';
    if (!form.role) newErrors.role = 'Role is required.';
    if (!form.join_date) newErrors.join_date = 'Join date is required.';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ✅ Submit update
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    const { error } = await supabase.from('employees').update(form).eq('id', id);
    setLoading(false);

    if (error) {
      alert('Update failed: ' + error.message);
    } else {
      alert('Employee updated successfully!');
      router.push('/employees');
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'grey',
        padding: '2rem',
      }}
    >
      <div
        style={{
          background: '#fff',
          padding: '2rem',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '500px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        }}
      >
        <h2
          style={{
            textAlign: 'center',
            marginBottom: '1.5rem',
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#333',
          }}
        >
          ✏ Edit Employee
        </h2>

        <form onSubmit={handleSubmit} noValidate>
          {/* Full Name */}
          <label style={labelStyle}>Full Name</label>
          <input
            type="text"
            name="full_name"
            value={form.full_name}
            onChange={handleChange}
            placeholder="Enter full name"
            style={inputStyle}
          />
          {errors.full_name && <p style={errorStyle}>{errors.full_name}</p>}

          {/* Email */}
          <label style={labelStyle}>Email</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Enter email"
            style={inputStyle}
          />
          {errors.email && <p style={errorStyle}>{errors.email}</p>}

          {/* Phone */}
          <label style={labelStyle}>Phone</label>
          <input
            type="text"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="Enter 10-digit phone"
            style={inputStyle}
          />
          {errors.phone && <p style={errorStyle}>{errors.phone}</p>}

          {/* Department */}
          <label style={labelStyle}>Department</label>
          <select
            name="department_id"
            value={form.department_id || ''}
            onChange={handleChange}
            style={inputStyle}
          >
            <option value="">Select Department</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>
          {errors.department_id && <p style={errorStyle}>{errors.department_id}</p>}

          {/* Role */}
          <label style={labelStyle}>Role</label>
          <select
            name="role"
            value={form.role || ''}
            onChange={handleChange}
            style={inputStyle}
          >
            <option value="">Select Role</option>
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="employee">Employee</option>
          </select>
          {errors.role && <p style={errorStyle}>{errors.role}</p>}

          {/* Job Title */}
          <label style={labelStyle}>Job Title</label>
          <input
            type="text"
            name="job_title"
            value={form.job_title || ''}
            onChange={handleChange}
            placeholder="Enter job title"
            style={inputStyle}
          />

          {/* Join Date */}
          <label style={labelStyle}>Join Date</label>
          <input
            type="date"
            name="join_date"
            value={form.join_date ? form.join_date.slice(0, 10) : ''}
            onChange={handleChange}
            style={inputStyle}
          />
          {errors.join_date && <p style={errorStyle}>{errors.join_date}</p>}

          {/* Image URL */}
          <label style={labelStyle}>Profile Image URL</label>
          <input
            type="url"
            name="image_url"
            value={form.image_url}
            onChange={handleChange}
            placeholder="Paste image URL"
            style={inputStyle}
          />
          {form.image_url && (
            <img
              src={form.image_url}
              alt="Employee"
              style={{
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                marginTop: '10px',
                objectFit: 'cover',
                border: '2px solid #eee',
              }}
            />
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: '1.5rem',
              width: '100%',
              padding: '0.75rem',
              background: '#0070f3',
              color: '#fff',
              fontSize: '16px',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: '0.3s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#0051a3')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#0070f3')}
            >
            {loading ? 'Updating...' : 'Update Employee'}
          </button>
        </form>
      </div>
    </div>
  );
}


// Reusable Styles
const inputStyle = {
  width: '100%',
  padding: '10px',
  marginBottom: '1rem',
  borderRadius: '6px',
  border: '1px solid #ccc',
  fontSize: '14px',
};

const labelStyle = {
  display: 'block',
  marginBottom: '0.5rem',
  fontWeight: '500',
  color: '#333',
};

const errorStyle = {
  color: 'red',
  fontSize: '13px',
  marginTop: '-0.5rem',
  marginBottom: '1rem',
};
