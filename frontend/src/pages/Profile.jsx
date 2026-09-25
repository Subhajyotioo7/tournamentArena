import { useState, useEffect, useCallback } from 'react';
import { walletService } from '../services/api';
import { logoutFromCognito } from '../services/auth';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { notify } from '../lib/toast';
import { AlertTriangle, Banknote, Camera, CheckCircle, CircleDollarSign, Gamepad2, History, LockKeyhole, LogOut, Plus, Rocket, RotateCw, ShieldCheck, Smartphone, User, Wallet, X } from 'lucide-react';

export default function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('games');

  const [formData, setFormData] = useState({
    selected_game: '',
    bgmi_id: '',
    freefire_id: '',
    fifa_id: '',
    mobile_number: '',
    bank_name: '',
    account_number: '',
    ifsc_code: '',
    upi_id: ''
  });
  const [showAddMoney, setShowAddMoney] = useState(false);
  const [siteConfig, setSiteConfig] = useState(null);
  const [depositForm, setDepositForm] = useState({ amount: '', utr_number: '' });
  const selectedGameId = formData.selected_game === 'bgmi'
    ? formData.bgmi_id
    : formData.selected_game === 'freefire'
      ? formData.freefire_id
      : formData.selected_game === 'fifa'
        ? formData.fifa_id
        : '';
  const isGameIdentityComplete = Boolean(formData.selected_game && selectedGameId?.trim());
  const isAccountDetailsComplete = Boolean(formData.mobile_number?.trim());

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
        selected_game: profileData.selected_game || '',
        bgmi_id: profileData.bgmi_id || '',
        freefire_id: profileData.freefire_id || '',
        fifa_id: profileData.fifa_id || '',
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
      notify('Profile updated successfully!');
      fetchProfile();
    } catch (error) {
      notify('Update failed: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logoutFromCognito(profile?.email);
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
          <AlertTriangle className="mx-auto mb-4 h-16 w-16 text-amber-500" aria-hidden="true" />
          <h2 className="text-xl font-black text-gray-900 mb-2">Fetch Failed</h2>
          <p className="text-gray-500 mb-6 font-medium">We couldn't load your profile details. Please check your connection or try again.</p>
          <Button
            onClick={() => { setLoading(true); fetchProfile(); }}
            className="w-full"
          >
            <span className="inline-flex items-center gap-2"><RotateCw className="h-4 w-4" aria-hidden="true" />Retry Connection</span>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Premium Header */}
      <div className="bg-gradient-to-br from-slate-950 via-slate-800 to-amber-950 text-white shadow-2xl overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-500/20 rounded-full -ml-24 -mb-24 blur-3xl"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-16 relative z-10 flex flex-col md:flex-row items-center md:items-start gap-8">
          <div className="relative group">
            <div className="w-24 h-24 sm:w-32 sm:h-32 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border-4 border-white/30 shadow-2xl transition-transform group-hover:scale-105">
              <User className="h-12 w-12 sm:h-16 sm:w-16" aria-hidden="true" />
            </div>
          </div>

          <div className="text-center md:text-left">
            <h1 className="flex items-center justify-center gap-2 text-3xl sm:text-4xl md:text-5xl font-black tracking-tight mb-2 md:justify-start">
              {profile.username}
              {profile.game_id_status === 'approved' && <ShieldCheck className="h-6 w-6 text-emerald-300 sm:h-7 sm:w-7" aria-label="Verified player" />}
            </h1>
            <p className="text-amber-100 text-lg sm:text-xl opacity-90 font-medium mb-4">{profile.email}</p>
            <div className="flex flex-wrap justify-center md:justify-start gap-3">
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-2 rounded-xl flex items-center gap-2">
                <span className="text-sm font-bold opacity-70 uppercase tracking-widest">Player UUID:</span>
                <span className="font-mono text-sm">{profile.player_uuid?.split('-')[0]}...</span>
              </div>
              <div className="bg-emerald-500/20 backdrop-blur-sm border border-emerald-500/30 px-4 py-2 rounded-xl flex items-center gap-2">
                <Wallet className="h-4 w-4 text-emerald-400" aria-hidden="true" />
                <span className="font-black">₹{balance.toFixed(2)}</span>
              </div>
              <Button
                onClick={() => navigate('/wallet/add-money')}
                className="bg-white !text-gray-900 hover:bg-gray-100"
              >
                <span className="inline-flex items-center gap-2"><Plus className="h-4 w-4" aria-hidden="true" />Add Money</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 -mt-8 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

          {/* Main Form Area */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-[1.25rem] shadow-2xl border border-slate-200 overflow-hidden">

              {/* Profile Stepper */}
              <div className="border-b border-gray-100 bg-slate-50/80 px-4 py-5 sm:px-8">
                <div className="relative flex items-start justify-between">
                  <div className="absolute left-[18%] right-[18%] top-5 h-1 overflow-hidden rounded-full bg-slate-200" aria-hidden="true">
                    <div className={`h-full rounded-full bg-amber-400 transition-all duration-500 ${isGameIdentityComplete ? 'w-full' : 'w-0'}`} />
                  </div>
                {[
                  { id: 'games', label: 'Game Identity', caption: 'Game IDs', icon: Gamepad2, complete: isGameIdentityComplete },
                  { id: 'account', label: 'Account Details', caption: 'Bank & KYC details', icon: Banknote, complete: isAccountDetailsComplete }
                ].map(tab => (
                  <Button
                    key={tab.id}
                    onClick={() => {
                      if (tab.id === 'games' || isGameIdentityComplete) setActiveTab(tab.id);
                    }}
                    disabled={tab.id === 'account' && !isGameIdentityComplete}
                    title={tab.id === 'account' && !isGameIdentityComplete ? 'Complete Game Identity first' : `Open ${tab.label}`}
                    variant="ghost"
                    className={`relative z-10 flex flex-1 !h-auto flex-col gap-2 py-0 text-center !text-slate-500 ${activeTab === tab.id ? '!text-amber-800' : ''} ${tab.id === 'account' && !isGameIdentityComplete ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                  >
                    <span className={`flex h-10 w-10 items-center justify-center rounded-full border-2 bg-white text-sm font-black transition-all duration-300 ${activeTab === tab.id ? 'scale-110 border-amber-500 text-amber-800 ring-4 ring-amber-100' : tab.complete && activeTab !== tab.id ? 'border-amber-500 bg-amber-400 text-stone-950' : 'border-slate-300 text-slate-500'}`}>
                      {tab.complete && activeTab !== tab.id ? <CheckCircle className="h-5 w-5" aria-hidden="true" /> : <span>{tab.id === 'games' ? '1' : '2'}</span>}
                    </span>
                    <span className={`text-xs font-bold sm:text-sm ${activeTab === tab.id ? 'font-black' : tab.complete ? 'text-slate-700' : 'text-slate-400'}`}>{tab.label}</span>
                    <span className="text-[10px] font-medium text-slate-400 sm:text-xs">{tab.caption}</span>
                  </Button>
                ))}
                </div>
              </div>

              <form onSubmit={handleUpdate} className="p-8 sm:p-10">

                {/* Game IDs Section */}
                {activeTab === 'games' && (
                  <div className="space-y-8 rounded-2xl bg-slate-50/60 p-1 animate-fadeIn">
                    <div className="flex items-center justify-between mb-2">
                      <h2 className="text-2xl font-black text-gray-900">Game Information</h2>
                      {getStatusBadge(profile.game_id_status, profile.game_id_rejection_reason)}
                    </div>

                    <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Primary Tournament Game</label>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { value: 'bgmi', label: 'BGMI', icon: '🎯', tone: 'from-purple-50 to-indigo-50' },
                          { value: 'freefire', label: 'Free Fire', icon: '🔥', tone: 'from-orange-50 to-amber-50' },
                          { value: 'fifa', label: 'FIFA', icon: '⚽', tone: 'from-blue-50 to-sky-50' },
                        ].map((game) => (
                          <button
                            key={game.value}
                            type="button"
                            onClick={() => setFormData({ ...formData, selected_game: game.value })}
                            className={`rounded-xl border p-3 text-center transition-all hover:-translate-y-0.5 hover:shadow-md ${formData.selected_game === game.value ? `border-amber-400 bg-gradient-to-br ${game.tone} shadow-md ring-2 ring-amber-100` : 'border-slate-200 bg-slate-50 hover:border-amber-200'}`}
                          >
                            <span className="block text-2xl">{game.icon}</span>
                            <span className="mt-1 block text-xs font-bold text-slate-700 sm:text-sm">{game.label}</span>
                            {formData.selected_game === game.value && <CheckCircle className="mx-auto mt-1 h-4 w-4 text-emerald-600" aria-hidden="true" />}
                          </button>
                        ))}
                      </div>
                      <p className="text-sm text-gray-500">Choose a game and enter its ID below. Team invitations will use the ID for the tournament game.</p>
                    </div>

                    <div className="grid grid-cols-1 gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-3">
                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">BGMI IGN</label>
                        <input
                          type="text"
                          className={`w-full rounded-xl border-2 bg-gray-50 px-4 py-4 font-bold text-gray-800 outline-none transition-all focus:border-purple-500 ${formData.selected_game === 'bgmi' && !formData.bgmi_id ? 'border-amber-300 ring-4 ring-amber-100' : 'border-transparent'}`}
                          placeholder="Your BGMI ID"
                          required={formData.selected_game === 'bgmi'}
                          value={formData.bgmi_id}
                          onChange={(e) => setFormData({ ...formData, bgmi_id: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Free Fire ID</label>
                        <input
                          type="text"
                          className={`w-full rounded-xl border-2 bg-gray-50 px-4 py-4 font-bold text-gray-800 outline-none transition-all focus:border-orange-500 ${formData.selected_game === 'freefire' && !formData.freefire_id ? 'border-amber-300 ring-4 ring-amber-100' : 'border-transparent'}`}
                          placeholder="Your FF ID"
                          required={formData.selected_game === 'freefire'}
                          value={formData.freefire_id}
                          onChange={(e) => setFormData({ ...formData, freefire_id: e.target.value })}
                        />
                        <p className="text-[11px] leading-4 text-slate-400">Optional — add later to join Free Fire tournaments.</p>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">FIFA EA ID</label>
                        <input
                          type="text"
                          className={`w-full rounded-xl border-2 bg-gray-50 px-4 py-4 font-bold text-gray-800 outline-none transition-all focus:border-blue-500 ${formData.selected_game === 'fifa' && !formData.fifa_id ? 'border-amber-300 ring-4 ring-amber-100' : 'border-transparent'}`}
                          placeholder="Your EA ID"
                          required={formData.selected_game === 'fifa'}
                          value={formData.fifa_id}
                          onChange={(e) => setFormData({ ...formData, fifa_id: e.target.value })}
                        />
                        <p className="text-[11px] leading-4 text-slate-400">Optional — add later to join FIFA tournaments.</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 italic">Your selected game ID is used when joining a tournament or inviting teammates. Admin will verify game IDs before tournament entry.</p>
                    <Button type="button" onClick={() => setActiveTab('account')} className="w-full rounded-xl bg-amber-400 px-6 py-3 font-extrabold text-stone-950 shadow-lg shadow-amber-500/20 transition-all hover:-translate-y-0.5 hover:bg-amber-500 active:scale-95 sm:w-auto">
                      Continue to Account Details
                    </Button>
                  </div>
                )}

                {/* Account Section */}
                {activeTab === 'account' && (
                  <div className="space-y-8 rounded-2xl bg-slate-50/60 p-1 animate-fadeIn">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h2 className="text-2xl font-black text-gray-900">Account Details</h2>
                        <p className="text-sm text-gray-500 mt-1">Add your contact and payout details.</p>
                      </div>
                      {getStatusBadge(profile.payment_details_status, profile.payment_details_rejection_reason)}
                    </div>

                    <div className="grid grid-cols-1 gap-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-2">
                      <div className="space-y-2 md:col-span-2">
                        <label className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest">
                          <Smartphone className="h-4 w-4 text-amber-600" aria-hidden="true" /> Mobile Number
                        </label>
                        <input
                          type="tel"
                          className={`w-full rounded-xl border-2 bg-gray-50 px-4 py-4 font-bold text-gray-800 outline-none transition-all focus:border-amber-500 ${activeTab === 'account' && !formData.mobile_number ? 'border-amber-300 ring-4 ring-amber-100' : 'border-transparent'}`}
                          value={formData.mobile_number}
                          onChange={(e) => setFormData({ ...formData, mobile_number: e.target.value })}
                          placeholder="Enter your 10-digit mobile number"
                          required
                        />
                      </div>
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
                <div className="mt-12 flex flex-col gap-4 border-t border-gray-100 pt-8 sm:flex-row">
                  <Button
                    type="submit"
                    disabled={saving}
                    className="h-16 flex-[2] rounded-xl bg-amber-400 font-extrabold text-stone-950 shadow-lg shadow-amber-500/20 transition-all hover:-translate-y-0.5 hover:bg-amber-500 active:scale-95"
                  >
                    {saving ? (
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <span className="inline-flex items-center gap-2"><CheckCircle className="h-4 w-4" aria-hidden="true" />Save Changes &amp; Verify</span>
                    )}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => fetchProfile()}
                    variant="secondary"
                    className="h-16 flex-1 rounded-xl transition-all hover:-translate-y-0.5 active:scale-95"
                  >
                    Discard
                  </Button>
                </div>

              </form>
            </div>
          </div>

          {/* Quick Stats Sidebar */}
          <div className="lg:col-span-1 space-y-8">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
              <h3 className="text-xl font-black text-gray-900 mb-6">Wallet Highlights</h3>
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Available Funds</p>
                  <p className="text-3xl font-black text-gray-900">₹{balance.toFixed(2)}</p>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <Button onClick={() => navigate('/wallet/add-money')} variant="outline" className="group flex h-auto items-center justify-start gap-2 rounded-xl p-4 text-left !text-gray-700 text-xs uppercase tracking-widest transition-all hover:-translate-y-0.5 hover:bg-amber-50">
                    <Plus className="h-4 w-4 text-amber-600 transition-transform group-hover:scale-110" aria-hidden="true" />Add Money
                  </Button>
                  <Button onClick={() => navigate('/wallet/transactions')} variant="outline" className="group flex h-auto items-center justify-start gap-2 rounded-xl p-4 text-left !text-gray-700 text-xs uppercase tracking-widest transition-all hover:-translate-y-0.5 hover:bg-amber-50">
                    <History className="h-4 w-4 text-slate-500 transition-transform group-hover:scale-110" aria-hidden="true" />History
                  </Button>
                  <Button onClick={() => navigate('/withdraw')} variant="outline" className="group col-span-2 flex h-auto items-center justify-start gap-2 rounded-xl p-4 text-left !text-gray-700 text-xs uppercase tracking-widest transition-all hover:-translate-y-0.5 hover:bg-amber-50">
                    <CircleDollarSign className="h-4 w-4 text-emerald-600 transition-transform group-hover:scale-110" aria-hidden="true" />Withdraw
                  </Button>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
              <h3 className="text-xl font-black text-gray-900 mb-6">Security</h3>
              <div className="space-y-4">
                <div className="flex cursor-pointer items-center gap-4 rounded-xl p-2 transition-colors hover:bg-amber-50 group" onClick={() => navigate('/forgot-password')}>
                  <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform"><LockKeyhole className="h-5 w-5" aria-hidden="true" /></div>
                  <div>
                    <h4 className="font-bold text-gray-900">Reset Password</h4>
                    <p className="text-xs text-gray-400">Changed recently?</p>
                  </div>
                </div>
                <hr className="border-gray-50" />
                <div className="flex cursor-pointer items-center gap-4 rounded-xl p-2 transition-colors hover:bg-red-50 group" onClick={handleLogout}>
                  <div className="w-12 h-12 bg-red-100 text-red-600 rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform"><LogOut className="h-5 w-5" aria-hidden="true" /></div>
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

      {/* ADD MONEY MODAL (Manual UPI) */}
      {showAddMoney && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] max-w-lg w-full overflow-hidden shadow-2xl border border-white/20 animate-in zoom-in-95 duration-300">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-8 text-white relative">
              <Button onClick={() => setShowAddMoney(false)} variant="ghost" size="icon" className="absolute top-6 right-6 !text-white/80 hover:!text-white" aria-label="Close add money dialog"><X className="h-5 w-5" aria-hidden="true" /></Button>
              <h3 className="flex items-center gap-2 text-3xl font-black italic tracking-tighter"><Rocket className="h-7 w-7" aria-hidden="true" />ADD MONEY</h3>
              <p className="text-emerald-100 font-bold text-xs uppercase tracking-widest mt-1">Manual UPI Verification</p>
            </div>

            <div className="p-8 space-y-8">
              {/* UPI Details Display */}
              <div className="bg-emerald-50 rounded-3xl p-6 border-2 border-emerald-100 text-center">
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-3">Scan & Pay via any UPI App</p>
                {siteConfig?.qr_code ? (
                  <img src={siteConfig.qr_code} alt="UPI QR" className="w-48 h-48 mx-auto rounded-2xl shadow-inner mb-4 border-4 border-white" />
                ) : (
                  <div className="w-48 h-48 mx-auto bg-white rounded-2xl flex items-center justify-center mb-4 shadow-inner"><Camera className="h-12 w-12 text-gray-400" aria-hidden="true" /></div>
                )}
                <div className="bg-white py-3 px-4 rounded-xl inline-flex items-center gap-3 border border-emerald-200">
                  <span className="font-black text-emerald-700">{siteConfig?.upi_id || 'Loading...'}</span>
                  <Button onClick={() => { navigator.clipboard.writeText(siteConfig?.upi_id); notify('UPI ID copied!'); }} variant="link" className="h-auto p-0 text-[10px] font-black uppercase">Copy</Button>
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
                    if (!depositForm.amount || !depositForm.utr_number) return notify('Please fill all details', { variant: 'destructive' });
                    try {
                      await walletService.submitDepositRequest(depositForm);
                      notify('Request submitted! Now send screenshot on WhatsApp.');
                      const wpMsg = encodeURIComponent(`Hi Admin, I just added ₹${depositForm.amount} to my wallet. UTR: ${depositForm.utr_number}. Please verify. Username: ${profile.username}`);
                      window.open(`https://wa.me/${siteConfig?.whatsapp_number?.replace(/\+/g, '')}?text=${wpMsg}`, '_blank');
                      setShowAddMoney(false);
                    } catch (e) { notify(e.message, { variant: 'destructive' }); }
                  }}
                  className="w-full py-5 text-[10px] uppercase tracking-[0.2em]"
                >
                  <span className="inline-flex items-center gap-2"><Smartphone className="h-4 w-4" aria-hidden="true" />Submit &amp; Send Screenshot</span>
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
