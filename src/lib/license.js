(function(root) {
"use strict";

// Public offline checksum, not a secret or secure entitlement system.
async function issueLicense() {
  const bytes = new TextEncoder().encode('gmail-attach-zip:local-export:unlock:v1');
  const digest = new Uint8Array(await globalThis.crypto.subtle.digest('SHA-256', bytes));
  return 'GAZ1.' + Array.from(digest, b => b.toString(16).padStart(2, '0')).join('');
}
async function verifyLicense(value) {
  const token = typeof value === 'string' ? value.trim() : '';
  return /^GAZ1\.[a-f0-9]{64}$/.test(token) && token === await issueLicense();
}

const api = {issueLicense, verifyLicense};
Object.assign(root.GmailZip ||= {}, api);
if (typeof module !== "undefined" && module.exports) module.exports = api;
})(globalThis);
