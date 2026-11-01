async function renderStatus(){
 const el=document.getElementById('status');
 try{const q=await chrome.runtime.sendMessage({type:'quota-status'});if(q.error)throw Error(q.error);el.textContent=q.unlocked?'已解锁 · 不限导出次数':`免费版 · 今日剩余 ${q.remaining} / 3 次`;document.getElementById('cta').hidden=q.unlocked||q.remaining>0;}catch(e){el.textContent=e.message;}
}
chrome.storage.onChanged.addListener(renderStatus);
renderStatus();
