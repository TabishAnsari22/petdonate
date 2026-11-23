import { useEffect, useState, type FormEvent } from 'react';
import { CheckCircle2, Heart, ShieldCheck } from 'lucide-react';
import { useSanctuary, type DonationRecord } from '../../context/SanctuaryContext';
import {
  calculateDonationSummary,
  formatCurrency,
  type DonationFrequency,
} from '../../lib/sanctuaryLogic';
import { EditorialReveal, SectionParallaxBand } from '../motion/EditorialMotion';

const PRESET_AMOUNTS = [10, 25, 50, 100, 250];

interface DonationStudioProps {
  initialCampaignId?: string | null;
  compact?: boolean;
}

export default function DonationStudio({
  initialCampaignId = null,
  compact = false,
}: DonationStudioProps) {
  const { campaigns, recordDonation, recentDonations } = useSanctuary();

  const [frequency, setFrequency] = useState<DonationFrequency>('one-time');
  const [selectedPreset, setSelectedPreset] = useState<number | 'custom'>(50);
  const [customAmount, setCustomAmount] = useState('75');
  const [campaignId, setCampaignId] = useState<string>(initialCampaignId ?? '');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [donorName, setDonorName] = useState('');
  const [donorEmail, setDonorEmail] = useState('');
  const [formError, setFormError] = useState('');
  const [confirmation, setConfirmation] = useState<DonationRecord | null>(null);

  useEffect(() => {
    if (initialCampaignId) {
      setCampaignId(initialCampaignId);
    }
  }, [initialCampaignId]);

  const numericAmount =
    selectedPreset === 'custom' ? Number(customAmount) || 0 : selectedPreset;
  const selectedCampaign = campaigns.find((c) => c.id === campaignId) ?? null;

  const summary = calculateDonationSummary({
    amount: numericAmount,
    frequency,
    isAnonymous,
    donorName,
    selectedCampaignTitle: selectedCampaign
      ? `${selectedCampaign.petName} (${selectedCampaign.breed})`
      : undefined,
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!summary.isValidAmount) {
      setFormError('Please select or enter a contribution between $5 and $250,000.');
      return;
    }
    if (!isAnonymous && !donorName.trim()) {
      setFormError('Please enter your name or select the anonymous donation option.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(donorEmail.trim())) {
      setFormError('Please provide a valid email address for your demo summary receipt.');
      return;
    }

    setFormError('');
    const record = recordDonation({
      amount: summary.amount,
      frequency,
      campaignId: campaignId || null,
      donorName,
      isAnonymous,
    });
    setConfirmation(record);
  };

  if (confirmation) {
    return (
      <div
        data-testid="donation-confirmation"
        className="bg-[#F7F4EE] border border-[#183D32]/25 p-8 md:p-12 space-y-6"
      >
        <div className="flex items-start gap-4">
          <CheckCircle2 className="w-7 h-7 text-[#183D32] shrink-0 mt-1" aria-hidden="true" />
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.2em] text-[#183D32] font-semibold">
              Demo Contribution Recorded
            </p>
            <h3 className="font-serif text-3xl md:text-4xl font-medium text-[#242824]">
              Thank you, {confirmation.donorLabel}.
            </h3>
            <p className="text-sm text-[#242824]/75 leading-relaxed max-w-2xl">
              Your local demonstration pledge of{' '}
              <strong className="font-semibold text-[#183D32]">
                {formatCurrency(confirmation.amount)} ({confirmation.frequency})
              </strong>{' '}
              toward <strong>{confirmation.campaignTitle}</strong> has been reflected in the interface progress bars.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-y border-[#242824]/12 py-5 text-sm">
          <div>
            <p className="text-xs uppercase tracking-wider text-[#242824]/60">Demo Reference</p>
            <p className="font-mono font-medium text-[#183D32] mt-1">{confirmation.reference}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-[#242824]/60">Designation</p>
            <p className="font-medium text-[#242824] mt-1">{confirmation.campaignTitle}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-[#242824]/60">Attribution</p>
            <p className="font-medium text-[#242824] mt-1">{confirmation.donorLabel}</p>
          </div>
        </div>

        <p className="text-xs text-[#242824]/65 leading-relaxed">
          Notice: This is a frontend-only demonstration. No real payment has been processed, no card details were collected, and no external transaction occurred.
        </p>

        <button
          type="button"
          onClick={() => setConfirmation(null)}
          className="px-6 py-3 bg-[#183D32] text-[#F7F4EE] text-xs font-semibold uppercase tracking-[0.14em] hover:bg-[#112C24] transition-colors cursor-pointer"
        >
          Make Another Demo Pledge
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
      {/* Left: Donation Configurator */}
      <EditorialReveal className="lg:col-span-7">
        <form
          onSubmit={handleSubmit}
          noValidate
          className="bg-[#F7F4EE] border border-[#242824]/14 p-6 md:p-10 space-y-8"
        >
        {/* Frequency Toggle */}
        <div className="space-y-3">
          <span className="block text-xs uppercase tracking-[0.16em] text-[#242824]/70 font-semibold">
            01 · Contribution Cadence
          </span>
          <div className="grid grid-cols-2 border border-[#242824]/20 bg-[#EAE5DC]/60 p-1">
            {(
              [
                { id: 'one-time', label: 'One-Time Gift' },
                { id: 'monthly', label: 'Monthly Sanctuary' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setFrequency(opt.id)}
                className={`py-2.5 px-4 text-xs font-semibold uppercase tracking-[0.12em] transition-colors cursor-pointer whitespace-nowrap ${
                  frequency === opt.id
                    ? 'bg-[#183D32] text-[#F7F4EE]'
                    : 'text-[#242824]/75 hover:text-[#242824]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Amount Selection */}
        <div className="space-y-3">
          <span className="block text-xs uppercase tracking-[0.16em] text-[#242824]/70 font-semibold">
            02 · Select Amount
          </span>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
            {PRESET_AMOUNTS.map((amt) => {
              const active = selectedPreset === amt;
              return (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setSelectedPreset(amt)}
                  className={`py-3 px-2 text-sm font-mono tabular-nums border transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#183D32] text-[#F7F4EE] border-[#183D32] font-semibold'
                      : 'bg-white/60 text-[#242824] border-[#242824]/20 hover:border-[#183D32]'
                  }`}
                >
                  ${amt}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setSelectedPreset('custom')}
              className={`py-3 px-2 text-xs font-semibold uppercase tracking-wider border transition-colors cursor-pointer ${
                selectedPreset === 'custom'
                  ? 'bg-[#183D32] text-[#F7F4EE] border-[#183D32]'
                  : 'bg-white/60 text-[#242824] border-[#242824]/20 hover:border-[#183D32]'
              }`}
            >
              Custom
            </button>
          </div>

          {selectedPreset === 'custom' && (
            <div className="pt-2">
              <label htmlFor="custom-donation-amount" className="block text-xs text-[#242824]/70 mb-1.5">
                Custom Amount (USD)
              </label>
              <input
                id="custom-donation-amount"
                type="number"
                min={5}
                max={250000}
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-[#242824]/20 font-mono text-base tabular-nums focus:outline-none focus:border-[#183D32]"
                placeholder="Enter amount"
              />
            </div>
          )}
        </div>

        {/* Case Designation */}
        <div className="space-y-2">
          <label
            htmlFor="donation-case-select"
            className="block text-xs uppercase tracking-[0.16em] text-[#242824]/70 font-semibold"
          >
            03 · Direct Your Gift
          </label>
          <select
            id="donation-case-select"
            value={campaignId}
            onChange={(e) => setCampaignId(e.target.value)}
            className="w-full px-4 py-3 bg-white border border-[#242824]/20 text-sm text-[#242824] focus:outline-none focus:border-[#183D32]"
          >
            <option value="">Rapid Emergency Care Reserve (Highest Triage Need)</option>
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.petName} — {c.medicalEmergency}
              </option>
            ))}
          </select>
        </div>

        {/* Donor Details */}
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs uppercase tracking-[0.16em] text-[#242824]/70 font-semibold">
              04 · Guardian &amp; Benefactor Details
            </span>
            <label className="inline-flex items-center gap-2 text-xs font-medium text-[#242824] cursor-pointer">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="w-4 h-4 accent-[#183D32]"
              />
              Donate anonymously
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="donor-full-name" className="block text-xs text-[#242824]/70 mb-1.5">
                Full Name {isAnonymous ? '(Optional when anonymous)' : '*'}
              </label>
              <input
                id="donor-full-name"
                type="text"
                value={donorName}
                onChange={(e) => setDonorName(e.target.value)}
                disabled={isAnonymous}
                placeholder={isAnonymous ? 'Recorded as Anonymous Benefactor' : 'Clara Vance'}
                className="w-full px-4 py-2.5 bg-white border border-[#242824]/20 text-sm disabled:bg-[#EAE5DC]/60 disabled:text-[#242824]/50 focus:outline-none focus:border-[#183D32]"
              />
            </div>

            <div>
              <label htmlFor="donor-email" className="block text-xs text-[#242824]/70 mb-1.5">
                Email Address (for demo summary) *
              </label>
              <input
                id="donor-email"
                type="email"
                value={donorEmail}
                onChange={(e) => setDonorEmail(e.target.value)}
                placeholder="clara@example.org"
                className="w-full px-4 py-2.5 bg-white border border-[#242824]/20 text-sm focus:outline-none focus:border-[#183D32]"
              />
            </div>
          </div>
        </div>

        {formError && (
          <p role="alert" className="text-sm text-[#9A3412] bg-[#9A3412]/8 border border-[#9A3412]/25 px-4 py-3">
            {formError}
          </p>
        )}

        <div className="space-y-3 pt-2">
          <button
            type="submit"
            className="w-full py-4 px-6 bg-[#183D32] text-[#F7F4EE] text-xs font-semibold uppercase tracking-[0.18em] hover:bg-[#112C24] transition-colors cursor-pointer inline-flex items-center justify-center gap-2"
          >
            <Heart className="w-4 h-4 text-[#B99A64]" aria-hidden="true" />
            Complete Demo Pledge · {formatCurrency(summary.amount)}
            {frequency === 'monthly' ? ' / mo' : ''}
          </button>
          <p className="text-[11px] text-[#242824]/60 text-center">
            Frontend demonstration only — no payment gateway is connected and no real funds are charged.
          </p>
        </div>
      </form>
      </EditorialReveal>

      {/* Right: Live Donation Summary & Recent Demo Ledger */}
      <aside className="lg:col-span-5">
        <SectionParallaxBand speed={12} className="space-y-6">
        <div className="bg-[#183D32] text-[#F7F4EE] p-7 md:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-[#F7F4EE]/15 pb-4">
            <span className="text-xs uppercase tracking-[0.18em] text-[#B99A64] font-semibold">
              Pledge Summary
            </span>
            <ShieldCheck className="w-4 h-4 text-[#A6B5A0]" aria-hidden="true" />
          </div>

          <div className="space-y-1">
            <p className="font-serif text-4xl font-medium tabular-nums">
              {formatCurrency(summary.amount)}
              <span className="text-lg text-[#A6B5A0] ml-1.5 font-sans font-normal">
                {frequency === 'monthly' ? 'monthly' : 'one-time'}
              </span>
            </p>
            {frequency === 'monthly' && (
              <p className="text-xs text-[#A6B5A0] tabular-nums">
                Annual sanctuary commitment: {formatCurrency(summary.annualEquivalent)}
              </p>
            )}
          </div>

          <dl className="space-y-3 text-sm border-t border-[#F7F4EE]/15 pt-5">
            <div className="flex justify-between gap-4">
              <dt className="text-[#A6B5A0]">Designation</dt>
              <dd className="text-right font-medium">{summary.designationLabel}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[#A6B5A0]">Public Attribution</dt>
              <dd className="text-right font-medium">{summary.attributionLabel}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[#A6B5A0]">Illustrative Care Equivalent</dt>
              <dd className="text-right font-mono tabular-nums text-[#B99A64]">
                ~{summary.estimatedCareHours} hrs ICU monitoring
              </dd>
            </div>
          </dl>
        </div>

        {!compact && (
          <div className="bg-[#EAE5DC]/70 border border-[#242824]/12 p-6 space-y-4">
            <h3 className="text-xs uppercase tracking-[0.16em] text-[#183D32] font-semibold">
              Recent Local Session Pledges (Demo)
            </h3>
            <ul className="divide-y divide-[#242824]/10">
              {recentDonations.slice(0, 4).map((item) => (
                <li key={item.id} className="py-3 flex items-baseline justify-between gap-4 text-sm">
                  <div>
                    <p className="font-medium text-[#242824]">{item.donorLabel}</p>
                    <p className="text-xs text-[#242824]/65">
                      {item.campaignTitle} · {item.timestamp}
                    </p>
                  </div>
                  <span className="font-mono font-semibold text-[#183D32] tabular-nums shrink-0">
                    {formatCurrency(item.amount)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
        </SectionParallaxBand>
      </aside>
    </div>
  );
}
