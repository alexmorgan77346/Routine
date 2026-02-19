// ============================================================
//  app.js — Routine App Logic
//  Includes: Reminders, Ringtones, Notifications, LocalStorage
// ============================================================

// ── DOM refs ─────────────────────────────────────────────────
const tabs        = document.querySelectorAll('.tab');
const tabContents = document.querySelectorAll('.tab-content');

const todayLabel  = document.getElementById('today-label');
const pctNumber   = document.getElementById('pct-number');
const ringFill    = document.getElementById('ring-fill');
const statDone    = document.getElementById('stat-done');
const statTotal   = document.getElementById('stat-total');
const quoteText   = document.getElementById('quote-text');
const quoteTag    = document.getElementById('quote-tag');
const btnEndDay   = document.getElementById('btn-end-day');

const dailyList    = document.getElementById('daily-list');
const dailyEmpty   = document.getElementById('daily-empty');
const btnAddDaily  = document.getElementById('btn-add-daily');
const btnLoadFixed = document.getElementById('btn-load-fixed');

const fixedList   = document.getElementById('fixed-list');
const fixedEmpty  = document.getElementById('fixed-empty');
const btnAddFixed = document.getElementById('btn-add-fixed');

const historyList  = document.getElementById('history-list');
const historyEmpty = document.getElementById('history-empty');

// Modal
const modalOverlay   = document.getElementById('modal-overlay');
const modalTitle     = document.getElementById('modal-title');
const modalInput     = document.getElementById('modal-input');
const modalCancel    = document.getElementById('modal-cancel');
const modalSave      = document.getElementById('modal-save');
const reminderToggle = document.getElementById('reminder-toggle');
const reminderFields = document.getElementById('reminder-fields');
const reminderTime   = document.getElementById('reminder-time');
const ringtoneGrid   = document.getElementById('ringtone-grid');
const btnPreviewTone = document.getElementById('btn-preview-tone');

// ── State ─────────────────────────────────────────────────────
let dailyTasks     = [];
let fixedTasks     = [];
let modalMode      = null;
let selectedTone   = 'gentle';
let reminderTimers = [];

const RING_CIRC = 2 * Math.PI * 58;

// ── Init ─────────────────────────────────────────────────────
function init() {
  todayLabel.textContent = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric'
  });
  requestNotificationPermission();
  dailyTasks = getDailyTasks();
  fixedTasks = getFixedTasks();
  renderDailyList();
  renderFixedList();
  updateDashboard();
  scheduleAllReminders();
}

init();

// ── Notification Permission ───────────────────────────────────
function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

// ── Tabs ─────────────────────────────────────────────────────
tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    tabContents.forEach(c => c.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
    if (tab.dataset.tab === 'history') renderHistory();
  });
});

// ── Dashboard ────────────────────────────────────────────────
function updateDashboard() {
  const total = dailyTasks.length;
  const done  = dailyTasks.filter(t => t.done).length;
  const pct   = total ? Math.round((done / total) * 100) : 0;

  pctNumber.textContent = pct;
  statDone.textContent  = done;
  statTotal.textContent = total;

  const offset = RING_CIRC - (pct / 100) * RING_CIRC;
  ringFill.style.strokeDashoffset = offset;

  if (total > 0) {
    const q = getQuote(pct);
    quoteText.textContent = q.text;
    quoteTag.textContent  = q.tag;
  } else {
    quoteText.textContent = 'Add tasks to start tracking your day.';
    quoteTag.textContent  = '—';
  }
}

btnEndDay.addEventListener('click', () => {
  if (!dailyTasks.length) { alert('No tasks to save.'); return; }
  const pct = calcPct(dailyTasks);
  saveHistoryEntry(pct);
  alert('Day saved! ' + pct + '% completion recorded.');
  renderHistory();
});

// ── Daily Tasks ──────────────────────────────────────────────
function renderDailyList() {
  dailyList.innerHTML = '';
  dailyEmpty.style.display = dailyTasks.length ? 'none' : 'block';
  dailyTasks.forEach(task => dailyList.appendChild(makeTaskEl(task, 'daily')));
}

btnAddDaily.addEventListener('click', () => openModal('daily', null));

