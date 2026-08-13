import React, { useState, useEffect, useRef } from 'react';
import { api, Niche } from '@/lib/api';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

interface Package {
  _id: string;
  name: string;
  displayName: string;
  price: number; // in RWF
  description?: string;
  features: string[];
  badge?: string;
  popular?: boolean;
}

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

type PaymentProvider = 'mtn' | 'airtel';
type PaymentState = 'idle' | 'initiating' | 'waiting' | 'verifying' | 'success' | 'failed';

export default function BookingPage() {
  const [step, setStep] = useState(1);
  const [niches, setNiches] = useState<Niche[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Booking result
  const [bookingId, setBookingId] = useState('');
  const [billingNumber, setBillingNumber] = useState('');

  // Payment state
  const [provider, setProvider] = useState<PaymentProvider>('mtn');
  const [paymentPhone, setPaymentPhone] = useState('');
  const [paymentState, setPaymentState] = useState<PaymentState>('idle');
  const [referenceId, setReferenceId] = useState('');
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentError, setPaymentError] = useState('');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Final success data
  const [memorialId, setMemorialId] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  const [packages, setPackages] = useState<Package[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);

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
    loadPackages();
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  const loadNiches = async () => {
    setLoading(true);
    try {
      const response = await api.getNiches();
      if (response.success) setNiches(response.data);
    } catch {}
    setLoading(false);
  };

  const loadPackages = async () => {
    try {
      const res  = await fetch(`${API_BASE}/public/packages`);
      const json = await res.json();
      if (json.success && json.packages?.length > 0) {
        setPackages(json.packages);
        setSelectedPackage(json.packages[0]);
      }
    } catch {}
  };

  const getNicheStatus = (wall: string, row: number, slot: number) => {
    const niche = niches.find(n => n.wall === wall && n.row_number === row && n.slot_number === slot);
    return niche?.status || 'available';
  };

  const validateStep1 = () => {
    const e: Partial<BookingForm> = {};
    if (!form.requester_name.trim())  e.requester_name  = 'Full name is required';
    if (!form.requester_email.trim()) e.requester_email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.requester_email)) e.requester_email = 'Invalid email';
    if (!form.requester_phone.trim()) e.requester_phone = 'Phone number is required';
    if (!form.deceased_name.trim())   e.deceased_name   = 'Deceased name is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = () => {
    if (getNicheStatus(form.preferred_wall, form.preferred_row, form.preferred_slot) !== 'available') {
      setError('This niche is not available. Please select another.');
      return false;
    }
    setError('');
    return true;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
  };

  const handleBack = () => { setStep(step - 1); setError(''); };

  // Step 3 → create booking → go to payment step
  const handleSubmitBooking = async () => {
    if (!selectedPackage) { setError('Please select a package'); return; }
    setSubmitting(true);
    setError('');
    try {
      const response = await api.createBooking({
        requester_name:  form.requester_name,
        requester_email: form.requester_email,
        requester_phone: form.requester_phone,
        deceased_name:   form.deceased_name,
        preferred_wall:  form.preferred_wall,
        preferred_row:   form.preferred_row,
        preferred_slot:  form.preferred_slot,
        message:         form.message,
        package_type:    selectedPackage.name,
        price:           selectedPackage.price, // already in RWF
      });
      if (response.success) {
        setBookingId(response.data.booking_id);
        setBillingNumber(response.data.billing_number);
        setPaymentPhone(form.requester_phone);
        setStep(4); // go to payment
      } else {
        setError(response.error || 'Failed to create booking');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    }
    setSubmitting(false);
  };

  // Step 4 — initiate payment
  const handleInitiatePayment = async () => {
    if (!paymentPhone.trim()) { setPaymentError('Phone number is required'); return; }
    setPaymentError('');
    setPaymentState('initiating');

    try {
      const result = await api.initiatePayment({ bookingId, provider, phoneNumber: paymentPhone });
      if (!result.success) {
        setPaymentState('failed');
        setPaymentError((result as any).error || 'Payment initiation failed. Please try again.');
        return;
      }
      setReferenceId(result.data.referenceId);
      setPaymentAmount(result.data.amount);
      setPaymentState('waiting');
      startPolling(result.data.referenceId);
    } catch (err: any) {
      setPaymentState('failed');
      setPaymentError(err.message || 'Payment initiation failed');
    }
  };

  const startPolling = (refId: string) => {
    let attempts = 0;
    const MAX = 24; // 2 minutes at 5s intervals
    pollRef.current = setInterval(async () => {
      attempts++;
      setPaymentState('verifying');
      try {
        const result = await api.verifyPayment({ bookingId, referenceId: refId });
        if (!result.success) {
          setPaymentState('waiting');
          if (attempts >= MAX) stopPolling('Payment timed out. Please try again.');
          return;
        }
        const { status, memorial, booking, reason } = result.data;
        if (status === 'SUCCESSFUL') {
          stopPolling();
          setMemorialId(memorial?.memorialId ?? bookingId);
          setQrCodeUrl(booking?.qrCode ?? '');
          setPaymentState('success');
          setStep(5);
        } else if (status === 'FAILED') {
          stopPolling(reason || 'Payment was declined. Please try again.');
        } else {
          setPaymentState('waiting');
          if (attempts >= MAX) stopPolling('Payment timed out. Please try again.');
        }
      } catch {
        setPaymentState('waiting');
      }
    }, 5000);
  };

  const stopPolling = (errMsg?: string) => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    if (errMsg) { setPaymentState('failed'); setPaymentError(errMsg); }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: name === 'preferred_row' || name === 'preferred_slot' ? parseInt(value) : value }));
    if (errors[name as keyof BookingForm]) setErrors(prev => ({ ...prev, [name]: undefined }));
  };

  const stepLabels = ['Details', 'Location', 'Review', 'Payment', 'Done'];

  return (
    <div className="min-h-screen bg-[#f8f6f3] py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-[#1a2332] mb-4">Book a Burial Niche</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">Reserve a dignified resting place for your loved one.</p>
        </div>

        {/* Progress */}
        <div className="mb-12">
          <div className="flex items-center justify-center">
            {[1, 2, 3, 4, 5].map((s, i) => (
              <React.Fragment key={s}>
                <div className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold ${step >= s ? 'bg-[#d4af37] text-white' : 'bg-gray-200 text-gray-500'}`}>
                  {step > s ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> : s}
                </div>
                {i < 4 && <div className={`w-12 md:w-20 h-1 ${step > s ? 'bg-[#d4af37]' : 'bg-gray-200'}`} />}
              </React.Fragment>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500 max-w-lg mx-auto px-2">
            {stepLabels.map(l => <span key={l}>{l}</span>)}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">

          {/* ── Step 1: Personal Details ── */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-serif font-semibold text-[#1a2332] mb-6">Personal Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {([
                  ['requester_name',  'Your Full Name *',       'text',  'Enter your full name'],
                  ['requester_email', 'Email Address *',        'email', 'your@email.com'],
                  ['requester_phone', 'Phone Number *',         'tel',   '+250 7XX XXX XXX'],
                  ['deceased_name',   "Deceased's Full Name *", 'text',  "Enter deceased's full name"],
                ] as const).map(([name, label, type, placeholder]) => (
                  <div key={name}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
                    <input type={type} name={name} value={form[name]} onChange={handleChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#d4af37] focus:border-transparent transition-all ${errors[name] ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder={placeholder} />
                    {errors[name] && <p className="mt-1 text-sm text-red-500">{errors[name]}</p>}
                  </div>
                ))}
              </div>
              <div className="flex justify-end pt-6">
                <button onClick={handleNext} className="px-8 py-3 bg-[#d4af37] text-[#1a2332] font-semibold rounded-lg hover:bg-[#b8960c] transition-all">Continue</button>
              </div>
            </div>
          )}

          {/* ── Step 2: Niche Selection ── */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-serif font-semibold text-[#1a2332] mb-6">Select Burial Niche Location</h2>
              {error && <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {(['preferred_wall', 'preferred_row', 'preferred_slot'] as const).map((field) => (
                  <div key={field}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{field === 'preferred_wall' ? 'Wall' : field === 'preferred_row' ? 'Row' : 'Slot'}</label>
                    <select name={field} value={form[field]} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#d4af37] focus:border-transparent">
                      {(field === 'preferred_wall' ? walls : field === 'preferred_row' ? rows : slots).map((v: any) => (
                        <option key={v} value={v}>{field === 'preferred_wall' ? `Wall ${v}` : field === 'preferred_row' ? `Row ${v}` : `Slot ${v}`}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
              <div className="mt-8">
                <h3 className="text-lg font-medium text-[#1a2332] mb-4">Wall {form.preferred_wall} — Niche Availability</h3>
                <div className="bg-[#f8f6f3] rounded-xl p-6">
                  {rows.map(row => (
                    <div key={row} className="flex items-center mb-4 last:mb-0">
                      <span className="w-16 text-sm font-medium text-gray-600">Row {row}</span>
                      <div className="flex gap-3 flex-1">
                        {slots.map(slot => {
                          const status = getNicheStatus(form.preferred_wall, row, slot);
                          const isSelected = form.preferred_row === row && form.preferred_slot === slot;
                          return (
                            <button key={slot} onClick={() => { if (status === 'available') { setForm(p => ({ ...p, preferred_row: row, preferred_slot: slot })); setError(''); } }}
                              disabled={status !== 'available'}
                              className={`flex-1 py-4 rounded-lg text-sm font-medium transition-all ${isSelected ? 'bg-[#d4af37] text-white ring-2 ring-[#d4af37] ring-offset-2' : status === 'available' ? 'bg-green-100 text-green-700 hover:bg-green-200' : status === 'reserved' ? 'bg-yellow-100 text-yellow-700 cursor-not-allowed' : 'bg-red-100 text-red-700 cursor-not-allowed'}`}>
                              Slot {slot}<br /><span className="text-xs opacity-75">{status === 'available' ? 'Available' : status === 'reserved' ? 'Reserved' : 'Occupied'}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Additional Message (Optional)</label>
                <textarea name="message" value={form.message} onChange={handleChange} rows={3} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#d4af37] focus:border-transparent" placeholder="Any special requests..." />
              </div>
              <div className="flex justify-between pt-6">
                <button onClick={handleBack} className="px-8 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all">Back</button>
                <button onClick={handleNext} className="px-8 py-3 bg-[#d4af37] text-[#1a2332] font-semibold rounded-lg hover:bg-[#b8960c] transition-all">Continue</button>
              </div>
            </div>
          )}

          {/* ── Step 3: Review ── */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-serif font-semibold text-[#1a2332] mb-6">Select Package & Review</h2>
              {error && <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>}

              {/* Package selection */}
              {packages.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-3">Choose a Package</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {packages.map(pkg => (
                      <button key={pkg._id} type="button" onClick={() => setSelectedPackage(pkg)}
                        className={`text-left p-4 rounded-xl border-2 transition-all ${
                          selectedPackage?._id === pkg._id
                            ? 'border-[#d4af37] bg-[#d4af37]/10'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}>
                        <div className="flex justify-between items-start">
                          <span className="font-semibold text-[#1a2332]">{pkg.displayName}</span>
                          {pkg.badge && <span className="text-xs bg-[#d4af37] text-white px-2 py-0.5 rounded-full">{pkg.badge}</span>}
                        </div>
                        <p className="text-[#d4af37] font-bold mt-1">RWF {pkg.price.toLocaleString()}</p>
                        {pkg.description && <p className="text-xs text-gray-500 mt-1">{pkg.description}</p>}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-[#f8f6f3] rounded-xl p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[['Your Name', form.requester_name], ['Email', form.requester_email], ['Phone', form.requester_phone], ["Deceased's Name", form.deceased_name]].map(([label, val]) => (
                    <div key={label}><p className="text-sm text-gray-500">{label}</p><p className="font-medium text-[#1a2332]">{val}</p></div>
                  ))}
                </div>
                <div className="border-t border-gray-200 pt-4">
                  <p className="text-sm text-gray-500">Selected Niche</p>
                  <p className="font-medium text-[#1a2332]">Wall {form.preferred_wall}, Row {form.preferred_row}, Slot {form.preferred_slot}</p>
                </div>
                <div className="border-t border-gray-200 pt-4">
                  <p className="text-sm text-gray-500">Package</p>
                  <p className="font-medium text-[#1a2332]">
                    {selectedPackage?.displayName || 'Standard'} — <span className="text-[#d4af37] font-bold">RWF {(selectedPackage?.price || 0).toLocaleString()}</span>
                  </p>
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
                <p className="text-sm text-blue-700"><strong>What happens next:</strong> After submitting, you'll be prompted to pay via MTN MoMo or Airtel Money. Your memorial page goes live only after payment is confirmed.</p>
              </div>
              <div className="flex justify-between pt-6">
                <button onClick={handleBack} className="px-8 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all">Back</button>
                <button onClick={handleSubmitBooking} disabled={submitting} className="px-8 py-3 bg-[#d4af37] text-[#1a2332] font-semibold rounded-lg hover:bg-[#b8960c] transition-all disabled:opacity-50 flex items-center gap-2">
                  {submitting ? <><svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>Processing...</> : 'Proceed to Payment'}
                </button>
              </div>
            </div>
          )}

          {/* ── Step 4: Payment ── */}
          {step === 4 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-serif font-semibold text-[#1a2332] mb-2">Complete Payment</h2>
              <p className="text-gray-500 text-sm">Booking <span className="font-mono font-semibold text-[#1a2332]">{bookingId}</span> · Billing <span className="font-mono">{billingNumber}</span></p>

              {paymentError && <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{paymentError}</div>}

              {/* Provider selection */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">Select Payment Method</p>
                <div className="grid grid-cols-2 gap-4">
                  {(['mtn', 'airtel'] as const).map(p => (
                    <button key={p} onClick={() => setProvider(p)} disabled={paymentState === 'waiting' || paymentState === 'verifying'}
                      className={`py-4 px-6 rounded-xl border-2 font-semibold transition-all ${provider === p ? 'border-[#d4af37] bg-[#d4af37]/10 text-[#1a2332]' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                      {p === 'mtn' ? '📱 MTN MoMo' : '📱 Airtel Money'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Phone number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mobile Money Phone Number</label>
                <input type="tel" value={paymentPhone} onChange={e => setPaymentPhone(e.target.value)}
                  disabled={paymentState === 'waiting' || paymentState === 'verifying'}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#d4af37] focus:border-transparent"
                  placeholder="+250 7XX XXX XXX" />
              </div>

              {/* Amount */}
              <div className="bg-[#f8f6f3] rounded-xl p-5 flex justify-between items-center">
                <span className="text-gray-600">Amount to Pay</span>
                <span className="text-2xl font-bold text-[#1a2332]">
                  RWF {(paymentAmount > 0 ? paymentAmount : selectedPackage?.price || 0).toLocaleString()}
                </span>
              </div>

              {/* Status messages */}
              {paymentState === 'waiting' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5 text-center">
                  <div className="flex items-center justify-center gap-3 mb-2">
                    <svg className="animate-spin w-5 h-5 text-yellow-600" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    <span className="font-semibold text-yellow-800">Waiting for your approval…</span>
                  </div>
                  <p className="text-sm text-yellow-700">A USSD prompt has been sent to <strong>{paymentPhone}</strong>. Please approve it on your phone.</p>
                </div>
              )}
              {paymentState === 'verifying' && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center text-sm text-blue-700 flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  Confirming payment with provider…
                </div>
              )}

              {/* Action button */}
              {(paymentState === 'idle' || paymentState === 'failed') && (
                <button onClick={handleInitiatePayment} className="w-full py-4 bg-[#d4af37] text-[#1a2332] font-bold rounded-xl hover:bg-[#b8960c] transition-all text-lg">
                  Pay Now via {provider === 'mtn' ? 'MTN MoMo' : 'Airtel Money'}
                </button>
              )}
              {paymentState === 'initiating' && (
                <button disabled className="w-full py-4 bg-[#d4af37]/60 text-[#1a2332] font-bold rounded-xl flex items-center justify-center gap-2">
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  Sending USSD prompt…
                </button>
              )}
            </div>
          )}

          {/* ── Step 5: Success ── */}
          {step === 5 && (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              </div>
              <h2 className="text-2xl font-serif font-semibold text-[#1a2332] mb-4">Payment Confirmed! 🕊️</h2>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">Your booking is approved and the memorial page is now live. A confirmation email with the QR code has been sent to <strong>{form.requester_email}</strong>.</p>

              <div className="bg-[#f8f6f3] rounded-xl p-6 max-w-md mx-auto mb-8 text-left space-y-3">
                <div className="flex justify-between"><span className="text-gray-500">Booking ID:</span><span className="font-mono font-semibold text-[#1a2332]">{bookingId}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Memorial ID:</span><span className="font-mono font-semibold text-[#1a2332]">{memorialId}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Payment:</span><span className="font-semibold text-green-600">Verified ✓</span></div>
              </div>

              {qrCodeUrl && (
                <div className="mb-8">
                  <p className="text-sm text-gray-500 mb-4">Your Memorial QR Code</p>
                  <img src={qrCodeUrl} alt="Memorial QR Code" className="w-48 h-48 mx-auto rounded-lg shadow-lg" />
                  <a href={qrCodeUrl} download={`qr-${memorialId}.png`} className="inline-flex items-center gap-2 mt-4 text-[#d4af37] hover:text-[#b8960c] font-medium">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    Download QR Code
                  </a>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a href={`/memorial/${memorialId}`} className="px-6 py-3 bg-[#d4af37] text-[#1a2332] font-semibold rounded-lg hover:bg-[#b8960c] transition-all">View Memorial Page</a>
                <a href="/" className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all">Return Home</a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
