/**
 * EternaRest API Service Layer
 *
 * Single source of truth for all backend communication.
 * Every function is fully typed, normalises raw wire data into
 * frontend shapes, and returns a discriminated ApiResult union
 * so callers never have to handle thrown exceptions.
 *
 * Backend base: http://localhost:5000/api
 */

import { supabase } from './supabase';
import { http } from './http';
import type {
  ApiResult,
  Booking,
  BookingStatus,
  Comment,
  CreateBookingPayload,
  CreateBookingResult,
  ApproveBookingResult,
  DashboardStats,
  LoginPayload,
  LoginResult,
  Media,
  MediaType,
  Memorial,
  Niche,
  NicheStatus,
  Payment,
  PaymentStatus,
  Invoice,
  InitiatePaymentPayload,
  InitiatePaymentResult,
  VerifyPaymentPayload,
  VerifyPaymentResult,
  RawBooking,
  RawMemorial,
  Tribute,
  AddCommentPayload,
  AddTributePayload,
} from './types';

// Re-export types so existing imports from '@/lib/api' keep working
export type {
  Booking,
  Comment,
  DashboardStats,
  Media,
  Memorial,
  Niche,
  Payment,
  Invoice,
} from './types';

// ─── Normalisers ──────────────────────────────────────────────────────────────
// Convert raw MongoDB documents into clean frontend shapes.

function normaliseBooking(b: RawBooking): Booking {
  return {
    id:               b._id,
    booking_id:       b.bookingId,
    billing_number:   b.billingNumber,
    deceased_name:    b.deceasedName,
    date_of_birth:    b.dateOfBirth,
    date_of_death:    b.dateOfDeath,
    biography:        b.biography,
    requester_name:   b.bookerName,
    requester_email:  b.bookerEmail,
    requester_phone:  b.bookerPhone,
    relationship:     b.relationship,
    package_type:     b.packageType,
    price:            b.price,
    payment_status:   b.paymentStatus,
    status:           b.status,
    qr_code:          b.qrCode,
    notes:            b.notes,
    approved_at:      b.approvedAt,
    created_at:       b.createdAt,
    // Legacy UI fields — walls are not yet tracked in the DB
    preferred_wall: 'A',
    preferred_row:  1,
    preferred_slot: 1,
  };
}

function normaliseMedia(m: { _id: string; type: MediaType; url: string; caption?: string }, memorialId: string, index: number): Media {
  const apiBase = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace('/api', '');
  return {
    id:            m._id,
    memorial_id:   memorialId,
    media_type:    m.type === 'video' ? 'video' : 'photo',
    url:           m.url?.startsWith('http') ? m.url : `${apiBase}${m.url}`,
    caption:       m.caption,
    display_order: index,
  };
}

function normaliseMemorial(m: RawMemorial): Memorial {
  const tributes: Tribute[] = (m.tributes ?? []).map(t => ({
    author_name: t.name,
    content:     t.message,
    created_at:  t.createdAt,
  }));

  const media: Media[] = (m.media ?? []).map((med, i) =>
    normaliseMedia(med as any, m._id, i),
  );

  return {
    id:                 m._id,
    memorial_id:        m.memorialId ?? m.bookingId,
    booking_id:         m.bookingId,
    deceased_name:      m.deceasedName,
    birth_date:         m.dateOfBirth,
    death_date:         m.dateOfDeath,
    biography:          m.biography,
    family_information: m.familyInformation,
    profile_image:      m.profileImage,
    cover_image:        m.coverImage,
    gallery:            m.gallery  ?? [],
    videos:             m.videos   ?? [],
    is_published:       m.isPublic ?? m.status === 'published',
    status:             m.status,
    views:              m.views ?? 0,
    media,
    tributes,
    created_at:         m.createdAt,
  };
}