btnLoadFixed.addEventListener('click', () => {
  const fixed = getFixedTasks();
  if (!fixed.length) { alert('No fixed tasks yet. Add some in the Fixed tab.'); return; }
  const existingNames = dailyTasks.map(t => t.name.toLowerCase());
  const toAdd = fixed
    .filter(f => !existingNames.includes(f.name.toLowerCase()))
    .map(f => ({ id: generateId(), name: f.name, done: false, reminder: f.reminder || null }));
  if (!toAdd.length) { alert("All fixed tasks are already in today's list."); return; }
  dailyTasks.push(...toAdd);
  saveDailyTasks(dailyTasks);
  renderDailyList();
  updateDashboard();
  scheduleAllReminders();
});

// ── Fixed Tasks ───────────────────────────────────────────────
function renderFixedList() {
  fixedList.innerHTML = '';
  fixedEmpty.style.display = fixedTasks.length ? 'none' : 'block';
  fixedTasks.forEach(task => fixedList.appendChild(makeTaskEl(task, 'fixed')));
}

btnAddFixed.addEventListener('click', () => openModal('fixed', null));

// ── Task Element ──────────────────────────────────────────────
function makeTaskEl(task, type) {
  const li = document.createElement('li');
  li.className = 'task-item' + (task.done ? ' done' : '');
  li.dataset.id = task.id;

  const reminderBadge = task.reminder
    ? '<span class="task-reminder">' +
        '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style=\"vertical-align:middle\"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>' +
        ' ' + task.reminder.time +
      '</span>'
    : '';

  li.innerHTML =
    (type === 'daily' ? '<input type="checkbox" class="task-check" ' + (task.done ? 'checked' : '') + ' />' : '') +
    '<span class="task-label">' + escHtml(task.name) + '</span>' +
    reminderBadge +
    '<div class="task-actions"><button class="task-btn edit">Edit</button><button class="task-btn del">Delete</button></div>';

  if (type === 'daily') {
    li.querySelector('.task-check').addEventListener('change', function(e) {
      task.done = e.target.checked;
      li.classList.toggle('done', task.done);
      saveDailyTasks(dailyTasks);
      updateDashboard();
    });
  }

  li.querySelector('.edit').addEventListener('click', () => openModal(type, task.id));
  li.querySelector('.del').addEventListener('click', () => {
    if (!confirm('Delete "' + task.name + '"?')) return;
    if (type === 'daily') {
      dailyTasks = dailyTasks.filter(t => t.id !== task.id);
      saveDailyTasks(dailyTasks);
      renderDailyList();
      updateDashboard();
    } else {
      fixedTasks = fixedTasks.filter(t => t.id !== task.id);
      saveFixedTasks(fixedTasks);
      renderFixedList();
    }
    scheduleAllReminders();
  });

  return li;
}

// ── History ──────────────────────────────────────────────────
function renderHistory() {
  const history = getHistory();
  historyList.innerHTML = '';
  historyEmpty.style.display = history.length ? 'none' : 'block';
  history.forEach(function(item) {
    const li = document.createElement('li');
    li.className = 'history-item';
    li.innerHTML =
      '<span class="history-date">' + formatDate(item.date) + '</span>' +
      '<div class="history-bar-wrap"><div class="history-bar" style="width:' + item.pct + '%"></div></div>' +
      '<span class="history-pct">' + item.pct + '%</span>';
    historyList.appendChild(li);
  });
}

// ── Modal ─────────────────────────────────────────────────────
function openModal(type, editId) {
  modalMode = { type, editId };
  modalTitle.textContent = editId ? 'Edit Task' : 'Add Task';

  // Reset
  reminderToggle.checked = false;
  reminderFields.classList.add('hidden');
  reminderTime.value = '';
  setActiveTone('gentle');

  if (editId) {
    const list = type === 'daily' ? dailyTasks : fixedTasks;
    const task = list.find(t => t.id === editId);
    if (task) {
      modalInput.value = task.name;
      if (task.reminder) {
        reminderToggle.checked = true;
        reminderFields.classList.remove('hidden');
        reminderTime.value = task.reminder.time;
        setActiveTone(task.reminder.tone || 'gentle');
      }
    }
  } else {
    modalInput.value = '';
    // Pre-fill with current time + 1hr (handle midnight overflow)
    const d = new Date();
    const nextHour = (d.getHours() + 1) % 24;
    reminderTime.value = String(nextHour).padStart(2,'0') + ':00';
  }

  modalOverlay.classList.remove('hidden');
  setTimeout(() => modalInput.focus(), 60);
}

