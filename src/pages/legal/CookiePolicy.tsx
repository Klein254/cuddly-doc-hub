import React from 'react';
import LegalLayout from './LegalLayout';
import { business } from '../../data/business';
import { openCookieSettings } from '../../lib/consent';

export default function CookiePolicy() {
  return (
    <LegalLayout
      page="cookies"
      title="Cookie Policy"
      intro={
        <p>
          Cookies and similar technologies (like your browser's local storage) let a website save small pieces of information on your device. This page explains what this website stores and why.
        </p>
      }
      sections={[
        {
          id: 'summary',
          title: 'The short version',
          body: (
            <p>
              This website does <strong>not</strong> use analytics, advertising, social media or other tracking cookies, and it doesn't load content from third parties that could set their own cookies. Our fonts and images are hosted on our own server.
            </p>
          ),
        },
        {
          id: 'what-we-store',
          title: 'What we store',
          body: (
            <table>
              <thead>
                <tr><th>Name</th><th>Type</th><th>Purpose</th><th>How long</th></tr>
              </thead>
              <tbody>
                <tr>
                  <td><code>vt-cookie-consent-v1</code></td>
                  <td>Local storage (strictly necessary)</td>
                  <td>Remembers that you've seen the cookie notice and any choice you made, so it doesn't keep reappearing.</td>
                  <td>Until you clear your browser storage</td>
                </tr>
              </tbody>
            </table>
          ),
        },
        {
          id: 'consent',
          title: 'Your choices',
          body: (
            <>
              <p>
                Strictly necessary storage doesn't require consent because the site can't work properly without it. If we ever add optional cookies (for example, analytics), we will update this policy, list them here, and only use them if you accept them in the cookie notice. Rejecting them will be as easy as accepting them.
              </p>
              <p>
                <button type="button" onClick={openCookieSettings} className="underline underline-offset-4 text-orange-700 font-medium">
                  Open cookie settings
                </button>
              </p>
              <p>You can also delete or block cookies and local storage in your browser settings.</p>
            </>
          ),
        },
        {
          id: 'links',
          title: 'External links',
          body: (
            <p>
              Some pages link to other websites (for example, Google Maps for directions). If you follow those links, those sites have their own cookie and privacy policies.
            </p>
          ),
        },
        {
          id: 'contact',
          title: 'Questions',
          body: <p>Email us at <a href={`mailto:${business.email}`}>{business.email}</a>.</p>,
        },
      ]}
    />
  );
}
