import { useState, useEffect, useCallback } from 'react';
import { walletService } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';

export default function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('games'); // games, kyc, payment

  const [formData, setFormData] = useState({
    bgmi_id: '',
    freefire_id: '',
    fifa_id: '',
    kyc_full_name: '',
    kyc_id_type: 'Aadhar Card',
    kyc_id_number: '',
    mobile_number: '',
    bank_name: '',
    account_number: '',
    ifsc_code: '',
    upi_id: ''
  });
  const [showAddMoney, setShowAddMoney] = useState(false);
  const [siteConfig, setSiteConfig] = useState(null);
  const [depositForm, setDepositForm] = useState({ amount: '', utr_number: '' });

  // Fetch detailed profile
  const fetchProfile = useCallback(async () => {
    try {
      const [profileData, balanceData] = await Promise.all([
        walletService.getDetailedProfile(),
        walletService.getBalance().catch(() => ({ balance: 0 }))
      ]);
      setProfile(profileData);
      setBalance(balanceData.balance || 0);

      setFormData({
        bgmi_id: profileData.bgmi_id || '',
        freefire_id: profileData.freefire_id || '',
        fifa_id: profileData.fifa_id || '',
        kyc_full_name: profileData.kyc_full_name || '',
        kyc_id_type: profileData.kyc_id_type || 'Aadhar Card',
        kyc_id_number: profileData.kyc_id_number || '',
        mobile_number: profileData.mobile_number || '',
        bank_name: profileData.bank_name || '',
        account_number: profileData.account_number || '',
        ifsc_code: profileData.ifsc_code || '',
        upi_id: profileData.upi_id || ''
      });
      setError(false);

      // Fetch site config for Add Money
      const config = await walletService.getSiteConfig();
      setSiteConfig(config);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      setError(true);
      if (error.message?.includes('401')) navigate('/login');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await walletService.updateProfile(formData);
      alert('✅ Profile updated and submitted for verification!');
      fetchProfile();
    } catch (error) {
      alert('❌ Update failed: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const getStatusBadge = (status, reason) => {
    const styles = {
      approved: 'bg-green-100 text-green-700 border-green-200',
      pending: 'bg-yellow-100 text-yellow-700 border-yellow-200 animate-pulse',
      rejected: 'bg-red-100 text-red-700 border-red-200',
    };

    return (
      <div className="mt-2">
        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${styles[status] || 'bg-gray-100'}`}>
          {status?.toUpperCase() || 'NOT SET'}
        </span>
        {status === 'rejected' && reason && (
          <p className="text-red-500 text-[10px] mt-1 italic font-medium">Reason: {reason}</p>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-3xl shadow-xl max-w-sm w-full mx-4">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-black text-gray-900 mb-2">Fetch Failed</h2>
          <p className="text-gray-500 mb-6 font-medium">We couldn't load your profile details. Please check your connection or try again.</p>
          <Button
            onClick={() => { setLoading(true); fetchProfile(); }}
            className="w-full"
          >
            Retry Connection 🔄
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Premium Header */}
      <div className="bg-gradient-to-r from-purple-700 via-indigo-700 to-blue-700 text-white shadow-lg overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/20 rounded-full -ml-24 -mb-24 blur-3xl"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-16 relative z-10 flex flex-col md:flex-row items-center md:items-start gap-8">
          <div className="relative group">
            <div className="w-24 h-24 sm:w-32 sm:h-32 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border-4 border-white/30 shadow-2xl transition-transform group-hover:scale-105">
              <span className="text-5xl sm:text-6xl">👤</span>
            </div>
          </div>

          <div className="text-center md:text-left">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight mb-2">{profile.username}</h1>
            <p className="text-indigo-100 text-lg sm:text-xl opacity-90 font-medium mb-4">{profile.email}</p>
            <div className="flex flex-wrap justify-center md:justify-start gap-3">
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-2 rounded-xl flex items-center gap-2">
                <span className="text-sm font-bold opacity-70 uppercase tracking-widest">Player UUID:</span>
                <span className="font-mono text-sm">{profile.player_uuid?.split('-')[0]}...</span>
              </div>
              <div className="bg-emerald-500/20 backdrop-blur-sm border border-emerald-500/30 px-4 py-2 rounded-xl flex items-center gap-2">
                <span className="text-emerald-400">💰</span>
                <span className="font-black">₹{balance.toFixed(2)}</span>
              </div>
              <Button
                onClick={() => setShowAddMoney(true)}
                className="bg-white !text-gray-900 hover:bg-gray-100"
              >
                Add Money ➕
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 -mt-8 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

          {/* Main Form Area */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">

              {/* Profile Tabs */}
              <div className="flex border-b border-gray-100 bg-gray-50/50">
                {[
                  { id: 'games', label: '🎮 Game IDs', color: 'purple' },
                  { id: 'kyc', label: '🪪 KYC Verify', color: 'blue' },
                  { id: 'payment', label: '🏦 Bank & UPI', color: 'indigo' }
                ].map(tab => (
                  <Button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    variant="ghost"
                    className={`flex-1 py-5 text-sm font-bold uppercase tracking-wider border-b-2 ${activeTab === tab.id
                      ? 'border-orange-600 !text-orange-600 bg-white'
                      : 'border-transparent !text-gray-500'
                      }`}
                  >
                    {tab.label}
                  </Button>
                ))}
              </div>

              <form onSubmit={handleUpdate} className="p-8 sm:p-10">

                {/* Game IDs Section */}
                {activeTab === 'games' && (
                  <div className="space-y-8 animate-fadeIn">
                    <div className="flex items-center justify-between mb-2">
                      <h2 className="text-2xl font-black text-gray-900">Game Information</h2>
                      {getStatusBadge(profile.game_id_status, profile.game_id_rejection_reason)}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">BGMI IGN</label>
                        <input
                          type="text"
                          className="w-full px-4 py-4 bg-gray-50 border-2 border-transparent focus:border-purple-500 rounded-2xl outline-none transition-all font-bold text-gray-800"
                          placeholder="Your BGMI ID"
                          value={formData.bgmi_id}
                          onChange={(e) => setFormData({ ...formData, bgmi_id: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Free Fire ID</label>
                        <input
                          type="text"
                          className="w-full px-4 py-4 bg-gray-50 border-2 border-transparent focus:border-orange-500 rounded-2xl outline-none transition-all font-bold text-gray-800"
                          placeholder="Your FF ID"
                          value={formData.freefire_id}
                          onChange={(e) => setFormData({ ...formData, freefire_id: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">FIFA EA ID</label>
                        <input
                          type="text"
                          className="w-full px-4 py-4 bg-gray-50 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none transition-all font-bold text-gray-800"
                          placeholder="Your EA ID"
                          value={formData.fifa_id}
                          onChange={(e) => setFormData({ ...formData, fifa_id: e.target.value })}
                        />
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 italic">Enter the in-game names (IGN) for the games you participate in. Admin will verify these before tournament entry.</p>
                  </div>
                )}

                {/* KYC Section */}
                {activeTab === 'kyc' && (
                  <div className="space-y-8 animate-fadeIn">
                    <div className="flex items-center justify-between mb-2">
                      <h2 className="text-2xl font-black text-gray-900">KYC Verification</h2>
                      {getStatusBadge(profile.kyc_status, profile.kyc_rejection_reason)}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Full Name (As per ID)</label>
                        <input
                          type="text"
                          disabled={profile.kyc_status === 'approved'}
                          className="w-full px-4 py-4 bg-gray-50 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none transition-all font-bold text-gray-800 disabled:opacity-50"
                          value={formData.kyc_full_name}
                          onChange={(e) => setFormData({ ...formData, kyc_full_name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">ID Card Type</label>
                        <select
                          disabled={profile.kyc_status === 'approved'}
                          className="w-full px-4 py-4 bg-gray-50 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none transition-all font-bold text-gray-800 disabled:opacity-50 appearance-none"
                          value={formData.kyc_id_type}
                          onChange={(e) => setFormData({ ...formData, kyc_id_type: e.target.value })}
                        >
                          <option>Aadhar Card</option>
                          <option>PAN Card</option>
                          <option>Driving License</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">ID Number</label>
                        <input
                          type="text"
                          disabled={profile.kyc_status === 'approved'}
                          className="w-full px-4 py-4 bg-gray-50 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none transition-all font-bold text-gray-800 disabled:opacity-50"
                          value={formData.kyc_id_number}
                          onChange={(e) => setFormData({ ...formData, kyc_id_number: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Mobile Number</label>
                        <input
                          type="tel"
                          disabled={profile.kyc_status === 'approved'}
                          className="w-full px-4 py-4 bg-gray-50 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none transition-all font-bold text-gray-800 disabled:opacity-50"
                          value={formData.mobile_number}
                          onChange={(e) => setFormData({ ...formData, mobile_number: e.target.value })}
                          placeholder="Enter 10-digit mobile number"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Payment Section */}
                {activeTab === 'payment' && (
                  <div className="space-y-8 animate-fadeIn">
                    <div className="flex items-center justify-between mb-2">
                      <h2 className="text-2xl font-black text-gray-900">Withdrawal Details</h2>
                      {getStatusBadge(profile.payment_details_status, profile.payment_details_rejection_reason)}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">UPI ID (Fastest Payout)</label>
                        <input
                          type="text"
                          className="w-full px-4 py-4 bg-gray-50 border-2 border-transparent focus:border-indigo-500 rounded-2xl outline-none transition-all font-bold text-gray-800 placeholder:font-normal"
                          placeholder="yourname@upi"
                          value={formData.upi_id}
                          onChange={(e) => setFormData({ ...formData, upi_id: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Bank Name</label>
                        <input
                          type="text"
                          className="w-full px-4 py-4 bg-gray-50 border-2 border-transparent focus:border-indigo-500 rounded-2xl outline-none transition-all font-bold text-gray-800"
                          value={formData.bank_name}
                          onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">IFSC Code</label>
                        <input
                          type="text"
                          className="w-full px-4 py-4 bg-gray-50 border-2 border-transparent focus:border-indigo-500 rounded-2xl outline-none transition-all font-bold text-gray-800"
                          value={formData.ifsc_code}
                          onChange={(e) => setFormData({ ...formData, ifsc_code: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Account Number</label>
                        <input
                          type="text"
                          className="w-full px-4 py-4 bg-gray-50 border-2 border-transparent focus:border-indigo-500 rounded-2xl outline-none transition-all font-bold text-gray-800"
                          value={formData.account_number}
                          onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Footer Actions */}
                <div className="mt-12 pt-8 border-t border-gray-100 flex flex-col sm:flex-row gap-4">
                  <Button
                    type="submit"
                    disabled={saving}
                    className="flex-[2] h-16"
                  >
                    {saving ? (
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      'Save Changes & Verify 🚀'
                    )}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => fetchProfile()}
                    variant="secondary"
                    className="flex-1 h-16"
                  >
                    Discard
                  </Button>
                </div>

              </form>
            </div>
          </div>

          {/* Quick Stats Sidebar */}
          <div className="lg:col-span-1 space-y-8">
            <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
              <h3 className="text-xl font-black text-gray-900 mb-6">Wallet Highlights</h3>
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Available Funds</p>
                  <p className="text-3xl font-black text-gray-900">₹{balance.toFixed(2)}</p>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <Button onClick={() => navigate('/wallet/transactions')} variant="outline" className="p-4 !text-gray-700 text-xs uppercase tracking-widest">
                    History
                  </Button>
                  <Button onClick={() => navigate('/withdraw')} variant="outline" className="p-4 !text-gray-700 text-xs uppercase tracking-widest">
                    Withdraw
                  </Button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
              <h3 className="text-xl font-black text-gray-900 mb-6">Security</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4 group cursor-pointer" onClick={() => navigate('/forgot-password')}>
                  <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center text-xl group-hover:rotate-12 transition-transform">🔒</div>
                  <div>
                    <h4 className="font-bold text-gray-900">Reset Password</h4>
                    <p className="text-xs text-gray-400">Changed recently?</p>
                  </div>
                </div>
                <hr className="border-gray-50" />
                <div className="flex items-center gap-4 group cursor-pointer" onClick={handleLogout}>
                  <div className="w-12 h-12 bg-red-100 text-red-600 rounded-xl flex items-center justify-center text-xl group-hover:rotate-12 transition-transform">🚪</div>
                  <div>
                    <h4 className="font-bold text-gray-900">Logout</h4>
                    <p className="text-xs text-gray-400">Exit secure session</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 💳 ADD MONEY MODAL (Manual UPI) */}
      {showAddMoney && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] max-w-lg w-full overflow-hidden shadow-2xl border border-white/20 animate-in zoom-in-95 duration-300">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-8 text-white relative">
              <Button onClick={() => setShowAddMoney(false)} variant="ghost" size="icon" className="absolute top-6 right-6 !text-white/80 hover:!text-white">✕</Button>
              <h3 className="text-3xl font-black italic tracking-tighter">ADD MONEY 🚀</h3>
              <p className="text-emerald-100 font-bold text-xs uppercase tracking-widest mt-1">Manual UPI Verification</p>
            </div>

            <div className="p-8 space-y-8">
              {/* UPI Details Display */}
              <div className="bg-emerald-50 rounded-3xl p-6 border-2 border-emerald-100 text-center">
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-3">Scan & Pay via any UPI App</p>
                {siteConfig?.qr_code ? (
                  <img src={siteConfig.qr_code} alt="UPI QR" className="w-48 h-48 mx-auto rounded-2xl shadow-inner mb-4 border-4 border-white" />
                ) : (
                  <div className="w-48 h-48 mx-auto bg-white rounded-2xl flex items-center justify-center text-5xl mb-4 shadow-inner">📸</div>
                )}
                <div className="bg-white py-3 px-4 rounded-xl inline-flex items-center gap-3 border border-emerald-200">
                  <span className="font-black text-emerald-700">{siteConfig?.upi_id || 'Loading...'}</span>
                  <Button onClick={() => { navigator.clipboard.writeText(siteConfig?.upi_id); alert('UPI ID Copied!'); }} variant="link" className="h-auto p-0 text-[10px] font-black uppercase">Copy</Button>
                </div>
              </div>

              {/* Submission Form */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Paid Amount</label>
                    <input
                      type="number"
                      placeholder="₹0.00"
                      value={depositForm.amount}
                      onChange={(e) => setDepositForm({ ...depositForm, amount: e.target.value })}
                      className="w-full bg-gray-50 border-2 border-transparent focus:border-emerald-500 rounded-2xl px-5 py-4 font-black"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase ml-1">UTR / Ref Number</label>
                    <input
                      type="text"
                      placeholder="12 Digit ID"
                      value={depositForm.utr_number}
                      onChange={(e) => setDepositForm({ ...depositForm, utr_number: e.target.value })}
                      className="w-full bg-gray-50 border-2 border-transparent focus:border-emerald-500 rounded-2xl px-5 py-4 font-black"
                    />
                  </div>
                </div>

                <Button
                  onClick={async () => {
                    if (!depositForm.amount || !depositForm.utr_number) return alert('Please fill all details');
                    try {
                      await walletService.submitDepositRequest(depositForm);
                      alert('✅ Request submitted! Now send screenshot on WhatsApp.');
                      const wpMsg = encodeURIComponent(`Hi Admin, I just added ₹${depositForm.amount} to my wallet. UTR: ${depositForm.utr_number}. Please verify. Username: ${profile.username}`);
                      window.open(`https://wa.me/${siteConfig?.whatsapp_number?.replace(/\+/g, '')}?text=${wpMsg}`, '_blank');
                      setShowAddMoney(false);
                    } catch (e) { alert(e.message); }
                  }}
                  className="w-full py-5 text-[10px] uppercase tracking-[0.2em]"
                >
                  Submit & Send Screenshot 📲
                </Button>

                <p className="text-[9px] text-gray-400 text-center font-bold px-4">Note: Your wallet will be credited after our team verifies the transaction UTR. This usually takes 5-15 minutes.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
