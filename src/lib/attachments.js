(function(root){
'use strict';
function allowedUrl(value,base='https://mail.google.com/'){
 try{const u=new URL(value,base);return u.protocol==='https:'&&['mail.google.com','mail-attachment.googleusercontent.com'].includes(u.hostname)&&!u.username&&!u.password?u:null;}catch{return null;}
}
function parseAttachment(input,base){
 let href=input.href,filename=input.filename;
 if(input.download_url){const m=/^[^:]+:([^:]*):(https:\/\/.*)$/.exec(input.download_url);if(!m)return null;filename=m[1]||filename;href=m[2];}
 const u=allowedUrl(href,base);if(!u)return null;
 if(!input.download_url&&!['view','disp','attid'].some(k=>u.searchParams.has(k)))return null;
 if(!input.download_url&&u.searchParams.get('view')!=='att'&&u.searchParams.get('disp')!=='safe'&&!u.searchParams.has('attid'))return null;
 return {filename:filename||u.searchParams.get('filename')||'未命名附件',url:u.href};
}
const api={parseAttachment,allowedUrl};Object.assign(root.GmailZip||={},api);if(typeof module!=='undefined')module.exports=api;
})(globalThis);
