import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';
import { buttonVariants } from './ui/button-variants';
import { Trophy } from 'lucide-react';

const navLinkClass = 'text-sm font-medium text-gray-700 transition-colors hover:text-[#FF5500]';
const mobileLinkClass = 'rounded-md px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-[#FF5500]';

export default function Navbar() {
  const { isLoggedIn, logout, user } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isAdmin = user?.is_staff || user?.is_superuser;

  const closeMobileMenu = () => setMobileMenuOpen(false);
  const handleLogout = () => {
    logout();
    closeMobileMenu();
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2" onClick={closeMobileMenu}>
            <Trophy className="h-5 w-5" aria-hidden="true" />
            <span className="text-base font-bold tracking-tight text-gray-950 sm:text-lg">Tournament Arena</span>
          </Link>

          <div className="hidden items-center gap-6 lg:flex">
            <Link to="/" className={navLinkClass}>Tournaments</Link>
            {isLoggedIn && (
              <>
                <Link to="/wallet/transactions" className={navLinkClass}>Wallet</Link>
                <Link to="/my-rooms" className={navLinkClass}>My Rooms</Link>
                <Link to="/my-invitations" className={navLinkClass}>Create Team</Link>
                <Link to="/profile" className={navLinkClass}>Profile</Link>
                {isAdmin && <Link to="/admin" className={navLinkClass}>Admin</Link>}
                <Button onClick={handleLogout} variant="outline" size="sm">Logout</Button>
              </>
            )}
            {!isLoggedIn && (
              <>
                <Link to="/login" className={navLinkClass}>Login</Link>
                <Link to="/register" className={buttonVariants({ size: 'sm' })}>Sign Up</Link>
              </>
            )}
          </div>

          <Button
            onClick={() => setMobileMenuOpen((open) => !open)}
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label="Toggle mobile menu"
            aria-expanded={mobileMenuOpen}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </Button>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-gray-200 py-4 lg:hidden">
            <div className="flex flex-col gap-1">
              <Link to="/" onClick={closeMobileMenu} className={mobileLinkClass}>Tournaments</Link>
              {isLoggedIn && (
                <>
                  <Link to="/wallet/transactions" onClick={closeMobileMenu} className={mobileLinkClass}>Wallet</Link>
                  <Link to="/my-rooms" onClick={closeMobileMenu} className={mobileLinkClass}>My Rooms</Link>
                  <Link to="/my-invitations" onClick={closeMobileMenu} className={mobileLinkClass}>Create Team</Link>
                  <Link to="/profile" onClick={closeMobileMenu} className={mobileLinkClass}>Profile</Link>
                  {isAdmin && <Link to="/admin" onClick={closeMobileMenu} className={mobileLinkClass}>Admin</Link>}
                  <Button onClick={handleLogout} variant="outline" className="mt-2 w-full justify-start">Logout</Button>
                </>
              )}
              {!isLoggedIn && (
                <>
                  <Link to="/login" onClick={closeMobileMenu} className={mobileLinkClass}>Login</Link>
                  <Link to="/register" onClick={closeMobileMenu} className={buttonVariants({ className: 'mt-2 w-full' })}>Sign Up</Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
