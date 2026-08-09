/**
 * momoGateway.js
 *
 * Abstracts MTN Mobile Money (Rwanda) and Airtel Money (Rwanda) payment flows.
 *
 * MTN MoMo  — uses the MTN MoMo Open API (Collections v1_0)
 *             https://momodeveloper.mtn.com/
 *
 * Airtel    — uses Airtel Money Africa API (Collections)
 *             https://developers.airtel.africa/
 *
 * Both follow the same pattern:
 *   1. initiate()  → sends a push USSD prompt to the customer's phone
 *   2. checkStatus() → polls the provider to confirm payment
 *
 * When MOMO_SANDBOX=true the gateway skips real HTTP calls and returns
 * deterministic mock responses so local development works without credentials.
 */

const https  = require('https');
const http   = require('http');
const crypto = require('crypto');

const SANDBOX    = process.env.MOMO_SANDBOX !== 'false'; // default: sandbox ON
const CURRENCY   = process.env.MOMO_CURRENCY || 'RWF';

// ─── MTN MoMo config ──────────────────────────────────────────────────────────
const MTN_BASE_URL    = process.env.MTN_BASE_URL    || 'https://sandbox.momodeveloper.mtn.com';
const MTN_COLLECTION_PRIMARY_KEY = process.env.MTN_COLLECTION_PRIMARY_KEY || '';
const MTN_API_USER    = process.env.MTN_API_USER    || '';
const MTN_API_KEY     = process.env.MTN_API_KEY     || '';
const MTN_CALLBACK    = process.env.MTN_CALLBACK_URL || 'https://yoursite.com/api/payments/momo/webhook';

// ─── Airtel config ────────────────────────────────────────────────────────────
const AIRTEL_BASE_URL = process.env.AIRTEL_BASE_URL || 'https://openapi.airtel.africa';
const AIRTEL_CLIENT_ID     = process.env.AIRTEL_CLIENT_ID    || '';
const AIRTEL_CLIENT_SECRET = process.env.AIRTEL_CLIENT_SECRET || '';
const AIRTEL_COUNTRY       = process.env.AIRTEL_COUNTRY      || 'RW';

