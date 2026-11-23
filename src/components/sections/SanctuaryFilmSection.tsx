import { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'motion/react';
import { GENERATED_IMAGES } from '../../data/sanctuaryData';
import { EditorialHairline, EditorialReveal } from '../motion/EditorialMotion';

interface FilmChapter {
  id: string;
  index: string;
  title: string;
  timestamp: string;
  seekSeconds: number;
  caption: string;
}

const FILM_CHAPTERS: FilmChapter[] = [
  {
    id: 'bond',
    index: '01',
    title: 'Midnight Arrival',
    timestamp: '00:00',
    seekSeconds: 0.0,
    caption: 'A quiet arrival beside comforting hands before surgical triage begins.',
  },
  {
    id: 'triage',
    index: '02',
    title: 'Hospital Guarantee',
    timestamp: '00:03',
    seekSeconds: 3.2,
    caption: 'Direct electronic settlement issued inside partner specialist suites.',
  },
  {
    id: 'recovery',
    index: '03',
    title: 'Restored Morning',
    timestamp: '00:08',
    seekSeconds: 8.6,
    caption: 'Homeward walks restored with full follow-up nursing continuity.',
  },
];

export default function SanctuaryFilmSection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const prefersReduced = useReducedMotion();

  const [progressPct, setProgressPct] = useState(0);
  const [activeChapterId, setActiveChapterId] = useState<string>('bond');

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });

  const frameScale = useTransform(
    scrollYProgress,
    [0, 0.45, 1],
    prefersReduced ? [1, 1, 1] : [0.97, 1.0, 0.99],
  );
  const innerVideoY = useTransform(
    scrollYProgress,
    [0, 1],
    prefersReduced ? [0, 0] : [-16, 16],
  );

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;

    const handleTimeUpdate = () => {
      if (!vid.duration) return;
      const t = vid.currentTime;
      setProgressPct((t / vid.duration) * 100);
      if (t >= 7.8) {
        setActiveChapterId('recovery');
      } else if (t >= 2.9) {
        setActiveChapterId('triage');
      } else {
        setActiveChapterId('bond');
      }
    };

    vid.addEventListener('timeupdate', handleTimeUpdate);
    return () => {
      vid.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, []);

  const seekToChapter = (chapter: FilmChapter) => {
    const vid = videoRef.current;
    if (!vid) return;
    vid.currentTime = chapter.seekSeconds;
    setActiveChapterId(chapter.id);
    if (vid.paused) {
      vid.play().catch(() => {});
    }
  };

  const activeChapter =
    FILM_CHAPTERS.find((c) => c.id === activeChapterId) ?? FILM_CHAPTERS[0];

  return (
    <section
      ref={sectionRef}
      aria-labelledby="sanctuary-film-heading"
      className="py-24 md:py-32 bg-[#183D32] text-[#F7F4EE] border-t border-[#242824]/15 overflow-hidden"
    >
      <div className="max-w-[1320px] mx-auto px-6 md:px-10 space-y-12">
        {/* Header Band */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
          <EditorialReveal className="lg:col-span-7 space-y-3">
            <p className="text-xs uppercase tracking-[0.22em] text-[#B99A64] font-semibold">
              Documentary Short · Field Study
            </p>
            <h2
              id="sanctuary-film-heading"
              className="font-serif text-4xl md:text-5xl font-medium leading-[1.08]"
            >
              Inside the Golden Hour of Veterinary Triage
            </h2>
          </EditorialReveal>
          <EditorialReveal delay={0.1} className="lg:col-span-5">
            <p className="text-sm md:text-base text-[#EAE5DC]/80 leading-relaxed">
              Follow the quiet architecture that bridges an urgent midnight diagnosis, our partner surgical centers, and a companion’s walk back across morning grass.
            </p>
          </EditorialReveal>
        </div>

        <EditorialHairline colorClass="bg-[#F7F4EE]/15" />

        {/* Architectural Editorial Cinema Grid (8-Col Widescreen Film + 4-Col Chapter Index) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
          <motion.div
            style={{ scale: frameScale }}
            className="lg:col-span-8 relative bg-[#0F2720] border border-[#F7F4EE]/16 overflow-hidden flex flex-col justify-between"
          >
            <div className="relative aspect-[16/9] w-full overflow-hidden">
              <motion.div
                style={{ y: innerVideoY }}
                className="w-full h-[108%] -top-[4%] relative will-change-transform"
              >
                <video
                  ref={videoRef}
                  data-testid="sanctuary-film-video"
                  src="/videos/aurelia_sanctuary_film.mp4"
                  poster={GENERATED_IMAGES.missionPortrait}
                  autoPlay={!prefersReduced}
                  muted
                  loop
                  playsInline
                  preload="auto"
                  className="w-full h-full object-cover"
                >
                  Your browser does not support embedded sanctuary film playback.
                </video>
              </motion.div>

              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0B1D17]/82 via-transparent to-[#0B1D17]/15"
              />

              {/* Clean Typographic Subtitle Overlay (No Buttons) */}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 p-6 sm:p-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div className="space-y-1.5 max-w-xl">
                  <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#B99A64]">
                    Reel {activeChapter.index} · {activeChapter.title}
                  </p>
                  <p className="font-serif text-xl sm:text-2xl text-[#F7F4EE] leading-snug">
                    {activeChapter.caption}
                  </p>
                </div>
                <span className="text-[11px] font-mono tracking-[0.18em] text-[#EAE5DC]/70 shrink-0">
                  {activeChapter.timestamp} / 00:11
                </span>
              </div>
            </div>

            {/* Subtle Golden Progress Line */}
            <div className="h-[2px] w-full bg-[#F7F4EE]/15">
              <div
                className="h-full bg-[#B99A64] transition-[width] duration-150 ease-linear"
                style={{ width: `${Math.min(100, Math.max(0, progressPct))}%` }}
              />
            </div>
          </motion.div>

          {/* Editorial Field-Study Chapter Dossier */}
          <div className="lg:col-span-4 flex flex-col justify-between bg-[#123128]/70 border border-[#F7F4EE]/14 p-6 sm:p-8 space-y-6">
            <div className="space-y-2 border-b border-[#F7F4EE]/15 pb-4">
              <p className="text-[11px] uppercase tracking-[0.22em] text-[#B99A64] font-semibold">
                Film Sequence · 3 Chapters
              </p>
              <p className="text-xs text-[#EAE5DC]/75 leading-relaxed">
                Select any narrative sequence to inspect each stage of direct emergency care.
              </p>
            </div>

            <div className="divide-y divide-[#F7F4EE]/12 flex-1 flex flex-col justify-center">
              {FILM_CHAPTERS.map((chapter) => {
                const active = chapter.id === activeChapterId;
                return (
                  <button
                    key={chapter.id}
                    type="button"
                    onClick={() => seekToChapter(chapter)}
                    className={`w-full text-left py-4 first:pt-2 last:pb-2 transition-colors cursor-pointer group ${
                      active
                        ? 'text-[#F7F4EE]'
                        : 'text-[#EAE5DC]/60 hover:text-[#F7F4EE]'
                    }`}
                  >
                    <div className="flex items-baseline justify-between gap-2 mb-1">
                      <div className="flex items-baseline gap-3">
                        <span
                          className={`font-serif text-2xl font-medium tabular-nums transition-colors ${
                            active ? 'text-[#B99A64]' : 'text-[#B99A64]/55 group-hover:text-[#B99A64]'
                          }`}
                        >
                          {chapter.index}
                        </span>
                        <h3 className="font-serif text-xl font-medium">{chapter.title}</h3>
                      </div>
                      <span className="text-[11px] font-mono tracking-wider opacity-75">
                        {chapter.timestamp}
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed pl-8 opacity-80">
                      {chapter.caption}
                    </p>
                    {active && (
                      <motion.div
                        layoutId="filmChapterActiveRule"
                        className="mt-3 ml-8 h-px bg-[#B99A64]"
                        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
