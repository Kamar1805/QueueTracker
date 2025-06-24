import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Signup.css';

const Signup = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [submitting, setSubmitting] = useState(false);


  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Admin',
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await signup(form.email, form.password, form.name, form.role);
      alert('Signup successful! Now login.');
      navigate('/login');
    } catch (error) {
      alert(error.message);
    }
    setSubmitting(false);
  };
  

  return (
    <div className="signup-container">
      <form className="signup-form" onSubmit={handleSubmit}>
        <h2>Sign Up</h2>
        <input name="name" placeholder="Full Name" onChange={handleChange} required />
        <input name="email" type="email" placeholder="Email" onChange={handleChange} required />
        <input name="password" type="password" placeholder="Password" onChange={handleChange} required />
        <select name="role" onChange={handleChange} required>
          <option value="Admin">Admin</option>
          <option value="Student">Student</option>
        </select>
        <button type="submit" disabled={submitting}>
  {submitting ? 'Signing up...' : 'Sign Up'}
</button>

      </form>
    </div>
  );
};

export default Signup;
