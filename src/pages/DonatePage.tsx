import { useSearchParams } from 'react-router-dom';
import EditorialHeader from '../components/ui/EditorialHeader';
import DonationStudio from '../components/sections/DonationStudio';

export default function DonatePage() {
  const [params] = useSearchParams();
  const initialCase = params.get('case');

  return (
    <main className="bg-[#F7F4EE]">
      <EditorialHeader
        eyebrow="Direct Philanthropy · Demo Showcase"
        title="Every Contribution Funds Immediate Care"
        description="Select a one-time gift or monthly sanctuary sponsorship. All pledges operate in local browser state for demonstration—no payment gateway or real charge occurs."
      />
      <section className="py-16 md:py-24 max-w-[1320px] mx-auto px-6 md:px-10">
        <DonationStudio initialCampaignId={initialCase} />
      </section>
    </main>
  );
}
