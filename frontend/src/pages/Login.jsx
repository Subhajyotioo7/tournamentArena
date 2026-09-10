import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginUser } from '../services/auth';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [needsVerification, setNeedsVerification] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setNeedsVerification(false);

    try {
      await loginUser(formData.username, formData.password);
      login();
      navigate('/');
    } catch (submitError) {
      setError(submitError.message || 'Login failed');
      setNeedsVerification((submitError.message || '').toLowerCase().includes('verify your email'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">Welcome back</h1>
          <p className="text-gray-600">Sign in to join tournaments and manage your rooms.</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
            {needsVerification && <Link to="/verify-email" className="block text-sm font-semibold text-[#FF5500] hover:underline">Verify your email with an OTP</Link>}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Username</label>
              <input type="text" value={formData.username} onChange={(event) => setFormData({ ...formData, username: event.target.value })} className="w-full rounded-md border border-gray-300 px-4 py-3 outline-none focus:border-[#FF5500] focus:ring-2 focus:ring-[#FF5500]/20" required />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Password</label>
              <input type="password" value={formData.password} onChange={(event) => setFormData({ ...formData, password: event.target.value })} className="w-full rounded-md border border-gray-300 px-4 py-3 outline-none focus:border-[#FF5500] focus:ring-2 focus:ring-[#FF5500]/20" required />
            </div>
            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-xs font-semibold text-[#FF5500] hover:underline">Forgot password?</Link>
            </div>
            <Button type="submit" disabled={loading} className="w-full">{loading ? 'Logging in...' : 'Login'}</Button>
          </form>
          <p className="mt-6 text-center text-gray-600">Don&apos;t have an account? <Link to="/register" className="font-semibold text-[#FF5500] hover:underline">Sign up</Link></p>
        </div>
      </div>
    </div>
  );
}
