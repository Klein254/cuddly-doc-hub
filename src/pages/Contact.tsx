import React, { useRef, useState } from 'react';
import { motion } from 'motion/react';
import { MapPin, Phone, Mail, AlertCircle, CheckCircle2, ArrowRight, Clock } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { PageLink } from '../lib/router';
import { business, PRIVACY_POLICY_VERSION } from '../data/business';

type Field = 'name' | 'email' | 'phone' | 'message' | 'consent';

const LIMITS = { name: 100, email: 200, phone: 30, message: 3000 };

export default function Contact() {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', message: '' });
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState(''); // honeypot: real people never fill this
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [responseMsg, setResponseMsg] = useState('');
  const formRef = useRef<HTMLFormElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name as Field]) setErrors({ ...errors, [e.target.name]: undefined });
  };

  const validate = () => {
    const next: Partial<Record<Field, string>> = {};
    if (!formData.name.trim()) next.name = 'Please enter your name.';
    if (!formData.email.trim()) next.email = 'Please enter your email address.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) next.email = 'Please enter a valid email address, like name@example.com.';
    if (formData.phone && !/^[+\d][\d\s()-]{5,}$/.test(formData.phone.trim())) next.phone = 'Please enter a valid phone number, or leave it blank.';
    if (!formData.message.trim()) next.message = 'Please tell us how we can help.';
    if (!consent) next.consent = 'Please tick the box so we can use your details to reply.';
    return next;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const found = validate();
    setErrors(found);
    const firstInvalid = (Object.keys(found) as Field[])[0];
    if (firstInvalid) {
      setStatus('idle');
      formRef.current?.querySelector<HTMLElement>(`[name="${firstInvalid}"]`)?.focus();
      return;
    }

    setStatus('loading');
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, consent, policyVersion: PRIVACY_POLICY_VERSION, website }),
      });
      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        setStatus('success');
        setResponseMsg("Thanks — your message has been sent. We'll reply by email or phone during our working hours.");
        setFormData({ name: '', email: '', phone: '', message: '' });
        setConsent(false);
      } else {
        setStatus('error');
        setResponseMsg(data.error || 'Something went wrong. Please try again, or email us directly.');
      }
    } catch (error) {
      console.error(error);
      setStatus('error');
      setResponseMsg('We couldn’t reach the server. Please check your connection, or email us directly.');
    }
  };

  const inputClass = (field: Field) =>
    `w-full bg-neutral-50 border p-4 focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-black outline-none text-black font-sans text-sm rounded-2xl transition-all duration-300 placeholder:text-neutral-500 ${
      errors[field] ? 'border-red-600' : 'border-neutral-300'
    }`;
  const labelClass = 'block uppercase font-sans font-bold text-[11px] tracking-wider text-neutral-700';
  const errorText = (field: Field) =>
    errors[field] && (
      <p id={`${field}-error`} className="text-red-700 text-xs font-medium flex items-center gap-1.5">
        <AlertCircle size={14} aria-hidden="true" /> {errors[field]}
      </p>
    );
  const a11y = (field: Field) => ({
    'aria-invalid': !!errors[field],
    'aria-describedby': errors[field] ? `${field}-error` : undefined,
  });

  const contactItems = [
    { icon: MapPin, label: 'Our Office', body: <>{business.addressLines.map((l) => <span key={l} className="block">{l}</span>)}<a href={business.mapsUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-orange-700 underline underline-offset-4 hover:text-black mt-1 inline-block">Open in Google Maps<span className="sr-only"> (opens in a new tab)</span></a></> },
    { icon: Phone, label: 'Phone', body: <a href={business.phoneHref} className="hover:text-orange-700 transition-colors">{business.phone}</a> },
    { icon: Mail, label: 'Email', body: <a href={`mailto:${business.email}`} className="hover:text-orange-700 transition-colors break-all">{business.email}</a> },
    { icon: Clock, label: 'Office Hours', body: business.hours },
  ];

  return (
    <div className="w-full bg-white pb-32">
      <PageHeader
        eyebrow="Get in touch"
        title={['Contact Us.']}
        intro="Tell us about your facility, your equipment or what you need supplied, and we'll get back to you."
        image="/images/laptop-typing.webp"
        ghost="Contact"
      />

      <div className="container mx-auto px-6 md:px-16 mt-28 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          {/* Contact Information */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} className="lg:col-span-5 space-y-12">
            <div>
              <span className="text-orange-700 font-sans text-xs font-bold uppercase tracking-widest block mb-2">Reach us directly</span>
              <h2 className="text-4xl md:text-6xl font-display font-bold text-black tracking-tight uppercase leading-none">
                Let's<br />Talk.
              </h2>
            </div>

            <ul className="space-y-8 mt-12">
              {contactItems.map((item, i) => (
                <motion.li
                  key={item.label}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + i * 0.08 }}
                  className="flex items-start gap-4 group"
                >
                  <div className="w-12 h-12 bg-neutral-50 border border-neutral-100 flex items-center justify-center shrink-0 rounded-2xl group-hover:bg-orange-500 group-hover:border-orange-500 transition-all duration-300 shadow-sm">
                    <item.icon size={18} className="text-black" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="text-[11px] font-sans font-bold text-neutral-600 uppercase tracking-widest mb-1">{item.label}</h3>
                    <div className="text-lg font-display font-medium text-black">{item.body}</div>
                  </div>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-7 bg-white border border-neutral-100 p-8 md:p-12 rounded-3xl shadow-2xl shadow-black/5"
          >
            <h2 className="text-2xl font-display font-bold uppercase tracking-tight mb-2">Send us a message</h2>
            <p className="text-sm text-neutral-600 mb-8">Fields marked * are required.</p>

            <div aria-live="polite" role="status">
              {status === 'success' && (
                <div className="mb-6 p-6 bg-neutral-50 border-l-4 border-orange-500 text-black flex items-start gap-4 rounded-2xl">
                  <CheckCircle2 className="shrink-0 mt-0.5 text-orange-700" size={20} aria-hidden="true" />
                  <div>
                    <p className="font-sans font-bold uppercase tracking-wider text-xs mb-1">Message sent</p>
                    <p className="text-neutral-700 font-sans text-sm">{responseMsg}</p>
                  </div>
                </div>
              )}
              {status === 'error' && (
                <div className="mb-6 p-6 bg-red-50 border-l-4 border-red-600 text-black flex items-start gap-4 rounded-2xl">
                  <AlertCircle className="shrink-0 mt-0.5 text-red-700" size={20} aria-hidden="true" />
                  <div>
                    <p className="font-sans font-bold uppercase tracking-wider text-xs mb-1">Message not sent</p>
                    <p className="text-neutral-700 font-sans text-sm">{responseMsg}</p>
                  </div>
                </div>
              )}
            </div>

            <form ref={formRef} onSubmit={handleSubmit} noValidate className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="name" className={labelClass}>Full name *</label>
                  <input type="text" id="name" name="name" autoComplete="name" required maxLength={LIMITS.name}
                    value={formData.name} onChange={handleChange} className={inputClass('name')} placeholder="e.g. Jane Wanjiku" {...a11y('name')} />
                  {errorText('name')}
                </div>
                <div className="space-y-2">
                  <label htmlFor="email" className={labelClass}>Email address *</label>
                  <input type="email" id="email" name="email" autoComplete="email" inputMode="email" required maxLength={LIMITS.email}
                    value={formData.email} onChange={handleChange} className={inputClass('email')} placeholder="name@example.com" {...a11y('email')} />
                  {errorText('email')}
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="phone" className={labelClass}>Phone number (optional)</label>
                <input type="tel" id="phone" name="phone" autoComplete="tel" inputMode="tel" maxLength={LIMITS.phone}
                  value={formData.phone} onChange={handleChange} className={inputClass('phone')} placeholder="+254 7XX XXX XXX" {...a11y('phone')} />
                {errorText('phone')}
              </div>

              <div className="space-y-2">
                <label htmlFor="message" className={labelClass}>Your message *</label>
                <textarea id="message" name="message" rows={5} required maxLength={LIMITS.message}
                  value={formData.message} onChange={handleChange} className={`${inputClass('message')} resize-y rounded-3xl`}
                  placeholder="What do you need help with? Please don't include health or patient information." {...a11y('message')} />
                <div className="flex justify-between gap-4">
                  {errorText('message') || <span />}
                  <span className="text-xs text-neutral-600 tabular-nums" aria-hidden="true">{formData.message.length}/{LIMITS.message}</span>
                </div>
              </div>

              {/* Honeypot field, hidden from people and assistive tech */}
              <div aria-hidden="true" className="absolute -left-[9999px] w-px h-px overflow-hidden">
                <label htmlFor="website">Leave this field empty</label>
                <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
              </div>

              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <input
                    id="consent"
                    name="consent"
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => { setConsent(e.target.checked); if (errors.consent) setErrors({ ...errors, consent: undefined }); }}
                    className="mt-1 w-5 h-5 shrink-0 accent-orange-600 cursor-pointer"
                    {...a11y('consent')}
                  />
                  <label htmlFor="consent" className="text-sm text-neutral-700 leading-relaxed cursor-pointer">
                    I agree that {business.shortName} may use the details I've entered to respond to my enquiry, as described in the{' '}
                    <PageLink to="privacy" className="text-orange-700 underline underline-offset-4 hover:text-black">Privacy Policy</PageLink>. *
                  </label>
                </div>
                {errorText('consent')}
              </div>

              <button
                type="submit"
                disabled={status === 'loading'}
                className="group w-full inline-flex items-center justify-center bg-black text-white font-sans font-bold uppercase tracking-wider py-4 hover:bg-orange-500 hover:text-black hover:shadow-lg transition-all duration-300 disabled:opacity-75 disabled:cursor-wait rounded-full text-xs"
              >
                {status === 'loading' ? 'Sending your message…' : (
                  <>Send message <ArrowRight size={14} className="ml-2 group-hover:translate-x-1 transition-transform" aria-hidden="true" /></>
                )}
              </button>

              <p className="text-xs text-neutral-600 leading-relaxed">
                We only use these details to reply to you. We don't add you to a mailing list or share your details for marketing.
              </p>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
