import React from 'react';
import PageHeader from '../../components/PageHeader';
import { PageLink, PageView } from '../../lib/router';
import { LEGAL_LAST_UPDATED } from '../../data/business';

export interface LegalSection {
  id: string;
  title: string;
  body: React.ReactNode;
}

const others: { id: PageView; label: string }[] = [
  { id: 'privacy', label: 'Privacy Policy' },
  { id: 'terms', label: 'Terms & Conditions' },
  { id: 'cookies', label: 'Cookie Policy' },
  { id: 'refunds', label: 'Refund & Returns' },
];

export default function LegalLayout({ page, title, intro, sections }: { page: PageView; title: string; intro: React.ReactNode; sections: LegalSection[] }) {
  return (
    <div className="w-full bg-white pb-32">
      <PageHeader eyebrow="Legal" title={[title]} compact />
      <div className="container mx-auto px-6 md:px-16 mt-16 max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-12">
        <aside className="lg:col-span-3 lg:sticky lg:top-32 self-start">
          <nav aria-label="On this page" className="mb-10">
            <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-600 mb-4">On this page</h2>
            <ol className="space-y-2 text-sm">
              {sections.map((s, i) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="text-neutral-700 hover:text-orange-700 transition-colors">
                    <span className="tabular-nums text-neutral-500 mr-2">{i + 1}.</span>{s.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
          <nav aria-label="Other policies">
            <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-600 mb-4">Other policies</h2>
            <ul className="space-y-2 text-sm">
              {others.filter((o) => o.id !== page).map((o) => (
                <li key={o.id}><PageLink to={o.id} className="text-neutral-700 hover:text-orange-700 transition-colors">{o.label}</PageLink></li>
              ))}
            </ul>
          </nav>
        </aside>
        <article className="lg:col-span-9 max-w-3xl legal-prose">
          <p className="text-sm font-bold uppercase tracking-widest text-neutral-600 !mb-6">Last updated: {LEGAL_LAST_UPDATED}</p>
          <div className="text-lg">{intro}</div>
          {sections.map((s, i) => (
            <section key={s.id} aria-labelledby={s.id}>
              <h2 id={s.id}>{i + 1}. {s.title}</h2>
              {s.body}
            </section>
          ))}
        </article>
      </div>
    </div>
  );
}
