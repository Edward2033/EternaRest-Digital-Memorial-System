// ─── Primitive domain types ───────────────────────────────────────────────────

export type BookingStatus  = 'pending' | 'approved' | 'rejected' | 'completed';
export type PaymentStatus  = 'unpaid'  | 'pending'  | 'verified' | 'rejected' | 'failed' | 'completed' | 'refunded';
export type MomoProvider   = 'mtn' | 'airtel';
export type MemorialStatus = 'draft'   | 'published'| 'archived';
export type PackageType    = 'basic'   | 'standard' | 'premium'  | 'essential' | 'legacy';
export type MediaType      = 'photo'   | 'video';
export type AdminRole      = 'owner'   | 'staff';
export type NicheStatus    = 'available'| 'reserved' | 'occupied';

// ─── Backend raw shapes (wire format) ────────────────────────────────────────
// These match exactly what MongoDB returns via the controllers.

export interface RawBooking {
  _id: string;
  bookingId: string;
  billingNumber: string;
  deceasedName: string;
  dateOfBirth: string;
  dateOfDeath: string;
  biography?: string;
  bookerName: string;
  bookerEmail: string;
  bookerPhone: string;
  relationship: string;
  packageType: PackageType;
  price: number;
  paymentStatus: PaymentStatus;
  status: BookingStatus;
  qrCode?: string;
  notes?: string;
  approvedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RawTribute {
  name: string;
  message: string;
  createdAt: string;
}

export interface RawMedia {
  _id: string;
  type: MediaType;
  url: string;
  caption?: string;
}

export interface RawMemorial {
  _id: string;
  memorialId: string;
  bookingId: string;
  deceasedName: string;
  dateOfBirth: string;
  dateOfDeath: string;
  biography?: string;
  familyInformation?: string;
  profileImage?: string;
  coverImage?: string;
  gallery: string[];
  videos: string[];
  isPublic: boolean;
  status: MemorialStatus;
  views: number;
  media: RawMedia[];
  tributes: RawTribute[];
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Frontend normalised shapes ───────────────────────────────────────────────

export interface Booking {
  id: string;
  booking_id: string;
  billing_number: string;
  deceased_name: string;
  date_of_birth: string;
  date_of_death: string;
  biography?: string;
  requester_name: string;
  requester_email: string;
  requester_phone: string;
  relationship: string;
  package_type: PackageType;
  price: number;
  payment_status: PaymentStatus;
  status: BookingStatus;
  qr_code?: string;
  notes?: string;
  approved_at?: string;
  created_at: string;
  // legacy fields retained for existing UI components
  preferred_wall: string;
  preferred_row: number;
  preferred_slot: number;
}

export interface Tribute {
  author_name: string;
  content: string;
  created_at: string;
}

export interface Media {
  id: string;
  memorial_id: string;
  media_type: MediaType;
  url: string;
  caption?: string;
  display_order: number;
}

export interface Memorial {
  id: string;
  memorial_id: string;
  booking_id: string;
  deceased_name: string;
  birth_date: string;
  death_date: string;
  biography?: string;
  family_information?: string;
  profile_image?: string;
  cover_image?: string;
  gallery: string[];
  videos: string[];
  is_published: boolean;
  status: MemorialStatus;
  views: number;
  media: Media[];
  tributes: Tribute[];
  created_at: string;
}

export interface Payment {
  id: string;
  payment_id: string;
  booking_id: string;
  billing_number: string;
  package_name: string;
  amount: number;
  currency: string;
  method: MomoProvider | 'bank_transfer' | 'card' | 'cash' | 'other';
  phone_number?: string;
  transaction_id?: string;
  transaction_reference?: string;
  status: PaymentStatus;
  verified_by?: string;
  verified_at?: string;
  paid_at?: string;
  notes?: string;
  created_at: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  booking_id: string;
  billing_number: string;
  amount: number;
  currency: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  due_date?: string;
  notes?: string;
  created_at: string;
}

export interface Niche {
  id: string;
  niche_id: string;
  wall: string;
  row_number: number;
  slot_number: number;
  status: NicheStatus;
  qr_code_url?: string;
}

export interface Comment {
  id: string;
  memorial_id: string;
  author_name: string;
  author_email?: string;
  content: string;
  is_approved: boolean;
  created_at: string;
  memorials?: { deceased_name: string; memorial_id: string };
}

export interface DashboardStats {
  totalBookings: number;
  pendingBookings: number;
  approvedBookings: number;
  rejectedBookings: number;
  totalMemorials: number;
  publishedMemorials: number;
  totalRevenue: number;
  totalPayments: number;
  totalPackages: number;
  totalContacts: number;
  availableNiches: number;
  reservedNiches: number;
  occupiedNiches: number;
  maintenanceNiches: number;
  pendingComments: number;
}

export interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  role: AdminRole;
}

// ─── Request payload types ────────────────────────────────────────────────────

export interface CreateBookingPayload {
  requester_name: string;
  requester_email: string;
  requester_phone: string;
  deceased_name: string;
  date_of_birth?: string;
  date_of_death?: string;
  biography?: string;
  relationship?: string;
  package_type?: PackageType;
  price?: number;
  /** Legacy wall/row/slot kept for UI compatibility */
  preferred_wall?: string;
  preferred_row?: number;
  preferred_slot?: number;
}

export interface AddTributePayload {
  name: string;
  message: string;
}

export interface InitiatePaymentPayload {
  bookingId: string;
  provider: MomoProvider;
  phoneNumber?: string;
}

export interface VerifyPaymentPayload {
  bookingId?: string;
  referenceId?: string;
  provider?: MomoProvider;
}

export interface InitiatePaymentResult {
  referenceId: string;
  transactionId: string;
  provider: MomoProvider;
  amount: number;
  currency: string;
  merchantNumber: string;
  payment: Payment;
}

export interface VerifyPaymentResult {
  status: 'SUCCESSFUL' | 'FAILED' | 'PENDING';
  payment: Payment;
  invoice?: Invoice;
  booking?: { bookingId: string; paymentStatus: PaymentStatus; status: BookingStatus };
  alreadyVerified?: boolean;
}

export interface AddCommentPayload {
  memorial_id: string;
  author_name: string;
  author_email?: string;
  content: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

// ─── API response envelope ────────────────────────────────────────────────────

export type ApiResult<T> =
  | { success: true;  data: T;    error?: never }
  | { success: false; data?: never; error: string };

// ─── Granular response types (matching exact controller shapes) ───────────────

export interface CreateBookingResult {
  booking_id: string;
  billing_number: string;
  memorial_id?: string;
  qr_code_url?: string;
}

export interface ApproveBookingResult {
  booking: Booking;
  memorial: { id: string; memorial_id: string };
  qr_code: string;
}

export interface LoginResult {
  token: string;
  user: AdminUser;
}
