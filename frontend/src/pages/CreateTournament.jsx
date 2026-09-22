import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { hostPartnerService, tournamentService } from '../services/api';
import { Button } from '../components/ui/button';
import { getGameTheme } from '../config/gameThemes';

const getTeamSize = (mode) => {
    if (mode === 'solo') return 1;
    if (mode === 'duo') return 2;
    return 4;
};

const getRoomPlayerCount = (mode) => {
    if (mode === 'solo') return 2;
    if (mode === 'duo') return 4;
    return 8;
};

const getCreationFee = (type) => (type === 'br' ? 50 : 0);

const getDefaultStartTime = () => {
    const date = new Date(Date.now() + 60 * 60 * 1000);
    const offset = date.getTimezoneOffset();
    return new Date(date.getTime() - offset * 60 * 1000).toISOString().slice(0, 16);
};

const getHostRequestText = (status, requesting) => {
    if (requesting) return 'Submitting...';
    if (status === 'pending') return 'Request Pending';
    return 'Submit Request';
};

const GAME_OPTIONS = [
    { value: 'bgmi', label: 'BGMI', icon: '🎯', tone: 'from-emerald-50 to-lime-50' },
    { value: 'freefire', label: 'Free Fire', icon: '🔥', tone: 'from-orange-50 to-amber-50' },
    { value: 'fifa', label: 'FIFA', icon: '⚽', tone: 'from-sky-50 to-blue-50' },
];

const FORMAT_OPTIONS = [
    { value: 'solo', label: 'Solo', detail: '1 vs 1', icon: '👤', popular: true },
    { value: 'duo', label: 'Duo', detail: '2 vs 2', icon: '👥' },
    { value: 'squad', label: 'Squad', detail: '4 vs 4', icon: '🛡️' },
];