function normalisePayment(p: Record<string, unknown>): Payment {
  return {
    id:                    (p._id ?? p.id) as string,
    payment_id:            (p.paymentId ?? '') as string,
    booking_id:            (p.bookingId ?? '') as string,
    billing_number:        (p.billingNumber ?? '') as string,
    package_name:          (p.packageName ?? '') as string,
    amount:                (p.amount ?? 0) as number,
    currency:              (p.currency ?? 'RWF') as string,
    method:                (p.method ?? p.paymentMethod ?? 'other') as Payment['method'],
    phone_number:          p.phoneNumber as string | undefined,
    transaction_id:        (p.transactionId ?? p.transactionReference) as string | undefined,
    transaction_reference: (p.transactionReference ?? p.transactionId) as string | undefined,
    status:                (p.status ?? 'pending') as PaymentStatus,
    verified_by:           p.verifiedBy as string | undefined,
    verified_at:           p.verifiedAt as string | undefined,
    paid_at:               p.paidAt as string | undefined,
    notes:                 p.notes as string | undefined,
    created_at:            (p.createdAt ?? '') as string,
  };
}

function normaliseInvoice(i: Record<string, unknown>): Invoice {
  return {
    id:             (i._id ?? i.id) as string,
    invoice_number: (i.invoiceNumber ?? '') as string,
    booking_id:     (i.bookingId ?? '') as string,
    billing_number: (i.billingNumber ?? '') as string,
    amount:         (i.amount ?? 0) as number,
    currency:       (i.currency ?? 'RWF') as string,
    status:         (i.status ?? 'draft') as Invoice['status'],
    due_date:       i.dueDate as string | undefined,
    notes:          i.notes as string | undefined,
    created_at:     (i.createdAt ?? '') as string,
  };
}

// ─── Fallback empty stats (keeps callers safe when the server is down) ────────

const EMPTY_STATS: DashboardStats = {
  totalBookings: 0, pendingBookings: 0, approvedBookings: 0, rejectedBookings: 0,
  totalMemorials: 0, publishedMemorials: 0,
  totalRevenue: 0, totalPayments: 0, totalPackages: 0, totalContacts: 0,
  availableNiches: 0, reservedNiches: 0, occupiedNiches: 0, maintenanceNiches: 0,
  pendingComments: 0,
};

// ─── API service ──────────────────────────────────────────────────────────────

