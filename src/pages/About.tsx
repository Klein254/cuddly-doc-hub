import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { Target, Lightbulb, Shield, Zap, Globe, Clock, ThumbsUp } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import SpotlightCard from '../components/fx/SpotlightCard';
import CountUp from '../components/fx/CountUp';
import { business } from '../data/business';

const values = [
  { icon: Clock, title: 'Reliability', desc: 'We turn up when we say we will and do the work we quoted for.' },
  { icon: Shield, title: 'Transparency', desc: 'Open communication and clear reports on every job.' },
  { icon: Globe, title: 'Sustainability', desc: 'We recommend energy- and water-efficient options where they make sense.' },
  { icon: Zap, title: 'Empowerment', desc: 'We invest in training our technicians, with safety first.' },
  { icon: ThumbsUp, title: 'Client Focus', desc: "Your equipment's long-term health is how we measure our work." },
];

export default function About() {
  const lineRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: lineRef, offset: ['start 80%', 'end 40%'] });
  const lineScale = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <div className="w-full bg-white pb-32">
      <PageHeader
        eyebrow="Who we are"
        title={['Engineered for', 'precision.']}
        intro="Practical engineering, careful workmanship and straightforward communication, for the buildings people depend on."
        image="/images/office-corridor.webp"
        ghost="About"
      />

      <div className="container mx-auto px-6 md:px-16 mt-28 max-w-7xl">
        {/* History Section */}
        <div ref={lineRef} className="mb-32 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="lg:col-span-7 relative pl-8"
          >
            <div aria-hidden="true" className="absolute left-0 top-0 bottom-0 w-px bg-neutral-200">
              <motion.div style={{ scaleY: lineScale }} className="absolute inset-0 bg-orange-500 origin-top" />
            </div>
            <span className="text-orange-700 font-sans text-xs font-bold uppercase tracking-widest block mb-2">Our story</span>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-black uppercase tracking-tight mb-6">Why we started</h2>
            <div className="space-y-4 text-neutral-700 font-sans text-base leading-relaxed">
              <p>
                {business.legalName} was founded in Nairobi in {business.founded} with a simple aim: to replace slow, reactive repairs with planned, preventive maintenance.
              </p>
              <p>
                Our work spans medical gas, HVAC, steam, power, plumbing and equipment maintenance, alongside the supply of hardware, electrical, medical and kitchen equipment, for hospitals, residential properties, hotels and commercial buildings.
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="lg:col-span-5 bg-black text-white p-10 flex flex-col justify-center h-full min-h-[240px] rounded-3xl shadow-xl relative overflow-hidden grain"
          >
            <div aria-hidden="true" className="absolute -right-10 -bottom-10 w-60 h-60 bg-orange-500/30 blur-[80px] rounded-full" />
            <span className="text-neutral-300 font-sans text-xs font-bold uppercase tracking-widest block mb-2 relative">Founded</span>
            <CountUp to={business.founded} from={1990} className="text-7xl md:text-8xl font-display font-bold leading-none mb-3 relative tabular-nums" />
            <p className="text-xs font-sans text-orange-500 font-bold tracking-wider uppercase relative">Nairobi, Kenya</p>
          </motion.div>
        </div>

        {/* Vision & Mission Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-32">
          <SpotlightCard
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="bg-white p-10 border border-neutral-200 rounded-3xl hover:shadow-2xl transition-shadow duration-300"
          >
            <div className="w-14 h-14 bg-neutral-50 border border-neutral-100 flex items-center justify-center mb-6 rounded-2xl shadow-sm group-hover:bg-orange-500 transition-colors">
              <Lightbulb size={24} className="text-black" aria-hidden="true" />
            </div>
            <h2 className="text-2xl font-display font-bold text-black uppercase tracking-tight mb-4">Our Vision</h2>
            <p className="text-neutral-700 font-sans text-base leading-relaxed">
              To become a trusted engineering and maintenance partner for healthcare, hospitality and commercial facilities across Kenya and the region.
            </p>
          </SpotlightCard>

          <SpotlightCard
            dark
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="bg-black text-white p-10 rounded-3xl shadow-xl border border-neutral-800"
          >
            <div aria-hidden="true" className="absolute inset-0 opacity-5 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]"></div>
            <div className="relative z-10">
              <div className="w-14 h-14 bg-neutral-900 border border-neutral-800 flex items-center justify-center mb-6 rounded-2xl">
                <Target size={24} className="text-orange-500" aria-hidden="true" />
              </div>
              <h2 className="text-2xl font-display font-bold uppercase tracking-tight mb-4">Our Mission</h2>
              <ul className="space-y-4 text-neutral-300 font-sans text-sm">
                {[
                  'Install and maintain medical gas, power and building systems carefully and to the applicable standards.',
                  'Work safely, and protect the people and places around our sites.',
                  'Give clear, written quotations before work begins.',
                ].map((m) => (
                  <li key={m} className="flex items-start gap-3">
                    <span className="text-orange-500 font-bold mt-0.5" aria-hidden="true">•</span>
                    {m}
                  </li>
                ))}
              </ul>
            </div>
          </SpotlightCard>
        </div>

        {/* Core Values Section */}
        <div className="border-t border-neutral-100 pt-24">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-16">
            <span className="text-orange-700 font-sans text-xs font-bold uppercase tracking-widest block mb-2">How we work</span>
            <h2 className="text-3xl md:text-5xl font-display font-bold text-black uppercase tracking-tight">Our Core Values</h2>
            <p className="text-neutral-600 font-sans text-sm max-w-md mt-4">The principles behind how we treat our clients, our team and our work.</p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {values.map((v, i) => (
              <SpotlightCard
                key={v.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ delay: i * 0.08, duration: 0.6 }}
                className="bg-neutral-50 border border-neutral-100 p-8 hover:bg-white hover:shadow-2xl hover:border-transparent transition-[background-color,box-shadow,border-color] duration-300 rounded-3xl"
              >
                <div className="w-12 h-12 bg-white border border-neutral-100 shadow-sm group-hover:bg-orange-500 group-hover:border-orange-500 group-hover:rotate-6 flex items-center justify-center mb-6 transition-all duration-300 rounded-2xl">
                  <v.icon size={22} className="text-black" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-display font-bold uppercase tracking-tight text-black mb-2">{v.title}</h3>
                <p className="text-neutral-600 font-sans text-sm leading-relaxed">{v.desc}</p>
              </SpotlightCard>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
