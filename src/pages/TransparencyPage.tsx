import EditorialHeader from '../components/ui/EditorialHeader';
import ImpactCountersSection from '../components/sections/ImpactCountersSection';

const ALLOCATION_ROWS = [
  { label: 'Direct Veterinary Hospital Settlements', pct: 91, note: 'Paid exclusively against verified itemized invoices' },
  { label: '24/7 Clinical Triage & Veterinary Oversight', pct: 5, note: 'On-call triage verification and clinic coordination' },
  { label: 'Foundation Operations & Stewardship Audit', pct: 4, note: 'Compliance, donor reporting, and platform upkeep' },
];

export default function TransparencyPage() {
  return (
    <main className="bg-[#F7F4EE]">
      <EditorialHeader
        eyebrow="Stewardship & Accountability (Demo Figures)"
        title="Radical Clarity in Every Dollar Deployed"
        description="Every figure below represents illustrative demonstration metrics modeling Aurelia’s direct-to-hospital stewardship standard."
      />

      <section className="py-20 max-w-[1320px] mx-auto px-6 md:px-10 space-y-16">
        <ImpactCountersSection />

        <div className="space-y-8 max-w-3xl">
          <h2 className="font-serif text-3xl md:text-4xl font-medium text-[#242824]">
            Illustrative Fund Allocation Model
          </h2>
          <div className="space-y-6">
            {ALLOCATION_ROWS.map((row) => (
              <div key={row.label} className="space-y-2">
                <div className="flex items-baseline justify-between gap-4">
                  <span className="text-base font-medium text-[#242824]">{row.label}</span>
                  <span className="font-mono text-lg font-semibold text-[#183D32] tabular-nums">
                    {row.pct}%
                  </span>
                </div>
                <div className="h-2 w-full bg-[#EAE5DC]">
                  <div className="h-full bg-[#183D32]" style={{ width: `${row.pct}%` }} />
                </div>
                <p className="text-xs text-[#242824]/65">{row.note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
