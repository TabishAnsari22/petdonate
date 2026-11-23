import { Link } from 'react-router-dom';
import { ArrowRight, Check } from 'lucide-react';
import EditorialHeader from '../components/ui/EditorialHeader';
import ResilientImage from '../components/ui/ResilientImage';
import { GENERATED_IMAGES } from '../data/sanctuaryData';

const ELIGIBLE_CONDITIONS = [
  'Acute surgical emergencies (GDV, intestinal obstruction, pyometra, internal hemorrhage)',
  'Traumatic orthopedic injuries requiring immediate stabilization or internal fixation',
  'Critical respiratory, cardiac, or toxicosis ICU interventions',
  'Localized oncologic resections carrying a strong curative or multi-year prognosis',
];

export default function EmergencyAssistancePage() {
  return (
    <main className="bg-[#F7F4EE]">
      <EditorialHeader
        eyebrow="Emergency Veterinary Grants"
        title="Rapid Clinical Triage When Every Hour Matters"
        description="Aurelia bridges urgent veterinary deposits directly with treating hospitals so families facing temporary or systemic financial hardship never face preventable loss."
      />

      <section className="py-20 max-w-[1320px] mx-auto px-6 md:px-10 space-y-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-6">
            <h2 className="font-serif text-3xl md:text-4xl font-medium text-[#242824]">
              Covered Emergencies &amp; Triage Criteria
            </h2>
            <p className="text-base text-[#242824]/80 leading-relaxed">
              Our veterinary advisory panel reviews itemized estimates from accredited clinics and issues electronic payment guarantees directly to the hospital desk—never burdening guardians with reimbursement delays.
            </p>
            <ul className="space-y-3 pt-2">
              {ELIGIBLE_CONDITIONS.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-[#242824]/85">
                  <Check className="w-4 h-4 text-[#183D32] shrink-0 mt-1" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="pt-4">
              <Link
                to="/apply"
                className="inline-flex items-center gap-2 px-7 py-3.5 bg-[#183D32] text-[#F7F4EE] text-xs font-semibold uppercase tracking-[0.16em] hover:bg-[#112C24] transition-colors"
              >
                Begin 6-Step Application
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </div>
          </div>

          <div className="lg:col-span-6 aspect-[4/3] overflow-hidden bg-[#EAE5DC]">
            <ResilientImage
              src={GENERATED_IMAGES.caseBarnaby}
              alt="Golden Retriever resting peacefully under calm veterinary observation"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>
    </main>
  );
}
