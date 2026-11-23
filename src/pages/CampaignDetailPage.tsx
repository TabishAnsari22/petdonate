import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useSanctuary } from '../context/SanctuaryContext';
import {
  calculateFundingProgress,
  formatCurrency,
} from '../lib/sanctuaryLogic';
import ResilientImage from '../components/ui/ResilientImage';
import DonationStudio from '../components/sections/DonationStudio';

export default function CampaignDetailPage() {
  const { id } = useParams();
  const { campaigns } = useSanctuary();
  const campaign = campaigns.find((c) => c.id === id);

  if (!campaign) {
    return (
      <main className="pt-36 pb-24 bg-[#F7F4EE]">
        <div className="max-w-[900px] mx-auto px-6 text-center space-y-6">
          <h1 className="font-serif text-4xl text-[#242824]">
            Case Dossier Not Found
          </h1>
          <Link
            to="/campaigns"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#183D32] text-[#F7F4EE] text-xs font-semibold uppercase tracking-[0.14em]"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Return to All Cases
          </Link>
        </div>
      </main>
    );
  }

  const progress = calculateFundingProgress(campaign.raisedAmount, campaign.goalAmount);

  return (
    <main className="pt-28 md:pt-36 pb-24 bg-[#F7F4EE]">
      <div className="max-w-[1320px] mx-auto px-6 md:px-10 space-y-16">
        <div>
          <Link
            to="/campaigns"
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#183D32] hover:text-[#242824]"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            All Emergency Cases
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-6 aspect-[4/3] overflow-hidden bg-[#EAE5DC]">
            <ResilientImage
              src={campaign.image}
              alt={campaign.imageAlt}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="lg:col-span-6 space-y-6">
            <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.14em] text-[#183D32] font-semibold">
              <span>{campaign.category}</span>
              <span aria-hidden="true">·</span>
              <span>{campaign.urgency}</span>
              <span aria-hidden="true">·</span>
              <span className="text-[#242824]/65">{campaign.location}</span>
            </div>

            <div>
              <h1 className="font-serif text-4xl md:text-5xl font-medium text-[#242824]">
                {campaign.petName}
              </h1>
              <p className="text-sm text-[#242824]/70 mt-1">
                {campaign.breed} · {campaign.age} · {campaign.hospitalName}
              </p>
            </div>

            <div className="space-y-3 border-y border-[#242824]/12 py-5">
              <div className="flex items-baseline justify-between tabular-nums">
                <span className="font-serif text-3xl text-[#183D32] font-medium">
                  {formatCurrency(campaign.raisedAmount)}
                </span>
                <span className="text-sm text-[#242824]/70 font-mono">
                  of {formatCurrency(campaign.goalAmount)} goal ({progress}%)
                </span>
              </div>
              <div className="h-2 w-full bg-[#EAE5DC]">
                <div
                  className="h-full bg-[#183D32] transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-[#242824]/65 tabular-nums">
                Supported by {campaign.donorCount} local session contributors
              </p>
            </div>

            <div className="space-y-2">
              <h2 className="font-serif text-2xl font-medium text-[#242824]">
                {campaign.medicalEmergency}
              </h2>
              <p className="text-sm md:text-base text-[#242824]/80 leading-relaxed">
                {campaign.treatmentSummary}
              </p>
            </div>

            <div className="bg-[#EAE5DC]/65 border border-[#242824]/12 p-5 space-y-3">
              <p className="text-xs uppercase tracking-[0.14em] text-[#183D32] font-semibold">
                Attending Clinical Note
              </p>
              <p className="text-sm italic font-serif text-[#242824] text-lg leading-relaxed">
                “{campaign.vetNote}”
              </p>
            </div>

            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.14em] text-[#242824]/70 font-semibold">
                Itemized Veterinary Estimate (Demo)
              </p>
              <dl className="divide-y divide-[#242824]/10 border-y border-[#242824]/10 text-sm">
                {campaign.costBreakdown.map((line) => (
                  <div key={line.item} className="py-2.5 flex justify-between gap-4">
                    <dt className="text-[#242824]/80">{line.item}</dt>
                    <dd className="font-mono tabular-nums font-medium text-[#242824]">
                      {formatCurrency(line.amount)}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>

        {/* Direct Case Donation Studio */}
        <section className="pt-12 border-t border-[#242824]/12 space-y-8">
          <h2 className="font-serif text-3xl md:text-4xl font-medium text-[#242824]">
            Contribute Directly to {campaign.petName}&apos;s Care
          </h2>
          <DonationStudio initialCampaignId={campaign.id} compact />
        </section>
      </div>
    </main>
  );
}
