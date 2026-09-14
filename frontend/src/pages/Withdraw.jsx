import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from '../components/ui/button';
import { walletService } from "../services/api";

export default function Withdraw() {
  const navigate = useNavigate();

  const [amount, setAmount] = useState("");
  const [upiId, setUpiId] = useState("");
  const [payoutMethod, setPayoutMethod] = useState("manual");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [balance, setBalance] = useState(null);
  const [pricing, setPricing] = useState({ gateway_fee: 0, gst_amount: 0, gst_rate: 18, payout_amount: 0, total_debit: 0 });

  useEffect(() => {
    walletService.getBalance()
      .then((data) => setBalance(Number(data.balance || 0)))
      .catch(() => setBalance(null));
  }, []);

  useEffect(() => {
    if (payoutMethod !== "instant" || !amount || Number(amount) <= 0) return;
    walletService.getWithdrawalPricing(amount)
      .then((data) => setPricing({
        gateway_fee: Number(data.gateway_fee || 0),
        gst_amount: Number(data.gst_amount || 0),
        gst_rate: Number(data.gst_rate || 18),
        payout_amount: Number(data.payout_amount || 0),
        total_debit: Number(data.total_debit || 0),
      }))
      .catch(() => setPricing({ gateway_fee: 0, gst_amount: 0, gst_rate: 18, payout_amount: 0, total_debit: 0 }));
  }, [amount, payoutMethod]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!amount || amount <= 0) {
      setMessage("Enter a valid withdrawal amount");
      return;
    }

    if (!upiId) {
      setMessage("Provide your UPI ID");
      return;
    }

    if (payoutMethod === "instant" && pricing.total_debit > 0 && balance !== null && balance < pricing.total_debit) {
      setMessage(`Insufficient balance. You need ₹${pricing.total_debit.toFixed(2)}, but your wallet has ₹${balance.toFixed(2)}.`);
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      await walletService.requestWithdrawal({
        amount,
        upi_id: upiId,
        payout_method: payoutMethod,
      });

      setMessage(payoutMethod === "instant"
        ? "✅ Instant payout completed."
        : "✅ Withdrawal sent to admin for manual payout.");

      setAmount("");
      setUpiId("");
    } catch (error) {
      setMessage(`❌ ${error.message || "Failed to submit withdrawal request"}`);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white w-full max-w-md rounded-xl shadow-lg p-6">
        <h1 className="text-2xl font-bold text-center mb-4">
          Withdraw Funds
        </h1>

        {message && (
          <p className="text-center mb-4 text-sm font-semibold">
            {message}
          </p>
        )}
        {balance !== null && (
          <p className="mb-4 rounded-lg bg-gray-100 px-3 py-2 text-center text-sm font-semibold text-gray-700">
            Wallet balance: ₹{balance.toFixed(2)}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Amount */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Amount (₹)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-600"
              placeholder="Enter amount"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Payout method</label>
            <select value={payoutMethod} onChange={(e) => setPayoutMethod(e.target.value)}
              className="w-full border rounded-lg px-3 py-2">
              <option value="instant">Instant UPI payout</option>
              <option value="manual">Manual payout (admin review)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">UPI ID</label>
            <input
              type="text"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
              placeholder="example@upi"
            />
          </div>

          {payoutMethod === "instant" && (
            <div className="rounded-lg bg-purple-50 border border-purple-100 px-3 py-2 text-sm text-purple-800">
              <div className="flex justify-between">
                <span>Gateway fee</span>
                <strong>₹{pricing.gateway_fee.toFixed(2)}</strong>
              </div>
              <div className="flex justify-between mt-1">
                <span>GST ({pricing.gst_rate}% of amount)</span>
                <strong>₹{pricing.gst_amount.toFixed(2)}</strong>
              </div>
              <div className="flex justify-between mt-1 font-semibold">
                <span>You receive</span>
                <strong>₹{Number(pricing.payout_amount || 0).toFixed(2)}</strong>
              </div>
              <div className="flex justify-between mt-1 border-t border-purple-200 pt-1 font-bold">
                <span>Total deducted from wallet</span>
                <strong>₹{Number(pricing.total_debit || 0).toFixed(2)}</strong>
              </div>
              <p className="text-xs text-purple-600 mt-2">
                Gateway fee and GST are added to the amount deducted from your wallet.
              </p>
              {balance !== null && pricing.total_debit > balance && (
                <p className="mt-2 text-xs font-semibold text-red-600">
                  Add ₹{(pricing.total_debit - balance).toFixed(2)} more to use instant payout.
                </p>
              )}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 text-white py-2 rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50"
          >
            {loading ? "Submitting..." : "Submit Withdrawal"}
          </Button>
        </form>

        <Button
          onClick={() => navigate("/wallet/transactions")}
          className="mt-4 w-full text-purple-600 font-semibold hover:underline"
        >
          ← Back to Wallet
        </Button>
      </div>
    </div>
  );
}
