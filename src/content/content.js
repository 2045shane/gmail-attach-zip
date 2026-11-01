(()=>{
'use strict';
if(document.getElementById('gaz-panel'))return;
const G=globalThis.GmailZip,host=document.createElement('div');host.id='gaz-panel';
const shadow=host.attachShadow({mode:'closed'});
shadow.innerHTML=`<style>:host{all:initial;position:fixed;right:20px;bottom:20px;z-index:2147483647;font:14px/1.6 "Microsoft YaHei",sans-serif;color:#241c16}section{box-sizing:border-box;background:#fbf6ee;border:1px solid #e4d5c2;border-radius:14px;padding:16px;box-shadow:0 10px 28px #301c1626;width:390px;max-width:90vw}button{font:inherit;cursor:pointer;border:1px solid #d8c7b2;border-radius:8px;padding:7px 12px;background:#efe4d2;color:#241c16;margin:3px}button.primary{background:#9e2f2a;color:white}button:disabled{opacity:.5;cursor:wait}h2{font-size:18px;margin:0}p{margin:8px 0}#list{max-height:280px;overflow:auto}label{display:block;border-top:1px solid #e4d5c2;padding:8px 0;overflow-wrap:anywhere}small{display:block;color:#6a5e52}a{color:#9e2f2a} [hidden]{display:none!important}</style><section><h2>Gmail 附件打包</h2><button id="scan" class="primary">打包附件</button><button id="toggle">收起</button><div id="body"><p>仅收集当前页面已加载、可见且有下载链接的附件。列表页附件 chip 可能没有链接，不能代表全部搜索结果。</p><div id="list"></div><button id="zip" hidden class="primary">确认并导出 ZIP</button><button id="individual" hidden>逐个下载</button><p id="status" role="status" aria-live="polite"></p><p id="cta" hidden><a href="https://www.xiaohongshu.com/" target="_blank" rel="noopener noreferrer">有问题请联系我</a>：小红书私信「珊哥爱读书」</p><button id="options">设置</button></div></section>`;
document.documentElement.append(host);
const $=id=>shadow.getElementById(id);let items=[],busy=false,fallback=[];
function message(text){$('status').textContent=text;}
function download(url,name){const a=document.createElement('a');a.href=url;a.download=name;a.rel='noopener';a.target='_blank';shadow.append(a);a.click();a.remove();}
function saveBlob(blob,name){const url=URL.createObjectURL(blob);download(url,name);setTimeout(()=>URL.revokeObjectURL(url),60000);}
function selected(){return [...$('list').querySelectorAll('input:checked')].map(el=>items[Number(el.value)]);}
function lock(value){busy=value;for(const id of ['scan','zip','individual'])$(id).disabled=value;for(const el of $('list').querySelectorAll('input'))el.disabled=value;}
async function authorize(){const q=await chrome.runtime.sendMessage({type:'quota-consume'});if(q.error)throw Error(q.error);if(!q.recorded){$('cta').hidden=false;throw Error(G.CTA);}return q;}
$('toggle').onclick=()=>{$('body').hidden=!$('body').hidden;$('toggle').textContent=$('body').hidden?'展开':'收起';};
$('options').onclick=()=>chrome.runtime.sendMessage({type:'open-options'});
$('scan').onclick=()=>{if(busy)return;items=G.collectAttachments();fallback=[];$('individual').hidden=true;$('list').replaceChildren();$('body').hidden=false;$('toggle').textContent='收起';for(const [i,item] of items.entries()){const label=document.createElement('label'),input=document.createElement('input'),text=document.createElement('span'),meta=document.createElement('small');input.type='checkbox';input.checked=true;input.value=i;text.textContent=item.filename;meta.textContent=`${item.sender} · ${item.date}`;label.append(input,text,meta);$('list').append(label);}$('zip').hidden=!items.length;message(items.length?`找到 ${items.length} 个附件，请勾选后确认。`:'没有找到可下载附件。请打开会话并展开邮件后重试。');};
$('zip').onclick=async()=>{
 const chosen=selected();if(busy||!chosen.length){message('请至少勾选一个附件。');return;}lock(true);$('cta').hidden=true;fallback=[];
 try{const settings=await chrome.storage.local.get('gazNaming');await authorize();const entries=[],failures=[],used=new Set(['_失败清单.txt']);
 for(const [index,item] of chosen.entries()){
 message(`正在读取 ${index+1}/${chosen.length}：${item.filename}`);
 const name=G.nameAttachment(item,settings.gazNaming,used);
 try{const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),60000);let response;try{response=await fetch(item.url,{credentials:'include',signal:controller.signal});if(!response.ok)throw Error(`HTTP ${response.status}`);if(!G.allowedUrl(response.url||item.url))throw Error('附件重定向到不支持的域名');if(/text\/html/i.test(response.headers.get('content-type')||''))throw Error('返回登录页或 HTML 页面');entries.push({name,data:new Uint8Array(await response.arrayBuffer())});}finally{clearTimeout(timer);}}
 catch(error){failures.push(`${name}：${error.message}`);fallback.push({...item,name});}
 }
 if(failures.length)entries.push({name:'_失败清单.txt',data:new TextEncoder().encode('以下附件未能读取，请尝试逐个下载：\r\n'+failures.join('\r\n'))});
 saveBlob(new Blob([G.createZip(entries)],{type:'application/zip'}),G.zipName());$('individual').hidden=!fallback.length;message(`已生成 ZIP：成功 ${chosen.length-failures.length} 个，失败 ${failures.length} 个。失败项可逐个下载（本次后备不再计次）。`);
 }catch(error){message(error.message);}finally{lock(false);}
};
$('individual').onclick=()=>{if(busy)return;const list=fallback.slice();for(const item of list)download(item.url,item.name);message('已请求逐个下载失败附件；浏览器可能要求允许多文件下载，跨域文件可能在新标签打开。');};
})();
