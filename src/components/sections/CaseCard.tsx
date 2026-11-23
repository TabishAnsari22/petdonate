import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import {
  calculateFundingProgress,
  formatCurrency,
  type EmergencyCampaign,
} from '../../lib/sanctuaryLogic';
import { ParallaxEditorialImage } from '../motion/EditorialMotion';

interface CaseCardProps {
  campaign: EmergencyCampaign;
  index?: number;
}

export default function CaseCard({ campaign, index = 0 }: CaseCardProps) {
  const progress = calculateFundingProgress(campaign.raisedAmount, campaign.goalAmount);
  const remainingAmount = Math.max(0, campaign.goalAmount - campaign.raisedAmount);
  const caseNumber = `CASE 0${index + 1}`;

  return (
    <article className="group relative h-full bg-[#FBF9F5] border border-[#242824]/14 flex flex-col justify-between transition-all duration-500 hover:border-[#183D32]/55 hover:-translate-y-1 hover:shadow-[0_18px_42px_-24px_rgba(24,61,50,0.28)]">
      {/* Top Architectural Dossier Index Rail */}
      <div className="px-5 py-3 border-b border-[#242824]/10 bg-[#EAE5DC]/45 flex items-center justify-between gap-2 text-[10px] font-mono uppercase tracking-[0.18em]">
        <span className="font-semibold text-[#183D32]">{caseNumber} · {campaign.urgency}</span>
        <span className="text-[#242824]/60 truncate">{campaign.location}</span>
      </div>

      {/* Linen Matted Editorial Portrait Frame */}
      <div className="flex-1 flex flex-col">
        <div className="p-3 pb-0">
          <Link
            to={`/campaigns/${campaign.id}`}
            className="block relative overflow-hidden aspect-[4/3] bg-[#EAE5DC] border border-[#242824]/10"
          >
            <ParallaxEditorialImage
              src={campaign.image}
              alt={campaign.imageAlt}
              className="w-full h-full"
              parallaxDistance={16}
              enableHoverZoom
            />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[#183D32]/25 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            />
          </Link>
        </div>

        <div className="p-6 pb-5 space-y-3.5 flex-1 flex flex-col">
          <div className="flex items-baseline justify-between gap-2 border-b border-[#242824]/10 pb-3">
            <div>
              <Link to={`/campaigns/${campaign.id}`} className="block">
                <h3 className="font-serif text-[28px] font-medium text-[#242824] group-hover:text-[#183D32] transition-colors leading-none">
                  {campaign.petName}
                </h3>
              </Link>
              <p className="text-xs text-[#242824]/65 mt-1.5">
                {campaign.breed} · {campaign.age}
              </p>
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#B99A64] shrink-0">
              {campaign.category}
            </span>
          </div>

          <div className="space-y-1.5 flex-1">
            <p className="text-sm font-semibold text-[#183D32] leading-snug">
              {campaign.medicalEmergency}
            </p>
            <p className="text-xs text-[#242824]/72 leading-relaxed line-clamp-2">
              {campaign.treatmentSummary}
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Clinical Funding Ledger + Seamless Flush Action Bar */}
      <div className="mt-auto">
        <div className="px-6 pb-5 space-y-2.5">
          <div className="flex items-baseline justify-between text-xs tabular-nums">
            <span className="font-semibold text-[#183D32] text-sm">
              {formatCurrency(campaign.raisedAmount)}{' '}
              <span className="font-normal text-xs text-[#242824]/60">pledged</span>
            </span>
            <span className="font-mono text-[11px] text-[#242824]/70">
              {progress}% · {formatCurrency(remainingAmount)} left
            </span>
          </div>

          <div
            className="h-[3px] w-full bg-[#242824]/12 overflow-hidden"
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${campaign.petName} funding progress`}
          >
            <motion.div
              className="h-full bg-gradient-to-r from-[#183D32] to-[#B99A64] origin-left"
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              style={{ width: `${progress}%` }}
            />
          </div>

          <p className="text-[11px] text-[#242824]/58 tabular-nums truncate">
            {campaign.donorCount} contributors · {campaign.hospitalName}
          </p>
        </div>

        <div className="grid grid-cols-12 border-t border-[#242824]/14">
          <Link
            to={`/donate?case=${encodeURIComponent(campaign.id)}`}
            className="col-span-7 inline-flex items-center justify-center py-3.5 bg-[#183D32] text-[#F7F4EE] text-[11px] font-semibold uppercase tracking-[0.16em] hover:bg-[#112C24] transition-colors whitespace-nowrap"
          >
            Underwrite Case
          </Link>
          <Link
            to={`/campaigns/${campaign.id}`}
            className="col-span-5 inline-flex items-center justify-center gap-1.5 py-3.5 bg-[#EAE5DC]/45 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#242824] hover:bg-[#EAE5DC] hover:text-[#183D32] transition-colors whitespace-nowrap border-l border-[#242824]/14"
          >
            Dossier
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
}
