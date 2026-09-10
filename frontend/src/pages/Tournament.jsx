import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { tournamentService, roomService } from '../services/api';
import RulesModal from '../components/RulesModal';
import TeamFormationModal from '../components/TeamFormationModal';
import { Button } from '../components/ui/button';
import { ArrowLeft, Ban, ClipboardList, CircleX, Info, Medal, Rocket, Trophy, Users } from 'lucide-react';

export default function Tournament() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState(null);
  const [prizes, setPrizes] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);

  const fetchTournamentData = useCallback(async () => {
    try {
      console.log('Fetching tournament with ID:', id);
      const [tournamentData, prizeData] = await Promise.all([
        tournamentService.getById(id),
        tournamentService.getPrizeDistribution(id).catch((err) => {
          console.warn('Prize distribution fetch failed:', err);
          return [];
        })
      ]);
      console.log('Tournament data:', tournamentData);
      console.log('Prize data:', prizeData);
      setTournament(tournamentData);
      setPrizes(prizeData);
      setRooms(tournamentData.rooms || []);
    } catch (error) {
      console.error('Failed to fetch tournament:', error);
      alert('Failed to load tournament: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTournamentData();
  }, [fetchTournamentData]);

  const handleCreateRoom = async () => {
    // Check if logged in
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please login first to join tournaments!\n\nClick "Login" in the top menu to continue.');
      navigate('/login');
      return;
    }

    // Create room first
    setCreating(true);
    try {
      const newRoom = await roomService.create(id);
      setRooms([...rooms, newRoom]);
      setSelectedRoom(newRoom.id);

      // Now show rules modal
      setShowRulesModal(true);
    } catch (error) {
      console.error('Create room error:', error);
      if (error.message.includes('Game ID not verified')) {
        alert('Cannot create room: Your Game ID is not verified yet. Please verify your Game ID in your profile first.');
      } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        alert('Please login first to create a room.');
      } else {
        alert('Failed to create room: ' + error.message);
      }
    } finally {
      setCreating(false);
    }
  };

  const handleAcceptRules = () => {
    setShowRulesModal(false);
    // Show team formation modal
    setShowTeamModal(true);
  };


  const handleJoinSolo = async () => {
    try {
      const data = await roomService.joinSolo(selectedRoom);
      if (data) {
        alert(`${data.message}\nPaid: ₹${data.payment}`);
        setShowTeamModal(false);
        navigate('/my-rooms');
      }
    } catch (error) {
      alert(error.message || 'Error joining tournament');
    }
  };

  const handleCreateTeam = async (gameIds) => {
    try {
      const data = await roomService.createTeam(selectedRoom, gameIds);
      if (data) {
        alert(`${data.message}\nInvitations sent to ${data.invitations.length} players`);
        setShowTeamModal(false);
        navigate('/my-rooms');
      }
    } catch (error) {
      alert(error.message || 'Error creating team');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading tournament...</p>
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <CircleX className="mx-auto mb-4 h-16 w-16 text-red-500" aria-hidden="true" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Tournament Not Found</h2>
          <Button onClick={() => navigate('/')} variant="link" className="p-0 text-purple-600">
            Go back home
          </Button>
        </div>
      </div>
    );
  }

  const gameGradients = {
    fifa: 'from-green-500 to-emerald-600',
    bgmi: 'from-orange-500 to-red-600',
    freefire: 'from-yellow-500 to-orange-600',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Tournament Header */}
      <div className={`bg-gradient-to-r ${gameGradients[tournament.game] || 'from-purple-600 to-blue-600'} text-white shadow-lg`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <Button onClick={() => navigate('/')} variant="ghost" className="mb-4 flex items-center gap-2 p-0 text-white/80 sm:mb-6">
            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
            Back to Tournaments
          </Button>

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-6">
            <div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 mb-2">
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight">{tournament.name}</h1>
                {tournament.is_active && (
                  <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-white/30">
                    Active
                  </span>
                )}
              </div>
              <p className="text-white/90 text-base sm:text-lg md:text-xl font-medium uppercase tracking-wide opacity-90">{tournament.game}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Main Content Column */}
          <div className="lg:col-span-2 space-y-8">

            {/* Tournament Info Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2">
                <Info className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" aria-hidden="true" /> Tournament Info
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 sm:gap-y-6 gap-x-4 sm:gap-x-8">
                <div>
                  <p className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Team Mode</p>
                  <p className="text-base sm:text-lg font-bold text-gray-900 capitalize">{tournament.team_mode || 'Solo'}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Team Size</p>
                  <p className="text-base sm:text-lg font-bold text-gray-900">{tournament.team_size || tournament.max_players_per_room} players</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Registration Deadline</p>
                  <p className="text-sm sm:text-base md:text-lg font-bold text-gray-900">
                    {tournament.registration_deadline ? new Date(tournament.registration_deadline).toLocaleString('en-IN', {
                      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                    }) : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Tournament Starts</p>
                  <p className="text-sm sm:text-base md:text-lg font-bold text-blue-600">
                    {tournament.start_time ? new Date(tournament.start_time).toLocaleString('en-IN', {
                      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                    }) : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Rules Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2">
                <ClipboardList className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" aria-hidden="true" /> Rules
              </h2>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="bg-purple-100 p-1 rounded-full mt-0.5"><div className="w-2 h-2 bg-purple-600 rounded-full"></div></div>
                  <span className="text-gray-700 leading-relaxed">Verify your game ID in your profile before joining.</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="bg-purple-100 p-1 rounded-full mt-0.5"><div className="w-2 h-2 bg-purple-600 rounded-full"></div></div>
                  <span className="text-gray-700 leading-relaxed">Entry fee is deducted automatically from your wallet.</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="bg-purple-100 p-1 rounded-full mt-0.5"><div className="w-2 h-2 bg-purple-600 rounded-full"></div></div>
                  <span className="text-gray-700 leading-relaxed">Winners receive prizes automatically after results are verified.</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="bg-purple-100 p-1 rounded-full mt-0.5"><div className="w-2 h-2 bg-purple-600 rounded-full"></div></div>
                  <span className="text-gray-700 leading-relaxed font-medium">Fair play is mandatory. Hacks or cheats result in permanent ban.</span>
                </li>
              </ul>
            </div>

            {/* Prize Distribution (Merged logic) */}
            {prizes.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2">
                  <Trophy className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600" aria-hidden="true" /> Prize Distribution
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {prizes.map((prize) => {
                    const isWinner = prize.rank === 1;
                    const winnerPrize = parseFloat(prize.prize_amount);
                    const entryFee = parseFloat(tournament.entry_fee);
                    const totalPayout = isWinner ? winnerPrize + entryFee : winnerPrize;

                    return (
                      <div key={prize.rank} className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-6 border border-yellow-100 text-center relative overflow-hidden group hover:scale-105 transition-transform duration-300">
                        <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                          <svg className="w-16 h-16 text-yellow-600" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.699-3.177a1 1 0 111.827.86l-1.699 3.178 1.699 3.177a1 1 0 11-1.827.86L14.954 9.323V11a1 1 0 01-1 1h-8a1 1 0 01-1-1v-1.677l-3.954 2.872a1 1 0 11-1.827-.86l1.699-3.177-1.699-3.178a1 1 0 011.827-.86L5.046 4.323V3a1 1 0 011-1h4z" /></svg>
                        </div>
                        <div className="mb-3 flex justify-center text-yellow-600 filter drop-shadow-sm">
                          <Medal className="h-10 w-10" aria-hidden="true" />
                        </div>
                        <p className="text-gray-500 text-sm font-bold uppercase tracking-wider mb-1">Rank #{prize.rank}</p>

                        {isWinner ? (
                          <>
                            <p className="text-2xl font-extrabold text-gray-900">₹{totalPayout.toFixed(0)}</p>
                            <div className="mt-2 pt-2 border-t border-yellow-200">
                              <p className="text-xs text-gray-600">Winner Prize: ₹{winnerPrize.toFixed(0)}</p>
                              <p className="text-xs text-gray-600">+ Entry Fee: ₹{entryFee.toFixed(0)}</p>
                            </div>
                          </>
                        ) : (
                          <p className="text-3xl font-extrabold text-gray-900">₹{totalPayout.toFixed(0)}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar Action Column */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl border-t-4 border-purple-600 p-6 sm:p-8 lg:sticky lg:top-8">
              <div className="text-center mb-6 sm:mb-8">
                <p className="text-gray-500 font-medium mb-1 uppercase tracking-wider text-xs sm:text-sm">Entry Fee</p>
                <div className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">
                  ₹{tournament.entry_fee}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-6 sm:mb-8">
                <div className="flex justify-between text-xs sm:text-sm font-bold text-gray-700 mb-2">
                  <span>Participants</span>
                  <span>{tournament.total_participants || 0} / {tournament.max_participants || 100}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-blue-500 h-full rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${Math.min(((tournament.total_participants || 0) / (tournament.max_participants || 100)) * 100, 100)}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-400 mt-2 text-center">
                  {((tournament.max_participants || 100) - (tournament.total_participants || 0))} spots remaining
                </p>
              </div>

              <div className="space-y-4">
                <Button
                  onClick={handleCreateRoom}
                  disabled={creating || (tournament.total_participants >= tournament.max_participants)}
                  className="w-full py-3 text-base sm:py-4 sm:text-lg"
                >
                  {creating ? (
                    <>
                      <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Processing...
                    </>
                  ) : (tournament.total_participants >= tournament.max_participants) ? (
                    <span className="inline-flex items-center gap-2"><Ban className="h-4 w-4" aria-hidden="true" />TOURNAMENT FULL</span>
                  ) : (tournament.team_mode === 'solo' ? <span className="inline-flex items-center gap-2"><Rocket className="h-4 w-4" aria-hidden="true" />JOIN TOURNAMENT</span> : <span className="inline-flex items-center gap-2"><Users className="h-4 w-4" aria-hidden="true" />CREATE TEAM</span>)
                  }
                </Button>

                <p className="text-xs text-center text-gray-400 leading-relaxed px-4">
                  By joining, you agree to the rules. Entry fee will be deducted immediately.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Modals */}
      {showRulesModal && tournament && (
        <RulesModal
          tournament={tournament}
          onClose={() => setShowRulesModal(false)}
          onAccept={handleAcceptRules}
        />
      )}

      {showTeamModal && tournament && (
        <TeamFormationModal
          tournament={tournament}
          room={selectedRoom}
          onClose={() => setShowTeamModal(false)}
          onJoinSolo={handleJoinSolo}
          onCreateTeam={handleCreateTeam}
        />
      )}
    </div>
  );
}
