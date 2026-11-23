import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

const NAV_LINKS = [
  { label: 'Home', to: '/' },
  { label: 'Our Mission', to: '/about' },
  { label: 'Emergency Help', to: '/emergency-assistance' },
  { label: 'Donate', to: '/donate' },
  { label: 'Success Stories', to: '/success-stories' },
  { label: 'Get Involved', to: '/get-involved' },
];

export default function Navbar() {
  const location = useLocation();
  const isHome = location.pathname === '/';
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 48);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const solidIvory = !isHome || scrolled || mobileOpen;

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-colors duration-300 ${
        solidIvory
          ? 'bg-[#F7F4EE] text-[#242824] border-b border-[#242824]/12'
          : 'bg-transparent text-[#242824] border-b border-transparent'
      }`}
    >
      <div className="max-w-[1320px] mx-auto px-6 md:px-10 h-16 md:h-20 flex items-center justify-between gap-8">
        {/* Zone 1: Single-line Brand Wordmark */}
        <Link
          to="/"
          className="font-serif text-2xl md:text-[26px] font-medium tracking-[-0.02em] text-[#183D32] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#183D32]"
        >
          Aurelia
        </Link>

        {/* Zone 2: Clean single-line editorial links */}
        <nav
          aria-label="Primary navigation"
          className="hidden lg:flex items-center gap-7 text-[13px] font-medium tracking-[0.02em] text-[#242824]"
        >
          {NAV_LINKS.map((item) => {
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`editorial-link whitespace-nowrap shrink-0 py-1 transition-colors ${
                  active ? 'text-[#183D32] font-semibold' : 'text-[#242824]/85 hover:text-[#183D32]'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Zone 3: Single Primary Action + Mobile Menu Trigger */}
        <div className="flex items-center gap-3 shrink-0">
          <Link
            to="/donate"
            className="hidden sm:inline-flex items-center justify-center px-5 py-2.5 text-xs font-semibold tracking-[0.14em] uppercase bg-[#183D32] text-[#F7F4EE] hover:bg-[#112C24] transition-colors whitespace-nowrap shrink-0"
          >
            Donate Now
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileOpen}
            className="lg:hidden inline-flex items-center justify-center w-10 h-10 border border-[#242824]/20 text-[#242824] hover:bg-[#EAE5DC] transition-colors cursor-pointer"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden bg-[#F7F4EE] border-t border-[#242824]/12 px-6 py-6">
          <nav aria-label="Mobile navigation" className="flex flex-col gap-3">
            {NAV_LINKS.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`py-2.5 text-base font-medium border-b border-[#242824]/10 ${
                  location.pathname === item.to ? 'text-[#183D32]' : 'text-[#242824]'
                }`}
              >
                {item.label}
              </Link>
            ))}
            <Link
              to="/campaigns"
              className="py-2.5 text-base font-medium border-b border-[#242824]/10 text-[#242824]"
            >
              Active Pet Cases
            </Link>
            <Link
              to="/donate"
              className="mt-3 inline-flex items-center justify-center px-5 py-3 text-xs font-semibold tracking-[0.14em] uppercase bg-[#183D32] text-[#F7F4EE]"
            >
              Donate Now
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
