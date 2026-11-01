importScripts('../lib/license.js', '../lib/quota.js');
const quota = GmailZip.createQuotaStore(chrome.storage.local);
chrome.runtime.onMessage.addListener((message, sender, respond) => {
  if (sender.id !== chrome.runtime.id) return;
  if (message.type === 'open-options') { chrome.runtime.openOptionsPage(); return; }
  if (!['quota-status', 'quota-consume'].includes(message.type)) return;
  if (message.type === 'quota-consume' && !GmailZip.isSupportedUrl(sender.url)) {
    respond({error:'不支持的页面'}); return;
  }
  (message.type === 'quota-consume' ? quota.consume() : quota.status())
    .then(respond).catch(() => respond({error:'无法读取或保存本地次数，请重试。'}));
  return true;
});
