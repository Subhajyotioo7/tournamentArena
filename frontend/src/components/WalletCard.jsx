import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { walletService } from '../services/api';

export default function WalletCard() {
    const [balance, setBalance] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchBalance();
    }, []);

    const fetchBalance = async () => {
        try {
            const data = await walletService.getBalance();
            setBalance(data.balance || 0);
        } catch (error) {
            console.error('Failed to fetch balance:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl p-6 text-white shadow-xl">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <p className="text-purple-100 text-sm font-medium">Wallet Balance</p>
                    {loading ? (
                        <div className="h-10 w-32 bg-white/20 rounded-lg animate-pulse mt-2"></div>
                    ) : (
                        <h2 className="text-4xl font-bold mt-1">₹{balance.toFixed(2)}</h2>
                    )}
                </div>
                <div className="bg-white/20 p-3 rounded-full">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                </div>
            </div>

            <div className="flex gap-3 mt-6">
                <Link
                    to="/wallet/add-money"
                    className="flex-1 bg-white text-purple-600 py-2.5 px-4 rounded-lg font-semibold text-center hover:bg-purple-50 transition-all transform hover:scale-105"
                >
                    Add Money
                </Link>
                <Link
                    to="/wallet/transactions"
                    className="flex-1 bg-white/10 backdrop-blur-sm py-2.5 px-4 rounded-lg font-semibold text-center hover:bg-white/20 transition-all"
                >
                    History
                </Link>
            </div>
        </div>
    );
}
