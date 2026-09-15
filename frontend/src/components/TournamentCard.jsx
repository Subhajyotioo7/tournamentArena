import { Link, useNavigate } from 'react-router-dom';
import { getGameTheme } from '../config/gameThemes';
import { DragButton } from './ui/drag-button';

export default function TournamentCard({ tournament }) {
  const navigate = useNavigate();
  const theme = getGameTheme(tournament.game);
  const GameIcon = theme.icon;

  return (
    <Link to={`/tournaments/${tournament.id}`}>
      <div className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden group">
        {/* Header with gradient */}
        <div className={`bg-gradient-to-r ${theme.gradient} p-4 sm:p-6 relative overflow-hidden`}>
          <div className="absolute top-0 right-0 text-6xl sm:text-8xl opacity-10 transform translate-x-4 -translate-y-4">
            <GameIcon className="h-16 w-16 sm:h-24 sm:w-24" aria-hidden="true" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <span className="flex items-center gap-1.5 text-white/90 text-xs sm:text-sm font-bold uppercase tracking-wide">
                <GameIcon className="h-3.5 w-3.5" aria-hidden="true" />
                {theme.label}
              </span>
              {tournament.is_active && (
                <span className="bg-white/20 backdrop-blur-sm text-white text-xs px-2 sm:px-3 py-1 rounded-full font-semibold">
                  Active
                </span>
              )}
            </div>
            <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-1">{tournament.name}</h3>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6">
          {(() => {
            const rank1Prize = tournament.prize_distributions?.find(p => p.rank === 1);
            const winnerPrize = rank1Prize ? parseFloat(rank1Prize.prize_amount) : 0;
            const entryFee = parseFloat(tournament.entry_fee) || 0;
            const totalPayout = winnerPrize + entryFee;

            return (
              <>
                <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4">
                  <div className={`bg-gradient-to-br from-white to-gray-50 rounded-lg p-2 sm:p-3 border ${theme.border}`}>
                    <p className="text-gray-600 text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-1">Total Payout</p>
                    <p className={`text-xl sm:text-2xl font-black ${theme.accent} leading-none`}>₹{totalPayout.toFixed(0)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2 sm:p-3 border border-gray-100">
                    <p className="text-gray-500 text-[10px] sm:text-xs font-medium uppercase tracking-wider mb-1">Entry Fee</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">₹{entryFee.toFixed(0)}</p>
                  </div>
                </div>

                <div className="mb-4 space-y-2">
                  <div className="text-xs sm:text-sm text-gray-600 flex justify-between border-b border-gray-50 pb-1">
                    <span>Game:</span>
                    <span className="font-semibold text-gray-900 uppercase">{tournament.game}</span>
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600 flex justify-between border-b border-gray-50 pb-1">
                    <span>Mode:</span>
                    <span className="font-semibold text-gray-900 capitalize">{tournament.team_mode || 'Solo'}</span>
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600 flex justify-between">
                    <span>Slots:</span>
                    <span className="font-semibold text-blue-600">{tournament.total_participants || 0} / {tournament.max_participants || 100}</span>
                  </div>
                </div>

                {/* Prize Distribution Preview */}
                {tournament.prize_distributions && tournament.prize_distributions.length > 0 && (
                  <div className="mb-5 rounded-xl border border-amber-100 bg-gradient-to-br from-amber-50/80 to-orange-50/50 p-3">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-700">Prize pool</p>
                      <span className="text-[10px] font-bold text-gray-400">Top {Math.min(3, tournament.prize_distributions.length)} ranks</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {tournament.prize_distributions.slice(0, 3).map((prize) => {
                        const isWinner = prize.rank === 1;
                        const pAmount = parseFloat(prize.prize_amount);
                        const displayAmount = isWinner ? pAmount + entryFee : pAmount;
                        let medal = '🥉';
                        if (prize.rank === 1) medal = '🥇';
                        else if (prize.rank === 2) medal = '🥈';
                        const prizeClasses = isWinner
                          ? `${theme.soft} ${theme.border}`
                          : 'border-white bg-white/80';

                        return (
                          <div key={prize.rank} className={`rounded-lg border p-2 text-center shadow-sm ${prizeClasses}`}>
                            <div className="text-base leading-none">{medal}</div>
                            <p className="mt-1 text-[9px] font-bold uppercase tracking-wide text-gray-400">Rank {prize.rank}</p>
                            <p className={`mt-1 text-sm font-black ${isWinner ? theme.accent : 'text-gray-700'}`}>₹{displayAmount.toFixed(0)}</p>
                            {isWinner && (
                              <p className="mt-0.5 text-[8px] text-gray-400">includes entry</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            );
          })()}


          {/* Action Button */}
          <DragButton
            className="w-full bg-[#facc15] text-stone-950 hover:bg-[#eab308]"
            colorLight="#fde047"
            colorDark="#ca8a04"
            onPointerDown={(event) => event.stopPropagation()}
            onDragComplete={() => navigate(`/tournaments/${tournament.id}`)}
          >
            View Tournament
          </DragButton>
        </div>
      </div>
    </Link>
  );
}