// ─── Generic JSON fetch helper ─────────────────────────────────────────────────
function jsonFetch(url, options = {}, body = null) {
  return new Promise((resolve, reject) => {
    const parsed   = new URL(url);
    const isHttps  = parsed.protocol === 'https:';
    const lib      = isHttps ? https : http;
    const data     = body ? JSON.stringify(body) : null;

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
        try {
          resolve({ status: res.statusCode, body: raw ? JSON.parse(raw) : {} });
        } catch {
          resolve({ status: res.statusCode, body: raw });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

// ─── Sandbox helpers ──────────────────────────────────────────────────────────

/** Generate a deterministic fake transaction ID for sandbox mode */
function sandboxTxnId() {
  return `SAND-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
}

// ─── MTN MoMo ─────────────────────────────────────────────────────────────────

/**
 * Get a fresh Bearer token from MTN MoMo.
 * Uses Basic auth with API_USER:API_KEY.
 */
async function mtnGetToken() {
  if (SANDBOX && !MTN_API_USER) {
    return { access_token: 'sandbox-mtn-token', token_type: 'access_token', expires_in: 3600 };
  }

  const credentials = Buffer.from(`${MTN_API_USER}:${MTN_API_KEY}`).toString('base64');
  const { status, body } = await jsonFetch(
    `${MTN_BASE_URL}/collection/token/`,
    {
      method: 'POST',
      headers: {
        Authorization:            `Basic ${credentials}`,
        'Ocp-Apim-Subscription-Key': MTN_COLLECTION_PRIMARY_KEY,
      },
    },
  );
  if (status !== 200) throw new Error(`MTN token error ${status}: ${JSON.stringify(body)}`);
  return body;
}

/**
 * Initiate an MTN MoMo Collections request-to-pay.
 * Sends a USSD push to msisdn (phone number).
 *
 * @returns {{ referenceId: string, transactionId: string }}
 */
async function mtnInitiate({ amount, msisdn, externalId, note }) {
  const referenceId = crypto.randomUUID();

  if (SANDBOX) {
    console.log(`📱 [MTN Sandbox] Push to ${msisdn} — ${amount} ${CURRENCY} | ref: ${referenceId}`);
    return { referenceId, transactionId: sandboxTxnId(), provider: 'mtn', status: 'PENDING' };
  }

  const { access_token } = await mtnGetToken();
  const { status } = await jsonFetch(
    `${MTN_BASE_URL}/collection/v1_0/requesttopay`,
    {
      method: 'POST',
      headers: {
        Authorization:              `Bearer ${access_token}`,
        'X-Reference-Id':           referenceId,
        'X-Target-Environment':     SANDBOX ? 'sandbox' : 'mtnrwanda',
        'Ocp-Apim-Subscription-Key': MTN_COLLECTION_PRIMARY_KEY,
        'X-Callback-Url':           MTN_CALLBACK,
      },
    },
    {
      amount:       String(amount),
      currency:     CURRENCY,
      externalId,
      payer:        { partyIdType: 'MSISDN', partyId: msisdn.replace(/\D/g, '') },
      payerMessage: note || 'EternaRest Memorial Payment',
      payeeNote:    note || 'EternaRest Memorial Payment',
    },
  );

  // 202 = accepted (async, no body)
  if (status !== 202) throw new Error(`MTN initiate error ${status}`);
  return { referenceId, transactionId: referenceId, provider: 'mtn', status: 'PENDING' };
}

/**
 * Check the status of a previous MTN MoMo Collections request.
 * Returns one of: SUCCESSFUL | FAILED | PENDING
 */
async function mtnCheckStatus(referenceId) {
  if (SANDBOX) {
    // In sandbox, treat all SAND-* refs as successful after a brief period
    console.log(`🔍 [MTN Sandbox] Checking ${referenceId}`);
    return { status: 'SUCCESSFUL', reason: null, provider: 'mtn' };
  }

  const { access_token } = await mtnGetToken();
  const { status, body } = await jsonFetch(
    `${MTN_BASE_URL}/collection/v1_0/requesttopay/${referenceId}`,
    {
      method: 'GET',
      headers: {
        Authorization:              `Bearer ${access_token}`,
        'X-Target-Environment':     'mtnrwanda',
        'Ocp-Apim-Subscription-Key': MTN_COLLECTION_PRIMARY_KEY,
      },
    },
  );
  if (status !== 200) throw new Error(`MTN status check error ${status}`);
  return { status: body.status, reason: body.reason || null, provider: 'mtn', raw: body };
}

// ─── Airtel Money ──────────────────────────────────────────────────────────────

let _airtelToken     = null;
let _airtelTokenExp  = 0;

/** Get (or refresh) an Airtel Money OAuth2 token. */
async function airtelGetToken() {
  if (SANDBOX && !AIRTEL_CLIENT_ID) {
    return 'sandbox-airtel-token';
  }

  if (_airtelToken && Date.now() < _airtelTokenExp) return _airtelToken;

  const { status, body } = await jsonFetch(
    `${AIRTEL_BASE_URL}/auth/oauth2/token`,
    { method: 'POST' },
    {
      client_id:     AIRTEL_CLIENT_ID,
      client_secret: AIRTEL_CLIENT_SECRET,
      grant_type:    'client_credentials',
    },
  );
  if (status !== 200) throw new Error(`Airtel token error ${status}: ${JSON.stringify(body)}`);
  _airtelToken    = body.access_token;
  _airtelTokenExp = Date.now() + (body.expires_in - 60) * 1000;
  return _airtelToken;
}

/**
 * Initiate an Airtel Money collection (push USSD).
 * @returns {{ referenceId: string, transactionId: string }}
 */
async function airtelInitiate({ amount, msisdn, externalId, note }) {
  const referenceId = crypto.randomUUID();

  if (SANDBOX) {
    console.log(`📱 [Airtel Sandbox] Push to ${msisdn} — ${amount} ${CURRENCY} | ref: ${referenceId}`);
    return { referenceId, transactionId: sandboxTxnId(), provider: 'airtel', status: 'PENDING' };
  }

  const token = await airtelGetToken();
  const cleanMsisdn = msisdn.replace(/\D/g, '').replace(/^250/, ''); // Airtel wants local format

  const { status, body } = await jsonFetch(
    `${AIRTEL_BASE_URL}/merchant/v1/payments/`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Country':   AIRTEL_COUNTRY,
        'X-Currency':  CURRENCY,
      },
    },
    {
      reference:   externalId,
      subscriber: { country: AIRTEL_COUNTRY, currency: CURRENCY, msisdn: cleanMsisdn },
      transaction: { amount, country: AIRTEL_COUNTRY, currency: CURRENCY, id: referenceId },
    },
  );

  if (status !== 200 || body.status?.code !== '200') {
    throw new Error(`Airtel initiate error ${status}: ${JSON.stringify(body)}`);
  }
  return { referenceId, transactionId: body.data?.transaction?.id || referenceId, provider: 'airtel', status: 'PENDING' };
}

/**
 * Check the status of an Airtel Money transaction.
 * Returns one of: TS (successful) | TF (failed) | TIP (in progress)
 */
async function airtelCheckStatus(transactionId) {
  if (SANDBOX) {
    console.log(`🔍 [Airtel Sandbox] Checking ${transactionId}`);
    return { status: 'TS', reason: null, provider: 'airtel' };
  }

  const token = await airtelGetToken();
  const { status, body } = await jsonFetch(
    `${AIRTEL_BASE_URL}/standard/v1/payments/${transactionId}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Country':   AIRTEL_COUNTRY,
        'X-Currency':  CURRENCY,
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

// ─── Unified gateway API ──────────────────────────────────────────────────────

/**
 * Normalised payment status codes used internally:
 *   PENDING    — awaiting customer action
 *   SUCCESSFUL — confirmed paid
 *   FAILED     — declined / expired
 */
function normaliseStatus(provider, rawStatus) {
  if (provider === 'mtn') {
    if (rawStatus === 'SUCCESSFUL') return 'SUCCESSFUL';
    if (rawStatus === 'FAILED')     return 'FAILED';
    return 'PENDING';
  }
  if (provider === 'airtel') {
    if (rawStatus === 'TS')  return 'SUCCESSFUL';
    if (rawStatus === 'TF')  return 'FAILED';
    return 'PENDING';
  }
  return 'PENDING';
}

/**
 * Initiate a payment via MTN MoMo or Airtel Money.
 *
 * @param {object} opts
 * @param {'mtn'|'airtel'} opts.provider
 * @param {number}  opts.amount
 * @param {string}  opts.msisdn      — customer phone e.g. +250794890144
 * @param {string}  opts.externalId  — your internal booking/payment ID
 * @param {string}  [opts.note]      — description shown to customer
 */
async function initiatePayment({ provider, amount, msisdn, externalId, note }) {
  if (provider === 'airtel') return airtelInitiate({ amount, msisdn, externalId, note });
  return mtnInitiate({ amount, msisdn, externalId, note });
}

/**
 * Check payment status.
 *
 * @param {'mtn'|'airtel'} provider
 * @param {string}         referenceId  — returned from initiatePayment
 */
async function checkPaymentStatus(provider, referenceId) {
  const raw = provider === 'airtel'
    ? await airtelCheckStatus(referenceId)
    : await mtnCheckStatus(referenceId);
  return { ...raw, normalisedStatus: normaliseStatus(provider, raw.status) };
}

module.exports = { initiatePayment, checkPaymentStatus, normaliseStatus };
