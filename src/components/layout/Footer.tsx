import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [error, setError] = useState('');

  const handleSubscribe = (e: FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    setError('');
    setSubscribed(true);
    setEmail('');
  };

  return (
    <footer className="bg-[#183D32] text-[#F7F4EE] border-t border-[#B99A64]/25">
      <div className="max-w-[1320px] mx-auto px-6 md:px-10 py-16 md:py-24">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 pb-14 border-b border-[#F7F4EE]/15">
          {/* Organization Manifesto */}
          <div className="md:col-span-4 space-y-5">
            <Link to="/" className="font-serif text-3xl font-medium tracking-tight text-[#F7F4EE]">
              Aurelia
            </Link>
            <p className="text-sm text-[#EAE5DC]/80 leading-relaxed max-w-sm">
              An international animal welfare foundation dedicated to rapid, direct-to-hospital emergency veterinary funding so no cherished life is lost to financial hardship.
            </p>
            <p className="text-xs text-[#A6B5A0] tracking-wide">
              Geneva · Edinburgh · Portland · Kyoto
            </p>
          </div>

          {/* Navigation Columns */}
          <div className="md:col-span-2 space-y-3">
            <h3 className="font-sans text-xs uppercase tracking-[0.18em] text-[#B99A64] font-semibold">
              Foundation
            </h3>
            <ul className="space-y-2.5 text-sm text-[#EAE5DC]/85">
              <li><Link to="/about" className="hover:text-[#F7F4EE] transition-colors">Our Mission</Link></li>
              <li><Link to="/campaigns" className="hover:text-[#F7F4EE] transition-colors">Emergency Cases</Link></li>
              <li><Link to="/success-stories" className="hover:text-[#F7F4EE] transition-colors">Success Stories</Link></li>
              <li><Link to="/transparency" className="hover:text-[#F7F4EE] transition-colors">Transparency</Link></li>
              <li><Link to="/faqs" className="hover:text-[#F7F4EE] transition-colors">FAQs</Link></li>
            </ul>
          </div>

          <div className="md:col-span-2 space-y-3">
            <h3 className="font-sans text-xs uppercase tracking-[0.18em] text-[#B99A64] font-semibold">
              Care &amp; Action
            </h3>
            <ul className="space-y-2.5 text-sm text-[#EAE5DC]/85">
              <li><Link to="/emergency-assistance" className="hover:text-[#F7F4EE] transition-colors">Emergency Help</Link></li>
              <li><Link to="/apply" className="hover:text-[#F7F4EE] transition-colors">Apply for Grant</Link></li>
              <li><Link to="/donate" className="hover:text-[#F7F4EE] transition-colors">Donate Now</Link></li>
              <li><Link to="/veterinary-partners" className="hover:text-[#F7F4EE] transition-colors">Vet Partners</Link></li>
              <li><Link to="/get-involved" className="hover:text-[#F7F4EE] transition-colors">Get Involved</Link></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="md:col-span-4 space-y-4">
            <h3 className="font-sans text-xs uppercase tracking-[0.18em] text-[#B99A64] font-semibold">
              The Sanctuary Dispatch
            </h3>
            <p className="text-sm text-[#EAE5DC]/80 leading-relaxed">
              Receive quarterly clinical outcomes, audited care allocations, and quiet stories of recovery.
            </p>
            {subscribed ? (
              <div className="flex items-start gap-2.5 p-3.5 bg-[#112C24] border border-[#A6B5A0]/35 text-sm text-[#F7F4EE]">
                <CheckCircle2 className="w-4 h-4 text-[#B99A64] shrink-0 mt-0.5" aria-hidden="true" />
                <span>
                  Subscribed in local demo preview. No external dispatch email is stored or transmitted.
                </span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} noValidate className="space-y-2">
                <div className="flex">
                  <label htmlFor="footer-newsletter" className="sr-only">
                    Email address for Sanctuary Dispatch
                  </label>
                  <input
                    id="footer-newsletter"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full px-3.5 py-2.5 text-sm bg-[#112C24] text-[#F7F4EE] placeholder:text-[#A6B5A0]/65 border border-[#F7F4EE]/20 focus:outline-none focus:border-[#B99A64]"
                  />
                  <button
                    type="submit"
                    aria-label="Subscribe to newsletter"
                    className="px-4 py-2.5 bg-[#B99A64] text-[#183D32] hover:bg-[#c8aa75] transition-colors cursor-pointer shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider"
                  >
                    Join
                    <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>
                {error && <p className="text-xs text-[#E8B8A8]">{error}</p>}
              </form>
            )}
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-[#A6B5A0]">
          <p>
            © 2026 Aurelia Sanctuary Foundation · Frontend Demonstration Showcase (Demo data &amp; local state only).
          </p>
          <div className="flex items-center gap-6">
            <Link to="/contact" className="hover:text-[#F7F4EE] transition-colors">Contact</Link>
            <Link to="/privacy" className="hover:text-[#F7F4EE] transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-[#F7F4EE] transition-colors">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
