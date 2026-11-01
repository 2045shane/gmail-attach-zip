(function(root) {
"use strict";

const STORAGE_KEYS = {quota:'gazQuota', license:'gazLicense'};
const CTA = '今日 3 次免费导出已用完。有问题请联系我：小红书私信「珊哥爱读书」';
function localDateKey(now = new Date()) {
  return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
}
function readQuota(stored, now = new Date(), unlocked = false) {
  const date = localDateKey(now);
  const count = stored?.date === date && Number.isSafeInteger(stored.count) && stored.count >= 0 ? stored.count : 0;
  return {date, count, unlocked, remaining: unlocked ? null : Math.max(0, 3-count), allowed: unlocked || count < 3};
}
function createQuotaStore(storage, now = () => new Date()) {
  let queue = Promise.resolve();
  async function status() {
    const data = await storage.get([STORAGE_KEYS.quota, STORAGE_KEYS.license]);
    return readQuota(data[STORAGE_KEYS.quota], now(), await root.GmailZip.verifyLicense(data[STORAGE_KEYS.license]));
  }
  function consume() {
    const result = queue.then(async () => {
      const current = await status();
      if (!current.allowed) return {...current, recorded:false};
      if (current.unlocked) return {...current, recorded:true};
      const stored = {date:current.date, count:current.count+1};
      await storage.set({[STORAGE_KEYS.quota]:stored});
      return {...readQuota(stored, now()), recorded:true};
    });
    queue = result.catch(() => {});
    return result;
  }
  return {status, consume};
}
function isSupportedUrl(value) {
  try { const u = new URL(value); return u.protocol === 'https:' && u.hostname === 'mail.google.com'; } catch { return false; }
}

const api = {STORAGE_KEYS, CTA, localDateKey, readQuota, createQuotaStore, isSupportedUrl};
Object.assign(root.GmailZip ||= {}, api);
if (typeof module !== "undefined" && module.exports) module.exports = api;
})(globalThis);
