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
                let message = `✅ ${data.message}`;
                if (data.leader_paid && data.leader_game_id) {
                    message += `\n\nFREE - Already paid by: ${data.leader_game_id}`;
                } else if (data.payment || data.payment_status) {
                    const payment = data.payment || data.payment_status;
                    if (payment !== 'FREE') {
                        message += `\nPaid: ₹${payment}`;
                    }
                }
                alert(message);
                fetchInvitations(); // Refresh list
            } else {
                // Show detailed error for debugging
                let errorMsg = data.error || 'Failed to accept invitation';
                if (data.details) {
                    errorMsg += `\n\nDetails: ${data.details}`;
                }
                if (data.traceback) {
                    console.error('Backend traceback:', data.traceback);
                }
                if (data.invited_game_id) {
                    errorMsg += `\n\nInvited Game ID: ${data.invited_game_id}`;
                    errorMsg += `\nYour Game IDs: ${data.your_game_ids?.join(', ') || 'None'}`;
                }
                if (data.required) {
                    errorMsg += `\n\nRequired: ₹${data.required}`;
                    errorMsg += `\nYour Balance: ₹${data.current_balance}`;
                }
                alert(`❌ ${errorMsg}`);
            }
        } catch (error) {
            alert(`❌ Error accepting invitation: ${error.message}`);

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

    const [savedTeams, setSavedTeams] = useState(JSON.parse(localStorage.getItem('presetTeams') || '[]'));
    const [isCreatingTeam, setIsCreatingTeam] = useState(false);
    const [newTeam, setNewTeam] = useState({ name: '', mode: 'duo', members: ['', '', ''] });

    const handleSaveTeam = () => {
        if (!newTeam.name) return alert('Enter team name');
        const filledMembers = newTeam.members.filter(m => m.trim());
        const required = newTeam.mode === 'duo' ? 1 : 3;

        if (filledMembers.length === 0) return alert('Enter at least one teammate Game ID');

        const updatedTeams = [...savedTeams, { ...newTeam, id: Date.now(), members: filledMembers }];
        setSavedTeams(updatedTeams);
        localStorage.setItem('presetTeams', JSON.stringify(updatedTeams));
        setIsCreatingTeam(false);
        setNewTeam({ name: '', mode: 'duo', members: ['', '', ''] });
        alert('✅ Team saved! You can now select this team when joining tournaments.');
    };

    const deleteTeam = (id) => {
        const updated = savedTeams.filter(t => t.id !== id);
        setSavedTeams(updated);
        localStorage.setItem('presetTeams', JSON.stringify(updated));
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* Saved Teams Section */}
                <div className="mb-12">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <span>👥</span> My Saved Teams
                        </h2>
                        <button
                            onClick={() => setIsCreatingTeam(!isCreatingTeam)}
                            className="bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-purple-700 transition-all text-sm"
                        >
                            {isCreatingTeam ? '✕ Cancel' : '+ Create Preset Team'}
                        </button>
                    </div>

                    {isCreatingTeam && (
                        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8 border-2 border-purple-100 animate-slide-up">
                            <h3 className="font-bold text-gray-900 mb-4">New Preset Team</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase">Team Name</label>
                                    <input
                                        type="text"
                                        value={newTeam.name}
                                        onChange={e => setNewTeam({ ...newTeam, name: e.target.value })}
                                        placeholder="e.g. My Pro Squad"
                                        className="w-full mt-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-600 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase">Mode</label>
                                    <select
                                        value={newTeam.mode}
                                        onChange={e => setNewTeam({ ...newTeam, mode: e.target.value })}
                                        className="w-full mt-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-600 outline-none"
                                    >
                                        <option value="duo">Duo (1 Teammate)</option>
                                        <option value="squad">Squad (3 Teammates)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-3 mb-6">
                                <label className="text-xs font-bold text-gray-500 uppercase">Teammate Game IDs</label>
                                {Array.from({ length: newTeam.mode === 'duo' ? 1 : 3 }).map((_, i) => (
                                    <input
                                        key={i}
                                        type="text"
                                        value={newTeam.members[i]}
                                        onChange={e => {
                                            const m = [...newTeam.members];
                                            m[i] = e.target.value;
                                            setNewTeam({ ...newTeam, members: m });
                                        }}
                                        placeholder={`Teammate ${i + 1} Game ID`}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-600 outline-none"
                                    />
                                ))}
                            </div>

                            <button
                                onClick={handleSaveTeam}
                                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
                            >
                                ✅ Save Team Preset
                            </button>
                        </div>
                    )}

                    {savedTeams.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {savedTeams.map(team => (
                                <div key={team.id} className="bg-white p-5 rounded-xl shadow-md border border-gray-100 flex justify-between items-center group">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-lg">{team.mode === 'duo' ? '👥' : '👨‍👩‍👧‍👦'}</span>
                                            <h4 className="font-bold text-gray-900">{team.name}</h4>
                                            <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded-full font-bold uppercase text-gray-500">{team.mode}</span>
                                        </div>
                                        <p className="text-xs text-gray-500">
                                            IDs: {team.members.join(', ')}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => deleteTeam(team.id)}
                                        className="text-gray-300 hover:text-red-500 p-2 transition-colors"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl py-10 text-center">
                            <p className="text-gray-400">No preset teams saved yet.</p>
                        </div>
                    )}
                </div>

                <hr className="my-10 border-gray-200" />

                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <span>📩</span> Received Invitations
                </h2>

                {invitations.length > 0 ? (
                    <div className="space-y-4">
                        {invitations.map((inv) => (
                            <div key={inv.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all border border-gray-100">
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
                                            <p className="text-sm text-gray-600">Entry Fee</p>
                                            <p className="font-semibold text-green-600 text-lg">FREE ✨</p>
                                            <p className="text-xs text-gray-500">Leader Paid</p>
                                        </div>
                                    </div>

                                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg p-4 mb-4 shadow-sm">
                                        <p className="text-sm text-green-800 flex items-center gap-2">
                                            <span className="text-xl">🎉</span>
                                            <strong>Great News!</strong> Your team leader already paid the full entry fee. Join for FREE!
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
                    <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100">
                        <div className="text-6xl mb-4 text-gray-200">📬</div>
                        <h2 className="text-xl font-bold text-gray-400">No Pending Invitations</h2>
                        <p className="text-gray-400 mt-1">You don't have any team invitations at the moment</p>
                    </div>
                )}
            </div>
        </div>
    );
}
