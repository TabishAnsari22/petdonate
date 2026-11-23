import { useRef, type ReactNode } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'motion/react';
import ResilientImage from '../ui/ResilientImage';

const EDITORIAL_EASE = [0.22, 1, 0.36, 1] as const;

interface EditorialRevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  yOffset?: number;
}

export function EditorialReveal({
  children,
  className = '',
  delay = 0,
  yOffset = 24,
}: EditorialRevealProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: yOffset }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.08 }}
      transition={{ duration: 0.78, delay, ease: EDITORIAL_EASE }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface EditorialHairlineProps {
  className?: string;
  delay?: number;
  colorClass?: string;
}

export function EditorialHairline({
  className = '',
  delay = 0.08,
  colorClass = 'bg-[#242824]/15',
}: EditorialHairlineProps) {
  return (
    <motion.div
      aria-hidden="true"
      initial={{ scaleX: 0 }}
      whileInView={{ scaleX: 1 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.9, delay, ease: EDITORIAL_EASE }}
      className={`h-px w-full origin-left ${colorClass} ${className}`}
    />
  );
}

interface ParallaxEditorialImageProps {
  src: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  parallaxDistance?: number;
  enableHoverZoom?: boolean;
}

export function ParallaxEditorialImage({
  src,
  alt,
  className = '',
  imgClassName = '',
  parallaxDistance = 26,
  enableHoverZoom = false,
}: ParallaxEditorialImageProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const prefersReduced = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  const y = useTransform(
    scrollYProgress,
    [0, 1],
    prefersReduced ? [0, 0] : [-parallaxDistance, parallaxDistance],
  );
  const scale = useTransform(
    scrollYProgress,
    [0, 0.5, 1],
    prefersReduced ? [1, 1, 1] : [1.08, 1.04, 1.09],
  );

  return (
    <motion.div
      ref={containerRef}
      initial={
        prefersReduced
          ? { opacity: 1 }
          : { opacity: 0.25, clipPath: 'inset(6% 0% 6% 0%)' }
      }
      whileInView={{ opacity: 1, clipPath: 'inset(0% 0% 0% 0%)' }}
      viewport={{ once: true, amount: 0.08 }}
      transition={{ duration: 0.9, ease: EDITORIAL_EASE }}
      className={`relative overflow-hidden ${className}`}
    >
      <motion.div
        style={{ y, scale }}
        className="w-full h-full will-change-transform"
      >
        <ResilientImage
          src={src}
          alt={alt}
          className={`w-full h-full object-cover ${
            enableHoverZoom
              ? 'transition-transform duration-700 ease-out group-hover:scale-[1.04]'
              : ''
          } ${imgClassName}`}
        />
      </motion.div>
    </motion.div>
  );
}

interface SectionParallaxBandProps {
  children: ReactNode;
  className?: string;
  speed?: number;
}

export function SectionParallaxBand({
  children,
  className = '',
  speed = 18,
}: SectionParallaxBandProps) {
  const bandRef = useRef<HTMLDivElement | null>(null);
  const prefersReduced = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: bandRef,
    offset: ['start end', 'end start'],
  });

  const y = useTransform(
    scrollYProgress,
    [0, 1],
    prefersReduced ? [0, 0] : [speed, -speed],
  );

  return (
    <motion.div
      ref={bandRef}
      style={{ y }}
      className={`will-change-transform ${className}`}
    >
      {children}
    </motion.div>
  );
}

interface StaggerGridProps {
  children: ReactNode;
  className?: string;
}

export function StaggerGrid({ children, className = '' }: StaggerGridProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.06 }}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: 0.1,
            delayChildren: 0.05,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface StaggerCardProps {
  children: ReactNode;
  className?: string;
}

export function StaggerCard({ children, className = '' }: StaggerCardProps) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 26 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.72, ease: EDITORIAL_EASE },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
