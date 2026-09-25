import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

export default function Login() {
  const location = useLocation();
  const cognitoDomain = import.meta.env.VITE_COGNITO_DOMAIN;
  const clientId = import.meta.env.VITE_COGNITO_CLIENT_ID;
  const redirectUri = import.meta.env.VITE_COGNITO_REDIRECT_URI || `${window.location.origin}/auth/callback`;
  const query = new URLSearchParams(location.search);
  const nextPath = query.get('next');
  const redirectStarted = useRef(false);

  useEffect(() => {
    if (redirectStarted.current || !cognitoDomain || !clientId) return;
    redirectStarted.current = true;

    const bytes = new Uint8Array(16);
    window.crypto.getRandomValues(bytes);
    const state = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
    sessionStorage.setItem('cognito_oauth_state', state);
    sessionStorage.setItem('cognito_next_path', nextPath || '/');
    const authUrl = `${cognitoDomain}/oauth2/authorize?${new URLSearchParams({
      client_id: clientId,
      response_type: 'code',
      scope: 'email openid phone',
      redirect_uri: redirectUri,
      state,
      ...(localStorage.getItem('cognito_login_hint')
        ? { login_hint: localStorage.getItem('cognito_login_hint') }
        : {}),
    })}`;
    window.location.assign(authUrl);
  }, [clientId, cognitoDomain, nextPath, redirectUri]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="text-gray-600">
        Redirecting to login...
      </div>
    </div>
  );
}
