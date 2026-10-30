import React from 'react';
import LegalLayout from './LegalLayout';
import { business } from '../../data/business';
import { PageLink } from '../../lib/router';

export default function PrivacyPolicy() {
  const email = <a href={`mailto:${business.email}`}>{business.email}</a>;
  return (
    <LegalLayout
      page="privacy"
      title="Privacy Policy"
      intro={
        <p>
          This policy explains how {business.legalName} (“{business.shortName}”, “we”, “us”) collects and uses personal data when you visit this website or contact us. We handle personal data in line with Kenya's Data Protection Act, 2019 and its regulations.
        </p>
      }
      sections={[
        {
          id: 'who-we-are',
          title: 'Who we are',
          body: (
            <>
              <p>We are the data controller for personal data collected through this website. Our contact details are:</p>
              <ul>
                <li>{business.legalName}</li>
                <li>{business.addressLines.join(', ')}</li>
                <li>Email: {email}</li>
                <li>Phone: <a href={business.phoneHref}>{business.phone}</a></li>
                {business.registrationNumber && <li>Registration number: {business.registrationNumber}</li>}
              </ul>
            </>
          ),
        },
        {
          id: 'what-we-collect',
          title: 'What we collect',
          body: (
            <>
              <p>We collect only what we need to respond to you.</p>
              <h3>When you use the contact form</h3>
              <ul>
                <li>Your name, email address and message (required).</li>
                <li>Your phone number, if you choose to give it.</li>
                <li>A record that you agreed to us using these details, with the date and the version of this policy you saw.</li>
              </ul>
              <p>
                Please don't include health, patient or other sensitive information in your message. We don't need it to respond, and if we receive it unintentionally we'll delete it.
              </p>
              <h3>When you email or call us</h3>
              <p>The details you choose to share, such as your name, contact details and what your enquiry is about.</p>
              <h3>When you browse the website</h3>
              <p>
                We don't use analytics, advertising or tracking tools. Like any web server, our hosting provider automatically processes technical data such as your IP address and browser type to deliver pages and keep the service secure. Our server also briefly holds IP addresses in memory (for no more than about 10 minutes) to block spam to the contact form. Your cookie choice is stored in your own browser (see our <PageLink to="cookies">Cookie Policy</PageLink>).
              </p>
            </>
          ),
        },
        {
          id: 'how-we-use',
          title: 'How we use your data and our lawful basis',
          body: (
            <table>
              <thead>
                <tr><th>Purpose</th><th>Lawful basis</th></tr>
              </thead>
              <tbody>
                <tr><td>Replying to your enquiry and preparing quotations</td><td>Your consent, and steps you ask us to take before entering into a contract</td></tr>
                <tr><td>Carrying out work or supplying goods you've ordered</td><td>Performance of a contract with you</td></tr>
                <tr><td>Keeping business and tax records</td><td>Compliance with legal obligations</td></tr>
                <tr><td>Keeping the website and contact form secure and free of spam</td><td>Our legitimate interests</td></tr>
              </tbody>
            </table>
          ),
        },
        {
          id: 'marketing',
          title: 'No marketing or selling of data',
          body: <p>We don't send marketing messages, and we don't sell, rent or trade your personal data.</p>,
        },
        {
          id: 'sharing',
          title: 'Who we share it with',
          body: (
            <>
              <p>We only share personal data with service providers who help us run our business, under terms that require them to protect it:</p>
              <ul>
                <li><strong>Email provider</strong> (Google, which provides our Gmail account): contact-form messages are delivered to our inbox.</li>
                <li><strong>Website hosting provider</strong>: stores the website and contact-form submissions.</li>
              </ul>
              <p>We may also disclose data where the law requires it, for example to a regulator or court.</p>
            </>
          ),
        },
        {
          id: 'transfers',
          title: 'Transfers outside Kenya',
          body: (
            <p>
              Our email and hosting providers may store data on servers outside Kenya. Where this happens, we rely on providers that offer appropriate safeguards for personal data, as required by sections 48 to 50 of the Data Protection Act, 2019. By using the contact form you also consent to this transfer for the purpose of replying to you.
            </p>
          ),
        },
        {
          id: 'retention',
          title: 'How long we keep it',
          body: (
            <ul>
              <li>Contact-form enquiries are deleted automatically from our website records 12 months after they were sent.</li>
              <li>Enquiry emails are kept for up to 12 months after our last contact, unless they lead to work with us.</li>
              <li>If you become a client, we keep contract, invoice and payment records for as long as Kenyan tax law requires (currently at least five years).</li>
            </ul>
          ),
        },
        {
          id: 'security',
          title: 'How we protect it',
          body: (
            <p>
              We use reasonable technical and organisational measures to protect personal data, including encrypted connections (HTTPS), access limited to staff who need it, and spam protection on the contact form. No system is completely secure, but if a breach affects your data we will notify you and the Data Protection Commissioner where the law requires.
            </p>
          ),
        },
        {
          id: 'rights',
          title: 'Your rights',
          body: (
            <>
              <p>Under the Data Protection Act, 2019 you have the right to:</p>
              <ul>
                <li>be told how your data is used (this policy);</li>
                <li>get a copy of the personal data we hold about you;</li>
                <li>ask us to correct data that is wrong or incomplete;</li>
                <li>ask us to delete data that is false, misleading or no longer needed;</li>
                <li>object to us processing your data, and withdraw your consent at any time (this doesn't affect anything we did before you withdrew it);</li>
                <li>ask us to transfer your data to you or another organisation, where technically possible.</li>
              </ul>
              <p>To use any of these rights, email {email}. We'll respond within the timeframes the law sets and may need to confirm your identity first.</p>
            </>
          ),
        },
        {
          id: 'complaints',
          title: 'Complaints',
          body: (
            <p>
              If you're unhappy with how we've handled your data, please contact us first so we can try to put it right. You also have the right to complain to the Office of the Data Protection Commissioner (ODPC) at{' '}
              <a href="https://www.odpc.go.ke" target="_blank" rel="noopener noreferrer">www.odpc.go.ke<span className="sr-only"> (opens in a new tab)</span></a>.
            </p>
          ),
        },
        {
          id: 'children',
          title: 'Children',
          body: <p>Our services are aimed at businesses and adults. We don't knowingly collect personal data from children.</p>,
        },
        {
          id: 'changes',
          title: 'Changes to this policy',
          body: <p>We may update this policy from time to time. The “last updated” date at the top shows when it last changed.</p>,
        },
      ]}
    />
  );
}
