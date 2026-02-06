import { useEffect, useState, useCallback } from "react";
import { walletService } from "../services/api";
import { useNavigate } from "react-router-dom";

export default function WalletTransactions() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("transactions"); // "transactions" or "withdrawals"

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [txResponse, wdrResponse] = await Promise.all([
        walletService.getTransactions(),
        walletService.getMyWithdrawals(),
      ]);

      // NORMALIZE TRANSACTIONS
      let txList = [];
      if (Array.isArray(txResponse)) txList = txResponse;
      else if (Array.isArray(txResponse?.results)) txList = txResponse.results;
      else if (Array.isArray(txResponse?.transactions)) txList = txResponse.transactions;
      setTransactions(txList);

      // NORMALIZE WITHDRAWALS
      setWithdrawals(Array.isArray(wdrResponse) ? wdrResponse : []);

    } catch (error) {
      console.error("Failed to load wallet data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getStatusColor = (status) => {
    switch (status) {
      case "pending": return "text-yellow-600 bg-yellow-50";
      case "approved": return "text-green-600 bg-green-50";
      case "rejected": return "text-red-600 bg-red-50";
      case "paid": return "text-blue-600 bg-blue-50";
      default: return "text-gray-600 bg-gray-50";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">Wallet History</h1>
            <p className="text-gray-500 text-sm mt-1">Track your earnings and payouts</p>
          </div>
          <button
            onClick={() => navigate("/profile")}
            className="bg-white border text-gray-700 px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-gray-50 transition-all"
          >
            ← Back
          </button>
        </div>

        {/* Action Button */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => navigate("/withdraw")}
            className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4 rounded-2xl font-bold shadow-lg shadow-purple-200 hover:scale-[1.02] active:scale-95 transition-all text-center"
          >
            💸 New Withdrawal Request
          </button>
        </div>

        {/* Tabs */}
        <div className="flex p-1 bg-gray-200/50 rounded-2xl mb-6 shadow-inner">
          <button
            onClick={() => setActiveTab("transactions")}
            className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${activeTab === "transactions" ? "bg-white text-purple-600 shadow-md" : "text-gray-500 hover:text-gray-700"
              }`}
          >
            Transactions
          </button>
          <button
            onClick={() => setActiveTab("withdrawals")}
            className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${activeTab === "withdrawals" ? "bg-white text-purple-600 shadow-md" : "text-gray-500 hover:text-gray-700"
              }`}
          >
            Withdrawals
          </button>
        </div>

        {/* Content */}
        {activeTab === "transactions" ? (
          transactions.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl shadow-sm text-center border-2 border-dashed border-gray-100">
              <span className="text-4xl mb-4 block">📜</span>
              <p className="text-gray-500 font-medium">No transactions found yet.</p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-50">
              {transactions.map((tx) => (
                <div key={tx.id} className="flex justify-between items-center p-5 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${tx.tx_type === 'credit' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                      {tx.tx_type === 'credit' ? '↙' : '↗'}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{tx.note || "System Payout"}</p>
                      <p className="text-xs text-gray-400 font-semibold">{new Date(tx.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className={`font-black text-lg ${tx.tx_type === 'credit' ? "text-green-600" : "text-red-600"}`}>
                    {tx.tx_type === 'credit' ? "+" : "-"}₹{parseFloat(tx.amount).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          withdrawals.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl shadow-sm text-center border-2 border-dashed border-gray-100">
              <span className="text-4xl mb-4 block">💰</span>
              <p className="text-gray-500 font-medium">No withdrawal requests found.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {withdrawals.map((wdr) => (
                <div key={wdr.id} className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-2xl">🏧</div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-extrabold text-gray-900">₹{parseFloat(wdr.amount).toFixed(2)}</p>
                        <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-full ${getStatusColor(wdr.status)}`}>
                          {wdr.status}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-400 font-bold mt-0.5">{new Date(wdr.requested_at).toLocaleDateString()} • {wdr.upi_id || 'Bank Transfer'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest leading-none mb-1">Status</p>
                    <p className={`text-xs font-black uppercase ${wdr.status === 'paid' ? 'text-blue-600' : wdr.status === 'approved' ? 'text-green-600' : 'text-yellow-600'}`}>
                      {wdr.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
