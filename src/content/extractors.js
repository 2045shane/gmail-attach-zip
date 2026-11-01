(function(root){
'use strict';
function visible(el){if(!el.getClientRects().length)return false;for(let p=el;p;p=p.parentElement){const s=getComputedStyle(p);if(s.display==='none'||s.visibility==='hidden'||p.getAttribute('aria-hidden')==='true')return false;}return true;}
function collectAttachments(){
 const found=[],seen=new Set();
 for(const el of document.querySelectorAll('[download_url],a[href*="view=att"],a[href*="disp=safe"],a[href*="attid="]')){
 if(!visible(el))continue;
 const box=el.closest('.aQH,.aZo,.aQy')||el;
 const item=root.GmailZip.parseAttachment({href:el.getAttribute('href'),download_url:el.getAttribute('download_url'),filename:el.getAttribute('download')||box.querySelector('.aV3')?.textContent?.trim()||el.getAttribute('data-filename')||el.getAttribute('title')},location.href);
 if(!item||seen.has(item.url))continue;seen.add(item.url);
 const mail=el.closest('.adn,[data-message-id],tr.zA,[role="row"]')||box;
 const sender=mail.querySelector('[email]')||mail.querySelector('.yW [name],.gD');
 const date=mail.querySelector('[data-time],.g3,.xW [title]');
 const stamp=date?.getAttribute('data-time');const raw=stamp?new Date(Number(stamp)):date?.getAttribute('title')||date?.textContent?.trim();
 const parsed=raw instanceof Date?raw:new Date(raw||'');
 found.push({...item,sender:sender?.getAttribute('name')||sender?.getAttribute('email')||sender?.textContent?.trim()||'发件人未知',date:Number.isNaN(parsed.getTime())?'日期未知':root.GmailZip.dateKey(parsed)});
 }
 return found;
}
Object.assign(root.GmailZip||={},{collectAttachments});
})(globalThis);
