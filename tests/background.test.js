const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
test('后台拒绝站外计次、验证发送者并处理并行请求',async()=>{
 let handler,data={};const context=vm.createContext({URL,TextEncoder,crypto:globalThis.crypto,chrome:{runtime:{id:'local-test',onMessage:{addListener(fn){handler=fn;}},openOptionsPage(){}},storage:{local:{get:async()=>({...data}),set:async value=>Object.assign(data,value)}}}});
 context.importScripts=(...paths)=>{for(const path of paths)vm.runInContext(fs.readFileSync('src/background/'+path,'utf8'),context);};
 vm.runInContext(fs.readFileSync('src/background/service-worker.js','utf8'),context);
 const send=(url,type='quota-consume')=>new Promise(resolve=>handler({type},{id:'local-test',url},resolve));
 assert.equal((await send('https://example.com/')).error,'不支持的页面');
 const status=await send('chrome-extension://local-test/popup.html','quota-status');assert.equal(status.remaining,3);
 const results=await Promise.all(Array.from({length:8},()=>send('https://mail.google.com/mail/u/0/')));
 assert.equal(results.filter(x=>x.recorded).length,3);assert.equal(data.gazQuota.count,3);
 let replied=false;handler({type:'quota-consume'},{id:'other',url:'https://mail.google.com/'},()=>{replied=true;});assert.equal(replied,false);
});
test('STORE 空包与多条目目录偏移、每条内容 CRC',()=>{
 const Z=require('../src/lib/zip');const empty=Buffer.from(Z.createZip([]));assert.equal(empty.length,22);assert.equal(empty.readUInt32LE(0),0x06054b50);
 const source=[{name:'甲/数据.csv',data:Uint8Array.from([0,1,255,42])},{name:'_失败清单.txt',data:new TextEncoder().encode('附件读取失败')}];const b=Buffer.from(Z.createZip(source));let cd=b.readUInt32LE(b.length-6);
 for(const entry of source){assert.equal(b.readUInt32LE(cd),0x02014b50);const local=b.readUInt32LE(cd+42);const len=b.readUInt16LE(local+26),size=b.readUInt32LE(local+18);const bytes=b.subarray(local+30+len,local+30+len+size);assert.deepEqual(bytes,Buffer.from(entry.data));assert.equal(b.readUInt32LE(cd+16),Z.crc32(bytes));assert.equal(b.subarray(cd+46,cd+46+b.readUInt16LE(cd+28)).toString(),entry.name);cd+=46+b.readUInt16LE(cd+28);}
 assert.equal(cd,b.length-22);
});
