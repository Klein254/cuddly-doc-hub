import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import CookieBanner from './components/CookieBanner';
import ScrollProgress from './components/fx/ScrollProgress';
import Home from './pages/Home';
import About from './pages/About';
import Services from './pages/Services';
import Contact from './pages/Contact';
import Clients from './pages/Clients';
import PrivacyPolicy from './pages/legal/PrivacyPolicy';
import Terms from './pages/legal/Terms';
import CookiePolicy from './pages/legal/CookiePolicy';
import RefundPolicy from './pages/legal/RefundPolicy';
import { NavigateProvider, PageView, pageFromPath, pagePaths, pageTitles } from './lib/router';
import { business } from './data/business';

export type { PageView };

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageView>(() => pageFromPath(window.location.pathname));
  const mainRef = useRef<HTMLElement>(null);
  const hasNavigated = useRef(false);

  const navigateTo = useCallback((page: PageView) => {
    if (window.location.pathname !== pagePaths[page]) {
      window.history.pushState({}, '', pagePaths[page]);
    }
    hasNavigated.current = true;
    setCurrentPage(page);
  }, []);

  useEffect(() => {
    const onPop = () => {
      hasNavigated.current = true;
      setCurrentPage(pageFromPath(window.location.pathname));
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  useEffect(() => {
    document.title = currentPage === 'home'
      ? `${business.shortName} | ${pageTitles.home}`
      : `${pageTitles[currentPage]} | ${business.shortName}`;
    if (hasNavigated.current) {
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
      // Move screen-reader / keyboard focus to the new page content.
      mainRef.current?.focus({ preventScroll: true });
    }
  }, [currentPage]);

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <Home navigateTo={navigateTo} />;
      case 'about':
        return <About />;
      case 'services':
        return <Services navigateTo={navigateTo} />;
      case 'clients':
        return <Clients navigateTo={navigateTo} />;
      case 'contact':
        return <Contact />;
      case 'privacy':
        return <PrivacyPolicy />;
      case 'terms':
        return <Terms />;
      case 'cookies':
        return <CookiePolicy />;
      case 'refunds':
        return <RefundPolicy />;
      default:
        return <Home navigateTo={navigateTo} />;
    }
  };

  return (
    <MotionConfig reducedMotion="user">
      <NavigateProvider value={navigateTo}>
        <div className="min-h-screen flex flex-col font-sans text-black bg-white overflow-x-clip">
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:bg-orange-500 focus:text-black focus:px-4 focus:py-3 focus:rounded-full focus:font-bold focus:text-sm"
          >
            Skip to main content
          </a>
          <ScrollProgress />
          <Navbar currentPage={currentPage} />
          <main id="main" ref={mainRef} tabIndex={-1} className="flex-grow flex flex-col relative w-full pt-20 outline-none">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={currentPage}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-col flex-grow"
              >
                {renderPage()}
              </motion.div>
            </AnimatePresence>
          </main>
          <Footer />
          <CookieBanner />
        </div>
      </NavigateProvider>
    </MotionConfig>
  );
}
