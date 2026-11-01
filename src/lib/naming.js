(function(root){
'use strict';
const pad=n=>String(n).padStart(2,'0');
function clean(value){return String(value||'').normalize('NFC').replace(/[\/\\:*?"<>|\x00-\x1f\x7f]/g,'_').replace(/[. ]+$/g,'').trim()||'未知';}
function dateKey(value){if(/^\d{4}-\d{2}-\d{2}$/.test(value||''))return value;const d=value instanceof Date?value:new Date(value);return Number.isNaN(d.getTime())?'日期未知':`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;}
function nameAttachment(item,mode='flat',used=new Set()){
 const date=dateKey(item.date),sender=clean(item.sender).slice(0,48),file=clean(item.filename);
 const dot=file.lastIndexOf('.');const ext=dot>0?file.slice(dot).slice(0,24):'';
 const base=`${date}_${sender}_${ext?file.slice(0,dot):file}`;
 const folder=mode==='sender'?sender+'/':mode==='date'?date+'/':'';
 let n=1,path;
 do{const suffix=n===1?'':` (${n})`;path=folder+base.slice(0,180-ext.length-suffix.length)+suffix+ext;n++;}while(used.has(path));
 used.add(path);return path;
}
function zipName(now=new Date()){return `Gmail附件_${dateKey(now).replace(/-/g,'')}-${pad(now.getHours())}${pad(now.getMinutes())}.zip`;}
const api={clean,dateKey,nameAttachment,zipName};Object.assign(root.GmailZip||={},api);if(typeof module!=='undefined')module.exports=api;
})(globalThis);
