import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Cookie } from 'lucide-react';
import { OPTIONAL_CATEGORIES, saveConsent, useConsent, useCookieSettingsOpen } from '../lib/consent';
import { PageLink } from '../lib/router';

export default function CookieBanner() {
  const consent = useConsent();
  const settingsOpen = useCookieSettingsOpen();
  // Wait a moment so the banner doesn't compete with the hero animation.
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 900);
    return () => clearTimeout(t);
  }, []);

  const visible = ready && (!consent.decided || settingsOpen);
  const hasOptional = OPTIONAL_CATEGORIES.length > 0;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          role="region"
          aria-label="Cookie notice"
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:bottom-6 md:max-w-md z-[70] bg-black text-white rounded-3xl p-6 shadow-2xl border border-neutral-800"
        >
          <div className="flex items-start gap-3 mb-4">
            <Cookie size={20} className="text-orange-500 shrink-0 mt-0.5" aria-hidden="true" />
            <div className="text-sm text-neutral-300 leading-relaxed">
              {hasOptional ? (
                <p>
                  We use essential storage to run this site and, with your permission, optional cookies ({OPTIONAL_CATEGORIES.join(', ')}). You can change your choice any time from “Cookie Settings” in the footer.
                </p>
              ) : (
                <p>
                  This site uses no tracking, analytics or advertising cookies. We only store your cookie choice in your browser so this notice doesn't reappear.
                </p>
              )}
              <PageLink to="cookies" className="inline-block mt-2 text-orange-500 underline underline-offset-4 hover:text-white">
                Read our Cookie Policy
              </PageLink>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            {hasOptional ? (
              <>
                <button
                  type="button"
                  onClick={() => saveConsent({ analytics: false, marketing: false })}
                  className="flex-1 min-w-[140px] border border-neutral-600 text-white py-3 px-4 rounded-full text-xs font-bold uppercase tracking-wider hover:border-white transition-colors"
                >
                  Reject optional cookies
                </button>
                <button
                  type="button"
                  onClick={() => saveConsent({ analytics: true, marketing: true })}
                  className="flex-1 min-w-[140px] bg-orange-500 text-black py-3 px-4 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-white transition-colors"
                >
                  Accept optional cookies
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => saveConsent({})}
                className="w-full bg-orange-500 text-black py-3 px-4 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-white transition-colors"
              >
                OK, got it
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
