import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { walletService } from "../services/api";

export default function Withdraw() {
  const navigate = useNavigate();

  const [amount, setAmount] = useState("");
  const [upiId, setUpiId] = useState("");
  const [bankDetails, setBankDetails] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!amount || amount <= 0) {
      setMessage("Enter a valid withdrawal amount");
      return;
    }

    if (!upiId && !bankDetails) {
      setMessage("Provide UPI ID or Bank Details");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      await walletService.requestWithdrawal({
        amount,
        upi_id: upiId,
        bank_details: bankDetails,
      });

      setMessage("✅ Withdrawal request sent to admin. Status: Pending");

      setAmount("");
      setUpiId("");
      setBankDetails("");
    } catch (error) {
      setMessage("❌ Failed to submit withdrawal request");
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

          {/* UPI */}
          <div>
            <label className="block text-sm font-medium mb-1">
              UPI ID (optional)
            </label>
            <input
              type="text"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
              placeholder="example@upi"
            />
          </div>

          {/* Bank */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Bank Details (optional)
            </label>
            <textarea
              value={bankDetails}
              onChange={(e) => setBankDetails(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
              placeholder="Account No, IFSC, Bank Name"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 text-white py-2 rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50"
          >
            {loading ? "Submitting..." : "Submit Withdrawal"}
          </button>
        </form>

        <button
          onClick={() => navigate("/wallet/transactions")}
          className="mt-4 w-full text-purple-600 font-semibold hover:underline"
        >
          ← Back to Wallet
        </button>
      </div>
    </div>
  );
}
