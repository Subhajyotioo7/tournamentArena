import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);
    const [resetToken, setResetToken] = useState(null); // For demo/development

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/forgot-password/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();
            if (response.ok) {
                setMessage(data.message);
                if (data.reset_token) {
                    setResetToken(data.reset_token);
                }
            } else {
                setError(data.error || 'Something went wrong');
            }
        } catch (err) {
            setError('Failed to connect to server');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 border border-gray-100">
                <div className="text-center mb-8">
                    <div className="text-4xl mb-4 text-purple-600">🔑</div>
                    <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Forgot Password</h1>
                    <p className="text-gray-500">Enter your email and we'll help you reset it</p>
                </div>

                {message ? (
                    <div className="text-center">
                        <div className="bg-green-50 text-green-700 p-4 rounded-xl mb-6 font-medium">
                            ✅ {message}
                        </div>

                        {resetToken && (
                            <div className="bg-blue-50 p-4 rounded-xl mb-6 border border-blue-100 text-left">
                                <p className="text-blue-800 text-xs font-bold uppercase mb-2">Development Reset Link:</p>
                                <Link
                                    to={`/reset-password/${resetToken}`}
                                    className="text-blue-600 text-sm break-all font-mono underline hover:text-blue-800"
                                >
                                    Click here to reset (Demo Only)
                                </Link>
                            </div>
                        )}

                        <Link to="/login" className="text-purple-600 font-bold hover:underline">
                            Back to Login
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-medium animate-shake text-center">
                                ⚠️ {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
                            <input
                                type="email"
                                required
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all outline-none"
                                placeholder="Enter your registered email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-2xl hover:scale-[1.02] transition-all disabled:opacity-50 disabled:scale-100`}
                        >
                            {loading ? (
                                <div className="flex items-center justify-center gap-2">
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Sending...
                                </div>
                            ) : (
                                'Send Reset Link 📧'
                            )}
                        </button>

                        <div className="text-center">
                            <Link to="/login" className="text-sm font-semibold text-gray-500 hover:text-purple-600 transition-colors">
                                Back to Login
                            </Link>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
