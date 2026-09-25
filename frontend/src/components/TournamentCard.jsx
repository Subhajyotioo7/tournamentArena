import { Link, useNavigate } from 'react-router-dom';
import { getGameTheme } from '../config/gameThemes';
import { DragButton } from './ui/drag-button';
import TournamentCountdown from './TournamentCountdown';
import { EsportsIcon } from './EsportsIcon';

export default function TournamentCard({ tournament }) {
  const navigate = useNavigate();
  const theme = getGameTheme(tournament.game);
  const GameIcon = theme.icon;

  return (
    <Link to={`/tournaments/${tournament.id}`}>
      <div className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden group">
        {/* Header with gradient */}
        <div className={`bg-gradient-to-r ${theme.gradient} p-4 sm:p-6 relative overflow-hidden`}>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/90 text-xs sm:text-sm font-bold uppercase tracking-wide">{theme.label}</span>
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
            const entryFee = parseFloat(tournament.entry_fee) || 0;
            const isOneVsOne = tournament.tournament_type === 'one_vs_one';
            const totalPayout = isOneVsOne
              ? entryFee * 2
              : (rank1Prize ? parseFloat(rank1Prize.prize_amount) : 0) + entryFee;

            return (
              <>
                <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4">
                  <div className={`bg-gradient-to-br from-white to-gray-50 rounded-lg p-2 sm:p-3 border ${theme.border}`}>
                    <p className="text-gray-600 text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-1">
                      {isOneVsOne ? 'Prize' : 'Total Payout'}
                    </p>
                    <p className={`text-xl sm:text-2xl font-black ${theme.accent} leading-none`}>₹{totalPayout.toFixed(0)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2 sm:p-3 border border-gray-100">
                    <p className="text-gray-500 text-[10px] sm:text-xs font-medium uppercase tracking-wider mb-1">Entry Fee</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">₹{entryFee.toFixed(0)}</p>
                  </div>
                </div>

                <div className="mb-4 overflow-hidden rounded-xl border border-gray-100 bg-white px-3 sm:px-4">
                  <div className="flex min-h-[4.25rem] items-center gap-3 border-b border-gray-100">
                    <GameIcon className="h-11 w-11 shrink-0" />
                    <span className="text-sm font-medium text-gray-600 sm:text-base">Game</span>
                    <span className="ml-auto text-sm font-bold uppercase text-gray-900 sm:text-base">{tournament.game}</span>
                  </div>
                  <div className="flex min-h-[4.25rem] items-center gap-3 border-b border-gray-100">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-800">
                      <EsportsIcon name="crosshair" className="h-7 w-7" />
                    </span>
                    <span className="text-sm font-medium text-gray-600 sm:text-base">Mode</span>
                    <span className="ml-auto text-sm font-bold capitalize text-gray-900 sm:text-base">{tournament.team_mode || 'Solo'}</span>
                  </div>
                  <div className="flex min-h-[4.25rem] items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-800">
                      <EsportsIcon name="team" className="h-7 w-7" />
                    </span>
                    <span className="text-sm font-medium text-gray-600 sm:text-base">Slots</span>
                    <span className="ml-auto text-right text-sm font-bold text-blue-600 sm:text-base">
                      {tournament.total_participants || 0} / {tournament.max_participants || 100}
                      <span className="ml-1 hidden font-medium text-gray-500 sm:inline">
                        ({Math.max(0, (tournament.max_participants || 100) - (tournament.total_participants || 0))} available)
                      </span>
                    </span>
                  </div>
                </div>
                {tournament.start_time && (
                  <div className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                    <TournamentCountdown target={tournament.start_time} />
                  </div>
                )}

                {/* Prize Distribution Preview */}
                {tournament.tournament_type !== 'one_vs_one' && tournament.prize_distributions && tournament.prize_distributions.length > 0 && (
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
