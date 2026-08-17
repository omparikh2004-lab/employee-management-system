import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useRouter } from 'next/router';

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        setError(error.message);
      } else {
        setMessage('✅ Check your email for the confirmation link!');
        setTimeout(() => router.push('/login'), 3000); // redirect to login after signup
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <form style={styles.form} onSubmit={handleSignUp}>
        <h2 style={styles.title}>Create an Account</h2>
        {error && <div style={styles.error}>{error}</div>}
        {message && <div style={styles.message}>{message}</div>}

        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={styles.input}
          required
          disabled={loading}
        />

        <input
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={styles.input}
          required
          disabled={loading}
        />

        <button 
          type="submit"
          style={loading ? {...styles.button, ...styles.buttonDisabled} : styles.button}
          disabled={loading}
        >
          {loading ? 'Signing up...' : 'Sign Up'}
        </button>

        <p style={styles.linkText}>
          Already have an account?{' '}
          <span 
            style={styles.link} 
            onClick={() => router.push('/login')}
          >
            Log In
          </span>
        </p>
      </form>
    </div>
  );
}

const styles = {
  container: {
    width: '100vw',
    height: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    background: '#f6f5f7',
  },
  form: {
    background: '#fff',
    padding: '2rem',
    borderRadius: '10px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    width: '100%',
    maxWidth: '350px',
    display: 'flex',
    flexDirection: 'column',
  },
  title: {
    marginBottom: '1rem',
    textAlign: 'center',
    color: '#2a4d69',
  },
  input: {
    marginBottom: '1rem',
    padding: '0.8rem',
    borderRadius: '5px',
    border: '1px solid #ddd',
    fontSize: '1rem',
  },
  button: {
    padding: '0.8rem',
    border: 'none',
    borderRadius: '5px',
    background: '#4a6fa5',
    color: '#fff',
    fontSize: '1rem',
    cursor: 'pointer',
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  error: {
    color: '#c62828',
    marginBottom: '1rem',
    background: '#ffebee',
    padding: '0.6rem',
    borderRadius: '5px',
  },
  message: {
    color: '#2e7d32',
    marginBottom: '1rem',
    background: '#e8f5e9',
    padding: '0.6rem',
    borderRadius: '5px',
  },
  linkText: {
    textAlign: 'center',
    marginTop: '1rem',
  },
  link: {
    color: '#4a6fa5',
    cursor: 'pointer',
    fontWeight: '600',
  },
};
