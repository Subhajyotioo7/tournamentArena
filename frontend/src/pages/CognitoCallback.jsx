import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiPost } from '../services/api';

export default function CognitoCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const [error, setError] = useState('');
  const exchangeStarted = useRef(false);

  useEffect(() => {
    if (exchangeStarted.current) return;
    exchangeStarted.current = true;

    const code = searchParams.get('code');
    const returnedState = searchParams.get('state');
    const cognitoError = searchParams.get('error_description') || searchParams.get('error');
    if (!code) {
      setError(cognitoError || 'Cognito did not return an authorization code.');
      return;
    }
    if (!returnedState || returnedState !== sessionStorage.getItem('cognito_oauth_state')) {
      setError('Invalid sign-in state. Please start login again.');
      return;
    }

    apiPost('/api/auth/cognito/callback/', { code }, false)
      .then((tokens) => {
        localStorage.setItem('token', tokens.access);
        localStorage.setItem('refresh', tokens.refresh);
        const nextPath = sessionStorage.getItem('cognito_next_path') || '/';
        sessionStorage.removeItem('cognito_oauth_state');
        sessionStorage.removeItem('cognito_next_path');
        login();
        navigate(nextPath.startsWith('/') && !nextPath.startsWith('//') ? nextPath : '/', { replace: true });
      })
      .catch((callbackError) => setError(callbackError.message || 'Unable to complete sign in.'));
  }, [login, navigate, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        {error ? (
          <>
            <h1 className="mb-2 text-xl font-bold text-red-700">Sign in failed</h1>
            <p className="mb-5 text-sm text-gray-600">{error}</p>
            <button className="font-semibold text-[#FF5500] hover:underline" onClick={() => navigate('/login')}>Return to login</button>
          </>
        ) : <p className="text-gray-700">Completing sign in...</p>}
      </div>
    </div>
  );
}
