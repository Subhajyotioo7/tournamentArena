import { Crosshair, User, Users, UsersRound } from 'lucide-react';
import { useState } from 'react';
import { Button } from './ui/button';

const TEAMMATE_KEYS = ['first', 'second', 'third', 'fourth'];

export default function TeamFormationModal({ tournament, onClose, onJoinSolo, onCreateTeam }) {
    const [gameIds, setGameIds] = useState(['', '', '']);
    const [loading, setLoading] = useState(false);
    const [paymentType, setPaymentType] = useState('split_equally');

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
        solo: { players: 1, share: 100, icon: User, invites: 0 },
        duo: { players: 2, share: 50, icon: Users, invites: 1 },
        squad: { players: 4, share: 25, icon: UsersRound, invites: 3 }
    };

    const info = teamInfo[tournament.team_mode];
    const paymentShare = (tournament.entry_fee / info.players).toFixed(2);
    const TeamIcon = info.icon;
    const gameLabels = { bgmi: 'BGMI', freefire: 'Free Fire', fifa: 'FIFA' };
    const gameLabel = gameLabels[tournament.game] || tournament.game.toUpperCase();

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

        if (filledIds.length < info.invites) {
            window.alert(`Enter all ${info.invites} teammate Game IDs before creating this team.`);
            return;
        }

        setLoading(true);
        try {
            // Save teammates for next time
            filledIds.forEach(id => saveTeammate(id));
            await onCreateTeam(filledIds, paymentType);
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
            <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white">
                {/* Header */}
                <div className="bg-gradient-to-r from-[#f59e0b] to-[#d97706] text-white p-6 rounded-t-2xl">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-2xl font-bold mb-1">Join Tournament</h2>
                            <p className="text-amber-100">{tournament.name}</p>
                        </div>
                        <Button
                            onClick={onClose}
                            variant="ghost"
                            size="icon"
                            className="text-white hover:bg-white/10 hover:text-white"
                            aria-label="Close team dialog"
                        >
                            ✕
                        </Button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Team Mode Info */}
                    <div className="bg-gradient-to-br from-amber-50 to-white rounded-xl p-4 border-2 border-amber-200">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="bg-amber-500 p-3 rounded-lg text-2xl">
                                <TeamIcon className="h-6 w-6" aria-hidden="true" />
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
                            <Button
                                onClick={handleJoinSolo}
                                disabled={loading}
                                className="w-full"
                            >
                                {loading ? 'Joining...' : `Join Solo - Pay ₹${paymentShare}`}
                            </Button>
                        </div>
                    )}

                    {/* Duo/Squad Mode */}
                    {(tournament.team_mode === 'duo' || tournament.team_mode === 'squad') && (
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-gray-900">
                                    {tournament.team_mode === 'duo' ? <><Users className="mr-2 inline h-4 w-4" aria-hidden="true" />Make Duo Team</> : <><UsersRound className="mr-2 inline h-4 w-4" aria-hidden="true" />Make Squad Team</>}
                                </h3>
                                <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold uppercase">
                                    {info.invites} Teammates Needed
                                </span>
                            </div>

                            <p className="text-sm text-gray-600 mb-6 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                <Crosshair className="mr-1 inline h-4 w-4" aria-hidden="true" />Enter your teammates&apos; <strong>{gameLabel} IDs</strong> below. We will send invitations using their {gameLabel} ID.
                            </p>

                            {/* Team Presets Selection */}
                            {presetTeams.length > 0 && (
                                <div className="mb-6">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Saved Team Presets</p>
                                    <div className="grid grid-cols-1 gap-2">
                                        {presetTeams.map(team => (
                                            <Button
                                                key={team.id}
                                                type="button"
                                                onClick={() => {
                                                    const newIds = ['', '', ''];
                                                    team.members.forEach((m, i) => { if (i < info.invites) newIds[i] = m; });
                                                    setGameIds(newIds);
                                                }}
                                                variant="outline"
                                                className="h-auto w-full justify-between p-3 text-left"
                                            >
                                                <div className="flex items-center gap-3">
                                                    {team.mode === 'duo' ? <Users className="h-5 w-5" aria-hidden="true" /> : <UsersRound className="h-5 w-5" aria-hidden="true" />}
                                                    <div>
                                                        <p className="text-sm font-bold text-gray-900 group-hover:text-amber-700">{team.name}</p>
                                                        <p className="text-[10px] text-gray-500">{team.members.join(', ')}</p>
                                                    </div>
                                                </div>
                                                <span className="text-amber-600 text-xs font-bold bg-white px-2 py-1 rounded-lg">Select</span>
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="space-y-3 mb-4">
                                {TEAMMATE_KEYS.slice(0, info.invites).map((memberKey, index) => (
                                    <div key={memberKey}>
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
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
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
                                            <Button
                                                key={id}
                                                type="button"
                                                onClick={() => selectSavedTeammate(id)}
                                                variant="outline"
                                                size="sm"
                                                className="h-8 rounded-full text-xs"
                                            >
                                                + {id}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                                <p className="text-sm text-yellow-800">
                                    <strong>Payment:</strong> Choose who pays the team entry fee. Split payment charges each player after accepting.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 gap-3 mb-4">
                                <label className={`cursor-pointer rounded-xl border-2 p-3 ${paymentType === 'leader_pays_all' ? 'border-amber-500 bg-amber-50' : 'border-gray-200'}`}>
                                    <input type="radio" className="sr-only" checked={paymentType === 'leader_pays_all'} onChange={() => setPaymentType('leader_pays_all')} />
                                    <span className="font-bold text-gray-900">Captain pays all</span>
                                    <span className="block text-xs text-gray-500 mt-1">Pay ₹{tournament.entry_fee} now. Teammates join free after accepting.</span>
                                </label>
                                <label className={`cursor-pointer rounded-xl border-2 p-3 ${paymentType === 'split_equally' ? 'border-amber-500 bg-amber-50' : 'border-gray-200'}`}>
                                    <input type="radio" className="sr-only" checked={paymentType === 'split_equally'} onChange={() => setPaymentType('split_equally')} />
                                    <span className="font-bold text-gray-900">Split payment</span>
                                    <span className="block text-xs text-gray-500 mt-1">You pay ₹{paymentShare}; each invited player pays after accepting.</span>
                                </label>
                            </div>

                            <Button
                                onClick={handleCreateTeam}
                                disabled={loading}
                                className="w-full"
                            >
                                {loading ? 'Sending Invitations...' : `Send Invitations`}
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
