import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';


export default function MyRooms() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [roomDetails, setRoomDetails] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [activeTab, setActiveTab] = useState('participants'); // 'participants', 'results', 'messages'
    const [wsStatus, setWsStatus] = useState('connecting'); // 'connecting', 'connected', 'error'
    const [winnerForm, setWinnerForm] = useState({ participant_id: '', rank: 1, prize_amount: '' });
    const wsRef = useRef(null);

    const isAdmin = user && (user.is_staff || user.is_superuser);

    useEffect(() => {
        fetchMyRooms();

        // Clean up WS on unmount
        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, []);

    // 🔄 WebSocket Connection Lifecycle
    useEffect(() => {
        const shouldConnect = selectedRoom && (isAdmin || activeTab === 'messages');

        if (shouldConnect) {
            connectWebSocket(selectedRoom);
            fetchMessageHistory(selectedRoom);
        }

        return () => {
            if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
            }
        };
    }, [selectedRoom, activeTab, isAdmin]);

    const fetchMessageHistory = async (roomId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/chat/room/${roomId}/messages/`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            if (response.ok) {
                const data = await response.json();
                const history = data.map(msg => ({
                    username: msg.sender,
                    text: msg.message,
                    timestamp: msg.created_at
                }));
                setMessages(history);
            }
        } catch (error) {
            console.error('Error fetching chat history:', error);
        }
    };

    const connectWebSocket = (roomId) => {
        const token = localStorage.getItem('token');
        if (!token) return;

        setWsStatus('connecting');

        // Create clean WS URL
        const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
        const cleanBase = apiBase.endsWith('/') ? apiBase.slice(0, -1) : apiBase;
        const baseWS = cleanBase.replace('http', 'ws');
        const wsUrl = `${baseWS}/ws/room/${roomId}/?token=${token}`;

        console.log('🚀 Connecting to WebSocket:', wsUrl);
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            console.log('✅ WebSocket Connected!');
            setWsStatus('connected');
        };

        ws.onmessage = (e) => {
            const data = JSON.parse(e.data);
            if (data.type === 'chat_message') {
                setMessages(prev => [...prev, {
                    username: data.sender,
                    text: data.message,
                    timestamp: new Date()
                }]);
            }
        };

        ws.onerror = (e) => {
            console.error('❌ WebSocket Error:', e);
            setWsStatus('error');
        };

        ws.onclose = () => {
            console.log('🔌 WebSocket Closed');
            // Don't set error on close if it was manual or successful before
        };

        wsRef.current = ws;
    };

    const fetchMyRooms = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/tournaments/my-rooms/`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json();
            if (response.ok) {
                setRooms(data.rooms || []);
            } else {
                console.error('Failed to fetch rooms:', data);
            }
        } catch (error) {
            console.error('Error fetching rooms:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleViewRoom = async (roomId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/tournaments/room/${roomId}/`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const data = await response.json();
                setRoomDetails(data);
                setSelectedRoom(roomId);
                setActiveTab('participants'); // Reset to participants tab
            } else {
                alert('Failed to load room details');
            }
        } catch (error) {
            console.error('Error fetching room details:', error);
            alert('Error loading room details');
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            open: 'bg-green-100 text-green-700 border border-green-200',
            full: 'bg-orange-100 text-orange-700 border border-orange-200',
            started: 'bg-blue-100 text-blue-700 border border-blue-200',
            completed: 'bg-gray-100 text-gray-600 border border-gray-200',
            cancelled: 'bg-red-100 text-red-700 border border-red-200',
        };
        return colors[status] || 'bg-gray-100 text-gray-700';
    };

    const getGameGradient = (game) => {
        const gradients = {
            fifa: 'from-green-500 to-emerald-600',
            bgmi: 'from-orange-500 to-red-600',
            freefire: 'from-yellow-500 to-orange-600',
        };
        return gradients[game] || 'from-purple-600 to-blue-600';
    };

    const handleAddWinner = async () => {
        if (!winnerForm.participant_id || !winnerForm.prize_amount) {
            alert('Please select a participant and enter prize amount');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/tournaments/room/${selectedRoom}/add-winner/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(winnerForm)
            });

            if (response.ok) {
                alert('🏆 Winner added and wallet credited!');
                setWinnerForm({ participant_id: '', rank: 1, prize_amount: '' });
                handleViewRoom(selectedRoom); // Refresh details
            } else {
                const data = await response.json();
                alert('Failed to add winner: ' + (data.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error adding winner:', error);
            alert('Error connecting to server');
        }
    };

    const handleSendMessage = () => {
        if (!newMessage.trim()) return;

        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
                'message': newMessage,
                'type': 'chat'
            }));
            setNewMessage('');
        } else {
            console.error('WebSocket is not connected');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading your rooms...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            {/* Header */}
            {/* Header Removed */}

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {rooms.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {rooms.map((room) => (
                            <div key={room.id} className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all overflow-hidden">
                                {/* Game Header */}
                                <div className={`bg-gradient-to-r ${getGameGradient(room.tournament_game)} p-4`}>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-white/80 text-xs font-medium uppercase">{room.tournament_game}</p>
                                            <h3 className="text-white font-bold text-lg">{room.tournament_name}</h3>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(room.status)}`}>
                                            {room.status}
                                        </span>
                                    </div>
                                </div>

                                {/* Room Details */}
                                <div className="p-6">
                                    <div className="space-y-3 mb-4">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Room Status</span>
                                            <span className={`font-semibold capitalize ${room.status === 'full' || room.current_players >= room.max_players ? 'text-orange-600' :
                                                room.status === 'started' ? 'text-blue-600' :
                                                    room.status === 'completed' ? 'text-gray-600' :
                                                        'text-green-600'
                                                }`}>
                                                {room.status === 'full' || room.current_players >= room.max_players ? 'FULL ⛔' :
                                                    room.status === 'open' ? 'OPEN ✅' :
                                                        room.status === 'started' ? 'STARTED 🎮' :
                                                            room.status === 'completed' ? 'COMPLETED 🏆' :
                                                                room.status.toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Players</span>
                                            <span className="font-semibold text-gray-900">
                                                👥 {room.current_players}/{room.max_players}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Prize Pool</span>
                                            <span className="font-semibold text-green-600">₹{room.prize_pool}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Entry Fee</span>
                                            <span className="font-semibold text-gray-900">₹{room.entry_fee}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Payment</span>
                                            <span className={`font-semibold ${room.paid ? 'text-green-600' : 'text-red-600'}`}>
                                                {room.paid ? '✅ Paid' : '❌ Unpaid'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Joined</span>
                                            <span className="text-gray-900">{new Date(room.joined_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="space-y-2">
                                        {room.status === 'started' ? (
                                            <button
                                                onClick={() => handleViewRoom(room.id)}
                                                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition-all"
                                            >
                                                🎮 Enter Room
                                            </button>
                                        ) : room.status === 'completed' ? (
                                            <button
                                                onClick={() => handleViewRoom(room.id)}
                                                className="w-full bg-gray-600 text-white py-3 rounded-lg font-semibold hover:bg-gray-700 transition-all"
                                            >
                                                👁️ View Results
                                            </button>
                                        ) : room.status === 'full' || room.current_players >= room.max_players ? (
                                            <button
                                                onClick={() => handleViewRoom(room.id)}
                                                className="w-full bg-yellow-100 text-yellow-800 py-3 rounded-lg font-semibold text-center border border-yellow-200 hover:bg-yellow-200 transition-all"
                                            >
                                                👁️ View Room
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleViewRoom(room.id)}
                                                className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-all"
                                            >
                                                👁️ View Room
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16">
                        <div className="text-6xl mb-4">🎮</div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">No Rooms Yet</h2>
                        <p className="text-gray-600 mb-6">You haven't joined any tournaments yet</p>
                        <button
                            onClick={() => navigate('/')}
                            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all"
                        >
                            Browse Tournaments
                        </button>
                    </div>
                )}
            </div>

            {/* Room Details Modal */}
            {selectedRoom && roomDetails && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
                    <div className={`bg-white rounded-[2rem] ${isAdmin ? 'max-w-7xl' : 'max-w-2xl'} w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl border border-white/20`}>

                        {/* Modal Header */}
                        <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 p-6 flex flex-shrink-0 justify-between items-center shadow-lg">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                                    <span className="text-2xl">🎮</span>
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-white leading-none mb-1">{roomDetails.tournament_name}</h2>
                                    <p className="text-white/70 text-[10px] font-black uppercase tracking-[0.2em]">ROOM #{roomDetails.room_number || '1'} • {roomDetails.game.toUpperCase()}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => { setSelectedRoom(null); setRoomDetails(null); }}
                                className="text-white bg-white/10 hover:bg-white/30 p-3 rounded-2xl transition-all duration-300 hover:rotate-90 active:scale-90"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 overflow-y-auto bg-gray-50/50">
                            {isAdmin ? (
                                /* --- 🛠️ ADMIN MASTER DASHBOARD (3-Pane) --- */
                                <div className="p-8 flex flex-col lg:flex-row gap-8 min-h-[600px]">

                                    {/* Column 1: Participants */}
                                    <div className="w-full lg:w-72 flex flex-col bg-white border border-gray-100 rounded-[2rem] overflow-hidden shadow-sm">
                                        <div className="bg-purple-600 px-4 py-3 flex items-center justify-between">
                                            <span className="text-white font-black text-xs uppercase tracking-widest">👤 Participants</span>
                                            <span className="bg-white/20 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">{roomDetails.current_players}/{roomDetails.max_players}</span>
                                        </div>
                                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                            {roomDetails.participants.map((p, i) => (
                                                <div key={i} className="p-4 bg-gray-50 rounded-2xl border border-transparent hover:border-purple-200 transition-all hover:shadow-md group">
                                                    <p className="font-black text-gray-900 text-xs truncate group-hover:text-purple-600 transition-colors">{p.username}</p>
                                                    <p className="text-[10px] text-gray-400 font-bold mt-0.5 tracking-tight">ID: {p.game_id || 'N/A'}</p>
                                                </div>
                                            ))}
                                            {roomDetails.participants.length === 0 && (
                                                <div className="py-20 text-center opacity-30 grayscale"><p className="text-xs font-black uppercase tracking-widest">Empty</p></div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Column 2: Live Room Chat */}
                                    <div className="flex-1 flex flex-col bg-white border border-gray-100 rounded-[2rem] overflow-hidden shadow-sm min-h-[500px]">
                                        <div className="bg-blue-600 px-5 py-4 flex items-center justify-between">
                                            <span className="text-white font-black text-xs uppercase tracking-widest">💬 Room Chat</span>
                                            <div className="flex items-center gap-2 bg-white/10 px-2.5 py-1 rounded-full">
                                                <span className={`w-2 h-2 rounded-full ${wsStatus === 'connected' ? 'bg-green-400' : 'bg-red-400 animate-pulse'}`}></span>
                                                <span className="text-[9px] text-white font-black uppercase tracking-tighter">{wsStatus}</span>
                                            </div>
                                        </div>
                                        <div className="flex-1 p-6 space-y-4 overflow-y-auto bg-blue-50/10">
                                            {messages.length > 0 ? messages.map((msg, i) => {
                                                const isMe = (msg.username || '').toLowerCase() === (user?.username || '').toLowerCase();
                                                return (
                                                    <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                                                        <div className={`max-w-[85%] px-4 py-3 rounded-2xl shadow-sm text-xs font-medium leading-relaxed ${isMe ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white border-gray-200 text-gray-800 rounded-tl-none border'}`}>
                                                            {!isMe && <p className="text-[10px] font-black text-blue-600 mb-1 tracking-tight">{msg.username.toUpperCase()}</p>}
                                                            <p>{msg.text}</p>
                                                        </div>
                                                    </div>
                                                );
                                            }) : (
                                                <div className="h-full flex flex-col items-center justify-center text-gray-300 space-y-3 py-20">
                                                    <span className="text-4xl">💭</span>
                                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50">Quiet Room</p>
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-4 bg-white border-t border-gray-50 flex gap-3">
                                            <input
                                                type="text"
                                                value={newMessage}
                                                onChange={(e) => setNewMessage(e.target.value)}
                                                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                                className="flex-1 px-5 py-3.5 bg-gray-50 border-none rounded-2xl text-xs font-bold focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-gray-400"
                                                placeholder="Send a message to everyone..."
                                            />
                                            <button onClick={handleSendMessage} className="bg-blue-600 text-white w-12 h-12 rounded-2xl flex items-center justify-center hover:bg-blue-700 transition-all shadow-lg active:scale-95 text-xl">🚀</button>
                                        </div>
                                    </div>

                                    {/* Column 3: Winners & Payouts */}
                                    <div className="w-full lg:w-80 flex flex-col gap-6">
                                        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200 rounded-[2rem] p-6 shadow-sm">
                                            <h4 className="text-sm font-black text-gray-900 mb-5 flex items-center gap-2 tracking-tight">🏆 Declare Winners</h4>
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="text-[10px] font-black text-gray-400 uppercase ml-1 block mb-1.5">Award To</label>
                                                    <select
                                                        value={winnerForm.participant_id}
                                                        onChange={(e) => setWinnerForm({ ...winnerForm, participant_id: e.target.value })}
                                                        className="w-full bg-white border border-yellow-200 rounded-2xl px-4 py-3 text-xs font-black text-gray-700 shadow-inner appearance-none focus:ring-2 focus:ring-yellow-400"
                                                    >
                                                        <option value="">Choose Participant</option>
                                                        {roomDetails.participants.map(p => <option key={p.id} value={p.id}>{p.username}</option>)}
                                                    </select>
                                                </div>
                                                <div className="flex gap-4">
                                                    <div className="w-24">
                                                        <label className="text-[10px] font-black text-gray-400 uppercase ml-1 block mb-1.5">Rank</label>
                                                        <input type="number" value={winnerForm.rank} onChange={(e) => setWinnerForm({ ...winnerForm, rank: e.target.value })} className="w-full border border-yellow-200 rounded-2xl px-2 py-3 text-xs text-center font-black" min="1" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <label className="text-[10px] font-black text-gray-400 uppercase ml-1 block mb-1.5">Prize Amount</label>
                                                        <input type="number" placeholder="₹0.00" value={winnerForm.prize_amount} onChange={(e) => setWinnerForm({ ...winnerForm, prize_amount: e.target.value })} className="w-full border border-yellow-200 rounded-2xl px-4 py-3 text-xs font-black text-green-700 placeholder:text-gray-300" />
                                                    </div>
                                                </div>
                                                <button onClick={handleAddWinner} className="w-full mt-2 bg-yellow-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-xl shadow-yellow-200 hover:bg-black active:scale-95">Verify & Payout 💰</button>
                                            </div>
                                        </div>

                                        <div className="bg-white border border-gray-100 rounded-[2rem] p-6 flex-1 shadow-sm flex flex-col overflow-hidden">
                                            <h4 className="text-[10px] font-black text-gray-400 uppercase mb-4 px-1 flex items-center justify-between">
                                                <span>Session Winners</span>
                                                <span className="bg-yellow-100 text-yellow-700 px-2.5 py-1 rounded-full">{roomDetails.results.length}</span>
                                            </h4>
                                            <div className="flex-1 overflow-y-auto space-y-3">
                                                {roomDetails.results.map((res, i) => (
                                                    <div key={i} className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl border border-transparent hover:border-gray-200 transition-all animate-in slide-in-from-right duration-500">
                                                        <div className="flex items-center gap-3">
                                                            <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs ${res.rank === 1 ? 'bg-yellow-400 text-white shadow-md shadow-yellow-100' : 'bg-gray-200 text-gray-600'}`}>#{res.rank}</span>
                                                            <span className="font-black text-gray-800 text-xs truncate w-24">{res.username}</span>
                                                        </div>
                                                        <span className="font-black text-green-600 text-sm">₹{res.prize_amount}</span>
                                                    </div>
                                                ))}
                                                {roomDetails.results.length === 0 && (
                                                    <div className="py-20 text-center text-gray-300 font-black text-[10px] uppercase tracking-widest italic leading-relaxed">No Winners<br />Declared Yet</div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                /* --- 👤 STANDARD PLAYER INTERFACE (Tabs) --- */
                                <div className="p-8">
                                    <div className="flex bg-gray-100/80 backdrop-blur-md p-1.5 rounded-[1.5rem] mb-8 shadow-inner">
                                        {['participants', 'messages', 'results'].map(tab => (
                                            <button
                                                key={tab}
                                                onClick={() => setActiveTab(tab)}
                                                className={`flex-1 py-3.5 text-[10px] font-black uppercase tracking-widest transition-all duration-300 rounded-[1.1rem] ${activeTab === tab ? 'bg-white text-purple-600 shadow-md transform scale-[1.02]' : 'text-gray-500 hover:text-gray-800'}`}
                                            >
                                                {tab}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="min-h-[400px]">
                                        {activeTab === 'participants' && (
                                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    {roomDetails.participants.map((p, i) => (
                                                        <div key={i} className="p-5 bg-white border border-gray-100 rounded-3xl flex justify-between items-center shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group">
                                                            <div>
                                                                <p className="font-black text-gray-900 group-hover:text-purple-600 transition-colors uppercase tracking-tighter">{p.username}</p>
                                                                <p className="text-[10px] text-gray-400 font-black mt-1 uppercase tracking-widest">Player ID: {p.game_id || 'N/A'}</p>
                                                            </div>
                                                            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-black text-xs shadow-inner uppercase tracking-wider">P{i + 1}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {activeTab === 'messages' && (
                                            <div className="flex flex-col h-[500px] bg-white border border-gray-100 rounded-[2.5rem] overflow-hidden shadow-sm animate-in zoom-in-95 duration-500">
                                                <div className="flex-1 p-6 space-y-4 overflow-y-auto bg-gray-50/30">
                                                    {messages.map((msg, i) => {
                                                        const isMe = (msg.username || '').toLowerCase() === (user?.username || '').toLowerCase();
                                                        return (
                                                            <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in slide-in-from-${isMe ? 'right' : 'left'}-4 duration-300`}>
                                                                <div className={`max-w-[85%] px-5 py-4 rounded-[1.5rem] text-xs font-bold shadow-md transition-all ${isMe ? 'bg-gradient-to-br from-purple-600 to-blue-600 text-white rounded-tr-none' : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none'}`}>
                                                                    {!isMe && <p className="text-[9px] font-black text-purple-600 mb-1.5 uppercase tracking-widest">{msg.username}</p>}
                                                                    <p className="leading-relaxed">{msg.text}</p>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                    {messages.length === 0 && (
                                                        <div className="h-full flex flex-col items-center justify-center space-y-4 py-20 grayscale opacity-40">
                                                            <span className="text-5xl">📫</span>
                                                            <p className="text-[10px] font-black uppercase tracking-[0.3em]">Inbox Empty</p>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="p-4 bg-white border-t flex gap-4">
                                                    <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()} className="flex-1 px-6 py-4 bg-gray-50 border-none rounded-2xl text-xs font-black tracking-tight focus:ring-2 focus:ring-purple-500 transition-all shadow-inner" placeholder="Message the entire room..." />
                                                    <button onClick={handleSendMessage} className="bg-black text-white w-14 h-14 rounded-2xl flex items-center justify-center hover:bg-purple-600 transition-all shadow-2xl active:scale-90 text-2xl">🚀</button>
                                                </div>
                                            </div>
                                        )}

                                        {activeTab === 'results' && (
                                            <div className="space-y-4 animate-in slide-in-from-right-8 duration-500">
                                                <div className="space-y-4">
                                                    {roomDetails.results.map((res, i) => (
                                                        <div key={i} className="p-6 bg-gradient-to-br from-yellow-50 to-orange-100/50 border border-yellow-200/50 rounded-[2.5rem] flex justify-between items-center shadow-lg hover:shadow-yellow-100 transition-shadow">
                                                            <div className="flex items-center gap-5">
                                                                <span className={`w-14 h-14 rounded-[1.5rem] flex items-center justify-center font-black text-2xl ${res.rank === 1 ? 'bg-yellow-400 text-white shadow-xl shadow-yellow-200' : 'bg-white text-gray-600 border'}`}>{res.rank}</span>
                                                                <div>
                                                                    <p className="font-black text-gray-900 text-lg uppercase tracking-tighter leading-tight">{res.username}</p>
                                                                    <p className="text-[10px] text-yellow-700 font-black uppercase tracking-[0.2em] mt-1">Status: Paid ✅</p>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="font-black text-green-700 text-2xl leading-none">₹{res.prize_amount}</p>
                                                                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1">Prize Awarded</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {roomDetails.results.length === 0 && (
                                                        <div className="py-24 text-center space-y-4 grayscale opacity-30">
                                                            <span className="text-6xl">⏱️</span>
                                                            <p className="text-xs font-black uppercase tracking-[0.4em]">Awaiting Outcome</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-6 border-t bg-white flex-shrink-0 flex justify-center lg:justify-end">
                            <button
                                onClick={() => { setSelectedRoom(null); setRoomDetails(null); }}
                                className="px-16 bg-gray-900 text-white py-4.5 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-black transition-all transform active:scale-95 shadow-2xl hover:shadow-purple-200 hover:-translate-y-1"
                            >
                                Leave Arena
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
