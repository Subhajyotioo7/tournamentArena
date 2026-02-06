import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';


export default function MyInvitations() {
    const navigate = useNavigate();
    const [invitations, setInvitations] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchInvitations();
    }, []);

    const fetchInvitations = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/tournaments/my-invitations/`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json();
            if (response.ok) {
                setInvitations(data.invitations || []);
            }
        } catch (error) {
            console.error('Error fetching invitations:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAccept = async (invitationId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/tournaments/invitation/${invitationId}/accept/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json();
            if (response.ok) {
                alert(`✅ ${data.message}\nPaid: ₹${data.payment}`);
                fetchInvitations(); // Refresh list
            } else {
                alert(`❌ ${data.error || 'Failed to accept invitation'}`);
            }
        } catch (error) {
            alert('❌ Error accepting invitation');
        }
    };

    const handleReject = async (invitationId) => {
        if (!confirm('Are you sure you want to reject this invitation?')) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/tournaments/invitation/${invitationId}/reject/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json();
            if (response.ok) {
                alert('Invitation rejected');
                fetchInvitations();
            }
        } catch (error) {
            alert('Error rejecting invitation');
        }
    };

    const getGameGradient = (game) => {
        const gradients = {
            fifa: 'from-green-500 to-emerald-600',
            bgmi: 'from-orange-500 to-red-600',
            freefire: 'from-yellow-500 to-orange-600',
        };
        return gradients[game] || 'from-purple-600 to-blue-600';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading invitations...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            {/* Header */}
            {/* Header Removed */}

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {invitations.length > 0 ? (
                    <div className="space-y-4">
                        {invitations.map((inv) => (
                            <div key={inv.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all">
                                {/* Game Header */}
                                <div className={`bg-gradient-to-r ${getGameGradient(inv.tournament_game)} p-4`}>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-white/80 text-xs font-medium uppercase">{inv.tournament_game}</p>
                                            <h3 className="text-white font-bold text-lg">{inv.tournament_name}</h3>
                                        </div>
                                        <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-1">
                                            <span className="text-white text-sm">⏰</span>
                                            <span className="text-white text-sm font-semibold">Pending</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Invitation Details */}
                                <div className="p-6">
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                                        <div>
                                            <p className="text-sm text-gray-600">Invited by</p>
                                            <p className="font-semibold text-gray-900">{inv.inviter_username}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">Team Mode</p>
                                            <p className="font-semibold text-gray-900 capitalize">{inv.team_mode}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">Your Share</p>
                                            <p className="font-semibold text-green-600">₹{inv.payment_share}</p>
                                        </div>
                                    </div>

                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                                        <p className="text-sm text-blue-800">
                                            <strong>Note:</strong> ₹{inv.payment_share} will be deducted from your wallet when you accept.
                                        </p>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => handleAccept(inv.id)}
                                            className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition-all flex items-center justify-center gap-2"
                                        >
                                            ✓ Accept & Pay ₹{inv.payment_share}
                                        </button>
                                        <button
                                            onClick={() => handleReject(inv.id)}
                                            className="flex-1 bg-gradient-to-r from-red-600 to-pink-600 text-white py-3 rounded-lg font-semibold hover:from-red-700 hover:to-pink-700 transition-all flex items-center justify-center gap-2"
                                        >
                                            ✕ Reject
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16">
                        <div className="text-6xl mb-4">📬</div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">No Pending Invitations</h2>
                        <p className="text-gray-600 mb-6">You don't have any team invitations at the moment</p>
                        <button
                            onClick={() => navigate('/')}
                            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all"
                        >
                            Browse Tournaments
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
