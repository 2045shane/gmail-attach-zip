(function(root){
'use strict';
const table=Uint32Array.from({length:256},(_,n)=>{for(let k=0;k<8;k++)n=n&1?0xedb88320^(n>>>1):n>>>1;return n>>>0;});
function crc32(bytes){let c=0xffffffff;for(const b of bytes)c=table[(c^b)&255]^(c>>>8);return (c^0xffffffff)>>>0;}
function createZip(entries){
 if(entries.length>65535)throw Error('附件数量超出 ZIP 限制');
 const encoder=new TextEncoder(),locals=[],centrals=[];let offset=0,centralSize=0;
 for(const entry of entries){
 const name=encoder.encode(entry.name),data=entry.data instanceof Uint8Array?entry.data:new Uint8Array(entry.data);
 if(name.length>65535||data.length>0xffffffff)throw Error('附件超出 ZIP 大小限制');
 const crc=crc32(data),local=new Uint8Array(30+name.length),lv=new DataView(local.buffer);
 lv.setUint32(0,0x04034b50,true);lv.setUint16(4,20,true);lv.setUint16(6,0x0800,true);lv.setUint16(12,33,true);lv.setUint32(14,crc,true);lv.setUint32(18,data.length,true);lv.setUint32(22,data.length,true);lv.setUint16(26,name.length,true);local.set(name,30);
 const central=new Uint8Array(46+name.length),cv=new DataView(central.buffer);
 cv.setUint32(0,0x02014b50,true);cv.setUint16(4,20,true);cv.setUint16(6,20,true);cv.setUint16(8,0x0800,true);cv.setUint16(14,33,true);cv.setUint32(16,crc,true);cv.setUint32(20,data.length,true);cv.setUint32(24,data.length,true);cv.setUint16(28,name.length,true);cv.setUint32(42,offset,true);central.set(name,46);
 locals.push(local,data);centrals.push(central);offset+=local.length+data.length;centralSize+=central.length;
 if(offset+centralSize+22>0xffffffff)throw Error('不支持 ZIP64，请分批导出');
 }
 const end=new Uint8Array(22),ev=new DataView(end.buffer);ev.setUint32(0,0x06054b50,true);ev.setUint16(8,entries.length,true);ev.setUint16(10,entries.length,true);ev.setUint32(12,centralSize,true);ev.setUint32(16,offset,true);
 const out=new Uint8Array(offset+centralSize+22);let pos=0;for(const part of [...locals,...centrals,end]){out.set(part,pos);pos+=part.length;}return out;
}
const api={crc32,createZip};Object.assign(root.GmailZip||={},api);if(typeof module!=='undefined')module.exports=api;
})(globalThis);
