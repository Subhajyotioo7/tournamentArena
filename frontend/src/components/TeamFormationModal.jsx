import { useState } from 'react';

export default function TeamFormationModal({ tournament, room, onClose, onJoinSolo, onCreateTeam }) {
    const [teamMode, setTeamMode] = useState(null);
    const [gameIds, setGameIds] = useState(['', '', '']);
    const [loading, setLoading] = useState(false);

    const teamInfo = {
        solo: { players: 1, share: 100, icon: '👤', invites: 0 },
        duo: { players: 2, share: 50, icon: '👥', invites: 1 },
        squad: { players: 4, share: 25, icon: '👨‍👩‍👧‍👦', invites: 3 }
    };

    const info = teamInfo[tournament.team_mode];
    const paymentShare = (tournament.entry_fee / info.players).toFixed(2);

    const handleJoinSolo = async () => {
        setLoading(true);
        try {
            await onJoinSolo();
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTeam = async () => {
        const requiredInvites = info.invites;
        const filledIds = gameIds.filter(id => id.trim()).slice(0, requiredInvites);

        if (filledIds.length !== requiredInvites) {
            alert(`Please enter ${requiredInvites} teammate Game ID${requiredInvites > 1 ? 's' : ''}`);
            return;
        }

        setLoading(true);
        try {
            await onCreateTeam(filledIds);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full">
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 rounded-t-2xl">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-2xl font-bold mb-1">Join Tournament</h2>
                            <p className="text-purple-100">{tournament.name}</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white hover:bg-white/20 p-2 rounded-lg transition-all text-2xl"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Team Mode Info */}
                    <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-4 border-2 border-purple-200">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="bg-purple-600 p-3 rounded-lg text-2xl">
                                {info.icon}
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">
                                    {tournament.team_mode.charAt(0).toUpperCase() + tournament.team_mode.slice(1)} Mode
                                </h3>
                                <p className="text-sm text-gray-600">{info.players} Player{info.players > 1 ? 's' : ''}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                                <p className="text-gray-600">Total Entry Fee</p>
                                <p className="font-bold text-gray-900">₹{tournament.entry_fee}</p>
                            </div>
                            <div>
                                <p className="text-gray-600">Your Share</p>
                                <p className="font-bold text-green-600">₹{paymentShare} ({info.share}%)</p>
                            </div>
                        </div>
                    </div>

                    {/* Solo Mode */}
                    {tournament.team_mode === 'solo' && (
                        <div>
                            <p className="text-sm text-gray-600 mb-4">
                                You'll join this tournament alone and pay the full entry fee.
                            </p>
                            <button
                                onClick={handleJoinSolo}
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50"
                            >
                                {loading ? 'Joining...' : `Join Solo - Pay ₹${paymentShare}`}
                            </button>
                        </div>
                    )}

                    {/* Duo/Squad Mode */}
                    {(tournament.team_mode === 'duo' || tournament.team_mode === 'squad') && (
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-3">
                                Invite Teammates ({info.invites} required)
                            </h3>
                            <p className="text-sm text-gray-600 mb-4">
                                Enter your teammates' Game IDs. They'll receive invitations and must accept before the tournament starts.
                            </p>

                            <div className="space-y-3 mb-4">
                                {Array.from({ length: info.invites }).map((_, index) => (
                                    <div key={index}>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Teammate {index + 1} Game ID
                                        </label>
                                        <input
                                            type="text"
                                            value={gameIds[index]}
                                            onChange={(e) => {
                                                const newIds = [...gameIds];
                                                newIds[index] = e.target.value;
                                                setGameIds(newIds);
                                            }}
                                            placeholder="Enter Game ID"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                                        />
                                    </div>
                                ))}
                            </div>

                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                                <p className="text-sm text-yellow-800">
                                    <strong>Note:</strong> You'll pay ₹{paymentShare} only after all teammates accept the invitation.
                                </p>
                            </div>

                            <button
                                onClick={handleCreateTeam}
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50"
                            >
                                {loading ? 'Sending Invitations...' : `Send Invitations`}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
