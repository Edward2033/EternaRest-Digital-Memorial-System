/**
 * momoGateway.js
 *
 * MTN Mobile Money (Rwanda) — Collections v1_0
 * Airtel Money Africa — Collections
 *
 * Set MOMO_SANDBOX=false + production keys to charge real phones.
 * Set MOMO_SANDBOX=true  + sandbox keys for testing (no real money).
 */

const https  = require('https');
const http   = require('http');
const crypto = require('crypto');

const SANDBOX     = process.env.MOMO_SANDBOX === 'true';
const CURRENCY    = process.env.MOMO_CURRENCY || 'RWF';
const TARGET_ENV  = process.env.MTN_TARGET_ENVIRONMENT || (SANDBOX ? 'sandbox' : 'mtnrwanda');

// ─── MTN config ───────────────────────────────────────────────────────────────
const MTN_BASE_URL   = process.env.MTN_BASE_URL || (SANDBOX
  ? 'https://sandbox.momodeveloper.mtn.com'
  : 'https://proxy.momoapi.mtn.com');
const MTN_SUB_KEY    = process.env.MTN_COLLECTION_PRIMARY_KEY || '';
const MTN_API_USER   = process.env.MTN_API_USER  || '';
const MTN_API_KEY    = process.env.MTN_API_KEY   || '';
const MTN_CALLBACK   = process.env.MTN_CALLBACK_URL || '';

// ─── Airtel config ────────────────────────────────────────────────────────────
const AIRTEL_BASE_URL      = process.env.AIRTEL_BASE_URL      || 'https://openapi.airtel.africa';
const AIRTEL_CLIENT_ID     = process.env.AIRTEL_CLIENT_ID     || '';
const AIRTEL_CLIENT_SECRET = process.env.AIRTEL_CLIENT_SECRET || '';
const AIRTEL_COUNTRY       = process.env.AIRTEL_COUNTRY       || 'RW';

