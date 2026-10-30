import React, { useEffect, useState } from 'react';
import { Menu, X, Phone, Mail } from 'lucide-react';
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'motion/react';
import { PageLink, PageView } from '../lib/router';
import { business } from '../data/business';

interface NavbarProps {
  currentPage: PageView;
}

const navItems: { id: PageView; label: string }[] = [
  { id: 'home', label: 'Home' },
  { id: 'about', label: 'About Us' },
  { id: 'services', label: 'Services' },
  { id: 'clients', label: 'Our Clients' },
  { id: 'contact', label: 'Contact Us' },
];

export default function Navbar({ currentPage }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, 'change', (y) => setScrolled(y > 40));

  useEffect(() => {
    if (!isMenuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setIsMenuOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isMenuOpen]);

  useEffect(() => setIsMenuOpen(false), [currentPage]);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/90 shadow-[0_8px_30px_rgba(0,0,0,0.06)]' : 'bg-white/80'} backdrop-blur-xl border-b border-neutral-100`}>
      {/* Top Bar */}
      <div
        className={`bg-black text-neutral-300 px-6 md:px-16 text-xs flex flex-col md:flex-row justify-between items-center gap-2 font-sans tracking-wide overflow-hidden transition-all duration-300 ${
          scrolled ? 'max-h-0 py-0' : 'max-h-24 py-2.5'
        }`}
      >
        <div className="flex items-center gap-6">
          <a href={business.phoneHref} className="flex items-center gap-1.5 hover:text-orange-500 transition-colors">
            <Phone size={13} className="text-orange-500" aria-hidden="true" /> {business.phone}
          </a>
          <a href={`mailto:${business.email}`} className="flex items-center gap-1.5 hover:text-orange-500 transition-colors">
            <Mail size={13} className="text-orange-500" aria-hidden="true" /> {business.email}
          </a>
        </div>
        <div className="hidden md:block text-[11px] text-neutral-300 font-medium">Jogoo Road Plaza, Nairobi | {business.hours}</div>
      </div>

      {/* Main Nav */}
      <nav aria-label="Main" className={`px-6 md:px-16 flex justify-between items-center transition-all duration-300 ${scrolled ? 'py-3' : 'py-4'}`}>
        <PageLink to="home" className="flex items-center py-1 group" aria-label={`${business.shortName} — home`}>
          <span className="font-display font-bold text-2xl tracking-tight text-black">
            VECTOR<span className="text-orange-600 font-light ml-1 group-hover:text-black transition-colors">TECHNICAL</span>
          </span>
        </PageLink>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8">
          {navItems.map((item) => {
            const active = currentPage === item.id;
            return (
              <PageLink
                key={item.id}
                to={item.id}
                aria-current={active ? 'page' : undefined}
                className={`font-sans text-sm font-medium transition-colors relative py-1 ${active ? 'text-black' : 'text-neutral-600 hover:text-black'}`}
              >
                {item.label}
                {active && (
                  <motion.span layoutId="nav-underline" className="absolute left-0 right-0 -bottom-0.5 h-0.5 bg-orange-500 rounded-full" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />
                )}
              </PageLink>
            );
          })}
          <PageLink
            to="contact"
            className="bg-black text-white px-6 py-3 font-sans font-medium text-xs uppercase tracking-wider hover:bg-orange-500 hover:text-black transition-colors duration-150 rounded-full ml-4 shadow-sm"
          >
            Request a Quote
          </PageLink>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          type="button"
          className="md:hidden text-black p-2 -mr-2 hover:text-orange-600 transition-colors"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-expanded={isMenuOpen}
          aria-controls="mobile-menu"
          aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
        >
          {isMenuOpen ? <X size={24} aria-hidden="true" /> : <Menu size={24} aria-hidden="true" />}
        </button>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-neutral-100 shadow-xl rounded-b-3xl overflow-hidden"
          >
            <div className="py-8 px-6 flex flex-col gap-2">
              {navItems.map((item, i) => (
                <motion.div key={item.id} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.04 * i }}>
                  <PageLink
                    to={item.id}
                    aria-current={currentPage === item.id ? 'page' : undefined}
                    className={`block font-display uppercase text-2xl font-bold py-2 pl-3 ${
                      currentPage === item.id ? 'text-black border-l-4 border-orange-500' : 'text-neutral-600'
                    }`}
                  >
                    {item.label}
                  </PageLink>
                </motion.div>
              ))}
              <PageLink
                to="contact"
                className="w-full bg-black text-white py-4 font-sans font-medium uppercase tracking-wider text-xs hover:bg-orange-500 hover:text-black transition-colors rounded-full mt-6 text-center shadow-sm"
              >
                Request a Quote
              </PageLink>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