export const api = {

  // ── Auth ────────────────────────────────────────────────────────────────────

  /**
   * Authenticate an admin user.
   * Stores the returned JWT in localStorage so subsequent requests can include it.
   */
  async login(email: string, password: string): Promise<ApiResult<LoginResult>> {
    const payload: LoginPayload = { email, password };
    const result = await http.post<{
      success: boolean;
      token: string;
      admin: { id: string; username: string; email: string };
    }>('/admin/login', payload);

    if (!result.success) return result;

    const { token, admin } = result.data;
    const loginResult: LoginResult = {
      token,
      user: {
        id:        admin.id,
        email:     admin.email,
        full_name: admin.username,
        role:      'owner',
      },
    };
    localStorage.setItem('eternarest_token', token);
    localStorage.setItem('eternarest_user', JSON.stringify(loginResult.user));
    return { success: true, data: loginResult };
  },

  // ── Bookings ────────────────────────────────────────────────────────────────

  /**
   * Fetch all bookings, optionally filtered by status.
   */
  async getBookings(status?: BookingStatus): Promise<ApiResult<Booking[]>> {
    const result = await http.get<{ success: boolean; bookings: RawBooking[] }>(
      '/bookings',
      status ? { status } : undefined,
      true,
    );
    if (!result.success) return result;
    return { success: true, data: result.data.bookings.map(normaliseBooking) };
  },

  /**
   * Fetch a single booking by its bookingId string (e.g. "BK-XXXXXXXX").
   */
  async getBooking(bookingId: string): Promise<ApiResult<Booking>> {
    const result = await http.get<{ success: boolean; booking: RawBooking }>(
      `/bookings/${bookingId}`,
    );
    if (!result.success) return result;
    return { success: true, data: normaliseBooking(result.data.booking) };
  },

  /**
   * Create a new booking.
   * Maps frontend snake_case fields to the backend camelCase shape.
   */
  async createBooking(payload: CreateBookingPayload): Promise<ApiResult<CreateBookingResult>> {
    const body = {
      bookerName:    payload.requester_name,
      bookerEmail:   payload.requester_email,
      bookerPhone:   payload.requester_phone,
      deceasedName:  payload.deceased_name,
      dateOfBirth:   payload.date_of_birth   ?? new Date('1950-01-01').toISOString(),
      dateOfDeath:   payload.date_of_death   ?? new Date().toISOString(),
      biography:     payload.biography       ?? '',
      relationship:  payload.relationship    ?? 'Family',
      packageType:   payload.package_type    ?? 'standard',
      price:         payload.price           ?? 199,
    };

    const result = await http.post<{
      success: boolean;
      bookingId: string;
      billingNumber: string;
      booking: { qrCode?: string };
    }>('/bookings', body);

    if (!result.success) return result;

    const { bookingId, billingNumber, booking } = result.data;
    return {
      success: true,
      data: {
        booking_id:     bookingId,
        billing_number: billingNumber,
        memorial_id:    bookingId,
        qr_code_url:    booking.qrCode ?? '/placeholder.svg',
      },
    };
  },

  /**
   * Approve a pending booking. Creates a memorial, QR code, and family account.
   */
  async approveBooking(bookingId: string): Promise<ApiResult<ApproveBookingResult>> {
    const result = await http.put<{
      success: boolean;
      booking: RawBooking;
      memorial: { _id: string; memorialId: string };
      qrCode: string;
    }>(`/bookings/approve/${bookingId}`, {});

    if (!result.success) return result;

    return {
      success: true,
      data: {
        booking:  normaliseBooking(result.data.booking),
        memorial: {
          id:          result.data.memorial._id,
          memorial_id: result.data.memorial.memorialId,
        },
        qr_code: result.data.qrCode,
      },
    };
  },

  /**
   * Reject a pending booking.
   */
  async rejectBooking(bookingId: string): Promise<ApiResult<Booking>> {
    const result = await http.put<{ success: boolean; booking: RawBooking }>(
      `/bookings/reject/${bookingId}`,
      {},
    );
    if (!result.success) return result;
    return { success: true, data: normaliseBooking(result.data.booking) };
  },

  /**
   * Unified status update — delegates to approveBooking / rejectBooking.
   * Kept for backwards compatibility with existing UI components.
   */
  async updateBookingStatus(
    bookingId: string,
    status: 'approved' | 'rejected',
  ): Promise<ApiResult<Booking>> {
    if (status === 'approved') {
      const result = await api.approveBooking(bookingId);
      if (!result.success) return result;
      return { success: true, data: result.data.booking };
    }
    return api.rejectBooking(bookingId);
  },

  // ── Memorials ───────────────────────────────────────────────────────────────

  /**
   * Fetch all published memorials.
   */
  async getMemorials(): Promise<ApiResult<Memorial[]>> {
    const result = await http.get<{ success: boolean; memorials: RawMemorial[] }>('/memorials', undefined, true);
    if (!result.success) return result;
    return { success: true, data: result.data.memorials.map(normaliseMemorial) };
  },

  /**
   * Fetch a single memorial by its bookingId / memorialId.
   */
  async getMemorial(id: string): Promise<ApiResult<Memorial>> {
    const result = await http.get<{ success: boolean; memorial: RawMemorial }>(
      `/memorials/${id}`,
    );
    if (!result.success) return result;
    return { success: true, data: normaliseMemorial(result.data.memorial) };
  },

  /**
   * Full-text search across memorial names and booking IDs.
   */
  async searchMemorials(query: string): Promise<ApiResult<Memorial[]>> {
    const result = await http.get<{ success: boolean; memorials: RawMemorial[] }>(
      '/memorials/search',
      { q: query },
    );
    if (!result.success) return result;
    return { success: true, data: result.data.memorials.map(normaliseMemorial) };
  },

  /**
   * Add a tribute / comment to a memorial.
   */
  async addTribute(bookingId: string, payload: AddTributePayload): Promise<ApiResult<Memorial>> {
    const result = await http.post<{ success: boolean; memorial: RawMemorial }>(
      `/memorials/${bookingId}/tribute`,
      payload,
    );
    if (!result.success) return result;
    return { success: true, data: normaliseMemorial(result.data.memorial) };
  },

  // ── Dashboard ───────────────────────────────────────────────────────────────

  /**
   * Fetch aggregated dashboard statistics.
   * Also fetches pending comment count in parallel.
   */
  async getDashboardStats(): Promise<ApiResult<DashboardStats>> {
    const [statsResult, commentsResult] = await Promise.all([
      http.get<{
        success: boolean;
        stats: {
          totalBookings: number;
          pendingBookings: number;
          approvedBookings: number;
          rejectedBookings: number;
          totalMemorials: number;
          totalRevenue: number;
          totalPayments: number;
          totalPackages: number;
          totalContacts: number;
          availableNiches: number;
          reservedNiches: number;
          occupiedNiches: number;
          maintenanceNiches: number;
        };
      }>('/dashboard/stats', undefined, true),
      http.get<{ success: boolean; count: number }>('/comments', { status: 'pending' }, true),
    ]);

    if (!statsResult.success) {
      return { success: false, error: statsResult.error };
    }

    const s = statsResult.data.stats;
    const pendingComments = commentsResult.success ? (commentsResult.data.count ?? 0) : 0;

    return {
      success: true,
      data: {
        totalBookings:     s.totalBookings,
        pendingBookings:   s.pendingBookings,
        approvedBookings:  s.approvedBookings,
        rejectedBookings:  s.rejectedBookings,
        totalMemorials:    s.totalMemorials,
        publishedMemorials:s.totalMemorials,      // backend doesn't split this yet
        totalRevenue:      s.totalRevenue   ?? 0,
        totalPayments:     s.totalPayments  ?? 0,
        totalPackages:     s.totalPackages  ?? 0,
        totalContacts:     s.totalContacts  ?? 0,
        availableNiches:   s.availableNiches   ?? 0,
        reservedNiches:    s.reservedNiches    ?? 0,
        occupiedNiches:    s.occupiedNiches    ?? 0,
        maintenanceNiches: s.maintenanceNiches ?? 0,
        pendingComments,
      },
    };
  },

  /**
   * Legacy alias — kept so existing callers using api.getStats() still compile.
   */
  async getStats() {
    const result = await api.getDashboardStats();
    if (!result.success) return { success: false as const, data: EMPTY_STATS };
    return { success: true as const, data: result.data };
  },

  // ── Comments ────────────────────────────────────────────────────────────────

  /**
   * Fetch comments, optionally filtered by approval status.
   */
  async getComments(approved?: boolean): Promise<ApiResult<Comment[]>> {
    const params = approved !== undefined
      ? { status: approved ? 'approved' : 'pending' }
      : undefined;

    const result = await http.get<{
      success: boolean;
      comments: Array<{
        _id: string; bookingId: string; authorName: string;
        authorEmail?: string; content: string; status: string; createdAt: string;
      }>;
    }>('/comments', params, true);

    if (!result.success) return result;

    return {
      success: true,
      data: result.data.comments.map(c => ({
        id:           c._id,
        memorial_id:  c.bookingId,
        author_name:  c.authorName,
        author_email: c.authorEmail,
        content:      c.content,
        is_approved:  c.status === 'approved',
        created_at:   c.createdAt,
        memorials:    { deceased_name: c.bookingId, memorial_id: c.bookingId },
      })),
    };
  },

  /**
   * Add a new comment to a memorial.
   */
  async addComment(memorial_id: string, author_name: string, content: string, author_email?: string): Promise<ApiResult<Comment>> {
    const result = await http.post<{ success: boolean; comment: any }>('/comments', {
      bookingId:   memorial_id,
      authorName:  author_name,
      authorEmail: author_email,
      content,
    });
    if (!result.success) return result;
    const c = result.data.comment;
    return {
      success: true,
      data: {
        id:           c._id,
        memorial_id:  c.bookingId,
        author_name:  c.authorName,
        author_email: c.authorEmail,
        content:      c.content,
        is_approved:  c.status === 'approved',
        created_at:   c.createdAt,
      },
    };
  },

  /**
   * Approve or reject a comment.
   */
  async moderateComment(id: string, is_approved: boolean): Promise<ApiResult<{ message: string }>> {
    const endpoint = is_approved ? 'approve' : 'reject';
    const result = await http.put<{ success: boolean; message: string }>(
      `/comments/${id}/${endpoint}`,
      {},
      true,
    );
    if (!result.success) return result;
    return { success: true, data: { message: result.data.message } };
  },

  // ── Niches ──────────────────────────────────────────────────────────────────

  /**
   * Fetch niches, optionally filtered by status or block (wall).
   */
  async getNiches(wall?: string, status?: string): Promise<ApiResult<Niche[]>> {
    const params: Record<string, string> = {};
    if (wall)   params['block']  = wall;
    if (status) params['status'] = status;

    const result = await http.get<{
      success: boolean;
      niches: Array<{
        _id: string; nicheId: string; block: string;
        row: number; nicheNumber: number; status: NicheStatus;
      }>;
    }>('/niches', params);

    if (!result.success) return { success: true, data: [] };

    return {
      success: true,
      data: result.data.niches.map(n => ({
        id:          n._id,
        niche_id:    n.nicheId,
        wall:        n.block,
        row_number:  n.row,
        slot_number: n.nicheNumber,
        status:      n.status,
      })),
    };
  },

  // ── Media (Supabase Storage) ─────────────────────────────────────────────────

  /**
   * Upload a photo or video file to Supabase Storage.
   * Returns the public URL of the uploaded file.
   */
  async uploadMedia(file: File, memorialId: string): Promise<string> {
    const ext      = file.name.split('.').pop() ?? 'bin';
    const fileName = `${memorialId}/${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from('memorial-media')
      .upload(fileName, file);

    if (error) throw new Error(error.message);

    const { data: { publicUrl } } = supabase.storage
      .from('memorial-media')
      .getPublicUrl(fileName);

    return publicUrl;
  },

  // ── Payments (Mobile Money) ──────────────────────────────────────────────────

  /**
   * Initiate an MTN MoMo or Airtel Money push payment.
   * Sends a USSD prompt to the customer's phone.
   */
  async initiatePayment(payload: InitiatePaymentPayload): Promise<ApiResult<InitiatePaymentResult>> {
    const result = await http.post<{
      success: boolean;
      referenceId: string;
      transactionId: string;
      provider: string;
      amount: number;
      currency: string;
      merchantNumber: string;
      payment: Record<string, unknown>;
    }>('/payments/initiate', payload);

    if (!result.success) return result;
    const d = result.data;
    return {
      success: true,
      data: {
        referenceId:    d.referenceId,
        transactionId:  d.transactionId,
        provider:       d.provider as 'mtn' | 'airtel',
        amount:         d.amount,
        currency:       d.currency,
        merchantNumber: d.merchantNumber,
        payment:        normalisePayment(d.payment),
      },
    };
  },

  /**
   * Verify a payment — polls the provider and confirms if paid.
   * Returns SUCCESSFUL / FAILED / PENDING.
   */
  async verifyPayment(payload: VerifyPaymentPayload): Promise<ApiResult<VerifyPaymentResult>> {
    const result = await http.post<{
      success: boolean;
      status: string;
      payment: Record<string, unknown>;
      invoice?: Record<string, unknown>;
      booking?: Record<string, unknown>;
      alreadyVerified?: boolean;
    }>('/payments/verify', payload);

    // 202 PENDING comes back as success:false with status PENDING
    if (!result.success && (result as any).data?.status !== 'PENDING') return result;

    const d = (result as any).data ?? {};
    return {
      success: true,
      data: {
        status:          d.status as 'SUCCESSFUL' | 'FAILED' | 'PENDING',
        payment:         normalisePayment(d.payment || {}),
        invoice:         d.invoice  ? normaliseInvoice(d.invoice)  : undefined,
        booking:         d.booking  ? (d.booking as any) : undefined,
        alreadyVerified: d.alreadyVerified,
      },
    };
  },

  /**
   * Get payment record for a booking.
   */
  async getPaymentByBooking(bookingId: string): Promise<ApiResult<Payment>> {
    const result = await http.get<{ success: boolean; payment: Record<string, unknown> }>(
      `/payments/booking/${bookingId}`,
    );
    if (!result.success) return result;
    return { success: true, data: normalisePayment(result.data.payment) };
  },

  /**
   * Get invoice for a payment.
   */
  async getInvoice(paymentId: string): Promise<ApiResult<{ invoice: Invoice; payment: Payment }>> {
    const result = await http.get<{
      success: boolean;
      invoice: Record<string, unknown>;
      payment: Record<string, unknown>;
    }>(`/payments/${paymentId}/invoice`);
    if (!result.success) return result;
    return {
      success: true,
      data: {
        invoice: normaliseInvoice(result.data.invoice),
        payment: normalisePayment(result.data.payment),
      },
    };
  },

  // ── Public packages ─────────────────────────────────────────────────────────

  /**
   * Fetch all active packages from the public API.
   */
  async getPackages(): Promise<ApiResult<Array<{
    _id: string; name: string; price: number; currency?: string;
    description?: string; features?: string[]; isActive: boolean; popular?: boolean;
  }>>> {
    const result = await http.get<{ success: boolean; packages: Array<Record<string, unknown>> }>(
      '/packages',
    );
    if (!result.success) return result;
    return {
      success: true,
      data: result.data.packages as Array<{
        _id: string; name: string; price: number; currency?: string;
        description?: string; features?: string[]; isActive: boolean; popular?: boolean;
      }>,
    };
  },

  // ── Legacy stubs (Supabase edge-function paths — not yet in use) ─────────────

  async updateMemorial(_memorial: Partial<Memorial> & { id: string }) {
    return { success: false as const, error: 'Not implemented' };
  },

  async deleteMemorial(_id: string) {
    return { success: false as const, error: 'Not implemented' };
  },

  async addMedia(
    _memorial_id: string,
    _media_type: MediaType,
    _url: string,
    _caption?: string,
  ) {
    return { success: false as const, error: 'Not implemented' };
  },

  async deleteMedia(_id: string) {
    return { success: false as const, error: 'Not implemented' };
  },

  async getQR(bookingId: string): Promise<ApiResult<{ qrId: string; publicUrl: string; status: string; memorialId: string }>> {
    const result = await http.get<{ success: boolean; qr: any }>(`/qr/${bookingId}`, undefined, true);
    if (!result.success) return result;
    const q = result.data.qr;
    return { success: true, data: { qrId: q.qrId, publicUrl: q.publicUrl ?? q.qrCodeUrl, status: q.status, memorialId: q.memorialId } };
  },

  async regenerateQR(bookingId: string): Promise<ApiResult<{ publicUrl: string }>> {
    const result = await http.post<{ success: boolean; qr: any }>(`/qr/${bookingId}/regenerate`, {}, true);
    if (!result.success) return result;
    return { success: true, data: { publicUrl: result.data.qr.publicUrl ?? result.data.qr.qrCodeUrl } };
  },

  async downloadQR(bookingId: string): Promise<void> {
    const token = localStorage.getItem('eternarest_token') ?? '';
    const base = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000/api';
    const res = await fetch(`${base}/qr/${bookingId}/download`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) { console.error('QR download failed'); return; }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `qr-${bookingId}.png`; a.click();
    URL.revokeObjectURL(url);
  },
};
