import { Banknote, CreditCard } from 'lucide-react';
import { Button } from './ui/button';

export default function RulesModal({ tournament, onClose, onAccept }) {
    if (!tournament) return null;

    const getTeamModeDisplay = () => {
        const modes = {
            solo: { players: 1, share: '100%' },
            duo: { players: 2, share: '50%' },
            squad: { players: 4, share: '25%' }
        };
        return modes[tournament.team_mode] || modes.solo;
    };

    const teamInfo = getTeamModeDisplay();

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 rounded-t-2xl">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-2xl font-bold mb-1">{tournament.name}</h2>
                            <p className="text-purple-100">Rules & Regulations</p>
                        </div>
                        <Button
                            onClick={onClose}
                            variant="ghost"
                            size="icon"
                            className="text-white hover:bg-white/10 hover:text-white"
                            aria-label="Close rules"
                        >
                            ✕
                        </Button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Tournament Info */}
                    <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-4 border-2 border-purple-200">
                        <h3 className="font-bold text-lg mb-3 text-gray-900">Tournament Details</h3>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                                <p className="text-gray-600">Game</p>
                                <p className="font-semibold text-gray-900">{tournament.game.toUpperCase()}</p>
                            </div>
                            <div>
                                <p className="text-gray-600">Team Mode</p>
                                <p className="font-semibold text-gray-900">
                                    {tournament.team_mode.charAt(0).toUpperCase() + tournament.team_mode.slice(1)} ({teamInfo.players} player{teamInfo.players > 1 ? 's' : ''})
                                </p>
                            </div>
                            <div>
                                <p className="text-gray-600">Entry Fee</p>
                                <p className="font-semibold text-green-600">₹{tournament.entry_fee}</p>
                            </div>
                            <div>
                                <p className="text-gray-600">Your Share</p>
                                <p className="font-semibold text-orange-600">₹{(tournament.entry_fee / teamInfo.players).toFixed(2)} ({teamInfo.share})</p>
                            </div>
                        </div>
                    </div>

                    {/* Prize Distribution */}
                    {tournament.prize_distributions && tournament.prize_distributions.length > 0 && (
                        <div>
                            <h3 className="flex items-center gap-2 font-bold text-lg mb-3 text-gray-900"><Banknote className="h-5 w-5 text-emerald-600" aria-hidden="true" />Prize Distribution</h3>
                            <div className="grid grid-cols-3 gap-3">
                                {tournament.prize_distributions.slice(0, 3).map((prize) => {
                                    const isWinner = prize.rank === 1;
                                    const pAmount = parseFloat(prize.prize_amount);
                                    const entryFee = parseFloat(tournament.entry_fee);
                                    const totalPayout = isWinner ? pAmount + entryFee : pAmount;

                                    return (
                                        <div key={prize.rank} className={`rounded-lg p-3 border text-center ${isWinner ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200 shadow-sm' : 'bg-gray-50 border-gray-100'}`}>
                                            <div className="text-2xl mb-1">
                                                {prize.rank === 1 ? '🥇' : prize.rank === 2 ? '🥈' : '🥉'}
                                            </div>
                                            <p className="text-xs text-gray-600">Rank #{prize.rank}</p>
                                            <p className={`text-lg font-bold ${isWinner ? 'text-orange-600' : 'text-gray-700'}`}>₹{totalPayout.toFixed(0)}</p>
                                            {isWinner && (
                                                <p className="text-[10px] text-gray-400">({pAmount}+{entryFee})</p>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Game Rules */}
                    <div>
                        <h3 className="font-bold text-lg mb-3 text-gray-900">📋 Game Rules</h3>
                        <ul className="space-y-2 text-sm text-gray-700">
                            <li className="flex items-start gap-2">
                                <span className="text-green-600 mt-0.5">✓</span>
                                <span>Fair play is mandatory. Any form of cheating will result in disqualification.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-green-600 mt-0.5">✓</span>
                                <span>Your Game ID must be verified before joining tournaments.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-green-600 mt-0.5">✓</span>
                                <span>Entry fee will be deducted from your wallet balance.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-green-600 mt-0.5">✓</span>
                                <span>The <strong>team leader pays the full entry fee</strong> for all members upfront.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-green-600 mt-0.5">✓</span>
                                <span>For team modes, all members must accept invitation before room starts.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-green-600 mt-0.5">✓</span>
                                <span>Prizes will be credited to winners' wallets after admin approval.</span>
                            </li>
                        </ul>
                    </div>

                    {/* Payment & Refund Policy */}
                    <div>
                        <h3 className="flex items-center gap-2 font-bold text-lg mb-3 text-gray-900"><CreditCard className="h-5 w-5 text-blue-600" aria-hidden="true" />Payment &amp; Refund Policy</h3>
                        <ul className="space-y-2 text-sm text-gray-700">
                            <li className="flex items-start gap-2">
                                <span className="text-red-600 mt-0.5">⚠</span>
                                <span><strong>No refunds</strong> after joining a tournament.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-blue-600 mt-0.5">ℹ</span>
                                <span>Ensure sufficient wallet balance before joining.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-blue-600 mt-0.5">ℹ</span>
                                <span>Invitations are free for teammates (Leader paid all).</span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="sticky bottom-0 bg-gray-50 p-6 rounded-b-2xl border-t flex gap-3">
                    <Button
                        onClick={onClose}
                        variant="outline"
                        className="flex-1"
                    >
                        Cancel
                    </Button>
                    <Button onClick={onAccept} className="flex-1">
                        Accept & Continue
                    </Button>
                </div>
            </div>
        </div>
    );
}
