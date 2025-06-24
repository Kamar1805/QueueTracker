import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import './Login.css';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: '', password: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await login(form.email, form.password);

      // 🔐 Fetch role from Firestore based on authenticated user
      const userRef = doc(db, 'users', auth.currentUser.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const role = userSnap.data().role;
        if (role === 'Admin') navigate('/admin');
        else if (role === 'Student') navigate('/student');
        else navigate('/');
      } else {
        alert('User info not found.');
      }

    } catch (error) {
      alert(error.message);
    }
    setSubmitting(false);
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleSubmit}>
        <h2>Login</h2>
        <input
          name="email"
          type="email"
          placeholder="Email"
          onChange={handleChange}
          required
        />
        <input
          name="password"
          type="password"
          placeholder="Password"
          onChange={handleChange}
          required
        />
        <button type="submit" disabled={submitting}>
          {submitting ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
};

export default Login;
