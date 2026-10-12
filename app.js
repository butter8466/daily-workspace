'use strict';
if (!window.Vue) {
  document.getElementById('load-error').hidden = false;
} else {
  const { createApp, ref, computed, watch, onMounted } = Vue;
  createApp({
    setup() {
      const staticMode = window.DAILY_CONFIG?.staticMode === true;
      const storageKey = 'daily-workspace-tasks-v1';
      const storageMessage = ref('任務會自動儲存在此瀏覽器。');
      let initialTasks = [
        { id: 'welcome-1', text: '規劃今天最重要的三件事', done: false },
        { id: 'welcome-2', text: '留 20 分鐘閱讀與學習', done: false },
        { id: 'welcome-3', text: '開始使用我的工作空間', done: true }
      ];
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved !== null) {
          const parsed = JSON.parse(saved);
          if (!Array.isArray(parsed) || !parsed.every(t => t && typeof t.id === 'string' && typeof t.text === 'string' && typeof t.done === 'boolean') || new Set(parsed.map(t => t.id)).size !== parsed.length) throw new Error('Invalid data');
          initialTasks = parsed;
        }
      } catch (_) { storageMessage.value = '無法讀取已儲存的任務，目前顯示預設內容。'; }
      const tasks = ref(initialTasks);
      const newTask = ref('');
      const filter = ref('all');
      const filters = [{ value: 'all', label: '全部' }, { value: 'pending', label: '待完成' }, { value: 'done', label: '已完成' }];
      const completed = computed(() => tasks.value.filter(t => t.done).length);
      const progress = computed(() => tasks.value.length ? Math.round(completed.value / tasks.value.length * 100) : 0);
      const visibleTasks = computed(() => tasks.value.filter(t => filter.value === 'all' || (filter.value === 'done' ? t.done : !t.done)));
      watch(tasks, value => {
        try { localStorage.setItem(storageKey, JSON.stringify(value)); storageMessage.value = '任務已儲存在此瀏覽器。'; }
        catch (_) { storageMessage.value = '瀏覽器無法儲存任務，重新整理後可能遺失。'; }
      }, { deep: true });
      function addTask() {
        const text = newTask.value.trim();
        if (!text) return;
        tasks.value.push({ id: window.crypto && window.crypto.randomUUID ? window.crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2), text, done: false });
        newTask.value = ''; filter.value = 'all';
      }
      function deleteTask(id) { tasks.value = tasks.value.filter(t => t.id !== id); }
      const apiConnected = ref(false);
      const apiLoading = ref(false);
      const apiMessage = ref('等待檢查連線');
      const serverTime = ref('');
      async function checkApi() {
        if (staticMode) {
          apiMessage.value = '自動儲存在此瀏覽器';
          return;
        }
        if (apiLoading.value) return;
        apiLoading.value = true; apiMessage.value = '正在連線…'; apiConnected.value = false; serverTime.value = '';
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        try {
          const response = await fetch('api/status', { signal: controller.signal, cache: 'no-store' });
          if (!response.ok || !(response.headers.get('content-type') || '').includes('application/json')) throw new Error('API unavailable');
          const data = await response.json();
          if (typeof data.message !== 'string' || typeof data.serverTime !== 'string' || Number.isNaN(Date.parse(data.serverTime))) throw new Error('Invalid response');
          apiMessage.value = data.message; apiConnected.value = true;
          serverTime.value = new Date(data.serverTime).toLocaleString('zh-TW');
        } catch (_) { apiMessage.value = '後端未連線；請確認 ASP.NET Core 服務已啟動。'; }
        finally { clearTimeout(timeout); apiLoading.value = false; }
      }
      onMounted(checkApi);
      const today = new Intl.DateTimeFormat('zh-TW', { month: 'long', day: 'numeric', weekday: 'long' }).format(new Date());
      return { staticMode, tasks, newTask, filter, filters, completed, progress, visibleTasks, addTask, deleteTask, storageMessage, apiConnected, apiLoading, apiMessage, serverTime, checkApi, today };
    }
  }).mount('#app');
}
