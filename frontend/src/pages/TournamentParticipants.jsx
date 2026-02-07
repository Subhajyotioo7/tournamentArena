import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { tournamentService, roomService } from '../services/api';

export default function TournamentParticipants() {
    const { id } = useParams();
    const [participants, setParticipants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [processing, setProcessing] = useState({});

    useEffect(() => {
        fetchParticipants();
    }, [id]);

    const fetchParticipants = async () => {
        try {
            const data = await tournamentService.getParticipants(id);
            setParticipants(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSetWinner = async (participantId, roomId) => {
        const rank = prompt("Enter rank (e.g. 1):");
        if (!rank) return;
        const prize = prompt("Enter prize amount (₹):");
        if (!prize) return;

        setProcessing({ ...processing, [participantId]: true });
        try {
            const response = await roomService.addWinner(roomId, {
                participant_id: participantId,
                rank: parseInt(rank),
                prize_amount: parseFloat(prize)
            });
            alert("✅ " + response.message);
            fetchParticipants();
        } catch (err) {
            alert("❌ Failed: " + err.message);
        } finally {
            setProcessing({ ...processing, [participantId]: false });
        }
    };

    const filteredParticipants = participants.filter(p =>
        p.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.game_id && p.game_id.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (loading) return (
        <div className="flex justify-center items-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
        </div>
    );

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-6 flex justify-between items-center">
                <div>
                    <Link to="/admin" className="text-gray-500 hover:text-gray-700 mb-2 inline-block">← Back to Dashboard</Link>
                    <h1 className="text-3xl font-bold text-gray-900">Tournament Participants</h1>
                    <p className="text-gray-600">Manage and view registered users</p>
                </div>

                <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-200">
                    <input
                        type="text"
                        placeholder="Search users..."
                        className="outline-none px-2 py-1 min-w-[300px]"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <span className="text-gray-400">🔍</span>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
                    Error: {error}
                </div>
            )}

            <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-xs uppercase tracking-wider">
                                <th className="p-4 font-semibold">User</th>
                                <th className="p-4 font-semibold">Game ID</th>
                                <th className="p-4 font-semibold">Room Info</th>
                                <th className="p-4 font-semibold">Joined At</th>
                                <th className="p-4 font-semibold">Status</th>
                                <th className="p-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredParticipants.length > 0 ? (
                                filteredParticipants.map((participant) => (
                                    <tr key={participant.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-4">
                                            <div className="font-bold text-gray-900">{participant.username}</div>
                                            <div className="text-sm text-gray-500">{participant.email}</div>
                                        </td>
                                        <td className="p-4 font-mono text-purple-700 font-semibold">
                                            {participant.game_id || <span className="text-gray-400 italic">Not set</span>}
                                        </td>
                                        <td className="p-4">
                                            <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                                                Room {participant.room_id.split('-')[0]}...
                                            </span>
                                            {participant.is_team_leader && (
                                                <span className="ml-2 bg-blue-100 text-blue-600 px-2 py-1 rounded text-xs font-bold">
                                                    Leader
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 text-sm text-gray-600">
                                            {new Date(participant.joined_at).toLocaleString()}
                                        </td>
                                        <td className="p-4">
                                            {participant.paid ? (
                                                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">
                                                    PAID ({participant.payment_share})
                                                </span>
                                            ) : (
                                                <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold">
                                                    UNPAID
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 text-right">
                                            <button
                                                onClick={() => handleSetWinner(participant.id, participant.room_id)}
                                                disabled={processing[participant.id]}
                                                className="bg-purple-600 text-white px-3 py-1 rounded-lg text-xs font-bold hover:bg-purple-700 disabled:opacity-50"
                                            >
                                                {processing[participant.id] ? '...' : '🏆 Set Winner'}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-gray-500 italic">
                                        No participants found matching your search.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="p-4 bg-gray-50 border-t border-gray-100 text-sm text-gray-500 text-right">
                    Total Participants: {filteredParticipants.length}
                </div>
            </div>
        </div>
    );
}