// ─── HTTP helper ──────────────────────────────────────────────────────────────
function jsonFetch(url, options = {}, body = null) {
  return new Promise((resolve, reject) => {
    const parsed  = new URL(url);
    const isHttps = parsed.protocol === 'https:';
    const lib     = isHttps ? https : http;
    const data    = body ? JSON.stringify(body) : null;

    const reqOptions = {
      hostname: parsed.hostname,
      port:     parsed.port || (isHttps ? 443 : 80),
      path:     parsed.pathname + parsed.search,
      method:   options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
        ...(options.headers || {}),
      },
    };

    const req = lib.request(reqOptions, (res) => {
      let raw = '';
      res.on('data', chunk => (raw += chunk));
      res.on('end', () => {
        try   { resolve({ status: res.statusCode, body: raw ? JSON.parse(raw) : {} }); }
        catch { resolve({ status: res.statusCode, body: raw }); }
      });
    });

    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

// ─── MTN: get Bearer token ────────────────────────────────────────────────────
async function mtnGetToken() {
  if (!MTN_API_USER || !MTN_API_KEY) {
    throw new Error('MTN_API_USER and MTN_API_KEY must be set in environment variables');
  }

  const credentials = Buffer.from(`${MTN_API_USER}:${MTN_API_KEY}`).toString('base64');

  // MTN token endpoint requires Content-Length: 0 even with no body
  const { status, body } = await jsonFetch(
    `${MTN_BASE_URL}/collection/token/`,
    {
      method: 'POST',
      headers: {
        'Authorization':             `Basic ${credentials}`,
        'Ocp-Apim-Subscription-Key': MTN_SUB_KEY,
        'Content-Length':            '0',
      },
    },
  );

  if (status !== 200) {
    throw new Error(`MTN token error ${status}: ${JSON.stringify(body)}`);
  }
  return body;
}

// ─── MTN: request to pay ──────────────────────────────────────────────────────
async function mtnInitiate({ amount, msisdn, externalId, note }) {
  if (!MTN_SUB_KEY || !MTN_API_USER || !MTN_API_KEY) {
    throw new Error('MTN credentials not configured. Set MTN_COLLECTION_PRIMARY_KEY, MTN_API_USER, MTN_API_KEY.');
  }

  const referenceId = crypto.randomUUID();
  const { access_token } = await mtnGetToken();

  // Sandbox only accepts EUR + MTN test MSISDN — production uses real RWF + real number
  const payAmount   = SANDBOX ? '100'         : String(amount);
  const payCurrency = SANDBOX ? 'EUR'         : CURRENCY;
  const payMsisdn   = SANDBOX ? '46733123454' : msisdn.replace(/[^0-9]/g, '');

  const headers = {
    'Authorization':             `Bearer ${access_token}`,
    'X-Reference-Id':            referenceId,
    'X-Target-Environment':      TARGET_ENV,
    'Ocp-Apim-Subscription-Key': MTN_SUB_KEY,
  };
  if (MTN_CALLBACK) headers['X-Callback-Url'] = MTN_CALLBACK;

  const { status, body } = await jsonFetch(
    `${MTN_BASE_URL}/collection/v1_0/requesttopay`,
    { method: 'POST', headers },
    {
      amount:       payAmount,
      currency:     payCurrency,
      externalId:   String(externalId),
      payer:        { partyIdType: 'MSISDN', partyId: payMsisdn },
      payerMessage: (note || 'EternaRest Memorial Payment').substring(0, 160),
      payeeNote:    (note || 'EternaRest Memorial Payment').substring(0, 160),
    },
  );

  if (status !== 202) {
    throw new Error(`MTN requesttopay failed with status ${status}: ${JSON.stringify(body)}`);
  }

  console.log(`📱 MTN${SANDBOX ? ' [SANDBOX]' : ''} push → ${msisdn} | ${amount} ${CURRENCY} | ref: ${referenceId}`);
  return { referenceId, transactionId: referenceId, provider: 'mtn', status: 'PENDING' };
}

// ─── MTN: check status ────────────────────────────────────────────────────────
async function mtnCheckStatus(referenceId) {
  const { access_token } = await mtnGetToken();

  const { status, body } = await jsonFetch(
    `${MTN_BASE_URL}/collection/v1_0/requesttopay/${referenceId}`,
    {
      method: 'GET',
      headers: {
        'Authorization':             `Bearer ${access_token}`,
        'X-Target-Environment':      TARGET_ENV,
        'Ocp-Apim-Subscription-Key': MTN_SUB_KEY,
      },
    },
  );

  if (status !== 200) {
    throw new Error(`MTN status check error ${status}: ${JSON.stringify(body)}`);
  }

  console.log(`🔍 MTN status for ${referenceId}: ${body.status} | reason: ${body.reason || 'none'}`);

  // Map MTN reason codes to friendly messages
  const reasonMap = {
    PAYER_NOT_FOUND:           'Phone number not registered on MTN MoMo.',
    NOT_ALLOWED:               'Transaction not allowed for this account.',
    NOT_ALLOWED_TARGET_ENV:    'Transaction not allowed in this environment.',
    INVALID_CALLBACK_URL:      'Invalid callback URL.',
    INVALID_CURRENCY:          'Currency not supported.',
    SERVICE_UNAVAILABLE:       'MTN MoMo service is temporarily unavailable.',
    INTERNAL_PROCESSING_ERROR: 'MTN internal error. Please try again.',
    NOT_ENOUGH_FUNDS:          'Insufficient balance on your MTN MoMo account.',
    PAYER_LIMIT_REACHED:       'Daily transaction limit reached on your MTN MoMo account.',
    PAYEE_NOT_ALLOWED_TO_RECEIVE: 'This account cannot receive payments.',
    EXPIRED:                   'Payment request expired. Please try again.',
    REJECTED:                  'Payment was rejected by the customer.',
  };
  const friendlyReason = reasonMap[body.reason] || body.reason || null;

  return { status: body.status, reason: friendlyReason, provider: 'mtn', raw: body };
}

// ─── Airtel: token cache ──────────────────────────────────────────────────────
let _airtelToken    = null;
let _airtelTokenExp = 0;

async function airtelGetToken() {
  if (!AIRTEL_CLIENT_ID || !AIRTEL_CLIENT_SECRET) {
    throw new Error('AIRTEL_CLIENT_ID and AIRTEL_CLIENT_SECRET must be set in environment variables');
  }

  if (_airtelToken && Date.now() < _airtelTokenExp) return _airtelToken;

  const { status, body } = await jsonFetch(
    `${AIRTEL_BASE_URL}/auth/oauth2/token`,
    { method: 'POST' },
    { client_id: AIRTEL_CLIENT_ID, client_secret: AIRTEL_CLIENT_SECRET, grant_type: 'client_credentials' },
  );

  if (status !== 200) throw new Error(`Airtel token error ${status}: ${JSON.stringify(body)}`);
  _airtelToken    = body.access_token;
  _airtelTokenExp = Date.now() + (body.expires_in - 60) * 1000;
  return _airtelToken;
}

// ─── Airtel: initiate ─────────────────────────────────────────────────────────
async function airtelInitiate({ amount, msisdn, externalId, note }) {
  const referenceId  = crypto.randomUUID();
  const token        = await airtelGetToken();
  const cleanMsisdn  = msisdn.replace(/\D/g, '').replace(/^250/, '');

  const { status, body } = await jsonFetch(
    `${AIRTEL_BASE_URL}/merchant/v1/payments/`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Country':     AIRTEL_COUNTRY,
        'X-Currency':    CURRENCY,
      },
    },
    {
      reference:   String(externalId),
      subscriber:  { country: AIRTEL_COUNTRY, currency: CURRENCY, msisdn: cleanMsisdn },
      transaction: { amount, country: AIRTEL_COUNTRY, currency: CURRENCY, id: referenceId },
    },
  );

  if (status !== 200 || body.status?.code !== '200') {
    throw new Error(`Airtel initiate error ${status}: ${JSON.stringify(body)}`);
  }

  console.log(`📱 Airtel USSD push sent → ${msisdn} | ${amount} ${CURRENCY} | ref: ${referenceId}`);
  return { referenceId, transactionId: body.data?.transaction?.id || referenceId, provider: 'airtel', status: 'PENDING' };
}

