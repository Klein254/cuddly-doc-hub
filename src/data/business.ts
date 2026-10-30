// Single source of truth for company details shown in the header, footer,
// contact page and legal pages. Update here and the whole site follows.
export const business = {
  legalName: 'Vector Technical Maintenance & General Supplies',
  shortName: 'Vector Technical',
  phone: '+254 115 526 992',
  phoneHref: 'tel:+254115526992',
  email: 'vectortech254@gmail.com',
  addressLines: ['Jogoo Road Plaza, 2nd Floor, Room 517', 'Nairobi, Kenya'],
  mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Jogoo+Road+Plaza+Nairobi',
  hours: 'Mon–Fri, 8 AM – 6 PM',
  founded: 2025,
  // Optional: fill in when available. Empty values are hidden on the site.
  registrationNumber: '', // e.g. business registration / company number from eCitizen BRS
};

// Shown on every legal page. Change it whenever a policy is updated.
export const LEGAL_LAST_UPDATED = '29 October 2026';

// Stored with each contact-form submission as proof of what the sender agreed to.
export const PRIVACY_POLICY_VERSION = '2026-10-29';
