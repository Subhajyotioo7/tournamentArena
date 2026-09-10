import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';

const games = [
  { name: 'BGMI', detail: 'Squad and solo brackets', image: 'https://wallpapercave.com/wp/wp7902961.jpg', tone: 'from-[#0D0F12]/90' },
  { name: 'FIFA', detail: 'Ranked football rooms', image: 'https://wallpapercave.com/wp/wp8729980.jpg', tone: 'from-[#0D0F12]/90' },
  { name: 'Free Fire', detail: 'High-speed qualifiers', image: 'https://wallpapercave.com/wp/wp6126238.jpg', tone: 'from-[#0D0F12]/90' },
];

const featuredTournaments = [
  { game: 'BGMI', title: 'Weekend Squad Series', entry: '₹50', prize: '₹5,000', slots: '20 / 25', status: 'Registration open', tone: 'text-[#8E9AA8]' },
  { game: 'FIFA', title: 'Champions Solo Cup', entry: '₹20', prize: '₹2,000', slots: '8 / 16', status: 'Registration open', tone: 'text-[#8E9AA8]' },
];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0D0F12] text-[#FFFFFF]">
      <main>
        <section className="relative overflow-hidden border-b border-white/10 bg-[#0D0F12]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_18%,rgba(255,85,0,0.16),transparent_26%),linear-gradient(135deg,rgba(26,29,36,0.2),transparent_58%)]" />
          <div className="relative mx-auto grid min-h-[570px] max-w-7xl items-center gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:px-10 lg:py-20">
            <div>
              <div className="mb-7 flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.28em] text-sky-300">
                <span className="h-2 w-2 bg-[#FF5500] shadow-[0_0_18px_rgba(255,85,0,0.9)]" />
                Tournament Arena / Competitive network
              </div>
              <h1 className="max-w-3xl text-5xl font-black leading-[0.95] tracking-[-0.04em] sm:text-6xl lg:text-8xl">
                Own the<br /><span className="text-[#FF5500]">bracket.</span>
              </h1>
              <p className="mt-7 max-w-xl text-base leading-7 text-[#8E9AA8] sm:text-lg">
                Enter verified competitions, secure your place, and play every round with the clarity serious players expect.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Button onClick={() => navigate('/')} size="lg" className="uppercase tracking-wider">
                  View open brackets <span className="ml-3">-&gt;</span>
                </Button>
                <Button onClick={() => navigate('/register')} variant="outline" size="lg">
                  Join the roster
                </Button>
              </div>
              <div className="mt-12 flex flex-wrap gap-x-8 gap-y-4 border-t border-white/10 pt-5 text-xs text-[#8E9AA8]">
                <span><strong className="text-white">24/7</strong> match access</span>
                <span><strong className="text-white">Verified</strong> brackets</span>
                <span><strong className="text-white">Fast</strong> settlements</span>
              </div>
            </div>

            <div className="relative hidden lg:block">
              <div className="absolute -inset-5 border border-[#FF5500]/20" />
              <div className="relative border border-white/10 bg-[#1A1D24]/95 p-5 shadow-2xl">
                <div className="mb-8 flex items-center justify-between border-b border-white/10 pb-4">
                  <div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8E9AA8]">Match control</p><p className="mt-1 font-bold">Open competition</p></div>
                  <span className="flex items-center gap-2 text-[10px] font-bold uppercase text-[#FF5500]"><span className="h-2 w-2 rounded-full bg-[#FF5500]" />Open</span>
                </div>
                {featuredTournaments.map((tournament) => (
                  <div key={tournament.title} className="mb-3 border border-white/10 bg-white/[0.03] p-4 last:mb-0">
                    <div className="flex items-start justify-between gap-4"><div><p className={`text-[10px] font-bold uppercase tracking-widest ${tournament.tone}`}>{tournament.game}</p><h3 className="mt-1 font-bold">{tournament.title}</h3></div><span className="text-[10px] text-[#FF5500]">Open</span></div>
                    <div className="mt-5 grid grid-cols-3 gap-3 text-xs"><span><b className="block text-[#FFFFFF]">{tournament.entry}</b><small className="text-[#8E9AA8]">Entry</small></span><span><b className="block text-[#FFFFFF]">{tournament.prize}</b><small className="text-[#8E9AA8]">Prize pool</small></span><span><b className="block text-[#FFFFFF]">{tournament.slots}</b><small className="text-[#8E9AA8]">Players</small></span></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#1A1D24] px-5 py-16 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8 flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#FF5500]">Choose your discipline</p><h2 className="mt-2 text-3xl font-bold tracking-tight">Find your next proving ground.</h2></div><p className="max-w-sm text-sm leading-6 text-[#8E9AA8]">Every room has a clear entry, a visible prize pool, and a defined path to the final.</p></div>
            <div className="grid gap-4 md:grid-cols-3">
              {games.map((game) => (
                <Button key={game.name} onClick={() => navigate('/')} variant="ghost" className="group relative h-auto min-h-52 overflow-hidden border border-white/10 p-0 text-left text-white hover:border-[#FF5500] hover:bg-transparent">
                  <img src={game.image} alt={game.name} className="absolute inset-0 h-full w-full object-cover opacity-60 transition duration-500 group-hover:scale-105 group-hover:opacity-75" />
                  <div className={`absolute inset-0 bg-gradient-to-t ${game.tone} via-[#0D0F12]/35 to-[#0D0F12]/75`} />
                  <div className="relative flex h-full min-h-52 flex-col justify-end p-5"><p className="text-2xl font-black tracking-tight">{game.name}</p><p className="mt-1 text-sm text-white/75">{game.detail}</p><span className="mt-5 text-[10px] font-bold uppercase tracking-[0.2em] text-white/80">View tournaments -&gt;</span></div>
                </Button>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#0D0F12] px-5 py-16 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-7xl border-y border-white/10 py-8"><div className="grid gap-8 text-center sm:grid-cols-3 sm:divide-x sm:divide-white/10"><div><p className="text-3xl font-black text-[#FFFFFF]">100%</p><p className="mt-1 text-xs uppercase tracking-widest text-[#8E9AA8]">Entry transparency</p></div><div><p className="text-3xl font-black text-[#FF5500]">Live</p><p className="mt-1 text-xs uppercase tracking-widest text-[#8E9AA8]">Room status updates</p></div><div><p className="text-3xl font-black text-[#FFFFFF]">Secure</p><p className="mt-1 text-xs uppercase tracking-widest text-[#8E9AA8]">Wallet transactions</p></div></div></div>
        </section>
      </main>
      <footer className="border-t border-white/10 bg-[#0D0F12] px-5 py-6 text-center text-xs text-[#8E9AA8] sm:px-8"><span className="font-bold text-[#FFFFFF]">Tournament Arena</span> <span className="mx-2">/</span> Verified competition, built for players.</footer>
    </div>
  );
}