// ─── Airtel: check status ─────────────────────────────────────────────────────
async function airtelCheckStatus(transactionId) {
  const token = await airtelGetToken();

  const { status, body } = await jsonFetch(
    `${AIRTEL_BASE_URL}/standard/v1/payments/${transactionId}`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Country':     AIRTEL_COUNTRY,
        'X-Currency':    CURRENCY,
      },
    },
  );

  if (status !== 200) throw new Error(`Airtel status check error ${status}`);
  return {
    status:   body.data?.transaction?.status,
    reason:   body.data?.transaction?.message || null,
    provider: 'airtel',
    raw:      body,
  };
}

// ─── Normalise status ─────────────────────────────────────────────────────────
function normaliseStatus(provider, rawStatus) {
  if (provider === 'mtn') {
    if (rawStatus === 'SUCCESSFUL') return 'SUCCESSFUL';
    if (rawStatus === 'FAILED')     return 'FAILED';
    return 'PENDING';
  }
  if (provider === 'airtel') {
    if (rawStatus === 'TS') return 'SUCCESSFUL';
    if (rawStatus === 'TF') return 'FAILED';
    return 'PENDING';
  }
  return 'PENDING';
}

// ─── Public API ───────────────────────────────────────────────────────────────
async function initiatePayment({ provider, amount, msisdn, externalId, note }) {
  if (provider === 'airtel') return airtelInitiate({ amount, msisdn, externalId, note });
  return mtnInitiate({ amount, msisdn, externalId, note });
}

async function checkPaymentStatus(provider, referenceId) {
  const raw = provider === 'airtel'
    ? await airtelCheckStatus(referenceId)
    : await mtnCheckStatus(referenceId);
  return { ...raw, normalisedStatus: normaliseStatus(provider, raw.status) };
}

module.exports = { initiatePayment, checkPaymentStatus, normaliseStatus };
