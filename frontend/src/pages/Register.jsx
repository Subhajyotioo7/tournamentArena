import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import { Button } from '../components/ui/button';

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ username: '', email: '', password: '', password2: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    if (formData.password !== formData.password2) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await authService.register(formData);
      alert('Registration successful! Please login.');
      navigate('/login');
    } catch (submitError) {
      setError(submitError.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field) => (event) => setFormData({ ...formData, [field]: event.target.value });

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">Join Tournament Arena</h1>
          <p className="text-gray-600">Create an account to start competing.</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
            {[['username', 'Username', 'text'], ['email', 'Email', 'email'], ['password', 'Password', 'password'], ['password2', 'Confirm password', 'password']].map(([field, label, type]) => (
              <div key={field}>
                <label className="mb-2 block text-sm font-medium text-gray-700">{label}</label>
                <input type={type} value={formData[field]} onChange={updateField(field)} className="w-full rounded-md border border-gray-300 px-4 py-3 outline-none focus:border-[#FF5500] focus:ring-2 focus:ring-[#FF5500]/20" required />
              </div>
            ))}
            <Button type="submit" disabled={loading} className="w-full">{loading ? 'Creating account...' : 'Sign up'}</Button>
          </form>
          <p className="mt-6 text-center text-gray-600">Already have an account? <Link to="/login" className="font-semibold text-[#FF5500] hover:underline">Login</Link></p>
        </div>
      </div>
    </div>
  );
}
