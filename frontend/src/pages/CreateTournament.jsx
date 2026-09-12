import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { hostPartnerService, tournamentService } from '../services/api';
import { Button } from '../components/ui/button';

export default function CreateTournament() {
    const navigate = useNavigate();
    const location = useLocation();
    const [loading, setLoading] = useState(false);
    const [requestingAccess, setRequestingAccess] = useState(false);
    const [hostRequestStatus, setHostRequestStatus] = useState(null);
    const [hostRequestMessage, setHostRequestMessage] = useState('');
    const [requestForm, setRequestForm] = useState({
        game: 'bgmi',
        requested_tournament_name: '',
        player_count: 16,
        note: ''
    });
    const [formData, setFormData] = useState({
        name: '',
        game: 'bgmi',
        tournament_type: 'one_vs_one',
        entry_fee: 10,
        team_mode: 'solo',
        max_participants: 2,
        custom_player_count: 0,
        start_time: '',
        teammate_ids: ['', '', ''],
        prize_distributions: [
            { rank: 1, prize: 100 }
        ]
    });

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const type = params.get('tournamentType');
        if (type === 'br') {
            setFormData(prev => ({ ...prev, tournament_type: 'br', team_mode: 'solo', max_participants: 16, custom_player_count: 16 }));
        }

        const loadHostStatus = async () => {
            try {
                const data = await hostPartnerService.getStatus();
                setHostRequestStatus(data.status || 'pending');
                setHostRequestMessage(data.message || '');
            } catch (error) {
                setHostRequestStatus('not_requested');
            }
        };

        loadHostStatus();
    }, [location.search]);

    const savedTeammates = JSON.parse(localStorage.getItem('savedTeammates') || '[]');
    const presetTeams = JSON.parse(localStorage.getItem('presetTeams') || '[]').filter(t => t.mode === formData.team_mode);

    const handleTeammateIdChange = (index, value) => {
        const newIds = [...formData.teammate_ids];
        newIds[index] = value;
        setFormData(prev => ({ ...prev, teammate_ids: newIds }));
    };

    const selectSavedTeammate = (id) => {
        const newIds = [...formData.teammate_ids];
        const emptyIndex = newIds.findIndex(val => val === '');
        const invites = formData.team_mode === 'duo' ? 1 : formData.team_mode === 'squad' ? 3 : 0;
        if (emptyIndex !== -1 && emptyIndex < invites) {
            newIds[emptyIndex] = id;
            setFormData(prev => ({ ...prev, teammate_ids: newIds }));
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handlePrizeChange = (index, field, value) => {
        const newPrizes = [...formData.prize_distributions];
        newPrizes[index][field] = value;
        setFormData(prev => ({ ...prev, prize_distributions: newPrizes }));
    };

    const handleHostRequest = async () => {
        if (!requestForm.requested_tournament_name || !requestForm.game) {
            alert('Please enter tournament name and select a game');
            return;
        }

        setRequestingAccess(true);
        try {
            const response = await hostPartnerService.requestAccess(requestForm);
            setHostRequestStatus('pending');
            setHostRequestMessage(response.message || 'Host partner request submitted.');
            alert(response.message || 'Host partner request submitted successfully');
        } catch (error) {
            console.error('Failed to request host access:', error);
            alert(error.message || 'Failed to submit host partner request');
        } finally {
            setRequestingAccess(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name) return alert('Name is required');

        setLoading(true);
        try {
            // Filter filled teammate IDs
            const invitesCount = formData.team_mode === 'duo' ? 1 : formData.team_mode === 'squad' ? 3 : 0;
            const filledTeammateIds = formData.teammate_ids.slice(0, invitesCount).filter(id => id.trim() !== '');

            // Save for future
            const currentSaved = JSON.parse(localStorage.getItem('savedTeammates') || '[]');
            let updatedSaved = [...currentSaved];
            filledTeammateIds.forEach(id => {
                if (!updatedSaved.includes(id)) updatedSaved = [id, ...updatedSaved];
            });
            localStorage.setItem('savedTeammates', JSON.stringify(updatedSaved.slice(0, 10)));

            const payload = {
                ...formData,
                tournament_type: formData.tournament_type,
                custom_player_count: formData.tournament_type === 'br' ? Number(formData.custom_player_count || 0) : 0,
                teammate_ids: filledTeammateIds
            };

            const response = await tournamentService.createUserTournament(payload);
            const breakdown = response.breakdown || {};
            alert(`✅ ${response.message}\n\n💰 Total Deducted: ₹${response.fee_deducted}\n- Creation Fee: ₹${breakdown.creation_fee || '10'}\n- Prize Pool: ₹${breakdown.prize_pool || '0'}`);
            navigate('/');
        } catch (error) {
            console.error('Failed to create tournament:', error);
            alert('❌ Error: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="bg-purple-600 px-8 py-6">
                    <h2 className="text-3xl font-extrabold text-white">Create Your Tournament</h2>
                    <p className="mt-2 text-purple-100 italic">
                        ₹10 creation fee + Winner's prize amount will be deducted from your wallet.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <div className="flex flex-col sm:flex-row gap-3">
                                <Button
                                    type="button"
                                    variant={formData.tournament_type === 'one_vs_one' ? 'default' : 'outline'}
                                    onClick={() => setFormData(prev => ({ ...prev, tournament_type: 'one_vs_one', team_mode: 'solo', max_participants: 2 }))}
                                >
                                    One vs One
                                </Button>
                                <Button
                                    type="button"
                                    variant={formData.tournament_type === 'br' ? 'default' : 'outline'}
                                    onClick={() => setFormData(prev => ({ ...prev, tournament_type: 'br', team_mode: 'solo', max_participants: 16, custom_player_count: 16 }))}
                                >
                                    BR / Long Tournament
                                </Button>
                            </div>
                            {formData.tournament_type === 'br' && (
                                <div className="mt-3 space-y-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-3 text-sm text-amber-800">
                                    <div>
                                        {hostRequestStatus === 'approved'
                                            ? 'Your host-partner request is approved, so you can create BR events.'
                                            : hostRequestStatus === 'pending'
                                                ? 'Your host-partner request is pending admin approval.'
                                                : 'Only approved host-partner accounts can create BR / long tournaments. Submit a request first.'}
                                    </div>

                                    {hostRequestStatus !== 'approved' && (
                                        <div className="rounded-xl border border-amber-200 bg-white p-3">
                                            <p className="mb-2 font-semibold text-amber-900">Request Host Partner Access</p>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-xs font-semibold uppercase tracking-wide text-amber-700">Game</label>
                                                    <select
                                                        value={requestForm.game}
                                                        onChange={(e) => setRequestForm(prev => ({ ...prev, game: e.target.value }))}
                                                        className="mt-1 block w-full border border-amber-300 rounded-lg px-3 py-2"
                                                    >
                                                        <option value="bgmi">BGMI</option>
                                                        <option value="freefire">Free Fire</option>
                                                        <option value="fifa">FIFA</option>
                                                    </select>
                                                </div>

                                                <div>
                                                    <label className="block text-xs font-semibold uppercase tracking-wide text-amber-700">Player Count</label>
                                                    <input
                                                        type="number"
                                                        min="2"
                                                        value={requestForm.player_count}
                                                        onChange={(e) => setRequestForm(prev => ({ ...prev, player_count: Number(e.target.value || 0) }))}
                                                        className="mt-1 block w-full border border-amber-300 rounded-lg px-3 py-2"
                                                    />
                                                </div>
                                            </div>

                                            <div className="mt-3">
                                                <label className="block text-xs font-semibold uppercase tracking-wide text-amber-700">Tournament Name</label>
                                                <input
                                                    type="text"
                                                    value={requestForm.requested_tournament_name}
                                                    onChange={(e) => setRequestForm(prev => ({ ...prev, requested_tournament_name: e.target.value }))}
                                                    placeholder="Weekend BR Cup"
                                                    className="mt-1 block w-full border border-amber-300 rounded-lg px-3 py-2"
                                                />
                                            </div>

                                            <div className="mt-3">
                                                <label className="block text-xs font-semibold uppercase tracking-wide text-amber-700">Note</label>
                                                <textarea
                                                    rows="3"
                                                    value={requestForm.note}
                                                    onChange={(e) => setRequestForm(prev => ({ ...prev, note: e.target.value }))}
                                                    placeholder="Describe the event details"
                                                    className="mt-1 block w-full border border-amber-300 rounded-lg px-3 py-2"
                                                />
                                            </div>

                                            <div className="mt-3 flex justify-end">
                                                <Button
                                                    type="button"
                                                    onClick={handleHostRequest}
                                                    disabled={requestingAccess || hostRequestStatus === 'pending'}
                                                    variant="default"
                                                    size="sm"
                                                >
                                                    {requestingAccess ? 'Submitting...' : hostRequestStatus === 'pending' ? 'Request Pending' : 'Submit Request'}
                                                </Button>
                                            </div>

                                            {hostRequestMessage && (
                                                <p className="mt-3 text-xs text-amber-900">{hostRequestMessage}</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Tournament Name</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                className="mt-1 block w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-purple-500 focus:border-purple-500"
                                placeholder="Global BGMI Championship"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Select Game</label>
                            <select
                                name="game"
                                value={formData.game}
                                onChange={handleChange}
                                className="mt-1 block w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-purple-500 focus:border-purple-500"
                            >
                                <option value="bgmi">BGMI</option>
                                <option value="freefire">Free Fire</option>
                                <option value="fifa">FIFA</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Entry Fee</label>
                            <input
                                type="number"
                                name="entry_fee"
                                value={formData.entry_fee}
                                onChange={handleChange}
                                min="0"
                                className="mt-1 block w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-purple-500 focus:border-purple-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Team Mode</label>
                            <select
                                name="team_mode"
                                value={formData.team_mode}
                                onChange={(e) => {
                                    const mode = e.target.value;
                                    const maxPlayers = mode === 'solo' ? 2 : mode === 'duo' ? 4 : 8;
                                    const brPlayerCount = mode === 'solo' ? 16 : mode === 'duo' ? 16 : 16;
                                    setFormData(prev => ({
                                        ...prev,
                                        team_mode: mode,
                                        custom_player_count: formData.tournament_type === 'br' ? Math.max(brPlayerCount, prev.custom_player_count || brPlayerCount) : prev.custom_player_count,
                                        max_participants: formData.tournament_type === 'br' ? Math.max(brPlayerCount, prev.custom_player_count || brPlayerCount) : maxPlayers
                                    }));
                                }}
                                className="mt-1 block w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-purple-500 focus:border-purple-500"
                            >
                                <option value="solo">Solo (1 vs 1)</option>
                                <option value="duo">Duo (2 vs 2)</option>
                                <option value="squad">Squad (4 vs 4)</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Players Count</label>
                            {formData.tournament_type === 'br' ? (
                                <input
                                    type="number"
                                    min="2"
                                    value={formData.custom_player_count}
                                    onChange={(e) => {
                                        const value = Number(e.target.value || 0);
                                        const teamSize = formData.team_mode === 'solo' ? 1 : formData.team_mode === 'duo' ? 2 : 4;
                                        const roundedValue = value > 0 ? Math.max(teamSize, value - (value % teamSize)) : 0;
                                        setFormData(prev => ({ ...prev, custom_player_count: roundedValue, max_participants: roundedValue }));
                                    }}
                                    className="mt-1 block w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-purple-500 focus:border-purple-500"
                                />
                            ) : (
                                <div className="mt-1 block w-full bg-gray-100 border border-gray-200 rounded-lg px-4 py-2 text-gray-600 font-bold">
                                    {formData.team_mode === 'solo' ? '2 players' : formData.team_mode === 'duo' ? '4 players' : '8 players'}
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Start Time</label>
                            <input
                                type="datetime-local"
                                name="start_time"
                                value={formData.start_time}
                                onChange={handleChange}
                                className="mt-1 block w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-purple-500 focus:border-purple-500"
                            />
                        </div>
                    </div>

                    {(formData.team_mode === 'duo' || formData.team_mode === 'squad') && (
                        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 space-y-4">
                            <h3 className="text-lg font-bold text-blue-900 flex items-center gap-2">
                                👥 Team Setup ({formData.team_mode.toUpperCase()})
                            </h3>
                            <p className="text-sm text-blue-700">Invite your teammates immediately. Enter their Game IDs below.</p>

                            {/* Team Presets Selection */}
                            {presetTeams.length > 0 && (
                                <div className="mb-4">
                                    <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-2">Saved Team Presets</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {presetTeams.map(team => (
                                            <Button
                                                key={team.id}
                                                type="button"
                                                onClick={() => {
                                                    const newIds = ['', '', ''];
                                                    const invites = formData.team_mode === 'duo' ? 1 : 3;
                                                    team.members.forEach((m, i) => { if (i < invites) newIds[i] = m; });
                                                    setFormData(prev => ({ ...prev, teammate_ids: newIds }));
                                                }}
                                                variant="outline"
                                                className="flex items-center justify-between p-3 text-left group"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xl">{team.mode === 'duo' ? '👥' : '👨‍👩‍👧‍👦'}</span>
                                                    <div>
                                                        <p className="text-sm font-bold text-gray-900 group-hover:text-blue-700">{team.name}</p>
                                                        <p className="text-[10px] text-gray-500">{team.members.join(', ')}</p>
                                                    </div>
                                                </div>
                                                <span className="text-blue-500 text-[10px] font-bold bg-blue-50 px-2 py-1 rounded-lg border border-blue-100">Use</span>
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {Array.from({ length: formData.team_mode === 'duo' ? 1 : 3 }).map((_, i) => (
                                    <div key={i}>
                                        <label className="text-xs font-semibold text-blue-600 uppercase">Teammate {i + 1} Game ID</label>
                                        <input
                                            type="text"
                                            value={formData.teammate_ids[i]}
                                            onChange={(e) => handleTeammateIdChange(i, e.target.value)}
                                            placeholder="Enter Game ID"
                                            className="mt-1 block w-full border border-blue-200 rounded-lg px-4 py-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                ))}
                            </div>

                            {savedTeammates.length > 0 && (
                                <div className="pt-2">
                                    <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-2">Recent Teammates</p>
                                    <div className="flex flex-wrap gap-2">
                                        {savedTeammates.filter(id => !formData.teammate_ids.includes(id)).map(id => (
                                            <Button
                                                key={id}
                                                type="button"
                                                onClick={() => selectSavedTeammate(id)}
                                                variant="outline"
                                                size="sm"
                                                className="text-xs"
                                            >
                                                + {id}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="border-t border-gray-200 pt-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">🏆 Winner Prize Distribution</h3>
                        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-xl p-5 shadow-sm">
                            <label className="text-sm font-semibold text-gray-700 mb-2 block">Base Winner Prize (₹)</label>
                            <input
                                type="number"
                                value={formData.prize_distributions[0].prize}
                                onChange={(e) => handlePrizeChange(0, 'prize', e.target.value)}
                                min="0"
                                className="w-full border border-yellow-300 rounded-lg px-4 py-3 text-lg font-bold text-gray-900 focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                                placeholder="Enter winner prize amount"
                            />

                            {/* Prize Calculation Display */}
                            <div className="mt-4 bg-white border-2 border-yellow-400 rounded-lg p-4">
                                <p className="text-sm font-semibold text-gray-700 mb-2">💰 Total Winner Payout:</p>
                                <div className="space-y-1 text-sm text-gray-600">
                                    <div className="flex justify-between">
                                        <span>Winner Prize:</span>
                                        <span className="font-semibold">₹{formData.prize_distributions[0].prize || 0}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Opponent's Entry Fee:</span>
                                        <span className="font-semibold">₹{formData.entry_fee}</span>
                                    </div>
                                    <div className="border-t border-yellow-300 pt-2 mt-2 flex justify-between text-lg font-bold text-green-600">
                                        <span>Total Payout:</span>
                                        <span>₹{(parseInt(formData.prize_distributions[0].prize) || 0) + (parseInt(formData.entry_fee) || 0)}</span>
                                    </div>
                                </div>
                            </div>

                            <p className="text-xs text-gray-600 mt-3 flex items-start gap-1">
                                <span>💡</span>
                                <span>The winner receives the winner prize + opponent's entry fee!</span>
                            </p>
                        </div>
                    </div>

                    <div className="pt-6">
                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full text-lg"
                        >
                            {loading ? 'Creating...' : '🚀 Create Tournament'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
