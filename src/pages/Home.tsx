import React, { useState, useEffect, useRef } from 'react';
import { PageView } from '../App';
import { ArrowRight, Wrench, Zap, Flame, Droplets, ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { clientsData } from '../data/clients';
import { business } from '../data/business';
import { PageLink } from '../lib/router';
import RevealText from '../components/fx/RevealText';
import Marquee from '../components/fx/Marquee';
import CountUp from '../components/fx/CountUp';
import SpotlightCard from '../components/fx/SpotlightCard';
import TruckScene from '../components/TruckScene';
import { serviceNames } from './Services';

interface HomeProps {
  navigateTo: (page: PageView) => void;
}

const slides = [
  {
    image: '/images/office-towers.webp',
    alt: 'Looking up at glass-fronted office towers against the sky',
    tagline: 'FACILITY MANAGEMENT',
    lines: ['Seamless Facility', 'Management', { text: 'Solutions', accent: true }],
    description: 'Planned maintenance and technical support for hospitals, residential complexes, hotels and commercial buildings, from our base in Nairobi.',
  },
  {
    image: '/images/chrome-tap.webp',
    alt: 'Water pouring from a chrome tap into a glass',
    tagline: 'GENERAL SUPPLIES',
    lines: ['Comprehensive', 'General', { text: 'Supplies', accent: true }],
    description: 'Electrical, hardware, plumbing, medical and kitchen equipment, sourced and delivered for clinical, commercial and industrial sites.',
  },
  {
    image: '/images/welder.webp',
    alt: 'A welder in a protective mask at work, with sparks flying',
    tagline: 'SKILLS & COMMUNITY',
    lines: ['Community', 'Skills &', { text: 'Empowerment', accent: true }],
    description: 'We believe in training technical teams and investing in local skills for long-term impact in Kenya.',
  },
];

const expertise = [
  { icon: Flame, title: 'Medical Gas', desc: 'Medical gas pipelines, manifolds and outlets: installation, repair and maintenance.' },
  { icon: Zap, title: 'Power & HVAC', desc: 'Generators, UPS, ventilation and steam systems for critical environments.' },
  { icon: Droplets, title: 'Specialised Cleaning', desc: 'Hydro-jet drain clearance and industrial tank cleaning and disinfection.' },
  { icon: Wrench, title: 'Preventive Care', desc: 'Scheduled servicing designed to extend equipment life and reduce downtime.' },
];

export default function Home({ navigateTo }: HomeProps) {
  const reduce = useReducedMotion();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [paused, setPaused] = useState(!!reduce);
  const [hovering, setHovering] = useState(false);
  const heroRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (paused || hovering) return;
    const timer = setInterval(() => setCurrentSlide((prev) => (prev + 1) % slides.length), 7000);
    return () => clearInterval(timer);
  }, [paused, hovering]);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);

  const { scrollYProgress: heroProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroContentY = useTransform(heroProgress, [0, 1], [0, 140]);
  const heroImgY = useTransform(heroProgress, [0, 1], ['0%', '18%']);

  const aboutRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: aboutProgress } = useScroll({ target: aboutRef, offset: ['start end', 'end start'] });
  const aboutImgY = useTransform(aboutProgress, [0, 1], ['-10%', '10%']);

  const onHeroMove = (e: React.PointerEvent<HTMLElement>) => {
    const el = heroRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--gx', `${e.clientX - r.left}px`);
    el.style.setProperty('--gy', `${e.clientY - r.top}px`);
  };

  const slide = slides[currentSlide];

  return (
    <div className="flex flex-col w-full bg-white">
      {/* Hero Section with Slider */}
      <section
        ref={heroRef}
        aria-roledescription="carousel"
        aria-label="Highlights"
        onPointerMove={onHeroMove}
        onPointerEnter={() => setHovering(true)}
        onPointerLeave={() => setHovering(false)}
        onFocus={() => setHovering(true)}
        onBlur={() => setHovering(false)}
        className="grain relative bg-black text-white min-h-[calc(100svh-5rem)] flex items-center overflow-hidden py-24"
      >
        <AnimatePresence initial={false}>
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2 }}
            className="absolute inset-0 z-0 select-none pointer-events-none"
          >
            <motion.div style={{ y: heroImgY }} className="absolute inset-0">
              <motion.img
                src={slide.image}
                alt={slide.alt}
                initial={{ scale: 1.18 }}
                animate={{ scale: 1.02 }}
                transition={{ duration: 8, ease: 'linear' }}
                className="w-full h-full object-cover grayscale contrast-125 opacity-40"
                fetchPriority={currentSlide === 0 ? 'high' : 'auto'}
              />
            </motion.div>
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-black/30" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40" />
          </motion.div>
        </AnimatePresence>

        {/* Cursor glow */}
        <div
          aria-hidden="true"
          className="absolute inset-0 z-[1] pointer-events-none hidden md:block"
          style={{ background: 'radial-gradient(500px circle at var(--gx, 70%) var(--gy, 40%), rgba(255,105,0,0.16), transparent 60%)' }}
        />
        {/* Orbit lines */}
        <svg aria-hidden="true" className="absolute -right-40 top-1/2 -translate-y-1/2 w-[900px] h-[900px] z-[1] opacity-40 hidden lg:block" viewBox="0 0 900 900">
          <motion.circle cx="450" cy="450" r="300" fill="none" stroke="#ff6900" strokeWidth="1" strokeDasharray="4 10"
            animate={{ rotate: 360 }} transition={{ duration: 120, repeat: Infinity, ease: 'linear' }} style={{ originX: '50%', originY: '50%' }} />
          <motion.circle cx="450" cy="450" r="400" fill="none" stroke="#ffffff" strokeOpacity="0.15" strokeWidth="1"
            animate={{ rotate: -360 }} transition={{ duration: 180, repeat: Infinity, ease: 'linear' }} />
          <motion.g animate={{ rotate: 360 }} transition={{ duration: 30, repeat: Infinity, ease: 'linear' }} style={{ transformBox: 'view-box', transformOrigin: '450px 450px' }}>
            <circle cx="450" cy="150" r="5" fill="#ff6900" />
          </motion.g>
        </svg>

        <motion.div style={{ y: heroContentY }} className="container mx-auto px-6 md:px-16 relative z-10 max-w-7xl flex flex-col justify-center h-full">
          <div className="max-w-4xl min-h-[440px] flex flex-col justify-center" aria-live={paused ? 'polite' : 'off'}>
            <AnimatePresence mode="wait">
              <motion.div key={currentSlide} exit={{ opacity: 0, y: -20, transition: { duration: 0.35 } }}>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="inline-flex items-center gap-2 px-4 py-1.5 bg-black/50 backdrop-blur-md border border-neutral-700/50 mb-6 rounded-full"
                >
                  <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" aria-hidden="true"></span>
                  <span className="text-[11px] font-sans text-orange-500 font-bold uppercase tracking-wider">{slide.tagline}</span>
                </motion.div>

                <RevealText
                  as={currentSlide === 0 ? 'h1' : 'h2'}
                  lines={slide.lines}
                  delay={0.1}
                  className="text-5xl md:text-7xl lg:text-[88px] leading-[0.92] font-display font-bold tracking-tight uppercase mb-8 text-white"
                />

                <motion.p
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.6 }}
                  className="text-neutral-300 text-base md:text-lg mb-10 max-w-xl font-sans leading-relaxed"
                >
                  {slide.description}
                </motion.p>
              </motion.div>
            </AnimatePresence>

            <div className="flex flex-wrap gap-4 mt-auto">
              <PageLink
                to="services"
                className="group inline-flex items-center bg-orange-500 text-black px-8 py-4 font-sans font-bold uppercase tracking-wider text-xs hover:bg-white transition-all rounded-full shadow-[0_10px_40px_-10px_rgba(255,105,0,0.7)]"
              >
                Explore Our Services
                <ArrowRight size={14} className="ml-2 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
              </PageLink>
              <PageLink
                to="contact"
                className="border border-neutral-400 px-8 py-4 font-sans font-bold uppercase tracking-wider text-xs text-white hover:bg-white hover:text-black hover:border-white transition-all rounded-full backdrop-blur-sm bg-black/20"
              >
                Request a Quote
              </PageLink>
            </div>
          </div>
        </motion.div>

        {/* Slider controls */}
        <div className="absolute bottom-10 right-6 md:right-16 flex items-center gap-4 z-20">
          <button
            type="button"
            onClick={() => setPaused((v) => !v)}
            className="w-10 h-10 rounded-full border border-white/20 bg-black/40 backdrop-blur-md text-white flex items-center justify-center hover:bg-orange-500 hover:text-black hover:border-orange-500 transition-colors"
            aria-label={paused ? 'Play slideshow' : 'Pause slideshow'}
          >
            {paused ? <Play size={16} aria-hidden="true" /> : <Pause size={16} aria-hidden="true" />}
          </button>
          <div className="flex gap-2">
            {slides.map((s, idx) => (
              <button
                type="button"
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className="relative w-12 h-6 flex items-center group"
                aria-label={`Show slide ${idx + 1} of ${slides.length}: ${s.tagline.toLowerCase()}`}
                aria-current={currentSlide === idx ? 'true' : undefined}
              >
                <span className="absolute inset-x-0 h-1.5 rounded-full bg-neutral-600/60 overflow-hidden">
                  {currentSlide === idx && (
                    <motion.span
                      key={`${currentSlide}-${paused || hovering}`}
                      className="absolute inset-0 bg-orange-500 origin-left"
                      initial={{ scaleX: paused || hovering ? 1 : 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: paused || hovering ? 0 : 7, ease: 'linear' }}
                    />
                  )}
                </span>
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={prevSlide}
          className="absolute top-0 left-0 bottom-0 w-20 md:w-40 z-20 hidden md:flex items-center justify-start px-6 opacity-0 hover:opacity-100 focus-visible:opacity-100 transition-opacity duration-300"
          aria-label="Previous slide"
        >
          <span className="w-14 h-14 bg-black/40 border border-white/10 rounded-full text-white flex items-center justify-center backdrop-blur-xl hover:bg-orange-500 hover:text-black transition-all">
            <ChevronLeft size={28} aria-hidden="true" />
          </span>
        </button>
        <button
          type="button"
          onClick={nextSlide}
          className="absolute top-0 right-0 bottom-28 w-20 md:w-40 z-20 hidden md:flex items-center justify-end px-6 opacity-0 hover:opacity-100 focus-visible:opacity-100 transition-opacity duration-300"
          aria-label="Next slide"
        >
          <span className="w-14 h-14 bg-black/40 border border-white/10 rounded-full text-white flex items-center justify-center backdrop-blur-xl hover:bg-orange-500 hover:text-black transition-all">
            <ChevronRight size={28} aria-hidden="true" />
          </span>
        </button>
      </section>

      {/* Services marquee */}
      <section aria-label="Services we offer" className="bg-orange-500 text-black py-5 overflow-hidden -rotate-1 scale-[1.03] relative z-10 -mt-4 shadow-xl">
        <Marquee items={serviceNames} duration={60} itemClassName="font-display font-bold uppercase text-xl md:text-2xl tracking-tight" separator={<span className="mx-6 md:mx-8" aria-hidden="true">✦</span>} />
      </section>

      {/* Expertise Section */}
      <section className="py-28 md:py-36 bg-white border-b border-neutral-100">
        <div className="container mx-auto px-6 md:px-16 max-w-7xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-6">
            <div>
              <span className="inline-flex items-center gap-3 text-orange-700 font-sans text-xs font-bold uppercase tracking-widest mb-3">
                <span className="w-8 h-px bg-orange-700" aria-hidden="true" /> What we do
              </span>
              <RevealText as="h2" inView lines={['Our Expertise']} className="text-4xl md:text-5xl lg:text-6xl font-display font-bold tracking-tight uppercase text-black" />
            </div>
            <p className="text-neutral-600 font-sans text-sm max-w-md leading-relaxed">
              One team for the systems your building depends on: installed, serviced and supplied by people who know them.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {expertise.map((feat, i) => (
              <SpotlightCard
                key={feat.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.7, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                className="p-8 bg-neutral-50 border border-neutral-100 rounded-3xl hover:bg-white hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
              >
                <span className="absolute top-0 right-0 font-display font-bold text-6xl text-neutral-100 group-hover:text-orange-100 transition-colors select-none" aria-hidden="true">
                  0{i + 1}
                </span>
                <div className="w-14 h-14 bg-white border border-neutral-100 shadow-sm flex items-center justify-center mb-8 rounded-2xl group-hover:bg-orange-500 group-hover:border-orange-500 group-hover:rotate-6 transition-all duration-300">
                  <feat.icon size={28} className="text-black" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-display font-bold uppercase tracking-tight mb-3 text-black">{feat.title}</h3>
                <p className="text-neutral-600 font-sans text-sm leading-relaxed">{feat.desc}</p>
              </SpotlightCard>
            ))}
          </div>
        </div>
      </section>

      {/* Facts strip */}
      <section aria-label="Company facts" className="bg-white">
        <div className="container mx-auto px-6 md:px-16 max-w-7xl grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-neutral-200 border-y border-neutral-200">
          {[
            { value: serviceNames.length, from: 0, label: 'Specialised service lines' },
            { value: business.founded, from: 1990, label: 'Founded in Nairobi' },
            { value: 1, from: 0, label: 'Point of contact for supply, installation & maintenance' },
          ].map((f) => (
            <div key={f.label} className="py-10 sm:px-8 first:sm:pl-0">
              <CountUp to={f.value} from={f.from} className="block font-display font-bold text-6xl md:text-7xl tracking-tight text-black tabular-nums" />
              <p className="mt-2 text-xs font-bold uppercase tracking-widest text-neutral-600 max-w-[16rem]">{f.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Scroll-driven delivery story */}
      <TruckScene />

      {/* Mini About Section */}
      <section className="py-28 md:py-36 bg-neutral-50 border-b border-neutral-100">
        <div className="container mx-auto px-6 md:px-16 max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="lg:col-span-7"
          >
            <span className="inline-flex items-center gap-3 text-orange-700 font-sans text-xs font-bold uppercase tracking-widest mb-3">
              <span className="w-8 h-px bg-orange-700" aria-hidden="true" /> Who we are
            </span>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold tracking-tight uppercase mb-6 text-black leading-[0.95]">
              Vector Technical <br />Maintenance & Supplies
            </h2>
            <p className="text-neutral-700 mb-6 font-sans text-base leading-relaxed">
              We keep the critical systems in hospitals, residential complexes, hotels and commercial buildings running, from medical gas and HVAC to power, plumbing and kitchens. Alongside maintenance, we supply the hardware, electrical, medical and kitchen equipment those systems need.
            </p>
            <p className="text-neutral-700 mb-8 font-sans text-base leading-relaxed">
              Founded in Nairobi in {business.founded}, we keep things simple: one point of contact, written quotations, and clear reports on the work we've done.
            </p>
            <PageLink
              to="about"
              className="text-black font-sans font-bold uppercase tracking-wider text-xs hover:text-orange-700 transition-colors inline-flex items-center gap-2 group border-b border-black pb-1 hover:border-orange-700"
            >
              More about us
              <ArrowRight size={14} className="group-hover:translate-x-1.5 transition-transform" aria-hidden="true" />
            </PageLink>
          </motion.div>

          <motion.div
            ref={aboutRef}
            initial={{ opacity: 0, clipPath: 'inset(20% 20% 20% 20% round 40px)' }}
            whileInView={{ opacity: 1, clipPath: 'inset(0% 0% 0% 0% round 40px)' }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-5 relative h-[480px] rounded-[2.5rem] bg-white shadow-xl overflow-hidden"
          >
            <motion.img
              style={{ y: aboutImgY }}
              src="/images/server-corridor.webp"
              alt="A technician with a laptop walking along a corridor of server cabinets"
              loading="lazy"
              className="absolute inset-0 w-full h-[120%] -top-[10%] object-cover grayscale contrast-110"
            />
            <div className="absolute -bottom-1 -left-1 bg-white/85 backdrop-blur-xl p-8 rounded-tr-3xl text-black">
              <p className="text-5xl font-display font-bold text-black mb-1">Est. {business.founded}</p>
              <p className="text-[11px] font-sans font-bold tracking-widest uppercase text-neutral-700">Nairobi, Kenya</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Clients Section — reads directly from src/data/clients.ts */}
      <section className="py-28 bg-white border-b border-neutral-100 overflow-hidden">
        <div className="container mx-auto px-6 md:px-16 max-w-7xl text-center mb-14">
          <span className="inline-flex items-center gap-3 text-orange-700 font-sans text-xs font-bold uppercase tracking-widest mb-3">
            <span className="w-8 h-px bg-orange-700" aria-hidden="true" /> Trusted partners
          </span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold tracking-tight uppercase text-black">Our Clients</h2>
        </div>

        <ul className="sr-only">
          {clientsData.map((c) => <li key={c.id}>{c.name}</li>)}
        </ul>
        <div aria-hidden="true" className="space-y-4">
          <Marquee items={clientsData.map((c) => c.name)} duration={45} itemClassName="font-display font-bold uppercase text-3xl md:text-5xl tracking-tight text-black" />
          <Marquee items={clientsData.map((c) => c.name)} reverse duration={55} itemClassName="font-display font-bold uppercase text-3xl md:text-5xl tracking-tight text-outline text-neutral-400" />
        </div>

        <div className="mt-14 text-center">
          <PageLink
            to="clients"
            className="text-black font-sans font-bold uppercase tracking-wider text-xs hover:text-orange-700 transition-colors inline-flex items-center gap-2 group border-b border-black pb-1 hover:border-orange-700"
          >
            View all clients
            <ArrowRight size={14} className="group-hover:translate-x-1.5 transition-transform" aria-hidden="true" />
          </PageLink>
        </div>
      </section>

      {/* CTA Section */}
      <section className="grain bg-black py-32 md:py-40 text-white relative overflow-hidden">
        <div aria-hidden="true" className="absolute inset-0 opacity-10 bg-[radial-gradient(#ff6900_1px,transparent_1px)] [background-size:16px_16px]"></div>
        <motion.div
          aria-hidden="true"
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-orange-500/20 blur-[120px]"
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="container mx-auto px-6 md:px-16 text-center relative z-10 max-w-4xl">
          <span className="text-orange-500 font-sans text-xs font-bold uppercase tracking-widest block mb-4">Let's work together</span>
          <RevealText
            as="h2"
            inView
            lines={['Keep your building', { text: 'running.', accent: true }]}
            className="text-4xl md:text-7xl font-display font-bold tracking-tight uppercase mb-8 text-white leading-[0.95]"
          />
          <p className="mb-12 text-neutral-300 font-sans text-base max-w-2xl mx-auto leading-relaxed">
            Tell us about your facility or what you need supplied, and we'll arrange a site visit or send a written quotation.
          </p>
          <PageLink
            to="contact"
            className="group inline-flex items-center bg-orange-500 text-black px-10 py-5 font-sans font-bold uppercase tracking-wider text-xs hover:bg-white transition-all rounded-full shadow-[0_10px_50px_-10px_rgba(255,105,0,0.8)]"
          >
            Request a Quote
            <ArrowRight size={14} className="ml-2 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
          </PageLink>
        </div>
      </section>
    </div>
  );
}
