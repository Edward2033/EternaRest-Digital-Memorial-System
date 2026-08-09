import React, { useState, useEffect } from 'react';
import { api, Niche } from '@/lib/api';

interface BookingForm {
  requester_name: string;
  requester_email: string;
  requester_phone: string;
  deceased_name: string;
  preferred_wall: string;
  preferred_row: number;
  preferred_slot: number;
  message: string;
}

export default function BookingPage() {
  const [step, setStep] = useState(1);
  const [niches, setNiches] = useState<Niche[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<{
    booking_id: string;
    memorial_id: string;
    niche_id: string;
    qr_code_url: string;
  } | null>(null);

  const [form, setForm] = useState<BookingForm>({
    requester_name: '',
    requester_email: '',
    requester_phone: '',
    deceased_name: '',
    preferred_wall: 'A',
    preferred_row: 1,
    preferred_slot: 1,
    message: '',
  });

  const [errors, setErrors] = useState<Partial<BookingForm>>({});

  const walls = ['A', 'B', 'C'];
  const rows = [1, 2, 3];
  const slots = [1, 2, 3, 4];

  useEffect(() => {
    loadNiches();
  }, []);

  const loadNiches = async () => {
    setLoading(true);
    try {
      const response = await api.getNiches();
      if (response.success) {
        setNiches(response.data);
      }
    } catch (err) {
      console.error('Failed to load niches:', err);
    }
    setLoading(false);
  };

  const getNicheStatus = (wall: string, row: number, slot: number) => {
    const niche = niches.find(
      n => n.wall === wall && n.row_number === row && n.slot_number === slot
    );
    return niche?.status || 'available';
  };

  const isNicheAvailable = (wall: string, row: number, slot: number) => {
    return getNicheStatus(wall, row, slot) === 'available';
  };

  const validateStep1 = () => {
    const newErrors: Partial<BookingForm> = {};
    
    if (!form.requester_name.trim()) {
      newErrors.requester_name = 'Full name is required';
    }
    if (!form.requester_email.trim()) {
      newErrors.requester_email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.requester_email)) {
      newErrors.requester_email = 'Please enter a valid email';
    }
    if (!form.requester_phone.trim()) {
      newErrors.requester_phone = 'Phone number is required';
    }
    if (!form.deceased_name.trim()) {
      newErrors.deceased_name = 'Deceased name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    if (!isNicheAvailable(form.preferred_wall, form.preferred_row, form.preferred_slot)) {
      setError('This niche is not available. Please select another.');
      return false;
    }
    setError('');
    return true;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  };

  const handleBack = () => {
    setStep(step - 1);
    setError('');
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');

    try {
      const response = await api.createBooking({
        requester_name: form.requester_name,
        requester_email: form.requester_email,
        requester_phone: form.requester_phone,
        deceased_name: form.deceased_name,
        preferred_wall: form.preferred_wall,
        preferred_row: form.preferred_row,
        preferred_slot: form.preferred_slot,
        message: form.message,
      });

      if (response.success) {
        setSuccess({
          booking_id:  response.data.booking_id,
          memorial_id: response.data.memorial_id ?? response.data.booking_id,
          niche_id:    `W${form.preferred_wall}-R${form.preferred_row}-S${form.preferred_slot}`,
          qr_code_url: response.data.qr_code_url ?? '/placeholder.svg',
        });
        setStep(4);
      } else {
        setError(response.error || 'Failed to create booking');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    }

    setSubmitting(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: name === 'preferred_row' || name === 'preferred_slot' ? parseInt(value) : value,
    }));
    if (errors[name as keyof BookingForm]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f6f3] py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-[#1a2332] mb-4">
            Book a Burial Niche
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Reserve a dignified resting place for your loved one. Complete the form below to begin the booking process.
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-12">
          <div className="flex items-center justify-center">
            {[1, 2, 3, 4].map((s, i) => (
              <React.Fragment key={s}>
                <div className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold ${
                  step >= s 
                    ? 'bg-[#d4af37] text-white' 
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {step > s ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : s}
                </div>
                {i < 3 && (
                  <div className={`w-16 md:w-24 h-1 ${step > s ? 'bg-[#d4af37]' : 'bg-gray-200'}`} />
                )}
              </React.Fragment>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-sm text-gray-500 max-w-md mx-auto">
            <span>Details</span>
            <span>Location</span>
            <span>Review</span>
            <span>Done</span>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          {/* Step 1: Personal Details */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-serif font-semibold text-[#1a2332] mb-6">
                Personal Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Full Name *
                  </label>
                  <input
                    type="text"
                    name="requester_name"
                    value={form.requester_name}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#d4af37] focus:border-transparent transition-all ${
                      errors.requester_name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter your full name"
                  />
                  {errors.requester_name && (
                    <p className="mt-1 text-sm text-red-500">{errors.requester_name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="requester_email"
                    value={form.requester_email}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#d4af37] focus:border-transparent transition-all ${
                      errors.requester_email ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="your@email.com"
                  />
                  {errors.requester_email && (
                    <p className="mt-1 text-sm text-red-500">{errors.requester_email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    name="requester_phone"
                    value={form.requester_phone}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#d4af37] focus:border-transparent transition-all ${
                      errors.requester_phone ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="(555) 123-4567"
                  />
                  {errors.requester_phone && (
                    <p className="mt-1 text-sm text-red-500">{errors.requester_phone}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Deceased's Full Name *
                  </label>
                  <input
                    type="text"
                    name="deceased_name"
                    value={form.deceased_name}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#d4af37] focus:border-transparent transition-all ${
                      errors.deceased_name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter deceased's full name"
                  />
                  {errors.deceased_name && (
                    <p className="mt-1 text-sm text-red-500">{errors.deceased_name}</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-6">
                <button
                  onClick={handleNext}
                  className="px-8 py-3 bg-[#d4af37] text-[#1a2332] font-semibold rounded-lg hover:bg-[#b8960c] transition-all"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Niche Selection */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-serif font-semibold text-[#1a2332] mb-6">
                Select Burial Niche Location
              </h2>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Wall
                  </label>
                  <select
                    name="preferred_wall"
                    value={form.preferred_wall}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#d4af37] focus:border-transparent"
                  >
                    {walls.map(wall => (
                      <option key={wall} value={wall}>Wall {wall}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Row
                  </label>
                  <select
                    name="preferred_row"
                    value={form.preferred_row}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#d4af37] focus:border-transparent"
                  >
                    {rows.map(row => (
                      <option key={row} value={row}>Row {row}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Slot
                  </label>
                  <select
                    name="preferred_slot"
                    value={form.preferred_slot}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#d4af37] focus:border-transparent"
                  >
                    {slots.map(slot => (
                      <option key={slot} value={slot}>Slot {slot}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Visual Niche Selector */}
              <div className="mt-8">
                <h3 className="text-lg font-medium text-[#1a2332] mb-4">
                  Wall {form.preferred_wall} - Niche Availability
                </h3>
                <div className="bg-[#f8f6f3] rounded-xl p-6">
                  {rows.map(row => (
                    <div key={row} className="flex items-center mb-4 last:mb-0">
                      <span className="w-16 text-sm font-medium text-gray-600">Row {row}</span>
                      <div className="flex gap-3 flex-1">
                        {slots.map(slot => {
                          const status = getNicheStatus(form.preferred_wall, row, slot);
                          const isSelected = form.preferred_row === row && form.preferred_slot === slot;
                          
                          return (
                            <button
                              key={slot}
                              onClick={() => {
                                if (status === 'available') {
                                  setForm(prev => ({ ...prev, preferred_row: row, preferred_slot: slot }));
                                  setError('');
                                }
                              }}
                              disabled={status !== 'available'}
                              className={`flex-1 py-4 rounded-lg text-sm font-medium transition-all ${
                                isSelected
                                  ? 'bg-[#d4af37] text-white ring-2 ring-[#d4af37] ring-offset-2'
                                  : status === 'available'
                                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                  : status === 'reserved'
                                  ? 'bg-yellow-100 text-yellow-700 cursor-not-allowed'
                                  : 'bg-red-100 text-red-700 cursor-not-allowed'
                              }`}
                            >
                              Slot {slot}
                              <br />
                              <span className="text-xs opacity-75">
                                {status === 'available' ? 'Available' : status === 'reserved' ? 'Reserved' : 'Occupied'}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-4 mt-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-100 rounded" />
                    <span className="text-gray-600">Available</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-yellow-100 rounded" />
                    <span className="text-gray-600">Reserved</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-100 rounded" />
                    <span className="text-gray-600">Occupied</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Message or Instructions (Optional)
                </label>
                <textarea
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#d4af37] focus:border-transparent"
                  placeholder="Any special requests or instructions..."
                />
              </div>

              <div className="flex justify-between pt-6">
                <button
                  onClick={handleBack}
                  className="px-8 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all"
                >
                  Back
                </button>
                <button
                  onClick={handleNext}
                  className="px-8 py-3 bg-[#d4af37] text-[#1a2332] font-semibold rounded-lg hover:bg-[#b8960c] transition-all"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-serif font-semibold text-[#1a2332] mb-6">
                Review Your Booking
              </h2>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                  {error}
                </div>
              )}

              <div className="bg-[#f8f6f3] rounded-xl p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Your Name</p>
                    <p className="font-medium text-[#1a2332]">{form.requester_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium text-[#1a2332]">{form.requester_email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium text-[#1a2332]">{form.requester_phone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Deceased's Name</p>
                    <p className="font-medium text-[#1a2332]">{form.deceased_name}</p>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <p className="text-sm text-gray-500">Selected Niche</p>
                  <p className="font-medium text-[#1a2332]">
                    Wall {form.preferred_wall}, Row {form.preferred_row}, Slot {form.preferred_slot}
                  </p>
                </div>

                {form.message && (
                  <div className="border-t border-gray-200 pt-4">
                    <p className="text-sm text-gray-500">Additional Message</p>
                    <p className="font-medium text-[#1a2332]">{form.message}</p>
                  </div>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <svg className="w-6 h-6 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h4 className="font-semibold text-blue-800">What happens next?</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      After submitting, your booking will be reviewed by our team. Once approved, 
                      a unique QR code will be generated for the memorial page. You'll receive 
                      confirmation via email.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-6">
                <button
                  onClick={handleBack}
                  className="px-8 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="px-8 py-3 bg-[#d4af37] text-[#1a2332] font-semibold rounded-lg hover:bg-[#b8960c] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Processing...
                    </>
                  ) : (
                    'Submit Booking'
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Success */}
          {step === 4 && success && (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              
              <h2 className="text-2xl font-serif font-semibold text-[#1a2332] mb-4">
                Booking Submitted Successfully!
              </h2>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Thank you for your booking. Our team will review it and contact you shortly.
              </p>

              <div className="bg-[#f8f6f3] rounded-xl p-6 max-w-md mx-auto mb-8">
                <div className="space-y-3 text-left">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Booking ID:</span>
                    <span className="font-mono font-semibold text-[#1a2332]">{success.booking_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Memorial ID:</span>
                    <span className="font-mono font-semibold text-[#1a2332]">{success.memorial_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Niche ID:</span>
                    <span className="font-mono font-semibold text-[#1a2332]">{success.niche_id}</span>
                  </div>
                </div>
              </div>

              <div className="mb-8">
                <p className="text-sm text-gray-500 mb-4">Your Memorial QR Code</p>
                <img
                  src={success.qr_code_url}
                  alt="Memorial QR Code"
                  className="w-48 h-48 mx-auto rounded-lg shadow-lg"
                />
                <a
                  href={success.qr_code_url}
                  download={`qr-${success.memorial_id}.png`}
                  className="inline-flex items-center gap-2 mt-4 text-[#d4af37] hover:text-[#b8960c] font-medium"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download QR Code
                </a>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href={`/memorial/${success.memorial_id}`}
                  className="px-6 py-3 bg-[#d4af37] text-[#1a2332] font-semibold rounded-lg hover:bg-[#b8960c] transition-all"
                >
                  View Memorial Page
                </a>
                <a
                  href="/"
                  className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all"
                >
                  Return Home
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
