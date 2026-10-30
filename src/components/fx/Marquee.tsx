import React from 'react';

interface MarqueeProps {
  items: string[];
  reverse?: boolean;
  duration?: number;
  className?: string;
  itemClassName?: string;
  separator?: React.ReactNode;
  // Repeat short lists so the band is always wider than the screen.
  minItems?: number;
}

// Infinite horizontal band. Pauses on hover; stops for reduced-motion users.
export default function Marquee({
  items,
  reverse = false,
  duration = 40,
  className = '',
  itemClassName = '',
  separator = <span className="text-orange-500 mx-6 md:mx-10" aria-hidden="true">✦</span>,
  minItems = 8,
}: MarqueeProps) {
  if (items.length === 0) return null;
  const repeated: string[] = [];
  while (repeated.length < Math.max(minItems, items.length)) repeated.push(...items);

  const group = (hidden: boolean) => (
    <div className="flex shrink-0 items-center" aria-hidden={hidden || undefined}>
      {repeated.map((item, i) => (
        <React.Fragment key={i}>
          <span className={`whitespace-nowrap ${itemClassName}`}>{item}</span>
          {separator}
        </React.Fragment>
      ))}
    </div>
  );

  return (
    <div className={`marquee overflow-hidden flex ${className}`}>
      <div
        className={`marquee-track flex w-max ${reverse ? 'reverse' : ''}`}
        style={{ ['--marquee-duration' as string]: `${duration}s` }}
      >
        {group(false)}
        {group(true)}
      </div>
    </div>
  );
}
