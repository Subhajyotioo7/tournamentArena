import { useState } from 'react';

export default function TeamFormationModal({ tournament, room, onClose, onJoinSolo, onCreateTeam }) {
    const [teamMode, setTeamMode] = useState(null);
    const [gameIds, setGameIds] = useState(['', '', '']);
    const [loading, setLoading] = useState(false);

    // Get saved teammates and presets from localStorage
    const savedTeammates = JSON.parse(localStorage.getItem('savedTeammates') || '[]');
    const presetTeams = JSON.parse(localStorage.getItem('presetTeams') || '[]').filter(t => t.mode === tournament.team_mode);

    const saveTeammate = (id) => {
        if (!id || id.trim() === '') return;
        const current = JSON.parse(localStorage.getItem('savedTeammates') || '[]');
        if (!current.includes(id)) {
            const updated = [id, ...current].slice(0, 10); // Keep last 10
            localStorage.setItem('savedTeammates', JSON.stringify(updated));
        }
    };

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
        const filledIds = gameIds.filter(id => id.trim());

        if (filledIds.length === 0 && info.invites > 0) {
            const confirmSolo = window.confirm(`You haven't entered any teammate Game IDs. Do you want to join this ${tournament.team_mode} tournament alone and wait for random teammates?`);
            if (!confirmSolo) return;
        }

        setLoading(true);
        try {
            // Save teammates for next time
            filledIds.forEach(id => saveTeammate(id));
            await onCreateTeam(filledIds);
        } finally {
            setLoading(false);
        }
    };

    const selectSavedTeammate = (id) => {
        const newIds = [...gameIds];
        const emptyIndex = newIds.findIndex(val => val === '');
        if (emptyIndex !== -1 && emptyIndex < info.invites) {
            newIds[emptyIndex] = id;
            setGameIds(newIds);
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
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-gray-900">
                                    {tournament.team_mode === 'duo' ? '👥 Make Duo Team' : '👨‍👩‍👧‍👦 Make Squad Team'}
                                </h3>
                                <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold uppercase">
                                    {info.invites} Teammates Needed
                                </span>
                            </div>

                            <p className="text-sm text-gray-600 mb-6 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                🎯 Enter the <strong>Game IDs</strong> of your teammates below. We will send them invitations to join your team.
                            </p>

                            {/* Team Presets Selection */}
                            {presetTeams.length > 0 && (
                                <div className="mb-6">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Saved Team Presets</p>
                                    <div className="grid grid-cols-1 gap-2">
                                        {presetTeams.map(team => (
                                            <button
                                                key={team.id}
                                                type="button"
                                                onClick={() => {
                                                    const newIds = ['', '', ''];
                                                    team.members.forEach((m, i) => { if (i < info.invites) newIds[i] = m; });
                                                    setGameIds(newIds);
                                                }}
                                                className="flex items-center justify-between p-3 rounded-xl border border-purple-100 bg-purple-50 hover:bg-purple-100 transition-colors text-left group"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xl">{team.mode === 'duo' ? '👥' : '👨‍👩‍👧‍👦'}</span>
                                                    <div>
                                                        <p className="text-sm font-bold text-gray-900 group-hover:text-purple-700">{team.name}</p>
                                                        <p className="text-[10px] text-gray-500">{team.members.join(', ')}</p>
                                                    </div>
                                                </div>
                                                <span className="text-purple-400 text-xs font-bold bg-white px-2 py-1 rounded-lg">Select</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

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

                            {/* Recent Teammates Shortcuts */}
                            {savedTeammates.length > 0 && (
                                <div className="mb-6">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Recent Teammates</p>
                                    <div className="flex flex-wrap gap-2">
                                        {savedTeammates.filter(id => !gameIds.includes(id)).map(id => (
                                            <button
                                                key={id}
                                                type="button"
                                                onClick={() => selectSavedTeammate(id)}
                                                className="bg-gray-100 hover:bg-purple-100 hover:text-purple-700 text-gray-600 px-3 py-1 rounded-full text-xs font-semibold transition-colors border border-gray-200"
                                            >
                                                + {id}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

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
