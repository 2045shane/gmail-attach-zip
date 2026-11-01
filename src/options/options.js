const $=id=>document.getElementById(id);
chrome.storage.local.get(['gazLicense','gazNaming']).then(data=>{$('license').value=data.gazLicense||'';$('naming').value=['flat','sender','date'].includes(data.gazNaming)?data.gazNaming:'flat';}).catch(()=>{$('notice').textContent='无法读取设置';});
$('save').onclick=async()=>{try{const key=$('license').value.trim();if(!await GmailZip.verifyLicense(key)){$('notice').textContent='解锁码无效，请检查前缀和内容。';return;}await chrome.storage.local.set({gazLicense:key});$('notice').textContent='解锁码已保存。';}catch{$('notice').textContent='保存失败，请重试。';}};
$('clear').onclick=async()=>{try{await chrome.storage.local.remove('gazLicense');$('license').value='';$('notice').textContent='解锁码已清除，恢复当天免费用量。';}catch{$('notice').textContent='清除失败，请重试。';}};
$('naming').onchange=async()=>{try{await chrome.storage.local.set({gazNaming:$('naming').value});$('notice').textContent='命名规则已保存。';}catch{$('notice').textContent='保存失败，请重试。';}};
