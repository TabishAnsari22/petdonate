import { useState, type FormEvent } from 'react';
import { CheckCircle2 } from 'lucide-react';
import EditorialHeader from '../components/ui/EditorialHeader';

const ROLES = [
  {
    index: '01',
    title: 'Post-Operative Respite Foster',
    detail:
      'Provide a quiet, calm household for pets recovering from orthopedic or soft-tissue surgery when guardians face temporary hospitalization or housing disruption.',
  },
  {
    index: '02',
    title: 'Sanctuary Circle Benefactor',
    detail:
      'Join our monthly patronage circle underwriting overnight emergency reserves across regional specialist hospitals.',
  },
  {
    index: '03',
    title: 'Regional Hospital Liaison',
    detail:
      'Assist local veterinary social workers and families in preparing itemized clinical estimates for rapid triage review.',
  },
];

export default function GetInvolvedPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [interest, setInterest] = useState(ROLES[0].title);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter your name and a valid email address.');
      return;
    }
    setError('');
    setSubmitted(true);
  };

  return (
    <main className="bg-[#F7F4EE]">
      <EditorialHeader
        eyebrow="Community & Patronage"
        title="Stand Beside Families in Their Hardest Night"
        description="Whether through monthly sanctuary patronage, post-operative fostering, or regional advocacy, your involvement turns emergency crisis into lasting recovery."
      />

      <section className="py-20 max-w-[1320px] mx-auto px-6 md:px-10 space-y-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {ROLES.map((r) => (
            <article key={r.index} className="bg-[#EAE5DC]/65 border border-[#242824]/12 p-8 space-y-4">
              <span className="font-serif text-3xl text-[#B99A64]">{r.index}</span>
              <h2 className="font-serif text-2xl font-medium text-[#242824]">{r.title}</h2>
              <p className="text-sm text-[#242824]/75 leading-relaxed">{r.detail}</p>
            </article>
          ))}
        </div>

        <div className="max-w-2xl bg-[#EAE5DC]/50 border border-[#242824]/14 p-8 md:p-10">
          {submitted ? (
            <div className="space-y-4">
              <CheckCircle2 className="w-7 h-7 text-[#183D32]" aria-hidden="true" />
              <h3 className="font-serif text-3xl text-[#242824]">
                Interest Recorded (Local Demo)
              </h3>
              <p className="text-sm text-[#242824]/75">
                Thank you, {name}. Your interest in <strong>{interest}</strong> has been acknowledged in this frontend demonstration.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSubmitted(false);
                  setName('');
                  setEmail('');
                  setNotes('');
                }}
                className="px-5 py-2.5 bg-[#183D32] text-[#F7F4EE] text-xs font-semibold uppercase tracking-[0.14em] cursor-pointer"
              >
                Submit Another Inquiry
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              <h2 className="font-serif text-3xl font-medium text-[#242824]">
                Express Interest
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="inv-name" className="block text-xs font-medium text-[#242824]/80 mb-1.5">
                    Full Name *
                  </label>
                  <input
                    id="inv-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#F7F4EE] border border-[#242824]/20 text-sm focus:outline-none focus:border-[#183D32]"
                  />
                </div>
                <div>
                  <label htmlFor="inv-email" className="block text-xs font-medium text-[#242824]/80 mb-1.5">
                    Email Address *
                  </label>
                  <input
                    id="inv-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#F7F4EE] border border-[#242824]/20 text-sm focus:outline-none focus:border-[#183D32]"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="inv-role" className="block text-xs font-medium text-[#242824]/80 mb-1.5">
                  Area of Involvement
                </label>
                <select
                  id="inv-role"
                  value={interest}
                  onChange={(e) => setInterest(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#F7F4EE] border border-[#242824]/20 text-sm focus:outline-none focus:border-[#183D32]"
                >
                  {ROLES.map((r) => (
                    <option key={r.title}>{r.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="inv-notes" className="block text-xs font-medium text-[#242824]/80 mb-1.5">
                  Background or Availability
                </label>
                <textarea
                  id="inv-notes"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#F7F4EE] border border-[#242824]/20 text-sm focus:outline-none focus:border-[#183D32]"
                />
              </div>
              {error && <p className="text-xs text-[#9A3412]">{error}</p>}
              <button
                type="submit"
                className="px-6 py-3 bg-[#183D32] text-[#F7F4EE] text-xs font-semibold uppercase tracking-[0.14em] cursor-pointer"
              >
                Send Demo Interest
              </button>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
