# 🚀 EternaRest Memorial Booking - Complete Setup Guide

## 📋 Table of Contents
1. [Quick Start](#quick-start)
2. [Cloudinary Setup (Media Storage)](#cloudinary-setup)
3. [Brevo Setup (Email Service)](#brevo-setup)
4. [Payment Gateway Setup](#payment-gateway-setup)
5. [Environment Variables](#environment-variables)
6. [Testing](#testing)
7. [Deployment](#deployment)

---

## Quick Start

### Prerequisites
- Node.js 18+ installed
- MongoDB database (Atlas recommended)
- Git

### Installation

```bash
# Clone repository
git clone <your-repo-url>
cd memorial-booking-tribute

# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

### Run Locally

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```
Server runs on: http://localhost:5000

**Terminal 2 - Frontend:**
```bash
npm run dev
```
Frontend runs on: http://localhost:5173

### Create Admin Account
```bash
cd backend
node createAdmin.js
```

Default credentials:
- **Email**: admin@eternarest.com
- **Password**: admin123

**⚠️ Change these in production!**

---

## 🖼️ Cloudinary Setup (Media Storage)

Cloudinary provides free image/video hosting with 25GB storage and 25GB bandwidth per month.

### Step 1: Create Account
1. Visit: https://cloudinary.com/users/register_free
2. Sign up with your email
3. Verify email address
4. Complete profile setup

### Step 2: Get API Credentials
1. After login, go to **Dashboard**
2. Find **Account Details** section (top of page)
3. Copy these values:
   ```
   Cloud Name: dxxxxxxxxxxxxx
   API Key: 123456789012345
   API Secret: abcdefghijklmnopqrstuvwxyz-ABC
   ```

### Step 3: Create Upload Preset (Frontend Direct Upload)
1. Click **Settings** (⚙️ icon) → **Upload**
2. Scroll to **Upload Presets** section
3. Click **Add upload preset** (blue button)
4. Configure:
   - **Preset name**: `eternarest_unsigned`
   - **Signing Mode**: **Unsigned** ⚠️ (Important - allows direct browser uploads)
   - **Folder**: `eternarest/memorials`
   - **Use filename**: No
   - **Unique filename**: Yes
   - **Overwrite**: No
   - **Access Mode**: Public read
   - **Resource type**: Auto
5. Click **Save**

### Step 4: Configure Application

**Frontend `.env`:**
```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_CLOUDINARY_CLOUD_NAME=dxxxxxxxxxxxxx
VITE_CLOUDINARY_UPLOAD_PRESET=eternarest_unsigned
```

**Backend `.env` (optional - for server-side uploads):**
```env
CLOUDINARY_CLOUD_NAME=dxxxxxxxxxxxxx
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuvwxyz-ABC
```

### Test Upload
1. Go to: http://localhost:5173/admin
2. Login with admin credentials
3. Navigate to **CMS** → **Gallery**
4. Try uploading an image
5. Check Cloudinary Dashboard → **Media Library** to verify

### Troubleshooting
- **Upload failed**: Check preset name matches exactly
- **Preset not found**: Ensure signing mode is "Unsigned"
- **CORS error**: Cloudinary allows all origins by default for unsigned presets
- **Quota exceeded**: Free tier is 25GB/month, upgrade if needed

---

## 📧 Brevo Setup (Email Service)

Brevo (formerly Sendinblue) offers 300 free emails per day with excellent deliverability.

### Why Brevo Instead of Gmail?
- ✅ Better deliverability (emails don't go to spam)
- ✅ 300 emails/day free tier (Gmail: ~100/day with restrictions)
- ✅ Professional sender reputation
- ✅ Real-time delivery tracking
- ✅ No "less secure apps" warnings
- ✅ Better for transactional emails

### Step 1: Create Account
1. Visit: https://app.brevo.com/account/register
2. Sign up with your business email
3. Verify your email address
4. Complete company profile (required)
5. Skip SMS setup (unless needed)

### Step 2: Get SMTP Credentials
1. After login, click your **profile name** (top right)
2. Go to **SMTP & API**
3. Click the **SMTP** tab
4. Note these values:
   - **Server**: `smtp-relay.brevo.com`
   - **Port**: `587` (TLS)
   - **Login**: Your Brevo account email
5. Click **Create a new SMTP key**
6. Name it: `EternaRest Production`
7. **Copy the SMTP key immediately** (shown only once!)
   - Example: `xsmtpsib-a1b2c3d4e5f6g7h8-AbCdEfGhIjKlMnOp`

### Step 3: Add Sender Email
1. Go to **Senders** (left sidebar)
2. Click **Add a new sender**
3. Configure:
   - **From email**: `noreply@eternarest.com` (or your domain)
   - **From name**: `EternaRest Memorial`
4. Verify domain if using custom domain:
   - Follow DNS setup instructions
   - Add SPF, DKIM records to your domain DNS

### Step 4: Configure Backend
Update `backend/.env`:
```env
# Brevo SMTP Configuration
EMAIL_HOST=smtp-relay.brevo.com
EMAIL_PORT=587
EMAIL_USER=your.brevo.account@example.com
EMAIL_PASS=xsmtpsib-a1b2c3d4e5f6g7h8-AbCdEfGhIjKlMnOp
EMAIL_FROM=EternaRest Memorial <noreply@eternarest.com>
```

### Step 5: Test Email Sending
Create test file `backend/test-email.js`:
```javascript
require('dotenv').config();
const nodemailer = require('nodemailer');

const transport = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

transport.sendMail({
  from: process.env.EMAIL_FROM,
  to: 'your.personal.email@gmail.com', // Change this!
  subject: 'EternaRest Test Email',
  text: 'If you receive this, Brevo SMTP is working correctly!',
  html: '<h1>Success!</h1><p>Brevo SMTP is configured correctly.</p>'
}).then(() => {
  console.log('✅ Email sent successfully!');
  process.exit(0);
}).catch((err) => {
  console.error('❌ Email failed:', err);
  process.exit(1);
});
```

Run test:
```bash
cd backend
node test-email.js
```

### Email Templates Used
1. **Booking Approval + Payment Receipt**
   - Sent when: Payment verified or admin approves
   - Includes: QR code attachment, memorial link, invoice
   
2. **Family Account Created**
   - Sent when: First booking creates family account
   - Includes: Login credentials (auto-generated password)

### Monitoring
1. Go to **Statistics** in Brevo dashboard
2. Track:
   - Emails sent
   - Delivery rate
   - Bounce rate
   - Opens/clicks

### Troubleshooting
- **Authentication failed**: Double-check SMTP key (no extra spaces)
- **Sender rejected**: Verify sender email in Brevo dashboard
- **Emails to spam**: Configure SPF/DKIM records (Brevo docs)
- **Rate limit exceeded**: Free tier is 300/day, upgrade if needed
- **TLS error**: Ensure port is 587, not 465 or 25

---

## 💳 Payment Gateway Setup

### Current Status: SANDBOX MODE
- All payments return mock success
- No real money charged
- Perfect for development/testing

### Production Setup

#### MTN Mobile Money (Rwanda)

**Step 1: Register**
1. Visit: https://momodeveloper.mtn.com/
2. Create developer account
3. Subscribe to **Collections** product
4. Complete KYC verification (business documents required)

**Step 2: Get Credentials**
After KYC approval:
1. Go to **Profile** → **Subscriptions**
2. Select **Collections**
3. Copy:
   - **Primary Key** (Ocp-Apim-Subscription-Key)
   - **API User** (UUID format)
   - **API Key** (secret key)

**Step 3: Create API User (if not provided)**
```bash
# Use MTN's sandbox tool or API
curl -X POST https://sandbox.momodeveloper.mtn.com/v1_0/apiuser \
  -H "X-Reference-Id: YOUR_UUID" \
  -H "Ocp-Apim-Subscription-Key: YOUR_PRIMARY_KEY" \
  -d '{"providerCallbackHost": "webhook.yourdomain.com"}'
```

**Step 4: Configure**
Update `backend/.env`:
```env
MOMO_SANDBOX=false
MTN_BASE_URL=https://proxy.momoapi.mtn.com
MTN_COLLECTION_PRIMARY_KEY=your_primary_key_here
MTN_API_USER=your_uuid_here
MTN_API_KEY=your_api_key_here
MTN_CALLBACK_URL=https://yourdomain.com/api/payments/momo/webhook
MTN_MOMO_NUMBER=+250794890144
```

#### Airtel Money (Rwanda)

**Step 1: Register**
1. Visit: https://developers.airtel.africa/
2. Sign up → Verify email
3. Apply for **Collections API** access
4. Submit business documentation

**Step 2: Get Credentials**
After approval:
1. Go to **My Apps**
2. Create new app
3. Copy:
   - **Client ID**
   - **Client Secret**

**Step 3: Configure**
Update `backend/.env`:
```env
AIRTEL_BASE_URL=https://openapi.airtel.africa
AIRTEL_CLIENT_ID=your_client_id_here
AIRTEL_CLIENT_SECRET=your_client_secret_here
AIRTEL_COUNTRY=RW
AIRTEL_MONEY_NUMBER=+250794890144
```

### Testing Payments

**Sandbox Mode (Current):**
```bash
# backend/.env
MOMO_SANDBOX=true
```

All payment requests will:
1. Generate deterministic transaction IDs
2. Return instant success
3. Trigger full approval pipeline
4. Send confirmation emails

**Test Flow:**
1. Create booking on website
2. Initiate payment (any phone number works)
3. System immediately marks as "paid"
4. Memorial page goes live
5. QR code generated
6. Email sent

---

## 🔐 Environment Variables

### Frontend `.env`
```env
# API Connection
VITE_API_BASE_URL=http://localhost:5000/api

# Cloudinary (Media Storage)
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=eternarest_unsigned
```

### Backend `.env`
```env
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/eternarest

# Server
PORT=5000
NODE_ENV=development
JWT_SECRET=your_very_long_random_secret_change_in_production
ALLOWED_ORIGINS=http://localhost:5173,https://yourdomain.com

# Email (Brevo)
EMAIL_HOST=smtp-relay.brevo.com
EMAIL_PORT=587
EMAIL_USER=your.brevo.email@example.com
EMAIL_PASS=your_brevo_smtp_key
EMAIL_FROM=EternaRest Memorial <noreply@eternarest.com>

# Payment - Sandbox (Development)
MOMO_SANDBOX=true
MTN_MOMO_NUMBER=+250794890144
AIRTEL_MONEY_NUMBER=+250794890144
USD_TO_RWF_RATE=1300
MOMO_CURRENCY=RWF

# Payment - Production Credentials (MTN)
MTN_BASE_URL=https://proxy.momoapi.mtn.com
MTN_COLLECTION_PRIMARY_KEY=
MTN_API_USER=
MTN_API_KEY=
MTN_CALLBACK_URL=https://yourdomain.com/api/payments/momo/webhook

# Payment - Production Credentials (Airtel)
AIRTEL_BASE_URL=https://openapi.airtel.africa
AIRTEL_CLIENT_ID=
AIRTEL_CLIENT_SECRET=
AIRTEL_COUNTRY=RW

# Cloudinary (Optional - Backend uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# WhatsApp (Future feature)
WHATSAPP_NUMBER=+250794890144
```

---

## 🧪 Testing

### Backend Tests
```bash
cd backend

# Test database connection
node -e "require('./config/db')()"

# Test email sending
node test-email.js

# Create test booking
curl -X POST http://localhost:5000/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "bookerName": "Test User",
    "bookerEmail": "test@example.com",
    "bookerPhone": "+250788123456",
    "deceasedName": "Test Memorial",
    "dateOfBirth": "1950-01-01",
    "dateOfDeath": "2024-01-01",
    "biography": "Test biography",
    "packageType": "Premium",
    "relationship": "Son"
  }'
```

### Frontend Tests
```bash
# Check if frontend connects to backend
curl http://localhost:5000/api/health

# Should return:
# {"status":"OK","message":"Server is running"}
```

### Manual Testing Checklist
- [ ] Create admin account
- [ ] Login to admin dashboard
- [ ] Add test service in CMS
- [ ] Add test package
- [ ] Create test booking
- [ ] Initiate payment (sandbox)
- [ ] Verify memorial page created
- [ ] Check QR code generated
- [ ] Verify email sent
- [ ] Test memorial search
- [ ] Add comment/tribute
- [ ] Upload memorial photo
- [ ] Submit testimonial
- [ ] Test contact form

---

## 🚀 Deployment

### Frontend (Vercel/Netlify)

**Build Command:**
```bash
npm run build
```

**Output Directory:** `dist`

**Environment Variables:**
Add all `VITE_*` variables from local `.env`

### Backend (Railway/Render/Heroku)

**Start Command:**
```bash
npm start
```

**Environment Variables:**
Add all variables from `backend/.env`

**⚠️ Important:**
- Set `NODE_ENV=production`
- Set `MOMO_SANDBOX=false` for real payments
- Use strong `JWT_SECRET`
- Configure `ALLOWED_ORIGINS` with your domain
- Enable HTTPS
- Set up domain DNS

### MongoDB Atlas
1. Whitelist deployment server IPs
2. Or use `0.0.0.0/0` (less secure but works everywhere)
3. Create database user with read/write permissions

### Post-Deployment
1. Test live booking flow
2. Verify emails arrive
3. Test payment integration (small amount first)
4. Monitor server logs
5. Set up backup strategy
6. Configure SSL certificate
7. Set up domain

---

## 📞 Support

### Common Issues

**"Cannot connect to MongoDB"**
- Check `MONGODB_URI` format
- Verify IP whitelist in Atlas
- Ensure database user exists

**"Cloudinary upload fails"**
- Verify preset is "unsigned"
- Check cloud name spelling
- Ensure browser has internet access

**"Emails not sending"**
- Verify Brevo SMTP key
- Check sender email is verified
- Ensure port 587 is not blocked

**"Payment always fails"**
- In sandbox mode, it should auto-succeed
- Check `MOMO_SANDBOX=true` in `.env`
- For production, verify API credentials

---

## 📚 Additional Resources

- **MongoDB Atlas**: https://www.mongodb.com/docs/atlas/
- **Cloudinary Docs**: https://cloudinary.com/documentation
- **Brevo API Docs**: https://developers.brevo.com/docs
- **MTN MoMo API**: https://momodeveloper.mtn.com/api-documentation/
- **Airtel Money API**: https://developers.airtel.africa/documentation

---

**Last Updated**: 2026-07-09
**Version**: 1.0.0
