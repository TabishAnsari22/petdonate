import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import EditorialHeader from '../components/ui/EditorialHeader';
import ResilientImage from '../components/ui/ResilientImage';
import { SUCCESS_STORIES } from '../data/sanctuaryData';

export default function SuccessStoriesPage() {
  return (
    <main className="bg-[#F7F4EE]">
      <EditorialHeader
        eyebrow="The Sanctuary Chronicle"
        title="Stories of Quiet Recovery &amp; Second Chances"
        description="Every emergency grant is measured not in spreadsheets, but in morning walks, sunlit windowsills, and families kept whole."
      />

      <section className="py-20 max-w-[1320px] mx-auto px-6 md:px-10 space-y-24">
        {SUCCESS_STORIES.map((story, idx) => (
          <article
            key={story.id}
            className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center pb-20 border-b border-[#242824]/12 last:border-b-0 last:pb-0"
          >
            <div
              className={`lg:col-span-6 aspect-[4/3] overflow-hidden bg-[#EAE5DC] ${
                idx % 2 === 1 ? 'lg:order-2' : ''
              }`}
            >
              <ResilientImage
                src={story.image}
                alt={story.imageAlt}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="lg:col-span-6 space-y-5 max-w-prose">
              <p className="text-xs uppercase tracking-[0.16em] text-[#183D32] font-semibold">
                {story.petName} · {story.species} · {story.location}
              </p>
              <h2 className="font-serif text-3xl md:text-4xl font-medium text-[#242824] leading-[1.15]">
                {story.headline}
              </h2>
              <div className="space-y-4 text-sm md:text-base text-[#242824]/80 leading-relaxed">
                {story.narrative.map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
              <div className="pt-3 border-t border-[#242824]/12 flex flex-wrap items-center justify-between gap-4 text-xs">
                <span className="font-mono text-[#183D32] font-medium">
                  {story.outcomeStat}
                </span>
                <span className="text-[#242824]/65">
                  Guardian: {story.guardianName} · {story.hospitalPartner}
                </span>
              </div>
            </div>
          </article>
        ))}

        <div className="bg-[#183D32] text-[#F7F4EE] p-10 md:p-14 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-2 max-w-xl">
            <h2 className="font-serif text-3xl md:text-4xl font-medium">
              Help Write Tomorrow&apos;s Recovery
            </h2>
            <p className="text-sm text-[#EAE5DC]/80">
              Explore companions currently awaiting critical surgery in our active triage registry.
            </p>
          </div>
          <Link
            to="/campaigns"
            className="inline-flex items-center gap-2 px-7 py-3.5 bg-[#B99A64] text-[#183D32] text-xs font-semibold uppercase tracking-[0.16em] shrink-0"
          >
            View Active Cases
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </main>
  );
}
