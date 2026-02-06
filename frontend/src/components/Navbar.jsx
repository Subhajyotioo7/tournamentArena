import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";

export default function Navbar() {
  const { isLoggedIn, logout, user } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isAdmin = user?.is_staff || user?.is_superuser;

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileMenuOpen(false);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2" onClick={closeMobileMenu}>
            <span className="text-2xl sm:text-3xl">🏆</span>
            <span className="text-base sm:text-xl font-extrabold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Tournament Arena
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center gap-6">
            <Link
              to="/"
              className="text-gray-700 hover:text-purple-600 font-medium transition-colors"
            >
              Tournaments
            </Link>

            {isLoggedIn && (
              <>
                <Link
                  to="/wallet/transactions"
                  className="text-gray-700 hover:text-purple-600 font-medium transition-colors"
                >
                  Wallet
                </Link>

                <Link
                  to="/my-rooms"
                  className="text-gray-700 hover:text-purple-600 font-medium transition-colors"
                >
                  My Rooms
                </Link>

                <Link
                  to="/my-invitations"
                  className="text-gray-700 hover:text-purple-600 font-medium transition-colors"
                >
                  Invitations
                </Link>

                <Link
                  to="/profile"
                  className="text-gray-700 hover:text-purple-600 font-medium transition-colors"
                >
                  Profile
                </Link>

                {isAdmin && (
                  <Link
                    to="/admin"
                    className="text-gray-700 hover:text-purple-600 font-medium transition-colors"
                  >
                    Admin
                  </Link>
                )}

                <button
                  onClick={handleLogout}
                  className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-4 py-2 rounded-lg font-semibold hover:from-red-600 hover:to-pink-600 transition-all"
                >
                  Logout
                </button>
              </>
            )}

            {!isLoggedIn && (
              <>
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-purple-600 font-medium transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Toggle mobile menu"
          >
            <svg
              className="w-6 h-6 text-gray-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {mobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-gray-200 animate-fade-in">
            <div className="flex flex-col space-y-3">
              <Link
                to="/"
                onClick={closeMobileMenu}
                className="text-gray-700 hover:text-purple-600 font-medium transition-colors py-2 px-4 rounded-lg hover:bg-gray-50"
              >
                Tournaments
              </Link>

              {isLoggedIn && (
                <>
                  <Link
                    to="/wallet/transactions"
                    onClick={closeMobileMenu}
                    className="text-gray-700 hover:text-purple-600 font-medium transition-colors py-2 px-4 rounded-lg hover:bg-gray-50"
                  >
                    Wallet
                  </Link>

                  <Link
                    to="/my-rooms"
                    onClick={closeMobileMenu}
                    className="text-gray-700 hover:text-purple-600 font-medium transition-colors py-2 px-4 rounded-lg hover:bg-gray-50"
                  >
                    My Rooms
                  </Link>

                  <Link
                    to="/my-invitations"
                    onClick={closeMobileMenu}
                    className="text-gray-700 hover:text-purple-600 font-medium transition-colors py-2 px-4 rounded-lg hover:bg-gray-50"
                  >
                    Invitations
                  </Link>

                  <Link
                    to="/profile"
                    onClick={closeMobileMenu}
                    className="text-gray-700 hover:text-purple-600 font-medium transition-colors py-2 px-4 rounded-lg hover:bg-gray-50"
                  >
                    Profile
                  </Link>

                  {isAdmin && (
                    <Link
                      to="/admin"
                      onClick={closeMobileMenu}
                      className="text-gray-700 hover:text-purple-600 font-medium transition-colors py-2 px-4 rounded-lg hover:bg-gray-50"
                    >
                      Admin
                    </Link>
                  )}

                  <button
                    onClick={handleLogout}
                    className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-4 py-3 rounded-lg font-semibold hover:from-red-600 hover:to-pink-600 transition-all text-left"
                  >
                    Logout
                  </button>
                </>
              )}

              {!isLoggedIn && (
                <>
                  <Link
                    to="/login"
                    onClick={closeMobileMenu}
                    className="text-gray-700 hover:text-purple-600 font-medium transition-colors py-2 px-4 rounded-lg hover:bg-gray-50"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    onClick={closeMobileMenu}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all text-center"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
