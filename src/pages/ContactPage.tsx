import { useState, type FormEvent } from 'react';
import { CheckCircle2, Mail, MapPin, Phone } from 'lucide-react';
import EditorialHeader from '../components/ui/EditorialHeader';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('General Foundation Inquiry');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) || !message.trim()) {
      setError('Please complete your name, valid email, and inquiry message.');
      return;
    }
    setError('');
    setSent(true);
  };

  return (
    <main className="bg-[#F7F4EE]">
      <EditorialHeader
        eyebrow="Regional Desks & Support"
        title="Contact the Aurelia Sanctuary"
        description="Reach our clinical triage coordination desk, philanthropy advisors, or regional partner teams."
      />

      <section className="py-20 max-w-[1320px] mx-auto px-6 md:px-10 grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#EAE5DC]/70 border border-[#242824]/12 p-7 space-y-5">
            <h2 className="font-serif text-2xl font-medium text-[#242824]">
              Sanctuary Coordination Desks (Demo)
            </h2>
            <div className="space-y-4 text-sm text-[#242824]/80">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-[#183D32] shrink-0 mt-1" aria-hidden="true" />
                <div>
                  <p className="font-medium text-[#242824]">European Stewardship Office</p>
                  <p>Rue du Rhône 42, 1204 Geneva, Switzerland</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-[#183D32] shrink-0 mt-1" aria-hidden="true" />
                <div>
                  <p className="font-medium text-[#242824]">Hospital Triage Line (Demo)</p>
                  <p className="font-mono">+41 22 555 0184</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-[#183D32] shrink-0 mt-1" aria-hidden="true" />
                <div>
                  <p className="font-medium text-[#242824]">Direct Correspondence</p>
                  <p>stewardship@aurelia-sanctuary.example</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 bg-[#EAE5DC]/45 border border-[#242824]/14 p-7 md:p-10">
          {sent ? (
            <div className="space-y-4">
              <CheckCircle2 className="w-7 h-7 text-[#183D32]" aria-hidden="true" />
              <h3 className="font-serif text-3xl text-[#242824]">
                Message Previewed (Demo Mode)
              </h3>
              <p className="text-sm text-[#242824]/75">
                Thank you, {name}. In this frontend showcase, messages are validated locally without dispatching external email.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSent(false);
                  setName('');
                  setEmail('');
                  setMessage('');
                }}
                className="px-5 py-2.5 bg-[#183D32] text-[#F7F4EE] text-xs font-semibold uppercase tracking-[0.14em] cursor-pointer"
              >
                Send Another Note
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              <h2 className="font-serif text-3xl font-medium text-[#242824]">
                Send an Inquiry
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="c-name" className="block text-xs font-medium text-[#242824]/80 mb-1.5">
                    Your Name *
                  </label>
                  <input
                    id="c-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#F7F4EE] border border-[#242824]/20 text-sm focus:outline-none focus:border-[#183D32]"
                  />
                </div>
                <div>
                  <label htmlFor="c-email" className="block text-xs font-medium text-[#242824]/80 mb-1.5">
                    Email Address *
                  </label>
                  <input
                    id="c-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#F7F4EE] border border-[#242824]/20 text-sm focus:outline-none focus:border-[#183D32]"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="c-subject" className="block text-xs font-medium text-[#242824]/80 mb-1.5">
                  Topic
                </label>
                <select
                  id="c-subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#F7F4EE] border border-[#242824]/20 text-sm focus:outline-none focus:border-[#183D32]"
                >
                  <option>General Foundation Inquiry</option>
                  <option>Veterinary Hospital Partnership</option>
                  <option>Legacy &amp; Endowment Giving</option>
                  <option>Press &amp; Editorial</option>
                </select>
              </div>
              <div>
                <label htmlFor="c-message" className="block text-xs font-medium text-[#242824]/80 mb-1.5">
                  Message *
                </label>
                <textarea
                  id="c-message"
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#F7F4EE] border border-[#242824]/20 text-sm focus:outline-none focus:border-[#183D32]"
                />
              </div>
              {error && <p className="text-xs text-[#9A3412]">{error}</p>}
              <button
                type="submit"
                className="px-6 py-3 bg-[#183D32] text-[#F7F4EE] text-xs font-semibold uppercase tracking-[0.14em] cursor-pointer"
              >
                Submit Inquiry (Demo)
              </button>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
