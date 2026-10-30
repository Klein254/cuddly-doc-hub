import React, { createContext, useContext } from 'react';

export type PageView =
  | 'home' | 'about' | 'services' | 'clients' | 'contact'
  | 'privacy' | 'terms' | 'cookies' | 'refunds';

export const pagePaths: Record<PageView, string> = {
  home: '/',
  about: '/about',
  services: '/services',
  clients: '/clients',
  contact: '/contact',
  privacy: '/privacy-policy',
  terms: '/terms',
  cookies: '/cookie-policy',
  refunds: '/refund-policy',
};

export const pageTitles: Record<PageView, string> = {
  home: 'Facility Maintenance & General Supplies in Nairobi',
  about: 'About Us',
  services: 'Services',
  clients: 'Our Clients',
  contact: 'Contact Us',
  privacy: 'Privacy Policy',
  terms: 'Terms & Conditions',
  cookies: 'Cookie Policy',
  refunds: 'Refund & Returns Policy',
};

export function pageFromPath(pathname: string): PageView {
  const clean = pathname.replace(/\/+$/, '') || '/';
  const match = (Object.keys(pagePaths) as PageView[]).find((p) => pagePaths[p] === clean);
  return match ?? 'home';
}

const NavigateContext = createContext<(page: PageView) => void>(() => {});
export const NavigateProvider = NavigateContext.Provider;
export const useNavigate = () => useContext(NavigateContext);

type PageLinkProps = Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & { to: PageView };

// A real <a href> (works with middle-click, copy link, screen readers) that
// navigates client-side on a normal click.
export function PageLink({ to, onClick, ...rest }: PageLinkProps) {
  const navigate = useNavigate();
  return (
    <a
      href={pagePaths[to]}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        navigate(to);
      }}
      {...rest}
    />
  );
}
