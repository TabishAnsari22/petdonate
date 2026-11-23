import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import {
  GENERATED_IMAGES,
  HOW_WE_HELP_PILLARS,
  SUCCESS_STORIES,
} from '../data/sanctuaryData';
import { useSanctuary } from '../context/SanctuaryContext';
import { computeScrollSceneState, type ScrollSceneKeyframe } from '../lib/sanctuaryLogic';
import HeroSanctuaryScene from '../components/3d/HeroSanctuaryScene';
import {
  EditorialHairline,
  EditorialReveal,
  ParallaxEditorialImage,
  SectionParallaxBand,
  StaggerCard,
  StaggerGrid,
} from '../components/motion/EditorialMotion';
import CaseCard from '../components/sections/CaseCard';
import SanctuaryFilmSection from '../components/sections/SanctuaryFilmSection';
import DonationStudio from '../components/sections/DonationStudio';
import EmergencyApplicationWizard from '../components/sections/EmergencyApplicationWizard';
import VetPartnershipSection from '../components/sections/VetPartnershipSection';
import ImpactCountersSection from '../components/sections/ImpactCountersSection';

export default function HomePage() {
  const { campaigns } = useSanctuary();
  const heroScrollRef = useRef<HTMLDivElement | null>(null);
  const [sceneState, setSceneState] = useState<ScrollSceneKeyframe>(() =>
    computeScrollSceneState(0),
  );

  return (
    <main>
      {/* SECTION B: CINEMATIC FULL-SCREEN 3D HERO WITH 6-SCENE SCROLL STORYTELLING */}
      <div
        ref={heroScrollRef}
        className="relative h-[280vh] bg-[#EDE6DA]"
        data-testid="hero-scroll-stage"
      >
        <div className="sticky top-0 h-screen w-full overflow-hidden">
          <HeroSanctuaryScene
            scrollContainerRef={heroScrollRef}
            onSceneChange={setSceneState}
          />

          {/* Editorial Hero Typography anchored cleanly on the left without obstructing the animals */}
          <div
            style={{
              opacity: sceneState.heroContentOpacity,
              transform: `translate3d(0, ${(1 - sceneState.heroContentOpacity) * -32}px, 0)`,
            }}
            className="pointer-events-none absolute inset-0 z-10 flex items-start pt-24 sm:items-center sm:pt-14 transition-opacity duration-200"
          >
            <div className="max-w-[1320px] w-full mx-auto px-6 md:px-10">
              <div
                className={`max-w-xl space-y-5 sm:space-y-6 ${
                  sceneState.heroContentOpacity > 0.15
                    ? 'pointer-events-auto'
                    : 'pointer-events-none'
                }`}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#183D32]">
                  Every Life Deserves A Chance
                </p>
                <h1 className="font-serif text-4xl sm:text-5xl lg:text-[58px] font-medium text-[#242824] leading-[1.06] tracking-[-0.015em]">
                  Every Pet Deserves a Chance. No Life Should Be Lost Because of Financial Hardship.
                </h1>
                <p className="text-base md:text-lg text-[#242824]/82 leading-relaxed max-w-lg">
                  We help families access emergency veterinary care when unexpected financial difficulties put their beloved pets&apos; lives at risk.
                </p>
                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <Link
                    to="/apply"
                    className="inline-flex items-center justify-center px-7 py-3.5 bg-[#183D32] text-[#F7F4EE] text-xs font-semibold uppercase tracking-[0.16em] hover:bg-[#112C24] transition-colors whitespace-nowrap"
                  >
                    Get Emergency Help
                  </Link>
                  <Link
                    to="/donate"
                    className="inline-flex items-center justify-center px-7 py-3.5 border border-[#183D32] text-[#183D32] bg-[#F7F4EE]/85 text-xs font-semibold uppercase tracking-[0.16em] hover:bg-[#183D32] hover:text-[#F7F4EE] transition-colors whitespace-nowrap"
                  >
                    Donate Now
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION C: MISSION STATEMENT */}
      <section className="py-24 md:py-32 bg-[#F7F4EE] border-t border-[#242824]/10 overflow-hidden">
        <div className="max-w-[1320px] mx-auto px-6 md:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-stretch">
            <div className="lg:col-span-6 aspect-[3/4] lg:aspect-auto">
              <ParallaxEditorialImage
                src={GENERATED_IMAGES.missionPortrait}
                alt="Veterinarian gently comforting a Golden Retriever beside tall sunlit windows"
                className="w-full h-full bg-[#EAE5DC]"
                parallaxDistance={28}
              />
            </div>

            <SectionParallaxBand speed={14} className="lg:col-span-6 flex flex-col justify-center space-y-8">
              <EditorialReveal className="space-y-4">
                <p className="text-xs uppercase tracking-[0.22em] text-[#183D32] font-semibold">
                  Our Mission
                </p>
                <h2 className="font-serif text-4xl md:text-5xl lg:text-[54px] font-medium text-[#242824] leading-[1.08]">
                  Because Love Should Never Come With a Price Tag.
                </h2>
              </EditorialReveal>

              <EditorialReveal delay={0.1} className="space-y-5 text-base text-[#242824]/80 leading-relaxed max-w-prose">
                <p className="first-letter:text-5xl first-letter:font-serif first-letter:font-medium first-letter:float-left first-letter:mr-3 first-letter:mt-1 first-letter:text-[#183D32]">
                  Across veterinary emergency rooms every night, devoted families are handed an unbearable threshold: produce thousands of dollars before morning, or consent to preventable farewells. Aurelia exists to stand in that gap with quiet speed, dignity, and clinical rigor.
                </p>
                <p>
                  By partnering directly with accredited 24-hour specialist hospitals, we issue electronic payment guarantees within hours of triage—keeping pets beside the people who love them without saddling families in crisis debt.
                </p>
              </EditorialReveal>

              <div className="space-y-5">
                <EditorialHairline colorClass="bg-[#242824]/15" />
                <EditorialReveal delay={0.18} className="flex flex-wrap items-center gap-6">
                  <Link
                    to="/about"
                    className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#183D32] hover:text-[#242824] transition-colors"
                  >
                    Read Our Charter
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </Link>
                  <Link
                    to="/transparency"
                    className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#242824]/75 hover:text-[#183D32] transition-colors"
                  >
                    View Allocation Ledger
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </Link>
                </EditorialReveal>
              </div>
            </SectionParallaxBand>
          </div>
        </div>
      </section>

      {/* SECTION C.5: SANCTUARY DOCUMENTARY FILM */}
      <SanctuaryFilmSection />

      {/* SECTION D: HOW WE HELP (01, 02, 03) */}
      <section className="py-24 md:py-28 bg-[#EAE5DC]/65 border-y border-[#242824]/12 overflow-hidden">
        <div className="max-w-[1320px] mx-auto px-6 md:px-10 space-y-14">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <EditorialReveal className="space-y-3 max-w-2xl">
              <p className="text-xs uppercase tracking-[0.22em] text-[#183D32] font-semibold">
                How We Help
              </p>
              <h2 className="font-serif text-4xl md:text-5xl font-medium text-[#242824] leading-[1.1]">
                Three Pillars of Calm, Decisive Intervention
              </h2>
            </EditorialReveal>
            <EditorialReveal delay={0.1}>
              <p className="text-sm text-[#242824]/75 max-w-md leading-relaxed">
                Every case flows from immediate hospital verification to direct settlement and post-discharge recovery support.
              </p>
            </EditorialReveal>
          </div>

          <StaggerGrid className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10">
            {HOW_WE_HELP_PILLARS.map((pillar) => (
              <StaggerCard key={pillar.index} className="h-full">
                <article className="h-full bg-[#F7F4EE] border border-[#242824]/12 p-8 flex flex-col justify-between space-y-8 transition-colors duration-300 hover:border-[#183D32]/35">
                  <div className="space-y-4">
                    <div className="flex items-baseline justify-between gap-3 border-b border-[#242824]/12 pb-4 min-h-[3.5rem]">
                      <span className="font-serif text-4xl font-medium text-[#B99A64] tabular-nums shrink-0">
                        {pillar.index}
                      </span>
                      <span className="text-[11px] uppercase tracking-[0.14em] text-[#183D32] font-semibold text-right leading-snug">
                        {pillar.subtitle}
                      </span>
                    </div>
                    <h3 className="font-serif text-3xl font-medium text-[#242824]">
                      {pillar.title}
                    </h3>
                    <p className="text-sm text-[#242824]/75 leading-relaxed">
                      {pillar.description}
                    </p>
                  </div>

                  <div className="space-y-4 pt-2 border-t border-[#242824]/10">
                    <p className="text-xs font-mono text-[#183D32]">{pillar.metric}</p>
                    <Link
                      to={pillar.ctaTo}
                      className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#183D32] hover:text-[#242824] transition-colors"
                    >
                      {pillar.ctaLabel}
                      <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                    </Link>
                  </div>
                </article>
              </StaggerCard>
            ))}
          </StaggerGrid>
        </div>
      </section>

      {/* SECTION E: EMERGENCY PET CASES */}
      <section className="py-24 md:py-32 bg-[#F7F4EE] overflow-hidden">
        <div className="max-w-[1320px] mx-auto px-6 md:px-10 space-y-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <EditorialReveal className="space-y-3 max-w-2xl">
              <p className="text-xs uppercase tracking-[0.22em] text-[#183D32] font-semibold">
                Urgent Triage Cases
              </p>
              <h2 className="font-serif text-4xl md:text-5xl font-medium text-[#242824] leading-[1.1]">
                Companions Awaiting Critical Care Today
              </h2>
            </EditorialReveal>
            <EditorialReveal delay={0.08}>
              <Link
                to="/campaigns"
                className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#183D32] hover:text-[#242824] transition-colors whitespace-nowrap"
              >
                View All Active Cases
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </EditorialReveal>
          </div>

          <StaggerGrid className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-7">
            {campaigns.map((campaign, idx) => (
              <StaggerCard key={campaign.id} className="h-full">
                <CaseCard campaign={campaign} index={idx} />
              </StaggerCard>
            ))}
          </StaggerGrid>
        </div>
      </section>

      {/* SECTION F: SUCCESS STORIES WITH ATMOSPHERIC SANCTUARY BACKGROUND VIDEO */}
      <section className="relative py-24 md:py-32 bg-[#183D32] text-[#F7F4EE] overflow-hidden">
        <video
          data-testid="stories-backdrop-video"
          src="/videos/aurelia_ambient_backdrop.mp4"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 w-full h-full object-cover opacity-20 scale-[1.03]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#183D32]/92 via-[#183D32]/82 to-[#14342B]/95"
        />

        <div className="relative z-10 max-w-[1320px] mx-auto px-6 md:px-10 space-y-14">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <EditorialReveal className="space-y-3 max-w-2xl">
              <p className="text-xs uppercase tracking-[0.22em] text-[#B99A64] font-semibold">
                Success Stories
              </p>
              <h2 className="font-serif text-4xl md:text-5xl font-medium leading-[1.1]">
                Lives Restored to Their Families
              </h2>
            </EditorialReveal>
            <EditorialReveal delay={0.08}>
              <Link
                to="/success-stories"
                className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#B99A64] hover:text-[#F7F4EE] transition-colors whitespace-nowrap"
              >
                Read Full Archive
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </EditorialReveal>
          </div>

          {/* Lead Story */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch pb-4">
            <div className="lg:col-span-7 aspect-[16/9]">
              <ParallaxEditorialImage
                src={SUCCESS_STORIES[0].image}
                alt={SUCCESS_STORIES[0].imageAlt}
                className="w-full h-full bg-[#112C24]"
                parallaxDistance={24}
              />
            </div>
            <SectionParallaxBand speed={12} className="lg:col-span-5 flex flex-col justify-center space-y-5">
              <EditorialReveal className="space-y-4">
                <p className="text-xs uppercase tracking-[0.16em] text-[#A6B5A0]">
                  {SUCCESS_STORIES[0].petName} · {SUCCESS_STORIES[0].location} · {SUCCESS_STORIES[0].year}
                </p>
                <h3 className="font-serif text-3xl md:text-4xl font-medium leading-[1.15]">
                  {SUCCESS_STORIES[0].headline}
                </h3>
                <p className="text-sm md:text-base text-[#EAE5DC]/80 leading-relaxed">
                  {SUCCESS_STORIES[0].excerpt}
                </p>
                <p className="text-xs font-mono text-[#B99A64] pt-1">
                  {SUCCESS_STORIES[0].outcomeStat}
                </p>
                <Link
                  to="/success-stories"
                  className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#F7F4EE] hover:text-[#B99A64] transition-colors pt-2"
                >
                  Read Winston&apos;s Recovery
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </Link>
              </EditorialReveal>
            </SectionParallaxBand>
          </div>

          <EditorialHairline colorClass="bg-[#F7F4EE]/15" />

          {/* Secondary Stories */}
          <StaggerGrid className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {SUCCESS_STORIES.slice(1).map((story) => (
              <StaggerCard key={story.id}>
                <article className="group grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
                  <div className="sm:col-span-5 aspect-[4/3]">
                    <ParallaxEditorialImage
                      src={story.image}
                      alt={story.imageAlt}
                      className="w-full h-full bg-[#112C24]"
                      parallaxDistance={16}
                      enableHoverZoom
                    />
                  </div>
                  <div className="sm:col-span-7 space-y-2.5">
                    <p className="text-xs uppercase tracking-[0.14em] text-[#A6B5A0]">
                      {story.petName} · {story.location}
                    </p>
                    <h4 className="font-serif text-2xl font-medium leading-snug">
                      {story.headline}
                    </h4>
                    <p className="text-sm text-[#EAE5DC]/75 line-clamp-2">{story.excerpt}</p>
                    <p className="text-xs font-mono text-[#B99A64] pt-1">{story.outcomeStat}</p>
                  </div>
                </article>
              </StaggerCard>
            ))}
          </StaggerGrid>
        </div>
      </section>

      {/* SECTION G: DONATION STUDIO */}
      <section className="py-24 md:py-32 bg-[#EAE5DC]/55 border-b border-[#242824]/12 overflow-hidden">
        <div className="max-w-[1320px] mx-auto px-6 md:px-10 space-y-12">
          <EditorialReveal className="max-w-2xl space-y-3">
            <p className="text-xs uppercase tracking-[0.22em] text-[#183D32] font-semibold">
              Direct Philanthropy
            </p>
            <h2 className="font-serif text-4xl md:text-5xl font-medium text-[#242824] leading-[1.1]">
              Underwrite Lifesaving Veterinary Care
            </h2>
            <p className="text-sm md:text-base text-[#242824]/75 leading-relaxed">
              Test our interactive frontend donation experience below. Pledges update local session progress bars immediately with zero external payment processing.
            </p>
          </EditorialReveal>
          <DonationStudio />
        </div>
      </section>

      {/* SECTION H: EMERGENCY ASSISTANCE MULTI-STEP FORM */}
      <section className="py-24 md:py-32 bg-[#F7F4EE] overflow-hidden">
        <div className="max-w-[1320px] mx-auto px-6 md:px-10 space-y-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <EditorialReveal className="max-w-2xl space-y-3">
              <p className="text-xs uppercase tracking-[0.22em] text-[#183D32] font-semibold">
                Emergency Assistance Application
              </p>
              <h2 className="font-serif text-4xl md:text-5xl font-medium text-[#242824] leading-[1.1]">
                Apply for Urgent Veterinary Grant Support
              </h2>
            </EditorialReveal>
            <EditorialReveal delay={0.08}>
              <Link
                to="/apply"
                className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#183D32] hover:text-[#242824] transition-colors whitespace-nowrap"
              >
                Open Dedicated Intake View
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </EditorialReveal>
          </div>
          <EditorialReveal delay={0.1}>
            <EmergencyApplicationWizard />
          </EditorialReveal>
        </div>
      </section>

      {/* SECTION I: VETERINARY PARTNERSHIP */}
      <section className="py-24 md:py-28 bg-[#EAE5DC]/45 border-y border-[#242824]/12 overflow-hidden">
        <div className="max-w-[1320px] mx-auto px-6 md:px-10 space-y-12">
          <EditorialReveal className="max-w-2xl space-y-3">
            <p className="text-xs uppercase tracking-[0.22em] text-[#183D32] font-semibold">
              Clinical Alliance
            </p>
            <h2 className="font-serif text-4xl md:text-5xl font-medium text-[#242824] leading-[1.1]">
              Built Together With Specialist Veterinary Hospitals
            </h2>
          </EditorialReveal>
          <VetPartnershipSection />
        </div>
      </section>

      {/* SECTION J: TRANSPARENCY & IMPACT */}
      <section className="py-24 md:py-28 bg-[#F7F4EE] overflow-hidden">
        <div className="max-w-[1320px] mx-auto px-6 md:px-10 space-y-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <EditorialReveal className="max-w-2xl space-y-3">
              <p className="text-xs uppercase tracking-[0.22em] text-[#183D32] font-semibold">
                Transparency &amp; Impact (Illustrative Demo Metrics)
              </p>
              <h2 className="font-serif text-4xl md:text-5xl font-medium text-[#242824] leading-[1.1]">
                Stewardship Measured in Restored Lives
              </h2>
            </EditorialReveal>
            <EditorialReveal delay={0.08}>
              <Link
                to="/transparency"
                className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#183D32] hover:text-[#242824] transition-colors whitespace-nowrap"
              >
                Full Stewardship Report
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </EditorialReveal>
          </div>
          <ImpactCountersSection />
        </div>
      </section>
    </main>
  );
}
