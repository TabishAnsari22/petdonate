import EditorialHeader from '../components/ui/EditorialHeader';
import VetPartnershipSection from '../components/sections/VetPartnershipSection';

export default function VeterinaryPartnersPage() {
  return (
    <main className="bg-[#F7F4EE]">
      <EditorialHeader
        eyebrow="Veterinary Clinical Alliance"
        title="Direct Electronic Settlements for Partner Hospitals"
        description="Join over 140 accredited emergency and referral veterinary hospitals streamlining charitable care without administrative friction."
      />
      <section className="py-16 md:py-24 max-w-[1320px] mx-auto px-6 md:px-10">
        <VetPartnershipSection />
      </section>
    </main>
  );
}
