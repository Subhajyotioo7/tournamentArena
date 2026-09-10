import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { authService } from '../services/api';

export default function VerifyEmail({ initialEmail = '' }) {
  const { uid, token } = useParams();
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [message, setMessage] = useState(uid && token ? 'Verifying your email...' : '');
  const [error, setError] = useState('');
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    if (!uid || !token) return undefined;

    fetch(`/api/verify-email/${uid}/${token}/`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Email verification failed');
        setMessage(data.message);
        setVerified(true);
      })
      .catch((verificationError) => {
        setError(verificationError.message);
        setMessage('');
      });
  }, [uid, token]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    try {
      const response = await authService.verifyEmailCode(email, code);
      setMessage(response.message);
      setVerified(true);
    } catch (verificationError) {
      setError(verificationError.message);
    }
  };

  const handleResend = async () => {
    setError('');
    try {
      const response = await authService.resendVerificationEmail(email);
      setMessage(response.message);
    } catch (verificationError) {
      setError(verificationError.message);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <h1 className="mb-3 text-2xl font-bold text-gray-900">Email verification</h1>
        {message && <p className="text-gray-700">{message}</p>}
        {error && <p className="text-red-700">{error}</p>}
        {!verified && (
          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email address" className="w-full rounded-md border border-gray-300 px-4 py-3" required />
            <input type="text" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={code} onChange={(event) => setCode(event.target.value)} placeholder="6-digit verification code" className="w-full rounded-md border border-gray-300 px-4 py-3" required />
            <button type="submit" className="w-full rounded-md bg-[#FF5500] px-4 py-3 font-semibold text-white">Verify email</button>
            <button type="button" onClick={handleResend} className="w-full text-sm font-semibold text-[#FF5500] hover:underline">Resend code</button>
          </form>
        )}
        {verified && <Link to="/login" className="mt-6 inline-block font-semibold text-[#FF5500] hover:underline">Go to login</Link>}
      </div>
    </div>
  );
}