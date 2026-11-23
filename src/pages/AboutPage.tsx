import { Link } from 'react-router-dom';
import EditorialHeader from '../components/ui/EditorialHeader';
import ResilientImage from '../components/ui/ResilientImage';
import ImpactCountersSection from '../components/sections/ImpactCountersSection';
import { GENERATED_IMAGES } from '../data/sanctuaryData';

export default function AboutPage() {
  return (
    <main className="bg-[#F7F4EE]">
      <EditorialHeader
        eyebrow="Our Mission & Charter"
        title="Because Love Should Never Come With a Price Tag."
        description="Founded to ensure emergency veterinary medicine remains accessible to devoted guardians facing sudden financial hardship."
      />

      <section className="py-20 max-w-[1320px] mx-auto px-6 md:px-10 space-y-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 aspect-[4/3] overflow-hidden bg-[#EAE5DC]">
            <ResilientImage
              src={GENERATED_IMAGES.vetSanctuary}
              alt="Aurelia clinical sanctuary interior"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="lg:col-span-6 space-y-5 text-base text-[#242824]/80 leading-relaxed max-w-prose">
            <h2 className="font-serif text-3xl md:text-4xl font-medium text-[#242824]">
              A Calm Mandate in Moments of Crisis
            </h2>
            <p>
              Modern veterinary surgery can save nearly every acute trauma, torsion, or localized tumor—yet emergency deposits often exceed $3,500 within minutes of arrival. Families who have shared a decade of devotion are routinely forced into impossible choices.
            </p>
            <p>
              Aurelia operates as a rapid-response philanthropic intermediary. Our clinical triage officers verify diagnoses directly with attending veterinarians and wire payment guarantees straight to the hospital, allowing surgical teams to begin immediately.
            </p>
            <div className="pt-4 flex flex-wrap gap-4">
              <Link
                to="/apply"
                className="px-6 py-3 bg-[#183D32] text-[#F7F4EE] text-xs font-semibold uppercase tracking-[0.14em]"
              >
                Apply for Assistance
              </Link>
              <Link
                to="/donate"
                className="px-6 py-3 border border-[#183D32] text-[#183D32] text-xs font-semibold uppercase tracking-[0.14em]"
              >
                Support the Fund
              </Link>
            </div>
          </div>
        </div>

        <ImpactCountersSection />
      </section>
    </main>
  );
}