function closeModal() {
  modalOverlay.classList.add('hidden');
  modalMode = null;
}

// Reminder toggle
reminderToggle.addEventListener('change', () => {
  reminderFields.classList.toggle('hidden', !reminderToggle.checked);
});

// Ringtone selection
ringtoneGrid.addEventListener('click', (e) => {
  const btn = e.target.closest('.ringtone-btn');
  if (btn) setActiveTone(btn.dataset.tone);
});

function setActiveTone(toneKey) {
  selectedTone = toneKey;
  document.querySelectorAll('.ringtone-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.tone === toneKey);
  });
}

// Preview tone
btnPreviewTone.addEventListener('click', () => {
  playRingtone(selectedTone);
});

modalCancel.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) closeModal(); });
modalInput.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

modalSave.addEventListener('click', () => {
  const name = modalInput.value.trim();
  if (!name) { modalInput.focus(); return; }

  let reminder = null;
  if (reminderToggle.checked && reminderTime.value) {
    reminder = { time: reminderTime.value, tone: selectedTone };
  }

  const { type, editId } = modalMode;

  if (type === 'daily') {
    if (editId) {
      const task = dailyTasks.find(t => t.id === editId);
      if (task) { task.name = name; task.reminder = reminder; }
    } else {
      dailyTasks.push({ id: generateId(), name, done: false, reminder });
    }
    saveDailyTasks(dailyTasks);
    renderDailyList();
    updateDashboard();
  } else {
    if (editId) {
      const task = fixedTasks.find(t => t.id === editId);
      if (task) { task.name = name; task.reminder = reminder; }
    } else {
      fixedTasks.push({ id: generateId(), name, reminder });
    }
    saveFixedTasks(fixedTasks);
    renderFixedList();
  }

  closeModal();
  scheduleAllReminders();
});

// ── Reminder Scheduler (OneSignal) ──────────────────────────
// Schedules push notifications via OneSignal so reminders fire
// even when the app is closed or the phone is locked.

function scheduleAllReminders() {
  // Clear old setTimeout fallbacks
  reminderTimers.forEach(id => clearTimeout(id));
  reminderTimers = [];

  dailyTasks.forEach(task => {
    if (!task.reminder || task.done) return;
    scheduleOneReminder(task);
  });
}

function scheduleOneReminder(task) {
  const parts = task.reminder.time.split(':');
  const fireAt = new Date();
  fireAt.setHours(parseInt(parts[0]), parseInt(parts[1]), 0, 0);

  const now = new Date();
  const msUntil = fireAt - now;

  // Already passed today — skip
  if (msUntil <= 0) return;

  // ── OneSignal Push (works when app is closed / phone locked) ──
  if (window.OneSignalDeferred) {
    OneSignalDeferred.push(async function(OneSignal) {
      try {
        const isSubscribed = await OneSignal.User.PushSubscription.optedIn;
        if (!isSubscribed) {
          await OneSignal.Notifications.requestPermission();
        }

        // Schedule the push notification at exact fire time
        await OneSignal.Notifications.create({
          contents: { en: task.name },
          headings: { en: '⏰ Routine Reminder' },
          send_after: fireAt.toISOString(),
          // Store tone in data so SW can use it
          data: { tone: task.reminder.tone || 'gentle', taskId: task.id },
        });

        console.log('Reminder scheduled via OneSignal:', task.name, 'at', fireAt);
      } catch (err) {
        console.warn('OneSignal schedule failed, using setTimeout fallback:', err);
        fallbackReminder(task, msUntil);
      }
    });
  } else {
    // Fallback if OneSignal not loaded
    fallbackReminder(task, msUntil);
  }
}

function fallbackReminder(task, msUntil) {
  // setTimeout only works while app is open
  const id = setTimeout(() => triggerReminderLocally(task), msUntil);
  reminderTimers.push(id);
}

function triggerReminderLocally(task) {
  // Play sound (app must be open for this)
  playRingtone(task.reminder.tone || 'gentle');

  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('⏰ Routine Reminder', {
      body: task.name,
    });
  } else {
    setTimeout(() => alert('Reminder: ' + task.name), 300);
  }
}

// Re-schedule when user returns to app tab
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) scheduleAllReminders();
});

// ── Utils ─────────────────────────────────────────────────────
function escHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
