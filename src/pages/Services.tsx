import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Wind, ThermometerSun, Zap, Activity, Grid, Beaker,
  ShieldAlert, Droplet, Stethoscope, HardHat, Package, Wrench, ArrowRight, ClipboardCheck, LucideIcon,
} from 'lucide-react';
import { PageView } from '../App';
import { PageLink } from '../lib/router';
import PageHeader from '../components/PageHeader';
import SpotlightCard from '../components/fx/SpotlightCard';
import SystemsStack from '../components/SystemsStack';

interface ServicesProps {
  navigateTo?: (page: PageView) => void;
}

type Category = 'Engineering' | 'Maintenance' | 'Supplies';

const servicesList: { title: string; description: string; icon: LucideIcon; category: Category }[] = [
  {
    title: 'Medical Gas Systems',
    description: 'We provide a fast, reliable and efficient service for medical gas plumbing and gas fitting, including installation, repair and maintenance of gas lines and gas appliances. Our gas fitters handle the full range of medical gas appliance and pipework jobs.',
    icon: Wind,
    category: 'Engineering',
  },
  {
    title: 'Industrial Tanks & Filtration',
    description: 'Serving the fuel, beverage and dairy industries, Vector cleans diverse tanks (plastic, fibreglass, aluminium, stainless steel, concrete). We revive neglected tanks, handling plumbing, cleaning and disinfection for safe reuse, assess and repair worn or damaged tanks, and supply and install new, larger tanks as your storage needs grow.',
    icon: Beaker,
    category: 'Maintenance',
  },
  {
    title: 'Hydro-jet Drain Cleaning',
    description: 'Hydro-jetting clears drains with high-pressure water instead of chemicals, so nothing harsh ends up in the environment or eats away at your pipes. It is one of the most thorough ways to clear stubborn blockages and build-up.',
    icon: Droplet,
    category: 'Maintenance',
  },
  {
    title: 'Steam Supply & Sterilisation',
    description: 'We install, calibrate and maintain steam supply accessories and heating systems used for sterilisation, space heating and hot water in hospital facilities. Our technicians focus on performance, energy efficiency and safety, helping to reduce downtime.',
    icon: ThermometerSun,
    category: 'Engineering',
  },
  {
    title: 'HVAC Systems',
    description: 'HVAC services for the environmental needs of healthcare settings, including cleanrooms, operating theatres and patient wards: from system design and installation to routine preventive maintenance and emergency repairs, covering ventilation, air quality, humidity and temperature control.',
    icon: Wind,
    category: 'Engineering',
  },
  {
    title: 'Emergency Power & UPS',
    description: 'Power continuity matters in hospitals. We maintain and service generators, uninterruptible power supply (UPS) systems and related power infrastructure to keep critical loads running during outages and voltage fluctuations, with regular testing and load assessments.',
    icon: Zap,
    category: 'Engineering',
  },
  {
    title: 'Medical & Technical Equipment Maintenance',
    description: 'Preventive and corrective maintenance of medical and technical equipment, following manufacturer specifications: scheduled servicing, parts replacement, calibration and performance testing. Our focus areas are dialysis, ICU, theatre and radiology equipment.',
    icon: Activity,
    category: 'Maintenance',
  },
  {
    title: 'Hardware & Electrical Supplies',
    description: 'A wide range of tools, wiring accessories, lighting, circuit protection devices, power tools and general hardware, supplying construction, maintenance and technical operations.',
    icon: HardHat,
    category: 'Supplies',
  },
  {
    title: 'Commercial Kitchens & Laundry',
    description: 'We supply, install and maintain laundry and kitchen equipment for commercial, industrial and institutional use: washing machines, dryers, steam irons, dishwashers, ovens, cookers, refrigerators and food service appliances, backed by preventive maintenance and repairs.',
    icon: Package,
    category: 'Supplies',
  },
  {
    title: 'Stainless Steel Fabrication',
    description: 'Durable, made-to-measure stainless steel for kitchens, hospitals, laboratories and commercial facilities: tables, sinks, worktops, trolleys, cabinets, rails and specialised fittings, designed with hygiene and safety in mind.',
    icon: Grid,
    category: 'Supplies',
  },
  {
    title: 'Surgical Equipment & Consumables',
    description: 'We supply and maintain surgical equipment and medical consumables, covering surgical instruments, sterilisation units, diagnostic tools and clinical devices, supported by scheduled maintenance and repairs.',
    icon: Stethoscope,
    category: 'Supplies',
  },
  {
    title: 'Industrial Incinerators',
    description: 'We supply, install and maintain incinerators for medical, industrial and municipal waste, selected with applicable environmental requirements in mind. We also provide routine servicing, repairs and operator training.',
    icon: ShieldAlert,
    category: 'Engineering',
  },
  {
    title: 'Facility Management Consulting',
    description: 'Site audits, energy assessments and lifecycle reviews that lead to a maintenance plan built around your facility, aimed at reducing downtime and long-term running costs.',
    icon: ClipboardCheck,
    category: 'Maintenance',
  },
  {
    title: 'General Maintenance & Repair',
    description: 'Routine building upkeep covering masonry, painting, minor civil works and carpentry, preserving the value and safety of your commercial or residential property.',
    icon: Wrench,
    category: 'Maintenance',
  },
  {
    title: 'Electrical Installations & Safety',
    description: 'Electrical installations, switchgear maintenance and energy audits, helping your power distribution run safely and efficiently.',
    icon: Zap,
    category: 'Engineering',
  },
  {
    title: 'Commercial Plumbing Systems',
    description: 'Water supply networks, pump stations and waste systems: leak detection, pipe retrofitting and emergency repairs to keep water flowing and prevent costly water damage.',
    icon: Droplet,
    category: 'Engineering',
  },
];

