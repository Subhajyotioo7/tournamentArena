import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { paymentService, walletService } from '../services/api';
import { notify } from '../lib/toast';

const QUICK_AMOUNTS = [100, 250, 500, 1000, 2000];

function PaymentContent({ status, amount, setAmount, loading, startPayment, navigate }) {
  if (status === 'success') {
    return (
      <div className="mt-8 text-center">
        <p className="text-5xl">✓</p>
        <h2 className="text-2xl font-black text-emerald-600 mt-3">Payment successful</h2>
        <p className="text-gray-500 mt-2">Your wallet has been credited.</p>
        <Button onClick={() => navigate('/wallet/transactions')} className="mt-6 w-full">View wallet history</Button>
      </div>
    );
  }
  if (status === 'checking' || status === 'pending') {
    return (
      <div className="mt-10 text-center">
        <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="font-bold mt-4">Confirming your PhonePe payment...</p>
        <p className="text-sm text-gray-500 mt-2">Please do not close this page.</p>
      </div>
    );
  }
  return (
    <>
      <div className="flex flex-wrap gap-2 mt-8">
        {QUICK_AMOUNTS.map((value) => {
          const selected = Number(amount) === value;
          const className = selected
            ? 'bg-purple-600 text-white'
            : 'bg-white text-gray-700';
          return (
            <button key={value} type="button" onClick={() => setAmount(String(value))}
              className={`px-4 py-2 rounded-xl border font-bold ${className}`}>
              ₹{value}
            </button>
          );
        })}
      </div>
      <label className="block text-sm font-bold text-gray-700 mt-6">Amount</label>
      <input type="number" min="1" max="100000" step="0.01" value={amount}
        onChange={(event) => setAmount(event.target.value)}
        placeholder="Enter amount" className="w-full mt-2 border-2 border-gray-100 rounded-2xl px-5 py-4 text-xl font-bold focus:border-purple-500 outline-none" />
      {Number(amount) >= 1 && (
        <div className="mt-4 rounded-2xl bg-gray-50 border border-gray-100 p-4 space-y-2 text-sm">
          <div className="flex justify-between"><span>Wallet credit</span><strong>₹{Number(amount).toFixed(2)}</strong></div>
          <div className="border-t pt-2 flex justify-between font-black text-gray-900"><span>Total payable</span><span>₹{Number(amount).toFixed(2)}</span></div>
        </div>
      )}
      <Button onClick={startPayment} disabled={loading} className="w-full mt-6 py-4">
        {loading ? 'Starting payment...' : 'Continue with UPI'}
      </Button>
      <p className="text-xs text-gray-400 text-center mt-4">No gateway fee or GST is charged for adding money. Your wallet is credited only after payment confirmation.</p>
    </>
  );
}

export default function AddMoney() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [amount, setAmount] = useState('');
  const [orderId, setOrderId] = useState(searchParams.get('merchantOrderId') || '');
  const [status, setStatus] = useState(orderId ? 'checking' : 'idle');
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(Boolean(orderId));

  useEffect(() => {
    walletService.getBalance().then((data) => setBalance(Number(data.balance || 0))).catch(() => {});
  }, []);

  useEffect(() => {
    if (!orderId) return undefined;
    let cancelled = false;
    let timer;
    const check = async () => {
      try {
        const result = await paymentService.getPhonePePaymentStatus(orderId);
        if (cancelled) return;
        setStatus(result.status.toLowerCase());
        setLoading(false);
        if (result.status === 'PENDING') timer = setTimeout(check, 3000);
        if (result.status === 'SUCCESS') {
          const wallet = await walletService.getBalance();
          if (!cancelled) setBalance(Number(wallet.balance || 0));
        }
      } catch (error) {
        if (!cancelled) {
          setStatus('error');
          setLoading(false);
          notify(error.message, { variant: 'destructive' });
        }
      }
    };
    check();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [orderId]);

  const startPayment = async () => {
    const value = Number(amount);
    if (!Number.isFinite(value) || value < 1) {
      notify('Enter an amount of at least ₹1.', { variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const result = await paymentService.createPhonePePayment(value.toFixed(2));
      setOrderId(result.merchant_order_id);
      setStatus('pending');
      window.location.assign(result.redirect_url);
    } catch (error) {
      setLoading(false);
      notify(error.message, { variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="max-w-lg mx-auto bg-white rounded-3xl shadow-xl p-8">
        <button type="button" onClick={() => navigate('/profile')} className="text-sm text-gray-500 mb-6">← Back to profile</button>
        <h1 className="text-3xl font-black text-gray-900">Add money</h1>
        <p className="text-gray-500 mt-2">Pay securely with UPI through PhonePe.</p>
        {balance !== null && <p className="mt-5 rounded-xl bg-emerald-50 px-4 py-3 font-bold text-emerald-700">Wallet balance: ₹{balance.toFixed(2)}</p>}

        <PaymentContent
          status={status}
          amount={amount}
          setAmount={setAmount}
          loading={loading}
          startPayment={startPayment}
          navigate={navigate}
        />
      </div>
    </div>
  );
}
