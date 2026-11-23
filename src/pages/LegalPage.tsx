import EditorialHeader from '../components/ui/EditorialHeader';

export default function LegalPage({ mode }: { mode: 'privacy' | 'terms' }) {
  const isPrivacy = mode === 'privacy';

  return (
    <main className="bg-[#F7F4EE]">
      <EditorialHeader
        eyebrow="Governance & Notice"
        title={isPrivacy ? 'Privacy & Local Demonstration Policy' : 'Terms of Use & Frontend Showcase Notice'}
        description={
          isPrivacy
            ? 'How this frontend demonstration handles inputs, uploaded medical document previews, and browser session state.'
            : 'Conditions governing the Aurelia Sanctuary interactive frontend demonstration experience.'
        }
      />

      <section className="py-16 md:py-24 max-w-[820px] mx-auto px-6 md:px-10 space-y-8 text-base text-[#242824]/80 leading-relaxed">
        {isPrivacy ? (
          <>
            <div className="space-y-2">
              <h2 className="font-serif text-2xl font-medium text-[#242824]">
                1. Zero Server Transmission
              </h2>
              <p>
                This website is a pure frontend showcase. Form entries, donation selections, veterinary clinic inquiries, and uploaded file previews remain strictly inside local browser memory during your session and are never transmitted to any remote server or database.
              </p>
            </div>
            <div className="space-y-2">
              <h2 className="font-serif text-2xl font-medium text-[#242824]">
                2. Document Previews
              </h2>
              <p>
                Files selected in Step 5 of the Emergency Assistance wizard are rendered locally using browser object URLs and discarded automatically when you close or reload the tab.
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="space-y-2">
              <h2 className="font-serif text-2xl font-medium text-[#242824]">
                1. Frontend Demonstration Disclaimer
              </h2>
              <p>
                All pet cases, recovery stories, hospital directories, impact counters, donation receipts, and generated reference numbers displayed on Aurelia Sanctuary are illustrative demonstration data. No real financial transaction, charitable solicitation, or clinical triage occurs through this site.
              </p>
            </div>
            <div className="space-y-2">
              <h2 className="font-serif text-2xl font-medium text-[#242824]">
                2. 3D Asset Integration Architecture
              </h2>
              <p>
                The hero Three.js scene uses procedural articulated anatomical rigs by default and includes documented configuration slots in src/config/models.ts for licensed external GLB/GLTF animal assets.
              </p>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
