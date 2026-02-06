export default function Landing() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* HERO SECTION */}
      <section className="relative min-h-[50vh] sm:h-[60vh] flex items-center justify-center bg-gradient-to-r from-purple-700 to-indigo-800 px-4">
        <div className="text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4">
            Play • Compete • Win 💰
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-200 max-w-2xl mx-auto px-4">
            Join tournaments for FIFA, BGMI, Free Fire, Valorant & more.
            Battle players & win real rewards!
          </p>

          <button className="mt-6 px-6 sm:px-8 py-3 bg-yellow-400 text-black rounded-lg font-bold hover:bg-yellow-300 transition text-sm sm:text-base">
            Join Now
          </button>
        </div>
      </section>

      {/* POPULAR GAMES */}
      <section className="py-8 sm:py-12 px-4 sm:px-6 md:px-16">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 sm:mb-8 text-center">
          Popular Games
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
          {/* FIFA */}
          <div className="bg-gray-900 rounded-xl shadow-lg overflow-hidden hover:scale-105 transition cursor-pointer">
            <img
              src="https://wallpapercave.com/wp/wp8729980.jpg"
              className="h-40 sm:h-48 md:h-52 w-full object-cover"
              alt="FIFA"
            />
            <div className="p-4 sm:p-5">
              <h3 className="text-xl sm:text-2xl font-bold">FIFA</h3>
              <p className="text-sm sm:text-base text-gray-400">Football e-sports tournaments</p>
            </div>
          </div>

          {/* BGMI */}
          <div className="bg-gray-900 rounded-xl shadow-lg overflow-hidden hover:scale-105 transition cursor-pointer">
            <img
              src="https://wallpapercave.com/wp/wp7902961.jpg"
              className="h-40 sm:h-48 md:h-52 w-full object-cover"
              alt="BGMI"
            />
            <div className="p-4 sm:p-5">
              <h3 className="text-xl sm:text-2xl font-bold">BGMI</h3>
              <p className="text-sm sm:text-base text-gray-400">Battle royale madness!</p>
            </div>
          </div>

          {/* Free Fire */}
          <div className="bg-gray-900 rounded-xl shadow-lg overflow-hidden hover:scale-105 transition cursor-pointer">
            <img
              src="https://wallpapercave.com/wp/wp6126238.jpg"
              className="h-40 sm:h-48 md:h-52 w-full object-cover"
              alt="Free Fire"
            />
            <div className="p-4 sm:p-5">
              <h3 className="text-xl sm:text-2xl font-bold">Free Fire</h3>
              <p className="text-sm sm:text-base text-gray-400">Fast-paced competitive rooms</p>
            </div>
          </div>
        </div>
      </section>

      {/* TOURNAMENT LIST */}
      <section className="py-8 sm:py-12 px-4 sm:px-6 md:px-16 bg-gray-900">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 sm:mb-8 text-center">
          Ongoing Tournaments
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {/* Tournament Card */}
          <div className="bg-gray-800 p-5 sm:p-6 rounded-xl shadow-lg">
            <h3 className="text-xl sm:text-2xl font-semibold">BGMI | Squad Tournament</h3>
            <p className="text-sm sm:text-base text-gray-400">Entry: ₹50 • Prize: ₹5000</p>
            <p className="text-sm sm:text-base text-gray-400">Slots: 20/25</p>

            <button className="mt-4 px-5 sm:px-6 py-2 bg-blue-600 rounded hover:bg-blue-500 font-bold text-sm sm:text-base w-full sm:w-auto">
              Join Tournament
            </button>
          </div>

          {/* Tournament Card */}
          <div className="bg-gray-800 p-5 sm:p-6 rounded-xl shadow-lg">
            <h3 className="text-xl sm:text-2xl font-semibold">FIFA 23 | Solo Cup</h3>
            <p className="text-sm sm:text-base text-gray-400">Entry: ₹20 • Prize: ₹2000</p>
            <p className="text-sm sm:text-base text-gray-400">Slots: 8/16</p>

            <button className="mt-4 px-5 sm:px-6 py-2 bg-blue-600 rounded hover:bg-blue-500 font-bold text-sm sm:text-base w-full sm:w-auto">
              Join Tournament
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="text-center py-6 mt-10 bg-black text-gray-400">
        © 2025 PlayZone Esports — All Rights Reserved
      </footer>
    </div>
  );
}
