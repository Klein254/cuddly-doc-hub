import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import RevealText from './fx/RevealText';

interface PageHeaderProps {
  eyebrow: string;
  title: string[];
  intro?: string;
  image?: string;
  // Large outlined word that drifts behind the title.
  ghost?: string;
  compact?: boolean;
}

export default function PageHeader({ eyebrow, title, intro, image, ghost, compact = false }: PageHeaderProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const imgY = useTransform(scrollYProgress, [0, 1], ['0%', '25%']);
  const imgScale = useTransform(scrollYProgress, [0, 1], [1.08, 1.2]);
  const ghostX = useTransform(scrollYProgress, [0, 1], ['0%', '-20%']);
  const contentY = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <div ref={ref} className={`grain bg-black text-white ${compact ? 'py-20' : 'py-28 md:py-36'} px-6 md:px-16 relative overflow-hidden`}>
      {image && (
        <motion.div
          aria-hidden="true"
          style={{ y: imgY, scale: imgScale, backgroundImage: `url(${image})` }}
          className="absolute inset-0 opacity-20 bg-cover bg-center grayscale contrast-125 pointer-events-none"
        />
      )}
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
      {ghost && (
        <motion.div
          aria-hidden="true"
          style={{ x: ghostX }}
          className="absolute -bottom-6 md:-bottom-12 left-0 whitespace-nowrap font-display font-bold uppercase text-[22vw] leading-none text-outline text-white/10 select-none pointer-events-none"
        >
          {ghost}
        </motion.div>
      )}
      <motion.div style={{ y: contentY, opacity: contentOpacity }} className="container mx-auto relative z-10 max-w-7xl text-left">
        <motion.span
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-3 text-orange-500 font-sans text-xs font-bold uppercase tracking-widest mb-5"
        >
          <span className="w-8 h-px bg-orange-500" aria-hidden="true" />
          {eyebrow}
        </motion.span>
        <RevealText
          lines={title}
          className={`${compact ? 'text-4xl md:text-6xl' : 'text-5xl md:text-7xl lg:text-8xl'} font-display font-bold tracking-tight uppercase mb-6 leading-[0.95]`}
        />
        {intro && (
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.35 }}
            className="text-neutral-300 text-base md:text-lg leading-relaxed max-w-2xl font-sans"
          >
            {intro}
          </motion.p>
        )}
      </motion.div>
    </div>
  );
}
