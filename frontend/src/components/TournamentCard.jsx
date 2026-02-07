import { Link } from 'react-router-dom';

export default function TournamentCard({ tournament }) {
  const gameIcons = {
    fifa: '⚽',
    bgmi: '🎮',
    freefire: '🔥',
  };

  const gameColors = {
    fifa: 'from-green-500 to-emerald-600',
    bgmi: 'from-orange-500 to-red-600',
    freefire: 'from-yellow-500 to-orange-600',
  };

  return (
    <Link to={`/tournaments/${tournament.id}`}>
      <div className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden group">
        {/* Header with gradient */}
        <div className={`bg-gradient-to-r ${gameColors[tournament.game] || 'from-purple-500 to-blue-600'} p-4 sm:p-6 relative overflow-hidden`}>
          <div className="absolute top-0 right-0 text-6xl sm:text-8xl opacity-10 transform translate-x-4 -translate-y-4">
            {gameIcons[tournament.game] || '🏆'}
          </div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/80 text-xs sm:text-sm font-medium uppercase tracking-wide">
                {tournament.game}
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
                  <div className="bg-gradient-to-br from-yellow-50 to-orange-100 rounded-lg p-2 sm:p-3 border border-yellow-200">
                    <p className="text-gray-600 text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-1">Total Payout</p>
                    <p className="text-xl sm:text-2xl font-black text-orange-600 leading-none">₹{totalPayout.toFixed(0)}</p>
                    <p className="text-[10px] text-gray-400 mt-1">Entry: ₹{entryFee}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2 sm:p-3 border border-gray-100">
                    <p className="text-gray-500 text-[10px] sm:text-xs font-medium uppercase tracking-wider mb-1">Team Size</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">{tournament.max_players_per_room}</p>
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
                  <div className="mb-4">
                    <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider mb-2">Prizes</p>
                    <div className="flex gap-2">
                      {tournament.prize_distributions.slice(0, 3).map((prize) => {
                        const isWinner = prize.rank === 1;
                        const pAmount = parseFloat(prize.prize_amount);
                        const displayAmount = isWinner ? pAmount + entryFee : pAmount;

                        return (
                          <div key={prize.rank} className={`flex-1 rounded-lg p-2 text-center border ${isWinner ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-100'}`}>
                            <p className="text-[10px] text-gray-500">#{prize.rank}</p>
                            <p className={`text-sm font-bold ${isWinner ? 'text-orange-600' : 'text-gray-700'}`}>₹{displayAmount.toFixed(0)}</p>
                            {isWinner && (
                              <p className="text-[8px] text-gray-400 mt-0.5">₹{pAmount}+₹{entryFee}</p>
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
          <button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2 sm:py-3 rounded-lg font-semibold text-sm sm:text-base hover:from-purple-700 hover:to-blue-700 transition-all transform group-hover:scale-105">
            View Tournament
          </button>
        </div>
      </div>
    </Link>
  );
}
