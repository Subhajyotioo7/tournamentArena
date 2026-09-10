import { useState, useEffect } from 'react';
import { adminService, tournamentService, roomService } from '../services/api'; // Consolidated imports
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
export default function AdminDashboard() {
    const { user, loading: authLoading } = useAuth();
    const isAdmin = user?.is_staff || user?.is_superuser;
    const [pendingPayouts, setPendingPayouts] = useState([]);
    const [tournaments, setTournaments] = useState([]);
    const [withdrawals, setWithdrawals] = useState([]);
    const [verifications, setVerifications] = useState([]);
    const [deposits, setDeposits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState({});

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        game: 'bgmi',
        entry_fee: '',
        team_mode: 'solo',
        registration_deadline: '',
        start_time: '',
        max_participants: 100
    });

    const [showPrizeModal, setShowPrizeModal] = useState(false);
    const [selectedTournamentId, setSelectedTournamentId] = useState(null);
    const [prizeDistributions, setPrizeDistributions] = useState([]);

    useEffect(() => {
        if (!authLoading && isAdmin) {
            fetchData();
        }
    }, [authLoading, isAdmin]);

    const fetchData = async () => {
        try {
            const [payoutsData, tournamentsData, withdrawalsData, verificationsData, depositsData] = await Promise.all([
                adminService.getPendingPayouts(),
                tournamentService.getAll(),
                adminService.getWithdrawals(),
                adminService.getPendingVerifications(),
                adminService.getPendingDeposits()
            ]);
            setPendingPayouts(Array.isArray(payoutsData) ? payoutsData : (payoutsData.pending_payouts || []));
            setTournaments(tournamentsData || []);
            setWithdrawals(withdrawalsData || []);
            setVerifications(verificationsData || []);
            setDeposits(depositsData || []);
        } catch (error) {
            console.error('Failed to fetch admin data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (authLoading) {
        return <div className="p-8 text-center">Loading...</div>;
    }

    if (!isAdmin) {
        return (
            <div className="p-8 text-center">
                <h1 className="text-2xl font-bold mb-3">Admin access required</h1>
                <p className="mb-5">Your account does not have permission to view this page.</p>
                <Link to="/" className="text-blue-600 hover:underline">Return home</Link>
            </div>
        );
    }

    const handleVerifyDeposit = async (depositId, action) => {
        let note = '';
        if (action === 'reject') {
            note = prompt('Enter rejection reason:');
            if (note === null) return;
        }

        try {
            await adminService.verifyDeposit(depositId, action, note);
            alert(`✅ Deposit ${action}ed!`);
            fetchData();
        } catch (error) {
            alert('❌ Verification failed: ' + error.message);
        }
    };

    const handleCreateTournament = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await tournamentService.create(formData);
            alert('✅ Tournament Created Successfully!');
            setShowCreateModal(false);
            setFormData({
                name: '',
                game: 'bgmi',
                entry_fee: '',
                team_mode: 'solo',
                registration_deadline: '',
                start_time: '',
                max_participants: 100
            });
            fetchData(); // Refresh list
        } catch (error) {
            alert('❌ Failed to create tournament: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenPrizeModal = async (tournamentId) => {
        setSelectedTournamentId(tournamentId);
        try {
            const data = await tournamentService.getPrizeDistribution(tournamentId);
            if (data && data.length > 0) {
                setPrizeDistributions(data);
            } else {
                // Default template
                setPrizeDistributions([
                    { rank: 1, prize_amount: 500 },
                    { rank: 2, prize_amount: 300 },
                    { rank: 3, prize_amount: 200 }
                ]);
            }
            setShowPrizeModal(true);
        } catch (error) {
            console.error("Failed to fetch prizes:", error);
            // Default fallback
            setPrizeDistributions([
                { rank: 1, prize_amount: 500 },
                { rank: 2, prize_amount: 300 },
                { rank: 3, prize_amount: 200 }
            ]);
            setShowPrizeModal(true);
        }
    };

    const handleSavePrizes = async () => {
        // No total percentage check needed for fixed amounts
        const total = prizeDistributions.reduce((sum, d) => sum + (parseFloat(d.prize_amount) || 0), 0);

        try {
            await tournamentService.setPrizeDistribution(selectedTournamentId, prizeDistributions);
            alert(`✅ Prize Distribution Saved! Total Pool: ₹${total} `);
            setShowPrizeModal(false);
        } catch (error) {
            alert('❌ Failed to save prizes: ' + error.message);
        }
    };

    const handleApprovePayouts = async (roomId) => {
        setProcessing({ ...processing, [roomId]: true });
        try {
            const response = await roomService.approvePayouts(roomId);
            alert(response.message);
            fetchData();
        } catch (error) {
            alert('Failed to approve payouts: ' + error.message);
        } finally {
            setProcessing({ ...processing, [roomId]: false });
        }
    };

    const handleApproveWithdrawal = async (withdrawalId) => {
        if (!confirm('Are you sure you want to approve this withdrawal? This will deduct the amount from user balance.')) return;

        try {
            await adminService.approveWithdrawal(withdrawalId);
            alert('✅ Withdrawal approved successfully!');
            fetchData();
        } catch (error) {
            alert('❌ Failed to approve withdrawal: ' + error.message);
        }
    };

    const handleRejectWithdrawal = async (withdrawalId) => {
        const adminNote = prompt('Enter rejection reason (optional):');
        if (adminNote === null) return; // User cancelled

        try {
            await adminService.rejectWithdrawal(withdrawalId, adminNote);
            alert('✅ Withdrawal rejected successfully!');
            fetchData();
        } catch (error) {
            alert('❌ Failed to reject withdrawal: ' + error.message);
        }
    };

    const handleVerifySection = async (profileId, section, action) => {
        let reason = '';
        if (action === 'reject') {
            reason = prompt(`Enter rejection reason for ${section.toUpperCase()}:`);
            if (reason === null) return;
        }

        try {
            await adminService.verifyProfileSection(profileId, section, action, reason);
            alert(`✅ ${section.toUpperCase()} marked as ${action}ed`);
            fetchData();
        } catch (error) {
            alert('❌ Verification failed: ' + error.message);
        }
    };

    // Group payouts by room
    const payoutsByRoom = pendingPayouts.reduce((acc, payout) => {
        const roomId = payout.room;
        if (!acc[roomId]) {
            acc[roomId] = [];
        }
        acc[roomId].push(payout);
        return acc;
    }, {});

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <h1 className="text-4xl font-extrabold mb-2">🛠️ Admin Dashboard</h1>
                    <p className="text-indigo-100">Manage tournament payouts and results</p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm font-medium">Pending Payouts</p>
                                <p className="text-3xl font-bold text-gray-900 mt-1">{pendingPayouts.length}</p>
                            </div>
                            <div className="bg-yellow-100 p-3 rounded-full">
                                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm font-medium">Total Rooms</p>
                                <p className="text-3xl font-bold text-gray-900 mt-1">{Object.keys(payoutsByRoom).length}</p>
                            </div>
                            <div className="bg-blue-100 p-3 rounded-full">
                                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm font-medium">Pending Verifications</p>
                                <p className="text-3xl font-bold text-gray-900 mt-1">{verifications.length}</p>
                            </div>
                            <div className="bg-purple-100 p-3 rounded-full">
                                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tournament Registrations */}
                <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">Tournament Registrations</h2>
                        <Button
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center gap-2"
                        >
                            <span>➕</span> Create Tournament
                        </Button>
                    </div>

                    {loading ? (
                        <div className="text-center py-12">
                            <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-gray-600">Loading tournaments...</p>
                        </div>
                    ) : tournaments.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tournament</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Game</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mode</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registered</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {tournaments.map((t) => {
                                        // Check if tournament is new (created within last 24 hours)
                                        const isNew = t.created_at && (Date.now() - new Date(t.created_at).getTime()) < 24 * 60 * 60 * 1000;

                                        return (
                                            <tr key={t.id} className={isNew ? 'bg-gradient-to-r from-yellow-50 to-orange-50' : ''}>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        <div className="text-sm font-medium text-gray-900">{t.name}</div>
                                                        {isNew && (
                                                            <span className="bg-orange-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full animate-pulse shadow-sm">
                                                                ✨ NEW
                                                            </span>
                                                        )}
                                                        {t.created_by && (
                                                            <span className={`${t.created_by_is_staff ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-blue-100 text-blue-700 border-blue-200'} text-[9px] font-bold px-2 py-0.5 rounded-full border shadow-sm`}>
                                                                {t.created_by_is_staff ? 'ADMIN' : 'USER'}: {t.created_by_username || 'Unknown'}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800 uppercase">
                                                        {t.game}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                                                    {t.team_mode}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900 font-bold">{t.total_participants || 0} Players</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-bold">
                                                    ₹{(t.total_participants || 0) * parseFloat(t.entry_fee)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <Button
                                                        onClick={() => handleOpenPrizeModal(t.id)}
                                                        variant="outline"
                                                        size="sm"
                                                    >
                                                        🏆 Set Prizes
                                                    </Button>
                                                    <Link
                                                        to={`/admin/tournament/${t.id}/participants`}
                                                        className="inline-flex items-center text-blue-600 hover:text-blue-900 font-semibold text-sm bg-blue-50 px-3 py-1 rounded-full hover:bg-blue-100 transition-colors ml-2"
                                                    >
                                                        👥 Players
                                                    </Link>
                                                </td >
                                            </tr >
                                        );
                                    })}
                                </tbody >
                            </table >
                        </div >
                    ) : (
                        <div className="text-center py-12 text-gray-500">
                            <div className="text-6xl mb-4">📊</div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">No Tournaments Found</h3>
                            <p>There are no tournaments to display at the moment.</p>
                        </div>
                    )}
                </div >

                {/* Pending Payouts */}
                < div className="bg-white rounded-xl shadow-lg p-6" >
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Pending Payouts</h2>

                    {
                        loading ? (
                            <div className="text-center py-12">
                                <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                <p className="text-gray-600">Loading payouts...</p>
                            </div>
                        ) : Object.keys(payoutsByRoom).length > 0 ? (
                            <div className="space-y-6">
                                {Object.entries(payoutsByRoom).map(([roomId, payouts]) => (
                                    <div key={roomId} className="border-2 border-gray-200 rounded-lg p-6 hover:border-purple-300 transition-all">
                                        <div className="flex items-center justify-between mb-4">
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-900">Room #{roomId.slice(0, 8)}</h3>
                                                <p className="text-sm text-gray-500">{payouts.length} winners</p>
                                            </div>
                                            <Button
                                                onClick={() => handleApprovePayouts(roomId)}
                                                disabled={processing[roomId]}
                                                variant="default"
                                            >
                                                {processing[roomId] ? 'Processing...' : 'Approve All'}
                                            </Button>
                                        </div>

                                        <div className="space-y-3">
                                            {payouts.map((payout) => (
                                                <div key={payout.id} className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <div className="text-2xl">
                                                            {payout.rank === 1 ? '🥇' : payout.rank === 2 ? '🥈' : payout.rank === 3 ? '🥉' : '🏅'}
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-gray-900">{payout.participant_username}</p>
                                                            <p className="text-sm text-gray-500">Rank #{payout.rank}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-2xl font-bold text-green-600">₹{parseFloat(payout.prize_amount).toFixed(2)}</p>
                                                        <p className="text-xs text-gray-500">{payout.payout_status}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-gray-500">
                                <div className="text-6xl mb-4">✅</div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">All Caught Up!</h3>
                                <p>No pending payouts at the moment.</p>
                            </div>
                        )
                    }
                </div >

                {/* Withdrawal Requests */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Withdrawal Requests</h2>

                    {loading ? (
                        <div className="text-center py-12">
                            <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-gray-600">Loading withdrawals...</p>
                        </div>
                    ) : withdrawals.length > 0 ? (
                        <div className="space-y-4">
                            {withdrawals.map((withdrawal) => (
                                <div key={withdrawal.id} className="border-2 border-gray-200 rounded-lg p-6 hover:border-purple-300 transition-all">
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900">{withdrawal.username || 'User'}</h3>
                                            <p className="text-sm text-gray-500">Requested: {new Date(withdrawal.requested_at).toLocaleDateString()}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl font-bold text-green-600">₹{parseFloat(withdrawal.amount).toFixed(2)}</p>
                                            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${withdrawal.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                withdrawal.status === 'approved' ? 'bg-green-100 text-green-800' :
                                                    withdrawal.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                                        'bg-blue-100 text-blue-800'
                                                }`}>
                                                {withdrawal.status.charAt(0).toUpperCase() + withdrawal.status.slice(1)}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        {withdrawal.upi_id && (
                                            <p className="text-sm text-gray-600"><strong>UPI ID:</strong> {withdrawal.upi_id}</p>
                                        )}
                                        {withdrawal.bank_details && (
                                            <p className="text-sm text-gray-600"><strong>Bank Details:</strong> {withdrawal.bank_details}</p>
                                        )}
                                    </div>

                                    {withdrawal.status === 'pending' && (
                                        <div className="flex gap-3">
                                            <Button
                                                onClick={() => handleApproveWithdrawal(withdrawal.id)}
                                                variant="default"
                                            >
                                                Approve
                                            </Button>
                                            <Button
                                                onClick={() => handleRejectWithdrawal(withdrawal.id)}
                                                variant="destructive"
                                            >
                                                Reject
                                            </Button>
                                        </div>
                                    )}

                                    {withdrawal.admin_note && (
                                        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                                            <p className="text-sm text-gray-700"><strong>Admin Note:</strong> {withdrawal.admin_note}</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-gray-500">
                            <div className="text-6xl mb-4">💰</div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">No Withdrawal Requests</h3>
                            <p>All withdrawal requests have been processed.</p>
                        </div>
                    )}
                </div>
                {/* Deposit Requests */}
                <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Money Deposit Requests</h2>

                    {loading ? (
                        <p className="text-gray-500">Loading deposits...</p>
                    ) : deposits.length > 0 ? (
                        <div className="space-y-4">
                            {deposits.map((dep) => (
                                <div key={dep.id} className="border-2 border-emerald-100 rounded-2xl p-6 bg-emerald-50/10 hover:border-emerald-200 transition-all">
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <h3 className="text-lg font-black text-gray-900">{dep.username}</h3>
                                            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">UTR: {dep.utr_number}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl font-black text-emerald-600">₹{parseFloat(dep.amount).toFixed(2)}</p>
                                            <p className="text-[10px] text-gray-400 font-bold">{new Date(dep.created_at).toLocaleString()}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <Button
                                            onClick={() => handleVerifyDeposit(dep.id, 'approve')}
                                            className="flex-1"
                                        >
                                            Approve & Credit
                                        </Button>
                                        <Button
                                            onClick={() => handleVerifyDeposit(dep.id, 'reject')}
                                            variant="destructive"
                                            className="flex-1"
                                        >
                                            Reject
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-gray-400">
                            <span className="text-5xl block mb-2">📥</span>
                            <p className="font-bold">No pending deposits</p>
                        </div>
                    )}
                </div>

                {/* Pending Verifications */}
                <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Pending Verifications</h2>
                    {loading ? (
                        <p>Loading...</p>
                    ) : verifications.length > 0 ? (
                        <div className="space-y-6">
                            {verifications.map((prof) => (
                                <div key={prof.username} className="border border-gray-100 rounded-xl p-6 bg-gray-50/30">
                                    <div className="flex justify-between items-start mb-4">
                                        <h3 className="text-lg font-bold text-indigo-700">{prof.username} Profile</h3>
                                        <div className="flex gap-2">
                                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${prof.kyc_status === 'pending' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-400'}`}>KYC</span>
                                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${prof.game_id_status === 'pending' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-400'}`}>Game ID</span>
                                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${prof.payment_details_status === 'pending' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-400'}`}>Payment</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {/* Game Verification */}
                                        <div className={`p-4 rounded-lg border relative ${prof.game_id_status === 'pending'
                                            ? 'bg-gradient-to-br from-purple-50 to-white border-purple-300 shadow-lg ring-2 ring-purple-200'
                                            : prof.game_id_status === 'approved'
                                                ? 'bg-green-50/50 border-green-200'
                                                : 'bg-gray-50 border-gray-200'
                                            }`}>
                                            <div className="flex items-center justify-between mb-3">
                                                <h4 className="font-bold text-sm text-purple-600 uppercase tracking-wide">Game IDs</h4>
                                                {prof.game_id_status === 'pending' && (
                                                    <span className="bg-orange-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full animate-pulse">NEW</span>
                                                )}
                                                {prof.game_id_status === 'approved' && (
                                                    <span className="bg-green-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full">✓ APPROVED</span>
                                                )}
                                                {prof.game_id_status === 'rejected' && (
                                                    <span className="bg-red-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full">✕ REJECTED</span>
                                                )}
                                            </div>
                                            <div className="text-xs space-y-1 mb-4">
                                                <p><strong>BGMI:</strong> {prof.bgmi_id || 'N/A'}</p>
                                                <p><strong>FreeFire:</strong> {prof.freefire_id || 'N/A'}</p>
                                                <p><strong>FIFA:</strong> {prof.fifa_id || 'N/A'}</p>
                                            </div>
                                            {prof.game_id_status === 'pending' && (
                                                <div className="flex gap-2 mt-auto">
                                                    <Button onClick={() => handleVerifySection(prof.player_uuid, 'game_id', 'approve')} size="sm" className="flex-1">Approve</Button>
                                                    <Button onClick={() => handleVerifySection(prof.player_uuid, 'game_id', 'reject')} variant="destructive" size="sm" className="flex-1">Reject</Button>
                                                </div>
                                            )}
                                        </div>

                                        {/* KYC Verification */}
                                        <div className={`p-4 rounded-lg border relative ${prof.kyc_status === 'pending'
                                            ? 'bg-gradient-to-br from-blue-50 to-white border-blue-300 shadow-lg ring-2 ring-blue-200'
                                            : prof.kyc_status === 'approved'
                                                ? 'bg-green-50/50 border-green-200'
                                                : 'bg-gray-50 border-gray-200'
                                            }`}>
                                            <div className="flex items-center justify-between mb-3">
                                                <h4 className="font-bold text-sm text-blue-600 uppercase tracking-wide">KYC Details</h4>
                                                {prof.kyc_status === 'pending' && (
                                                    <span className="bg-orange-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full animate-pulse">NEW</span>
                                                )}
                                                {prof.kyc_status === 'approved' && (
                                                    <span className="bg-green-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full">✓ APPROVED</span>
                                                )}
                                                {prof.kyc_status === 'rejected' && (
                                                    <span className="bg-red-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full">✕ REJECTED</span>
                                                )}
                                            </div>
                                            <div className="text-xs space-y-1 mb-4">
                                                <p><strong>Name:</strong> {prof.kyc_full_name || 'N/A'}</p>
                                                <p><strong>Mobile:</strong> {prof.mobile_number || 'N/A'}</p>
                                                <p><strong>ID:</strong> {prof.kyc_id_type}: {prof.kyc_id_number || 'N/A'}</p>
                                            </div>
                                            {prof.kyc_status === 'pending' && (
                                                <div className="flex gap-2">
                                                    <Button onClick={() => handleVerifySection(prof.player_uuid, 'kyc', 'approve')} size="sm" className="flex-1">Approve</Button>
                                                    <Button onClick={() => handleVerifySection(prof.player_uuid, 'kyc', 'reject')} variant="destructive" size="sm" className="flex-1">Reject</Button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Payment Verification */}
                                        <div className={`p-4 rounded-lg border relative ${prof.payment_details_status === 'pending'
                                            ? 'bg-gradient-to-br from-indigo-50 to-white border-indigo-300 shadow-lg ring-2 ring-indigo-200'
                                            : prof.payment_details_status === 'approved'
                                                ? 'bg-green-50/50 border-green-200'
                                                : 'bg-gray-50 border-gray-200'
                                            }`}>
                                            <div className="flex items-center justify-between mb-3">
                                                <h4 className="font-bold text-sm text-indigo-600 uppercase tracking-wide">Payments</h4>
                                                {prof.payment_details_status === 'pending' && (
                                                    <span className="bg-orange-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full animate-pulse">NEW</span>
                                                )}
                                                {prof.payment_details_status === 'approved' && (
                                                    <span className="bg-green-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full">✓ APPROVED</span>
                                                )}
                                                {prof.payment_details_status === 'rejected' && (
                                                    <span className="bg-red-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full">✕ REJECTED</span>
                                                )}
                                            </div>
                                            <div className="text-xs space-y-1 mb-4">
                                                <p><strong>UPI:</strong> {prof.upi_id || 'N/A'}</p>
                                                <p><strong>Bank:</strong> {prof.bank_name || 'N/A'}</p>
                                                <p><strong>A/C:</strong> {prof.account_number || 'N/A'}</p>
                                                <p><strong>IFSC:</strong> {prof.ifsc_code || 'N/A'}</p>
                                            </div>
                                            {prof.payment_details_status === 'pending' && (
                                                <div className="flex gap-2">
                                                    <Button onClick={() => handleVerifySection(prof.player_uuid, 'payment', 'approve')} size="sm" className="flex-1">Approve</Button>
                                                    <Button onClick={() => handleVerifySection(prof.player_uuid, 'payment', 'reject')} variant="destructive" size="sm" className="flex-1">Reject</Button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center py-8 text-gray-500">No pending verifications</p>
                    )}
                </div>
            </div >

            {/* Create Tournament Modal */}
            {
                showCreateModal && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-purple-50 to-indigo-50">
                                <h3 className="text-xl font-bold text-gray-900">Create New Tournament</h3>
                                <Button
                                    onClick={() => setShowCreateModal(false)}
                                    variant="ghost"
                                    size="icon"
                                >
                                    ✕
                                </Button>
                            </div>

                            <div className="p-6">
                                <form onSubmit={handleCreateTournament} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-gray-700">Tournament Name</label>
                                            <input
                                                type="text"
                                                required
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                placeholder="e.g. Weekend Warrior Cup"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-gray-700">Select Game</label>
                                            <select
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                                                value={formData.game}
                                                onChange={(e) => setFormData({ ...formData, game: e.target.value })}
                                            >
                                                <option value="bgmi">BGMI Mobile</option>
                                                <option value="freefire">Free Fire Max</option>
                                                <option value="fifa">FIFA 24</option>
                                            </select>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-gray-700">Team Mode</label>
                                            <select
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                                                value={formData.team_mode}
                                                onChange={(e) => setFormData({ ...formData, team_mode: e.target.value })}
                                            >
                                                <option value="solo">Solo (1 vs 1)</option>
                                                <option value="duo">Duo (2 vs 2)</option>
                                                <option value="squad">Squad (4 vs 4)</option>
                                            </select>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-gray-700">Entry Fee (₹)</label>
                                            <input
                                                type="number"
                                                required
                                                min="0"
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                                                value={formData.entry_fee}
                                                onChange={(e) => setFormData({ ...formData, entry_fee: e.target.value })}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-gray-700">Max Participants</label>
                                            <input
                                                type="number"
                                                required
                                                min="1"
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                                                value={formData.max_participants}
                                                onChange={(e) => setFormData({ ...formData, max_participants: e.target.value })}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-gray-700">Registration Deadline</label>
                                            <input
                                                type="datetime-local"
                                                required
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                                                value={formData.registration_deadline}
                                                onChange={(e) => setFormData({ ...formData, registration_deadline: e.target.value })}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-gray-700">Start Time</label>
                                            <input
                                                type="datetime-local"
                                                required
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                                                value={formData.start_time}
                                                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full"
                                    >
                                        {loading ? 'Creating Tournament...' : '🚀 Launch Tournament'}
                                    </Button>
                                </form>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Prize Distribution Modal */}
            {
                showPrizeModal && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-yellow-50">
                                <h3 className="text-xl font-bold text-gray-900">🏆 Set Prize Distribution</h3>
                                <Button
                                    onClick={() => setShowPrizeModal(false)}
                                    variant="ghost"
                                    size="icon"
                                >
                                    ✕
                                </Button>
                            </div>

                            <div className="p-6">
                                <p className="text-sm text-gray-600 mb-4">Set fixed prize amount (₹) for each rank.</p>

                                <div className="space-y-4 max-h-[400px] overflow-y-auto mb-6">
                                    {prizeDistributions.map((dist, index) => (
                                        <div key={index} className="flex gap-4 items-center">
                                            <div className="flex-1">
                                                <label className="text-xs font-semibold text-gray-500 uppercase">Rank</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={dist.rank}
                                                    onChange={(e) => {
                                                        const newDist = [...prizeDistributions];
                                                        newDist[index].rank = parseInt(e.target.value);
                                                        setPrizeDistributions(newDist);
                                                    }}
                                                    className="w-full p-2 border border-gray-300 rounded-md"
                                                    placeholder="Rank"
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <label className="text-xs font-semibold text-gray-500 uppercase">Amount (₹)</label>
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={dist.prize_amount}
                                                        onChange={(e) => {
                                                            const newDist = [...prizeDistributions];
                                                            newDist[index].prize_amount = parseFloat(e.target.value);
                                                            setPrizeDistributions(newDist);
                                                        }}
                                                        className="w-full p-2 border border-gray-300 rounded-md pr-8"
                                                        placeholder="500"
                                                    />
                                                    <span className="absolute right-3 top-2 text-gray-400">₹</span>
                                                </div>
                                            </div>
                                            <Button
                                                onClick={() => {
                                                    const newDist = prizeDistributions.filter((_, i) => i !== index);
                                                    setPrizeDistributions(newDist);
                                                }}
                                                variant="ghost"
                                                size="icon"
                                                className="mt-5"
                                                title="Remove Rank"
                                            >
                                                ✕
                                            </Button>
                                        </div>
                                    ))}
                                </div>

                                <Button
                                    onClick={() => setPrizeDistributions([...prizeDistributions, { rank: prizeDistributions.length + 1, prize_amount: 100 }])}
                                    variant="outline"
                                    className="w-full mb-6"
                                >
                                    + Add Rank
                                </Button>

                                <div className="bg-gray-50 p-4 rounded-lg flex justify-between items-center mb-6">
                                    <span className="font-semibold text-gray-700">Total Prizes:</span>
                                    <span className="font-bold text-lg text-green-600">
                                        ₹{prizeDistributions.reduce((sum, d) => sum + (parseFloat(d.prize_amount) || 0), 0)}
                                    </span>
                                </div>

                                <Button
                                    onClick={handleSavePrizes}
                                    className="w-full"
                                >
                                    💾 Save Distribution
                                </Button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
