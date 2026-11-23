import { useEffect, useRef, useState } from 'react';
import { DEMO_IMPACT_STATS } from '../../data/sanctuaryData';
import {
  EditorialHairline,
  StaggerCard,
  StaggerGrid,
} from '../motion/EditorialMotion';

function AnimatedCounter({
  target,
  suffix,
  active,
}: {
  target: number;
  suffix: string;
  active: boolean;
}) {
  const [display, setDisplay] = useState(target);
  const hasDecimal = !Number.isInteger(target);

  useEffect(() => {
    if (!active) return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      setDisplay(target);
      return;
    }

    let raf = 0;
    const duration = 950;
    const start = performance.now();
    const step = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const val = target * eased;
      setDisplay(hasDecimal ? Number(val.toFixed(1)) : Math.round(val));
      if (progress < 1) {
        raf = requestAnimationFrame(step);
      }
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [active, target, hasDecimal]);

  return (
    <span className="font-serif text-4xl md:text-5xl font-medium text-[#183D32] tabular-nums">
      {hasDecimal ? display.toFixed(1) : display.toLocaleString()}
      {suffix}
    </span>
  );
}

export default function ImpactCountersSection() {
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.08 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={sectionRef} className="space-y-0">
      <EditorialHairline />
      <StaggerGrid className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 py-12">
        {DEMO_IMPACT_STATS.map((stat) => (
          <StaggerCard key={stat.label} className="space-y-2.5">
            <AnimatedCounter target={stat.value} suffix={stat.suffix} active={inView} />
            <p className="text-xs uppercase tracking-[0.16em] text-[#242824] font-semibold">
              {stat.label}
            </p>
            <p className="text-sm text-[#242824]/70 leading-relaxed">{stat.detail}</p>
          </StaggerCard>
        ))}
      </StaggerGrid>
      <EditorialHairline delay={0.18} />
    </div>
  );
}
