import { useState, type FormEvent } from 'react';
import { CheckCircle2, Stethoscope } from 'lucide-react';
import { PARTNER_HOSPITALS, GENERATED_IMAGES } from '../../data/sanctuaryData';
import {
  useSanctuary,
  type PartnerSubmissionRecord,
} from '../../context/SanctuaryContext';
import {
  EditorialReveal,
  ParallaxEditorialImage,
  StaggerCard,
  StaggerGrid,
} from '../motion/EditorialMotion';

export default function VetPartnershipSection() {
  const { recordPartnerRegistration } = useSanctuary();
  const [clinicName, setClinicName] = useState('');
  const [city, setCity] = useState('');
  const [medicalDirector, setMedicalDirector] = useState('');
  const [email, setEmail] = useState('');
  const [specialty, setSpecialty] = useState('24-Hour Emergency & Critical Care');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState<PartnerSubmissionRecord | null>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!clinicName.trim() || !city.trim() || !medicalDirector.trim()) {
      setError('Please enter clinic name, city, and medical director.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid clinic contact email.');
      return;
    }
    setError('');
    const rec = recordPartnerRegistration({ clinicName, city, medicalDirector });
    setSubmitted(rec);
    setClinicName('');
    setCity('');
    setMedicalDirector('');
    setEmail('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
      <div className="lg:col-span-6 flex flex-col justify-between space-y-6">
        <ParallaxEditorialImage
          src={GENERATED_IMAGES.vetSanctuary}
          alt="Serene sunlit veterinary sanctuary hospital interior with warm stone and timber"
          className="aspect-[16/9] bg-[#EAE5DC] border border-[#242824]/12"
          parallaxDistance={24}
        />

        <div className="space-y-4">
          <p className="text-xs uppercase tracking-[0.18em] text-[#183D32] font-semibold">
            Selected Accredited Alliance Hospitals (Demo Directory)
          </p>
          <StaggerGrid className="divide-y divide-[#242824]/12 border-y border-[#242824]/12">
            {PARTNER_HOSPITALS.map((h) => (
              <StaggerCard key={h.id}>
                <div className="py-3.5 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                  <div>
                    <h4 className="font-serif text-xl font-medium text-[#242824]">{h.name}</h4>
                    <p className="text-xs text-[#242824]/65 mt-0.5">{h.specialties}</p>
                  </div>
                  <span className="text-xs font-medium text-[#183D32] shrink-0">{h.city}</span>
                </div>
              </StaggerCard>
            ))}
          </StaggerGrid>
        </div>
      </div>

      <EditorialReveal delay={0.12} className="lg:col-span-6 bg-[#EAE5DC]/75 border border-[#242824]/14 p-7 md:p-10 flex flex-col justify-between">
        {submitted ? (
          <div className="space-y-5 my-auto">
            <CheckCircle2 className="w-8 h-8 text-[#183D32]" aria-hidden="true" />
            <h3 className="font-serif text-3xl font-medium text-[#242824]">
              Partnership Dossier Registered (Demo)
            </h3>
            <p className="text-sm text-[#242824]/75 leading-relaxed">
              Thank you, <strong>{submitted.medicalDirector}</strong>.{' '}
              <strong>{submitted.clinicName}</strong> ({submitted.city}) has been recorded under demo reference{' '}
              <span className="font-mono text-[#183D32] font-semibold">{submitted.reference}</span>.
            </p>
            <p className="text-xs text-[#242824]/60">
              Frontend demonstration only — no clinic credentialing data was sent to an external server.
            </p>
            <button
              type="button"
              onClick={() => setSubmitted(null)}
              className="px-5 py-2.5 bg-[#183D32] text-[#F7F4EE] text-xs font-semibold uppercase tracking-[0.14em] cursor-pointer"
            >
              Register Another Clinic
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <div className="flex items-center gap-2.5 text-[#183D32]">
              <Stethoscope className="w-5 h-5" aria-hidden="true" />
              <span className="text-xs uppercase tracking-[0.18em] font-semibold">
                Hospital &amp; Specialist Registration
              </span>
            </div>
            <h3 className="font-serif text-3xl font-medium text-[#242824]">
              Partner With Our Emergency Triage Desk
            </h3>
            <p className="text-sm text-[#242824]/75 leading-relaxed">
              Partner hospitals receive direct electronic guarantee-of-payment notices within hours of clinical triage so life-saving surgery never waits on family credit lines.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label htmlFor="vet-clinic-name" className="block text-xs font-medium text-[#242824]/80 mb-1.5">
                  Hospital / Clinic Name *
                </label>
                <input
                  id="vet-clinic-name"
                  type="text"
                  value={clinicName}
                  onChange={(e) => setClinicName(e.target.value)}
                  placeholder="Alpine Veterinary Surgical Centre"
                  className="w-full px-3.5 py-2.5 bg-[#F7F4EE] border border-[#242824]/20 text-sm focus:outline-none focus:border-[#183D32]"
                />
              </div>
              <div>
                <label htmlFor="vet-city" className="block text-xs font-medium text-[#242824]/80 mb-1.5">
                  City &amp; Region *
                </label>
                <input
                  id="vet-city"
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Geneva, Switzerland"
                  className="w-full px-3.5 py-2.5 bg-[#F7F4EE] border border-[#242824]/20 text-sm focus:outline-none focus:border-[#183D32]"
                />
              </div>
              <div>
                <label htmlFor="vet-director" className="block text-xs font-medium text-[#242824]/80 mb-1.5">
                  Lead Veterinarian / Director *
                </label>
                <input
                  id="vet-director"
                  type="text"
                  value={medicalDirector}
                  onChange={(e) => setMedicalDirector(e.target.value)}
                  placeholder="Dr. Camille Rochat"
                  className="w-full px-3.5 py-2.5 bg-[#F7F4EE] border border-[#242824]/20 text-sm focus:outline-none focus:border-[#183D32]"
                />
              </div>
              <div>
                <label htmlFor="vet-email" className="block text-xs font-medium text-[#242824]/80 mb-1.5">
                  Clinic Email *
                </label>
                <input
                  id="vet-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="triage@clinic.org"
                  className="w-full px-3.5 py-2.5 bg-[#F7F4EE] border border-[#242824]/20 text-sm focus:outline-none focus:border-[#183D32]"
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="vet-specialty" className="block text-xs font-medium text-[#242824]/80 mb-1.5">
                  Primary Clinical Capability
                </label>
                <select
                  id="vet-specialty"
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#F7F4EE] border border-[#242824]/20 text-sm focus:outline-none focus:border-[#183D32]"
                >
                  <option>24-Hour Emergency &amp; Critical Care</option>
                  <option>Soft Tissue &amp; Orthopedic Surgery</option>
                  <option>Interventional Cardiology</option>
                  <option>Veterinary Oncology &amp; Internal Medicine</option>
                </select>
              </div>
            </div>

            {error && <p className="text-xs text-[#9A3412]">{error}</p>}

            <button
              type="submit"
              className="w-full py-3.5 px-6 bg-[#183D32] text-[#F7F4EE] text-xs font-semibold uppercase tracking-[0.16em] hover:bg-[#112C24] transition-colors cursor-pointer"
            >
              Submit Clinic Registration (Demo)
            </button>
          </form>
        )}
      </EditorialReveal>
    </div>
  );
}
