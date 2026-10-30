import React from 'react';
import { motion } from 'motion/react';
import { Building2, ArrowRight } from 'lucide-react';
import { clientsData } from '../data/clients';
import { PageView } from '../App';
import { PageLink } from '../lib/router';
import PageHeader from '../components/PageHeader';
import SpotlightCard from '../components/fx/SpotlightCard';

interface ClientsProps {
  navigateTo?: (page: PageView) => void;
}

// The list below comes straight from src/data/clients.ts — add a client there
// and it appears here and in the scrolling band on the home page automatically.
export default function Clients(_: ClientsProps) {
  return (
    <div className="w-full bg-white pb-32">
      <PageHeader
        eyebrow="Trusted partners"
        title={['Our Clients.']}
        intro="We're proud to work with these organisations."
        image="/images/office-towers.webp"
        ghost="Partners"
      />

      {/* Clients List */}
      <div className="container mx-auto px-6 md:px-16 mt-28 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {clientsData.map((client, index) => (
            <SpotlightCard
              key={client.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="bg-neutral-50 border border-neutral-100 p-10 hover:bg-white hover:shadow-2xl hover:border-transparent transition-[background-color,box-shadow,border-color] duration-300 rounded-3xl"
            >
              <span aria-hidden="true" className="absolute top-4 right-6 font-display font-bold text-7xl text-neutral-100 group-hover:text-orange-100 transition-colors select-none">
                {String(index + 1).padStart(2, '0')}
              </span>
              <div className="w-14 h-14 bg-white border border-neutral-100 shadow-sm group-hover:bg-orange-500 group-hover:border-orange-500 flex items-center justify-center mb-6 transition-all duration-300 rounded-2xl relative">
                <Building2 size={24} className="text-black" aria-hidden="true" />
              </div>
              <h2 className="text-2xl font-display font-bold uppercase tracking-tight text-black mb-4 relative">{client.name}</h2>
              {client.description && <p className="text-neutral-700 font-sans text-base leading-relaxed relative">{client.description}</p>}
            </SpotlightCard>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grain mt-20 border border-neutral-800 p-10 md:p-14 bg-black text-white relative overflow-hidden rounded-3xl shadow-xl"
        >
          <div aria-hidden="true" className="absolute inset-0 opacity-10 bg-[radial-gradient(#ff6900_1px,transparent_1px)] [background-size:16px_16px]"></div>
          <div className="relative z-10 text-center max-w-2xl mx-auto">
            <h2 className="text-2xl md:text-4xl font-display font-bold uppercase tracking-tight mb-4">Work with us</h2>
            <p className="text-neutral-300 font-sans text-sm leading-relaxed mb-8">
              Whether you manage a hospital, a commercial building or an industrial site, tell us what you need and we'll put together a plan and a written quotation.
            </p>
            <PageLink
              to="contact"
              className="inline-flex items-center justify-center bg-orange-500 text-black px-8 py-4 font-sans font-bold uppercase tracking-wider text-xs hover:bg-white transition-all rounded-full shadow-lg group"
            >
              Contact us
              <ArrowRight size={14} className="ml-2 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
            </PageLink>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
