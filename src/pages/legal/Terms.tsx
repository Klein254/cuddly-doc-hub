import React from 'react';
import LegalLayout from './LegalLayout';
import { business } from '../../data/business';
import { PageLink } from '../../lib/router';

export default function Terms() {
  return (
    <LegalLayout
      page="terms"
      title="Terms & Conditions"
      intro={
        <p>
          These terms apply to your use of this website, which is operated by {business.legalName} of {business.addressLines.join(', ')}. By using the website you agree to them. If you don't agree, please don't use the site.
        </p>
      }
      sections={[
        {
          id: 'information',
          title: 'Information on this website',
          body: (
            <>
              <p>
                The website gives general information about our services and supplies. We try to keep it accurate and up to date, but it isn't a quotation, an offer or professional advice for your specific situation. Products, services and availability can change.
              </p>
              <p>Photos are for illustration. Stock images don't show our own staff, clients or projects unless we say so.</p>
            </>
          ),
        },
        {
          id: 'quotes',
          title: 'Quotations, orders and work',
          body: (
            <>
              <p>
                Any work or supply of goods is agreed separately in writing, usually through a written quotation, purchase order or service agreement. Those documents set out the scope, price, payment terms, timelines and warranties, and they take priority over anything on this website.
              </p>
              <p>
                Unless a quotation says otherwise, quotations are valid for 30 days and prices are in Kenya Shillings. Returns and refunds are covered in our <PageLink to="refunds">Refund &amp; Returns Policy</PageLink>.
              </p>
            </>
          ),
        },
        {
          id: 'acceptable-use',
          title: 'Using the website',
          body: (
            <>
              <p>You agree not to:</p>
              <ul>
                <li>use the website for anything unlawful, or in a way that could damage or disrupt it;</li>
                <li>try to gain unauthorised access to the website, its server or any related systems;</li>
                <li>send spam, malicious code or false information through the contact form.</li>
              </ul>
            </>
          ),
        },
        {
          id: 'ip',
          title: 'Intellectual property',
          body: (
            <>
              <p>
                The content of this website, including text, graphics, illustrations, animations and the “Vector Technical” name and branding, belongs to {business.legalName} or is used under licence. You may view it and print or save pages for your own reference, but you may not copy, republish or use it commercially without our written permission.
              </p>
              <p>
                Some photographs are stock images from Unsplash, used under the <a href="https://unsplash.com/license" target="_blank" rel="noopener noreferrer">Unsplash License<span className="sr-only"> (opens in a new tab)</span></a>. Their copyright remains with the photographers.
              </p>
              <p>
                Client names on the website are shown to describe organisations we have worked with. Their names and trademarks belong to them, and showing them doesn't mean they endorse us beyond that working relationship.
              </p>
            </>
          ),
        },
        {
          id: 'links',
          title: 'Links to other websites',
          body: <p>We may link to other websites, such as Google Maps. We aren't responsible for their content or how they handle your data.</p>,
        },
        {
          id: 'liability',
          title: 'Our liability',
          body: (
            <>
              <p>
                We provide this website “as is”. As far as the law allows, we aren't liable for any loss caused by relying on general information on the website, or by the website being temporarily unavailable.
              </p>
              <p>
                Nothing in these terms limits or excludes any liability that can't be limited or excluded under Kenyan law, including your rights under the Consumer Protection Act, 2012, or our liability for death or personal injury caused by our negligence.
              </p>
            </>
          ),
        },
        {
          id: 'privacy',
          title: 'Privacy',
          body: <p>How we handle your personal data is explained in our <PageLink to="privacy">Privacy Policy</PageLink> and <PageLink to="cookies">Cookie Policy</PageLink>.</p>,
        },
        {
          id: 'law',
          title: 'Governing law',
          body: <p>These terms are governed by the laws of Kenya, and the courts of Kenya have jurisdiction over any dispute about them.</p>,
        },
        {
          id: 'changes',
          title: 'Changes',
          body: <p>We may update these terms from time to time. The “last updated” date at the top shows when they last changed.</p>,
        },
        {
          id: 'contact',
          title: 'Contact',
          body: <p>Questions about these terms? Email <a href={`mailto:${business.email}`}>{business.email}</a> or call <a href={business.phoneHref}>{business.phone}</a>.</p>,
        },
      ]}
    />
  );
}
