import React, { useState } from 'react';
import { useCMS } from '@/hooks/useCMS';
import { submitContact } from '@/hooks/useCMS';

export default function ContactPage() {
  const { settings } = useCMS(['settings']);

  const phone    = settings['site_phone']    || '+250 794 890 144';
  const email    = settings['site_email']    || 'info@eternarest.com';
  const address  = settings['address']       || 'Kigali, Rwanda';
  const whatsapp = settings['whatsapp']      || '250794890144';
  const hoursGardens = settings['hours_gardens'] || 'Open Daily 6am – 8pm';
  const hoursOffice  = settings['hours_office']  || 'Mon–Sat 8am – 6pm';
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.name.trim()) newErrors.name = 'Name is required';
    if (!form.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    if (!form.subject) newErrors.subject = 'Please select a subject';
    if (!form.message.trim()) newErrors.message = 'Message is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    const result = await submitContact({
      name:    form.name,
      email:   form.email,
      phone:   form.phone || undefined,
      subject: form.subject || undefined,
      message: form.message,
    });
    setSubmitting(false);
    if (result.success) {
      setSuccess(true);
      setForm({ name: '', email: '', phone: '', subject: '', message: '' });
    } else {
      setErrors(prev => ({ ...prev, message: result.message || 'Failed to send. Please try again.' }));
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f6f3]">
      {/* Hero Section */}
      <section className="relative py-20 bg-[#1a2332]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-6">
              Contact Us
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              We're here to help and answer any questions you may have. Reach out to us with compassion and care.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Contact Info */}
            <div className="lg:col-span-1">
              <h2 className="text-2xl font-serif font-bold text-[#1a2332] mb-6">
                Get in Touch
              </h2>
              <p className="text-gray-600 mb-8">
                Our compassionate team is available to assist you with any inquiries about our memorial services.
              </p>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-[#d4af37]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-[#d4af37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#1a2332]">Visit Us</h3>
                    <p className="text-gray-600 mt-1">{address}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-[#d4af37]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-[#d4af37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#1a2332]">Call Us</h3>
                    <p className="text-gray-600 mt-1">{phone}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-[#d4af37]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-[#d4af37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#1a2332]">Email Us</h3>
                    <p className="text-gray-600 mt-1">{email}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-[#d4af37]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-[#d4af37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#1a2332]">Hours</h3>
                    <p className="text-gray-600 mt-1">
                      Gardens: {hoursGardens}<br />
                      Office: {hoursOffice}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <h2 className="text-2xl font-serif font-bold text-[#1a2332] mb-6">
                  Send Us a Message
                </h2>

                {success ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-[#1a2332] mb-2">Message Sent!</h3>
                    <p className="text-gray-600 mb-6">
                      Thank you for reaching out. We'll get back to you within 24 hours.
                    </p>
                    <button
                      onClick={() => setSuccess(false)}
                      className="text-[#d4af37] font-semibold hover:text-[#b8960c]"
                    >
                      Send Another Message
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={form.name}
                          onChange={handleChange}
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#d4af37] focus:border-transparent ${
                            errors.name ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="Your name"
                        />
                        {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email Address *
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={form.email}
                          onChange={handleChange}
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#d4af37] focus:border-transparent ${
                            errors.email ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="your@email.com"
                        />
                        {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={form.phone}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#d4af37] focus:border-transparent"
                          placeholder="(555) 123-4567"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Subject *
                        </label>
                        <select
                          name="subject"
                          value={form.subject}
                          onChange={handleChange}
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#d4af37] focus:border-transparent ${
                            errors.subject ? 'border-red-500' : 'border-gray-300'
                          }`}
                        >
                          <option value="">Select a subject</option>
                          <option value="booking">Booking Inquiry</option>
                          <option value="memorial">Memorial Services</option>
                          <option value="pricing">Pricing Information</option>
                          <option value="support">Technical Support</option>
                          <option value="other">Other</option>
                        </select>
                        {errors.subject && <p className="mt-1 text-sm text-red-500">{errors.subject}</p>}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Message *
                      </label>
                      <textarea
                        name="message"
                        value={form.message}
                        onChange={handleChange}
                        rows={6}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#d4af37] focus:border-transparent ${
                          errors.message ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="How can we help you?"
                      />
                      {errors.message && <p className="mt-1 text-sm text-red-500">{errors.message}</p>}
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full py-4 bg-[#d4af37] text-[#1a2332] font-semibold rounded-lg hover:bg-[#b8960c] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {submitting ? (
                        <>
                          <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Sending...
                        </>
                      ) : (
                        'Send Message'
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-serif font-bold text-[#1a2332] mb-4">
              Find Us
            </h2>
            <p className="text-gray-600">
              Visit our memorial gardens and experience the serene environment.
            </p>
          </div>
          <div className="bg-gray-200 rounded-2xl h-96 flex items-center justify-center">
            <div className="text-center">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
                <p className="text-gray-500">{address}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
