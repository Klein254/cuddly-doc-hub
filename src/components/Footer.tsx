import React from 'react';
import { Phone, Mail, MapPin, Clock } from 'lucide-react';
import { PageLink, PageView } from '../lib/router';
import { business } from '../data/business';
import { openCookieSettings } from '../lib/consent';

const siteLinks: { id: PageView; label: string }[] = [
  { id: 'home', label: 'Home' },
  { id: 'about', label: 'About Us' },
  { id: 'services', label: 'Services' },
  { id: 'clients', label: 'Our Clients' },
  { id: 'contact', label: 'Contact Us' },
];

const legalLinks: { id: PageView; label: string }[] = [
  { id: 'privacy', label: 'Privacy Policy' },
  { id: 'terms', label: 'Terms & Conditions' },
  { id: 'cookies', label: 'Cookie Policy' },
  { id: 'refunds', label: 'Refund & Returns' },
];

export default function Footer() {
  return (
    <footer className="grain bg-black text-neutral-300 border-t border-neutral-900 pt-20 px-6 md:px-16 relative overflow-hidden">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-12 relative z-10">
        <div className="md:col-span-4">
          <PageLink to="home" className="font-display font-bold text-2xl tracking-tight text-white inline-block mb-4">
            VECTOR<span className="text-orange-500 font-light ml-1">TECHNICAL</span>
          </PageLink>
          <p className="text-sm text-neutral-400 max-w-sm font-sans leading-relaxed">
            Facility maintenance, technical services and general supplies for hospitals, hotels, residential and commercial buildings. Based in Nairobi, Kenya.
          </p>
        </div>

        <nav aria-label="Footer" className="md:col-span-2">
          <h2 className="text-xs font-bold uppercase tracking-widest text-white mb-5">Company</h2>
          <ul className="space-y-3 text-sm">
            {siteLinks.map((l) => (
              <li key={l.id}><PageLink to={l.id} className="hover:text-orange-500 transition-colors">{l.label}</PageLink></li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Legal" className="md:col-span-2">
          <h2 className="text-xs font-bold uppercase tracking-widest text-white mb-5">Legal</h2>
          <ul className="space-y-3 text-sm">
            {legalLinks.map((l) => (
              <li key={l.id}><PageLink to={l.id} className="hover:text-orange-500 transition-colors">{l.label}</PageLink></li>
            ))}
            <li>
              <button type="button" onClick={openCookieSettings} className="hover:text-orange-500 transition-colors text-left">
                Cookie Settings
              </button>
            </li>
          </ul>
        </nav>

        <address className="md:col-span-4 not-italic text-sm space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-white mb-5">Contact</h2>
          <p className="flex gap-3"><MapPin size={16} className="text-orange-500 shrink-0 mt-0.5" aria-hidden="true" /><span>{business.addressLines.join(', ')}</span></p>
          <p className="flex gap-3"><Phone size={16} className="text-orange-500 shrink-0 mt-0.5" aria-hidden="true" /><a href={business.phoneHref} className="hover:text-orange-500 transition-colors">{business.phone}</a></p>
          <p className="flex gap-3"><Mail size={16} className="text-orange-500 shrink-0 mt-0.5" aria-hidden="true" /><a href={`mailto:${business.email}`} className="hover:text-orange-500 transition-colors">{business.email}</a></p>
          <p className="flex gap-3"><Clock size={16} className="text-orange-500 shrink-0 mt-0.5" aria-hidden="true" /><span>{business.hours}</span></p>
        </address>
      </div>

      <div className="max-w-7xl mx-auto border-t border-neutral-800 mt-16 py-8 flex flex-col sm:flex-row justify-between gap-4 text-xs font-sans text-neutral-400 relative z-10">
        <p>
          &copy; {new Date().getFullYear()} {business.legalName}. All rights reserved.
          {business.registrationNumber && <> Registration No. {business.registrationNumber}.</>}
        </p>
        <p>Stock photography from Unsplash, used under the Unsplash License.</p>
      </div>

      <div aria-hidden="true" className="select-none pointer-events-none font-display font-bold uppercase leading-[0.8] text-[24vw] text-outline text-neutral-800 text-center -mb-[4vw]">
        Vector
      </div>
    </footer>
  );
}