export const serviceNames = servicesList.map((s) => s.title);

const filters: ('All' | Category)[] = ['All', 'Engineering', 'Maintenance', 'Supplies'];

export default function Services({ navigateTo }: ServicesProps) {
  const [filter, setFilter] = useState<'All' | Category>('All');
  const visible = servicesList.filter((s) => filter === 'All' || s.category === filter);

  return (
    <div className="w-full bg-white pb-32">
      <PageHeader
        eyebrow="What we deliver"
        title={['Technical', 'Services.']}
        intro="Engineering, clinical installations, maintenance and supplies for healthcare, hospitality, residential and commercial facilities."
        image="/images/welder.webp"
        ghost="Services"
      />

      <SystemsStack />

      {/* Services Grid */}
      <div className="container mx-auto px-6 md:px-16 mt-12 max-w-7xl">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <h2 className="text-3xl md:text-5xl font-display font-bold uppercase tracking-tight leading-[0.95]">
            All services <span className="text-neutral-500 tabular-nums">({visible.length})</span>
          </h2>
          <div role="group" aria-label="Filter services" className="flex flex-wrap gap-2">
            {filters.map((f) => (
              <button
                key={f}
                type="button"
                aria-pressed={filter === f}
                onClick={() => setFilter(f)}
                className={`relative px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors ${
                  filter === f ? 'text-white' : 'text-neutral-700 bg-neutral-100 hover:bg-neutral-200'
                }`}
              >
                {filter === f && <motion.span layoutId="service-filter" className="absolute inset-0 bg-black rounded-full" transition={{ type: 'spring', stiffness: 400, damping: 34 }} />}
                <span className="relative">{f}</span>
              </button>
            ))}
          </div>
        </div>

        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {visible.map((service, index) => (
              <SpotlightCard
                layout
                key={service.title}
                initial={{ opacity: 0, y: 20, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: (index % 3) * 0.05, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className="bg-neutral-50 border border-neutral-100 p-8 hover:bg-white hover:shadow-2xl hover:border-transparent transition-[background-color,box-shadow,border-color] duration-300 rounded-3xl"
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="w-14 h-14 bg-white border border-neutral-100 shadow-sm group-hover:bg-orange-500 group-hover:border-orange-500 group-hover:-rotate-6 flex items-center justify-center transition-all duration-300 rounded-2xl">
                    <service.icon size={24} className="text-black" aria-hidden="true" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-600 bg-white border border-neutral-200 rounded-full px-3 py-1">
                    {service.category}
                  </span>
                </div>
                <h3 className="text-xl font-display font-bold uppercase tracking-tight text-black mb-3">{service.title}</h3>
                <p className="text-neutral-600 font-sans text-sm leading-relaxed">{service.description}</p>
              </SpotlightCard>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Custom Sourcing Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="grain mt-20 border border-neutral-800 p-10 md:p-14 bg-black text-white relative overflow-hidden rounded-3xl shadow-xl"
        >
          <div aria-hidden="true" className="absolute inset-0 opacity-10 bg-[radial-gradient(#ff6900_1px,transparent_1px)] [background-size:16px_16px]"></div>
          <div aria-hidden="true" className="absolute -right-24 -top-24 w-96 h-96 bg-orange-500/25 blur-[100px] rounded-full" />
          <div className="relative z-10 max-w-4xl">
            <span className="text-orange-500 font-sans text-xs font-bold uppercase tracking-widest block mb-2">Beyond our catalogue</span>
            <h2 className="text-3xl md:text-4xl font-display font-bold uppercase tracking-tight mb-4">Procurement & Sourcing</h2>
            <p className="text-neutral-300 font-sans text-base leading-relaxed mb-8">
              Need something that isn't listed? Beyond our specialised engineering supplies, we work with a network of manufacturers and distributors to source general products, from plumbing fixtures like showers and taps to architectural hardware like door stoppers, hinges and custom fittings, and deliver them to your site.
            </p>
            <PageLink
              to="contact"
              className="inline-flex items-center justify-center bg-orange-500 text-black px-8 py-4 font-sans font-bold uppercase tracking-wider text-xs hover:bg-white transition-all rounded-full shadow-lg group"
            >
              Ask about sourcing
              <ArrowRight size={14} className="ml-2 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
            </PageLink>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
