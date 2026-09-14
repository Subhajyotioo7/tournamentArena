import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { tournamentEarningsService } from "../services/api";

export default function TournamentEarnings() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    tournamentEarningsService.getMine()
      .then(setData)
      .catch((err) => setError(err.message || "Unable to load organizer history."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-600">Loading tournament earnings...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center text-red-600">{error}</div>;

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-black text-gray-900">Tournament Earnings</h1>
            <p className="text-gray-500 mt-1">Players joined and entry money earned from your tournaments.</p>
          </div>
          <Button onClick={() => navigate("/wallet/transactions")} variant="outline">← Wallet</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm"><p className="text-xs uppercase font-bold text-gray-400">Total earned</p><p className="text-3xl font-black text-emerald-600 mt-2">₹{Number(data.total_earned).toFixed(2)}</p></div>
          <div className="bg-white rounded-2xl p-6 shadow-sm"><p className="text-xs uppercase font-bold text-gray-400">Players joined</p><p className="text-3xl font-black text-indigo-600 mt-2">{data.total_players}</p></div>
          <div className="bg-white rounded-2xl p-6 shadow-sm"><p className="text-xs uppercase font-bold text-gray-400">Tournaments created</p><p className="text-3xl font-black text-purple-600 mt-2">{data.total_tournaments}</p></div>
        </div>

        <section className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-8">
          <h2 className="text-xl font-black p-6 border-b">My tournaments</h2>
          {data.tournaments.length === 0 ? <p className="p-8 text-gray-500">You have not created a tournament yet.</p> : (
            <div className="divide-y">
              {data.tournaments.map((item) => (
                <div key={item.id} className="p-5 flex flex-wrap justify-between gap-3">
                  <div><p className="font-bold text-gray-900">{item.name}</p><p className="text-xs text-gray-400 uppercase">{item.game} • Entry ₹{Number(item.entry_fee).toFixed(2)}</p></div>
                  <div className="text-right"><p className="font-black text-emerald-600">₹{Number(item.total_earned).toFixed(2)}</p><p className="text-xs text-gray-500">{item.total_players} player{item.total_players === 1 ? "" : "s"}</p></div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <h2 className="text-xl font-black p-6 border-b">Complete earning history</h2>
          {data.history.length === 0 ? <p className="p-8 text-gray-500">No player entry payments yet.</p> : (
            <div className="divide-y">
              {data.history.map((item) => (
                <div key={item.id} className="p-5 flex justify-between items-center">
                  <div><p className="font-bold text-gray-900">{item.player}</p><p className="text-sm text-gray-500">{item.tournament_name} • {new Date(item.created_at).toLocaleString()}</p></div>
                  <p className="font-black text-emerald-600">+₹{Number(item.amount).toFixed(2)}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
