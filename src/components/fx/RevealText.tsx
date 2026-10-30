import React from 'react';
import { motion } from 'motion/react';

interface RevealTextProps {
  // Each entry is one visual line. Wrap a line in { text, accent: true } to colour it orange.
  lines: (string | { text: string; accent?: boolean })[];
  as?: 'h1' | 'h2';
  className?: string;
  delay?: number;
  inView?: boolean;
}

// Masked, word-by-word upward reveal for large headlines.
export default function RevealText({ lines, as = 'h1', className = '', delay = 0, inView = false }: RevealTextProps) {
  const Tag = motion[as];
  let wordIndex = 0;
  const trigger = inView
    ? { initial: 'hidden', whileInView: 'show', viewport: { once: true, margin: '-80px' } }
    : { initial: 'hidden', animate: 'show' };

  return (
    <Tag className={className} {...trigger}>
      {lines.map((line, li) => {
        const { text, accent } = typeof line === 'string' ? { text: line, accent: false } : line;
        return (
          <span key={li} className={`block ${accent ? 'text-orange-500' : ''}`}>
            {text.split(' ').map((word, wi) => {
              const i = wordIndex++;
              return (
                <span key={wi} className="inline-block overflow-hidden align-bottom pb-[0.08em] -mb-[0.08em]">
                  <motion.span
                    className="inline-block"
                    variants={{
                      hidden: { y: '110%', rotate: 4 },
                      show: { y: '0%', rotate: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: delay + i * 0.06 } },
                    }}
                  >
                    {word}
                  </motion.span>
                  {wi < text.split(' ').length - 1 && ' '}
                </span>
              );
            })}
          </span>
        );
      })}
    </Tag>
  );
}
