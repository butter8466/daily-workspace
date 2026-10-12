'use strict';
if (!window.Vue) { document.getElementById('load-error').hidden = false; }
else {
  const { createApp, ref, computed, watch } = Vue;
  createApp({ setup() {
    const key = 'equity-research-tw-v1';
    const markets = ['上市', '上櫃', '興櫃', '其他'];
    const statuses = ['觀察中', '研究中', '待回顧'];
    const resources = [
      { tag:'TWSE', title:'臺灣證券交易所', description:'上市個股資訊、交易統計與市場資料。開啟後輸入證券代號查詢。', url:'https://wwwc.twse.com.tw/IIH2/zh/company/stock.html' },
      { tag:'MOPS', title:'公開資訊觀測站', description:'公司財務報表、月營收、重大訊息與股利公告。', url:'https://mops.twse.com.tw/' },
      { tag:'TPEX', title:'證券櫃檯買賣中心', description:'上櫃與興櫃市場資訊、交易統計及相關公告。', url:'https://www.tpex.org.tw/zh-tw/index.html' }
    ];
    const message = ref(''); const saveStatus = ref('資料僅儲存在此瀏覽器。');
    function validUrl(value) {
      try { const url = new URL(value); return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password; }
      catch (_) { return false; }
    }
    function validStocks(value) {
      if (!Array.isArray(value) || value.length > 500) return false;
      const codes = new Set(); const ids = new Set();
      return value.every(s => {
        if (!s || typeof s.id !== 'string' || !s.id || s.id.length > 100 || ids.has(s.id) || typeof s.code !== 'string' || !/^[0-9A-Z]{4,6}$/.test(s.code) || codes.has(s.code) || typeof s.name !== 'string' || !s.name.trim() || s.name.length > 40 || !markets.includes(s.market) || !statuses.includes(s.status) || !['thesis','risks','next'].every(k => typeof s[k] === 'string' && s[k].length <= 12000) || typeof s.updatedAt !== 'string' || Number.isNaN(Date.parse(s.updatedAt)) || !Array.isArray(s.links) || s.links.length > 100) return false;
        const linkIds = new Set();
        if (!s.links.every(l => {
          if (!l || typeof l.id !== 'string' || !l.id || l.id.length > 100 || linkIds.has(l.id) || typeof l.title !== 'string' || !l.title.trim() || l.title.length > 100 || typeof l.url !== 'string' || l.url.length > 2000 || !validUrl(l.url)) return false;
          linkIds.add(l.id); return true;
        })) return false;
        codes.add(s.code); ids.add(s.id); return true;
      });
    }
    let initial = [];
    let readFailed = false;
    try {
      const saved = localStorage.getItem(key);
      if (saved !== null) { const parsed = JSON.parse(saved); if (!validStocks(parsed)) throw Error('invalid'); initial = parsed; }
    } catch (_) { readFailed = true; message.value = '無法讀取研究資料，原始資料未覆寫。請先嘗試在原瀏覽器匯出備份，或匯入有效備份後繼續。'; }
    const stocks = ref(initial); const selectedId = ref(initial[0]?.id || '');
    const selected = computed(() => stocks.value.find(s => s.id === selectedId.value));
    const search = ref(''); const filter = ref('全部');
    const filtered = computed(() => stocks.value.filter(s => (filter.value === '全部' || s.status === filter.value) && (s.code + ' ' + s.name).toLowerCase().includes(search.value.trim().toLowerCase())));
    const researching = computed(() => stocks.value.filter(s => s.status === '研究中').length);
    const linkCount = computed(() => stocks.value.reduce((n, s) => n + s.links.length, 0));
    const draft = ref({ code:'', name:'', market:'上市' });
    const linkDraft = ref({ title:'', url:'' });
    watch(selectedId, () => { linkDraft.value = { title:'', url:'' }; });
    function id() { return window.crypto?.randomUUID ? window.crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2); }
    watch(stocks, value => {
      if (readFailed) { saveStatus.value = '暫停儲存，請先處理讀取錯誤。'; return; }
      try { localStorage.setItem(key, JSON.stringify(value)); saveStatus.value = '已儲存 · ' + new Date().toLocaleTimeString('zh-TW', { hour:'2-digit', minute:'2-digit' }); }
      catch (_) { saveStatus.value = '儲存失敗，請匯出備份以免遺失。'; message.value = '瀏覽器儲存空間不足或已封鎖儲存，請匯出備份。'; }
    }, { deep:true });
    function addStock() {
      if (readFailed) { message.value = '目前暫停新增，請先匯入有效備份處理儲存錯誤。'; return; }
      const code = draft.value.code.trim().toUpperCase(); const name = draft.value.name.trim();
      if (!/^[0-9A-Z]{4,6}$/.test(code) || !name || name.length > 40 || !markets.includes(draft.value.market)) { message.value = '請輸入 4–6 碼英數證券代號、名稱與市場。'; return; }
      if (stocks.value.length >= 500) { message.value = '自選股最多 500 檔。'; return; }
      const existing = stocks.value.find(s => s.code === code);
      if (existing) { selectedId.value = existing.id; message.value = '這個代號已在自選股清單中。'; return; }
      const entry = { id:id(), code, name, market:draft.value.market, status:'觀察中', thesis:'', risks:'', next:'', links:[], updatedAt:new Date().toISOString() };
      stocks.value.push(entry); selectedId.value = entry.id; draft.value = { code:'', name:'', market:'上市' }; search.value = ''; filter.value = '全部'; message.value = '';
    }
    function touch() { if (selected.value) selected.value.updatedAt = new Date().toISOString(); }
    function removeStock() {
      if (!selected.value || !window.confirm('移除 ' + selected.value.code + ' ' + selected.value.name + ' 與這檔股票的筆記和連結？請先匯出備份。')) return;
      stocks.value = stocks.value.filter(s => s.id !== selectedId.value); selectedId.value = stocks.value[0]?.id || ''; message.value = '已移除自選股。';
    }
    function addLink() {
      if (!selected.value) return;
      const title = linkDraft.value.title.trim(); const url = linkDraft.value.url.trim();
      if (!title || title.length > 100 || url.length > 2000 || !validUrl(url)) { message.value = '請輸入標題及有效的 HTTP／HTTPS 網址（不可包含帳密）。'; return; }
      if (selected.value.links.length >= 100) { message.value = '每檔自選股最多 100 筆連結。'; return; }
      if (selected.value.links.some(l => l.url === url)) { message.value = '這個網址已加入。'; return; }
      selected.value.links.push({ id:id(), title, url }); touch(); linkDraft.value = { title:'', url:'' }; message.value = '';
    }
    function removeLink(linkId) { if (selected.value) { selected.value.links = selected.value.links.filter(l => l.id !== linkId); touch(); } }
    function exportData() {
      if (readFailed) { message.value = '原始儲存資料無法讀取，目前無法匯出有效備份。'; return; }
      const blob = new Blob([JSON.stringify({ version:1, exportedAt:new Date().toISOString(), stocks:stocks.value }, null, 2)], { type:'application/json' });
      const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = '台股研究備份-' + new Date().toISOString().slice(0,10) + '.json'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000); message.value = '已下載備份。備份包含你的個人筆記，請妥善保存。';
    }
    async function importData(event) {
      const file = event.target.files?.[0]; if (!file) return;
      try {
        if (file.size > 10000000) throw Error('too large');
        const data = JSON.parse(await file.text());
        if (!data || data.version !== 1 || !validStocks(data.stocks)) throw Error('invalid');
        const existingCodes = new Set(stocks.value.map(s => s.code));
        const additions = data.stocks.filter(s => !existingCodes.has(s.code)).map(s => ({ ...s, id:id(), links:s.links.map(l => ({...l, id:id()})) }));
        if (stocks.value.length + additions.length > 500) throw Error('too many');
        const merged = [...stocks.value, ...additions];
        // 驗證與寫入成功後才更新画面，不覆寫既有同代號筆記。
        localStorage.setItem(key, JSON.stringify(merged)); readFailed = false; stocks.value = merged; selectedId.value = selectedId.value || merged[0]?.id || '';
        message.value = '已匯入 ' + additions.length + ' 檔；同代號的現有資料保留不覆寫。';
      } catch (_) { message.value = '匯入失敗：請使用本工具匯出的有效 JSON 備份（最大 10 MB）。現有資料未變更。'; }
      finally { event.target.value = ''; }
    }
    const today = new Intl.DateTimeFormat('zh-TW', { month:'long', day:'numeric', weekday:'long' }).format(new Date());
    const hostname = url => { try { return new URL(url).hostname; } catch (_) { return ''; } };
    const formatDate = value => new Date(value).toLocaleString('zh-TW', { month:'numeric', day:'numeric', hour:'2-digit', minute:'2-digit' });
    return { markets, statuses, resources, message, saveStatus, stocks, selectedId, selected, search, filter, filtered, researching, linkCount, draft, linkDraft, addStock, touch, removeStock, addLink, removeLink, exportData, importData, today, hostname, formatDate };
  }}).mount('#app');
}
