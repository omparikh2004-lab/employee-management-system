import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useRouter } from 'next/router';

export default function UpdatePassword() {
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      setError(error.message);
    } else {
      setMessage('Password updated successfully! Redirecting to login...');
      setTimeout(() => router.push('/login'), 2000);
    }

    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <div style={styles.background}>
        <div style={styles.shape}></div>
        <div style={styles.shape}></div>
      </div>

      <form style={styles.form} onSubmit={handleUpdatePassword}>
        <div style={styles.logo}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" stroke="#4a6fa5" strokeWidth="2"/>
            <path d="M20.59 22C20.59 18.13 16.74 15 12 15C7.26 15 3.41 18.13 3.41 22" stroke="#4a6fa5" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <h3 style={styles.title}>Reset Password</h3>
        </div>

        {error && <div style={styles.error}>{error}</div>}
        {message && <div style={styles.message}>{message}</div>}

        <div style={styles.inputGroup}>
          <label htmlFor="newPassword" style={styles.label}>New Password</label>
          <input
            type="password"
            placeholder="Enter your new password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            style={styles.input}
            required
            disabled={loading}
          />
        </div>

        <button 
          type="submit" 
          style={loading ? {...styles.button, ...styles.buttonDisabled} : styles.button}
          disabled={loading}
        >
          {loading ? "Updating..." : "Update Password"}
        </button>
      </form>
    </div>
  );
}

const styles = {
  container: {
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    width: '100vw',
    height: '100vh',
    backgroundColor: '#f6f5f7',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: 1,
  },
  shape: {
    position: 'absolute',
    width: '200px',
    height: '200px',
    borderRadius: '50%',
    background: 'linear-gradient(45deg, #4a6fa5, #2a4d69)',
    opacity: '0.1',
    top: '20%',
    left: '10%',
  },
  form: {
    backgroundColor: '#ffffff',
    display: 'flex',
    flexDirection: 'column',
    padding: '2.5rem',
    borderRadius: '12px',
    boxShadow: '0 14px 28px rgba(0,0,0,0.25), 0 10px 10px rgba(0,0,0,0.22)',
    width: '100%',
    maxWidth: '400px',
    zIndex: 2,
  },
  logo: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: '1.5rem',
  },
  title: {
    textAlign: 'center',
    margin: '1rem 0 0',
    color: '#2a4d69',
    fontSize: '1.5rem',
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: '1.2rem',
  },
  label: {
    display: 'block',
    marginBottom: '0.5rem',
    color: '#555',
    fontSize: '0.9rem',
    fontWeight: '500',
  },
  input: {
    width: '100%',
    padding: '0.8rem',
    borderRadius: '5px',
    border: '1px solid #ddd',
    fontSize: '1rem',
    transition: 'border 0.3s',
    boxSizing: 'border-box',
  },
  button: {
    padding: '0.8rem',
    borderRadius: '5px',
    border: 'none',
    backgroundColor: '#4a6fa5',
    color: 'white',
    fontSize: '1rem',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
    marginBottom: '1rem',
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.7,
    cursor: 'not-allowed',
  },
  error: {
    backgroundColor: '#ffebee',
    color: '#c62828',
    padding: '0.8rem',
    borderRadius: '5px',
    marginBottom: '1rem',
    fontSize: '0.9rem',
  },
  message: {
    backgroundColor: '#e8f5e9',
    color: '#2e7d32',
    padding: '0.8rem',
    borderRadius: '5px',
    marginBottom: '1rem',
    fontSize: '0.9rem',
  },
};