export default function CreateTournament() {
    const navigate = useNavigate();
    const location = useLocation();
    const [loading, setLoading] = useState(false);
    const [requestingAccess, setRequestingAccess] = useState(false);
    const [hostRequestStatus, setHostRequestStatus] = useState(null);
    const [hostRequestMessage, setHostRequestMessage] = useState('');
    const [timeSlots, setTimeSlots] = useState([]);
    const [timeSlotsLoading, setTimeSlotsLoading] = useState(true);
    const [showAllTimeSlots, setShowAllTimeSlots] = useState(false);
    const [requestForm, setRequestForm] = useState({
        game: 'bgmi',
        requested_tournament_name: '',
        player_count: 16,
        youtube_link: '',
        instagram_link: '',
        phone_number: '',
        note: ''
    });
    const hostRequestStatusMessage = {
        approved: 'Your host-partner request is approved, so you can create BR events.',
        pending: 'Your host-partner request is pending admin approval.',
    }[hostRequestStatus] || 'Only approved host-partner accounts can create BR / long tournaments. Submit a request first.';
    const [formData, setFormData] = useState({
        name: '',
        game: 'bgmi',
        tournament_type: 'one_vs_one',
        entry_fee: 10,
        team_mode: 'solo',
        max_participants: 2,
        custom_player_count: 0,
        start_time: '',
        time_slot_id: '',
        prize_distributions: [
            { rank_from: 1, rank_to: 1, prize: 0 }
        ]
    });
    const theme = getGameTheme(formData.game);
    const ThemeIcon = theme.icon;
    const isReadyToCreate = Boolean(
        formData.name.trim()
        && formData.game
        && formData.entry_fee !== ''
        && formData.team_mode
        && (formData.tournament_type === 'br' || formData.time_slot_id)
    );
    const completedFields = [
        formData.name.trim(),
        formData.game,
        formData.entry_fee !== '',
        formData.team_mode,
        formData.tournament_type === 'br' || formData.time_slot_id,
    ].filter(Boolean).length;

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
            } catch {
                setHostRequestStatus('not_requested');
            }
        };

        loadHostStatus();
        setTimeSlotsLoading(true);
        tournamentService.getAvailableTimeSlots()
            .then(setTimeSlots)
            .catch((error) => console.error('Failed to load available start times:', error))
            .finally(() => setTimeSlotsLoading(false));
    }, [location.search]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const orderedTimeSlots = [...timeSlots].sort(
        (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    );
    const visibleTimeSlots = showAllTimeSlots ? orderedTimeSlots : orderedTimeSlots.slice(0, 4);

    const handlePrizeChange = (index, field, value) => {
        setFormData(prev => ({
            ...prev,
            prize_distributions: prev.prize_distributions.map((prize, prizeIndex) =>
                prizeIndex === index ? { ...prize, [field]: value } : prize
            ),
        }));
    };

    const addPrizeRange = () => {
        setFormData(prev => ({
            ...prev,
            prize_distributions: [
                ...prev.prize_distributions,
                { rank_from: prev.prize_distributions.length + 1, rank_to: prev.prize_distributions.length + 1, prize: 0 }
            ]
        }));
    };

    const removePrizeRange = (index) => {
        setFormData(prev => ({
            ...prev,
            prize_distributions: prev.prize_distributions.filter((_, prizeIndex) => prizeIndex !== index)
        }));
    };

    const handleHostRequest = async () => {
        if (!requestForm.requested_tournament_name || !requestForm.game || !requestForm.youtube_link || !requestForm.instagram_link) {
            alert('Please enter tournament name, YouTube link, and Instagram link');
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
                    const distributions = formData.tournament_type === 'one_vs_one'
                        ? []
                        : formData.prize_distributions.flatMap((range) => {
                        const from = Math.max(1, Number(range.rank_from) || 1);
                        const to = Math.max(from, Number(range.rank_to) || from);
                        return Array.from({ length: to - from + 1 }, (_, index) => ({
                            rank: from + index,
                            prize: Number(range.prize) || 0
                        }));
                        });
            const payload = {
                ...formData,
                tournament_type: formData.tournament_type,
                time_slot_id: formData.tournament_type === 'one_vs_one' ? formData.time_slot_id : undefined,
                custom_player_count: formData.tournament_type === 'br' ? Number(formData.custom_player_count || 0) : 0,
                prize_distributions: distributions,
            };

            const response = await tournamentService.createUserTournament(payload);
            const breakdown = response.breakdown || {};
            const creationFee = breakdown.creation_fee || String(getCreationFee(formData.tournament_type));
            const creatorEntryFee = breakdown.entry_fee || '0';
            alert(`✅ ${response.message}\n\n💰 Total Deducted: ₹${response.fee_deducted}\n- Creation Fee: ₹${creationFee}\n- Prize Pool: ₹${breakdown.prize_pool || '0'}\n- Entry Fee: ₹${creatorEntryFee}`);
            navigate('/');
        } catch (error) {
            console.error('Failed to create tournament:', error);
            alert('❌ Error: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`min-h-screen bg-gradient-to-br ${theme.soft} via-slate-50 to-amber-50/40 py-8 px-4 sm:px-6 lg:px-8`}>
            <div className="mx-auto max-w-4xl overflow-hidden rounded-[1.25rem] border border-slate-200/70 bg-slate-50/90 shadow-2xl shadow-slate-900/10">
                <div className={`relative overflow-hidden bg-gradient-to-r ${theme.gradient} px-8 py-6`}>
                    <ThemeIcon className={`absolute -right-2 -top-5 h-36 w-36 opacity-10 ${theme.headerText}`} aria-hidden="true" />
                    <div className="relative z-10">
                        <h2 className={`text-3xl font-extrabold ${theme.headerText}`}>Create Your Tournament</h2>
                        <p className={`mt-2 italic ${theme.headerMuted}`}>
                        {formData.tournament_type === 'br'
                            ? '₹50 long tournament creation fee plus your prize distribution is deducted from your wallet.'
                            : 'No creation fee. The entry fee is charged when you join your own room, and the winner receives the full two-player pool.'}
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-8">
                    <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 shadow-sm">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Quick setup</p>
                            <p className="mt-1 text-sm font-semibold text-slate-800">{completedFields} of 5 essentials complete</p>
                        </div>
                        <div className="flex gap-1.5" aria-label={`${completedFields} of 5 fields complete`}>
                            {[1, 2, 3, 4, 5].map((step) => (
                                <span key={step} className={`h-2 w-8 rounded-full transition-colors ${step <= completedFields ? 'bg-amber-500' : 'bg-slate-200'}`} />
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <div className="md:col-span-2">
                            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-md shadow-slate-900/5">
                            <div className="mb-3 flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-bold text-slate-900">Tournament type</p>
                                    <p className="text-xs text-slate-500">Choose the experience you want to host</p>
                                </div>
                                <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-800">Step 1</span>
                            </div>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <Button
                                    type="button"
                                    variant={formData.tournament_type === 'one_vs_one' ? 'default' : 'outline'}
                                    className="h-auto justify-start rounded-xl px-4 py-3 text-left transition-all hover:-translate-y-0.5"
                                    onClick={() => setFormData(prev => ({ ...prev, tournament_type: 'one_vs_one', team_mode: 'solo', max_participants: 2, time_slot_id: '' }))}
                                >
                                    <span className="mr-3 text-xl">⚔️</span><span><strong className="block">One vs One</strong><small className="font-normal opacity-75">Fast, head-to-head matches</small></span>
                                </Button>
                                <Button
                                    type="button"
                                    variant={formData.tournament_type === 'br' ? 'default' : 'outline'}
                                    className="h-auto justify-start rounded-xl px-4 py-3 text-left transition-all hover:-translate-y-0.5"
                                    onClick={() => setFormData(prev => ({ ...prev, tournament_type: 'br', team_mode: 'solo', max_participants: 16, custom_player_count: 16, time_slot_id: '' }))}
                                >
                                    <span className="mr-3 text-xl">🏆</span><span><strong className="block">BR / Long Tournament</strong><small className="font-normal opacity-75">Compete for the biggest pool</small></span>
                                </Button>
                            </div>
                            </div>
                            {formData.tournament_type === 'br' && (
                                <div className="mt-3 space-y-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-3 text-sm text-amber-800">
                                    <div>
                                        {hostRequestStatusMessage}
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
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="block text-xs font-semibold uppercase tracking-wide text-amber-700">YouTube Link <span className="text-red-600">*</span></label>
                                                        <input
                                                            type="url"
                                                            required
                                                            value={requestForm.youtube_link}
                                                            onChange={(e) => setRequestForm(prev => ({ ...prev, youtube_link: e.target.value }))}
                                                            placeholder="https://youtube.com/@yourchannel"
                                                            className="mt-1 block w-full border border-amber-300 rounded-lg px-3 py-2"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-semibold uppercase tracking-wide text-amber-700">Instagram Link <span className="text-red-600">*</span></label>
                                                        <input
                                                            type="url"
                                                            required
                                                            value={requestForm.instagram_link}
                                                            onChange={(e) => setRequestForm(prev => ({ ...prev, instagram_link: e.target.value }))}
                                                            placeholder="https://instagram.com/yourprofile"
                                                            className="mt-1 block w-full border border-amber-300 rounded-lg px-3 py-2"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-3">
                                                <label className="block text-xs font-semibold uppercase tracking-wide text-amber-700">Phone Number <span className="font-normal normal-case">(optional)</span></label>
                                                <input
                                                    type="tel"
                                                    value={requestForm.phone_number}
                                                    onChange={(e) => setRequestForm(prev => ({ ...prev, phone_number: e.target.value }))}
                                                    placeholder="Optional contact number"
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
                                                    {getHostRequestText(hostRequestStatus, requestingAccess)}
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

                        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-md shadow-slate-900/5">
                            <label className="flex items-center justify-between text-sm font-bold text-slate-800">
                                Tournament Name
                                {formData.name.trim() && <span className="text-xs font-semibold text-emerald-600">✓ Complete</span>}
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                className="mt-2 block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-amber-400 focus:bg-white focus:ring-4 focus:ring-amber-100"
                                placeholder="Global BGMI Championship"
                            />
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-md shadow-slate-900/5 md:col-span-2">
                            <div className="mb-3 flex items-center justify-between">
                                <label className="text-sm font-bold text-slate-800">Select Game</label>
                                <span className="text-xs font-semibold text-emerald-600">✓ {formData.game.toUpperCase()} selected</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 sm:gap-3">
                                {GAME_OPTIONS.map((game) => (
                                    <button
                                        key={game.value}
                                        type="button"
                                        onClick={() => handleChange({ target: { name: 'game', value: game.value } })}
                                        className={`rounded-xl border p-3 text-center transition-all hover:-translate-y-0.5 hover:shadow-md ${formData.game === game.value ? `border-amber-400 bg-gradient-to-br ${game.tone} shadow-md ring-2 ring-amber-200` : 'border-slate-200 bg-slate-50/70 hover:border-amber-200'}`}
                                    >
                                        <span className="block text-2xl">{game.icon}</span>
                                        <span className="mt-1 block text-xs font-bold text-slate-700 sm:text-sm">{game.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-md shadow-slate-900/5">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-bold text-slate-800">Entry Fee</label>
                                <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-800">Suggested</span>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                                {[10, 50, 100, 500].map((fee) => (
                                    <button
                                        key={fee}
                                        type="button"
                                        onClick={() => handleChange({ target: { name: 'entry_fee', value: fee } })}
                                        className={`rounded-full border px-3 py-1.5 text-xs font-bold transition-all hover:-translate-y-0.5 ${Number(formData.entry_fee) === fee ? 'border-amber-400 bg-amber-100 text-amber-900 shadow-sm' : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-amber-300'}`}
                                    >
                                        ₹{fee}
                                    </button>
                                ))}
                            </div>
                            <input
                                type="number"
                                name="entry_fee"
                                value={formData.entry_fee}
                                onChange={handleChange}
                                min="0"
                                className="mt-3 block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition-all focus:border-amber-400 focus:bg-white focus:ring-4 focus:ring-amber-100"
                            />
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-md shadow-slate-900/5 md:col-span-2">
                            <div className="mb-3 flex items-center justify-between">
                                <div>
                                    <label className="text-sm font-bold text-slate-800">Tournament Format</label>
                                    <p className="mt-1 text-xs text-slate-500">Your room format sets the player count automatically</p>
                                </div>
                                {formData.team_mode === 'solo' && <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-800">Most Popular</span>}
                            </div>
                            <div className="grid grid-cols-3 gap-2 sm:gap-3">
                                {FORMAT_OPTIONS.map((format) => {
                                    const disabled = formData.tournament_type === 'one_vs_one' && format.value !== 'solo';
                                    return (
                                        <button
                                            key={format.value}
                                            type="button"
                                            disabled={disabled}
                                            onClick={() => {
                                                const mode = format.value;
                                                const maxPlayers = getRoomPlayerCount(mode);
                                                const brPlayerCount = 16;
                                                setFormData(prev => ({
                                                    ...prev,
                                                    team_mode: mode,
                                                    custom_player_count: formData.tournament_type === 'br' ? Math.max(brPlayerCount, prev.custom_player_count || brPlayerCount) : prev.custom_player_count,
                                                    max_participants: formData.tournament_type === 'br' ? Math.max(brPlayerCount, prev.custom_player_count || brPlayerCount) : maxPlayers
                                                }));
                                            }}
                                            className={`relative rounded-xl border p-3 text-left transition-all ${disabled ? 'cursor-not-allowed border-slate-100 bg-slate-100/70 opacity-45' : 'hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-md'} ${formData.team_mode === format.value ? 'border-amber-400 bg-amber-50 shadow-md ring-2 ring-amber-100' : 'border-slate-200 bg-slate-50/70'}`}
                                        >
                                            <span className="text-xl">{format.icon}</span>
                                            <span className="mt-1 block text-xs font-bold text-slate-800 sm:text-sm">{format.label}</span>
                                            <span className="block text-[10px] text-slate-500 sm:text-xs">{format.detail}</span>
                                            {format.popular && formData.team_mode === format.value && <span className="absolute right-2 top-2 text-xs text-emerald-600">✓</span>}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-md shadow-slate-900/5">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-bold text-slate-800">Players Count</label>
                                <span className="text-xs font-semibold text-emerald-600">✓ Format matched</span>
                            </div>
                            {formData.tournament_type === 'br' ? (
                                <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                                    <button type="button" onClick={() => setFormData(prev => ({ ...prev, custom_player_count: Math.max(getTeamSize(prev.team_mode), prev.custom_player_count - getTeamSize(prev.team_mode)), max_participants: Math.max(getTeamSize(prev.team_mode), prev.custom_player_count - getTeamSize(prev.team_mode)) }))} className="h-9 w-9 rounded-lg bg-white text-xl font-bold text-slate-700 shadow-sm transition hover:bg-amber-100">−</button>
                                    <div className="text-center">
                                        <p className="text-lg font-extrabold text-slate-900">{formData.custom_player_count} players</p>
                                        <p className="text-xs text-slate-500">{FORMAT_OPTIONS.find((format) => format.value === formData.team_mode)?.label} format</p>
                                    </div>
                                    <button type="button" onClick={() => setFormData(prev => ({ ...prev, custom_player_count: prev.custom_player_count + getTeamSize(prev.team_mode), max_participants: prev.custom_player_count + getTeamSize(prev.team_mode) }))} className="h-9 w-9 rounded-lg bg-white text-xl font-bold text-slate-700 shadow-sm transition hover:bg-amber-100">+</button>
                                </div>
                            ) : (
                                <div className="mt-3 flex items-center justify-between rounded-xl bg-amber-50 px-4 py-3">
                                    <span className="text-lg font-extrabold text-slate-900">{getRoomPlayerCount(formData.team_mode)} players</span>
                                    <span className="text-xs font-semibold text-amber-800">{FORMAT_OPTIONS.find((format) => format.value === formData.team_mode)?.label} format</span>
                                </div>
                            )}
                        </div>

                        {formData.tournament_type === 'one_vs_one' && (
                            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-md shadow-slate-900/5 md:col-span-2">
                                <div className="mb-3 flex items-center justify-between">
                                    <div>
                                        <label className="text-sm font-bold text-slate-800">Choose Start Time</label>
                                        <p className="mt-1 text-xs text-slate-500">Pick a time approved by the admin</p>
                                    </div>
                                    {formData.time_slot_id && <span className="text-xs font-semibold text-emerald-600">✓ Time selected</span>}
                                </div>
                                <input
                                    name="time_slot_id"
                                    value={formData.time_slot_id}
                                    onChange={handleChange}
                                    required
                                    tabIndex="-1"
                                    aria-hidden="true"
                                    className="sr-only"
                                    readOnly
                                />
                                {timeSlotsLoading ? (
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        {[1, 2].map((placeholder) => (
                                            <div key={placeholder} className="h-20 animate-pulse rounded-xl border border-slate-200 bg-slate-100" />
                                        ))}
                                    </div>
                                ) : timeSlots.length > 0 ? (
                                    <>
                                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                            {visibleTimeSlots.map((slot, index) => {
                                                const selected = String(formData.time_slot_id) === String(slot.id);
                                                return (
                                                    <button
                                                        key={slot.id}
                                                        type="button"
                                                        onClick={() => setFormData(prev => ({ ...prev, time_slot_id: String(slot.id) }))}
                                                        className={`relative rounded-xl border p-3 text-left transition-all hover:-translate-y-0.5 hover:shadow-md ${selected ? 'border-amber-400 bg-amber-100 text-amber-950 shadow-md ring-2 ring-amber-200' : 'border-slate-200 bg-slate-50/70 text-slate-700 hover:border-amber-300'}`}
                                                    >
                                                        {index === 0 && (
                                                            <span className="absolute right-2 top-2 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                                                                {selected ? 'Selected' : 'Next Available'}
                                                            </span>
                                                        )}
                                                        <span className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Match slot</span>
                                                        <span className="mt-1 block pr-20 text-sm font-bold">
                                                            {new Date(slot.start_time).toLocaleString('en-IN', {
                                                                timeZone: 'Asia/Kolkata',
                                                                dateStyle: 'medium',
                                                                timeStyle: 'short',
                                                            })}
                                                        </span>
                                                        {selected && <span className="mt-1 block text-xs font-semibold text-amber-800">✓ Ready to book</span>}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        {orderedTimeSlots.length > 4 && (
                                            <button
                                                type="button"
                                                onClick={() => setShowAllTimeSlots((current) => !current)}
                                                className="mt-3 text-sm font-bold text-amber-700 underline decoration-amber-300 underline-offset-4 transition hover:text-amber-900"
                                            >
                                                {showAllTimeSlots ? 'Show fewer times' : `View all ${orderedTimeSlots.length} times`}
                                            </button>
                                        )}
                                    </>
                                ) : (
                                    <div className="mt-3 flex items-center gap-3 rounded-xl border border-amber-100 bg-amber-50/70 p-3 text-sm text-slate-600">
                                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-xl shadow-sm" aria-hidden="true">🗓️</span>
                                        <span><strong className="block text-slate-800">No times available yet</strong><span className="text-xs">An admin will add an approved start time soon. Check back in a moment.</span></span>
                                    </div>
                                )}
                            </div>
                        )}

                    </div>

                    {formData.tournament_type === 'br' && (
                    <div className="border-t border-gray-200 pt-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">🏆 Set Prize Distribution</h3>
                        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-xl p-5 shadow-sm">
                            <div className="space-y-3">
                                {formData.prize_distributions.map((range, index) => (
                                    <div key={index} className="grid grid-cols-[1fr_1fr_1.5fr_auto] items-end gap-2">
                                        <label className="text-xs font-semibold text-gray-700">
                                            From rank
                                            <input type="number" min="1" value={range.rank_from} onChange={(e) => handlePrizeChange(index, 'rank_from', e.target.value)} className="mt-1 w-full rounded-lg border border-yellow-300 px-3 py-2" />
                                        </label>
                                        <label className="text-xs font-semibold text-gray-700">
                                            To rank
                                            <input type="number" min="1" value={range.rank_to} onChange={(e) => handlePrizeChange(index, 'rank_to', e.target.value)} className="mt-1 w-full rounded-lg border border-yellow-300 px-3 py-2" />
                                        </label>
                                        <label className="text-xs font-semibold text-gray-700">
                                            Prize per rank (₹)
                                            <input type="number" min="0" value={range.prize} onChange={(e) => handlePrizeChange(index, 'prize', e.target.value)} className="mt-1 w-full rounded-lg border border-yellow-300 px-3 py-2 font-bold" />
                                        </label>
                                        <Button type="button" variant="outline" size="sm" onClick={() => removePrizeRange(index)} disabled={formData.prize_distributions.length === 1}>Remove</Button>
                                    </div>
                                ))}
                                <Button type="button" variant="outline" size="sm" onClick={addPrizeRange}>+ Add rank range</Button>
                            </div>

                            <div className="mt-4 bg-white border-2 border-yellow-400 rounded-lg p-4">
                                <p className="text-sm font-semibold text-gray-700 mb-2">💰 Total amount needed in your account:</p>
                                <div className="space-y-1 text-sm text-gray-600">
                                    <div className="flex justify-between">
                                        <span>Tournament creation fee:</span>
                                        <span className="font-semibold">₹{getCreationFee(formData.tournament_type)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Prize distribution:</span>
                                        <span className="font-semibold">₹{formData.prize_distributions.reduce((total, range) => total + ((Math.max(1, Number(range.rank_to) || 1) - Math.max(1, Number(range.rank_from) || 1) + 1) * (parseFloat(range.prize) || 0)), 0)}</span>
                                    </div>
                                    <div className="border-t border-yellow-300 pt-2 mt-2 flex justify-between text-lg font-bold text-green-600">
                                        <span>Total required:</span>
                                        <span>₹{getCreationFee(formData.tournament_type) + formData.prize_distributions.reduce((total, range) => total + ((Math.max(1, Number(range.rank_to) || 1) - Math.max(1, Number(range.rank_from) || 1) + 1) * (parseFloat(range.prize) || 0)), 0)}</span>
                                    </div>
                                </div>
                            </div>

                            <p className="text-xs text-gray-600 mt-3 flex items-start gap-1">
                                <span>💡</span>
                                <span>This amount is deducted from your wallet when the tournament is created.</span>
                            </p>
                        </div>
                    </div>
                    )}

                    <div className="pt-6">
                        <Button
                            type="submit"
                            disabled={loading}
                            className={`w-full rounded-xl text-lg transition-all ${isReadyToCreate && !loading ? 'animate-pulse shadow-lg shadow-amber-400/30 ring-2 ring-amber-200 ring-offset-2' : ''}`}
                        >
                            {loading ? 'Creating...' : '🚀 Create Tournament'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
