// в”Ђв”Ђ DATA в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
const SECTIONS = [
  { key: "listening",  label: "Tinglash",  icon: "\u{1F3A7}", color: "#2DD4BF" },
  { key: "reading",    label: "O'qish",    icon: "\u{1F4D6}", color: "#60A5FA" },
];

const TIPS = {
  listening: [
    "BBC podkastlari bilan mashq qiling - tez nutqni kuzatishga e'tibor bering.",
    "Har kuni 1 ta tinglash mock testini bajaring. Har bir noto'g'ri javobni ko'rib chiqing.",
    "TED ma'ruzalarini tinglang va to'xtatmasdan asosiy fikrlarni yozing.",
  ],
  reading: [
    "Avval sarlavhalarni ko'zdan kechiring, so'ng savollardagi kalit so'zlarni qidiring.",
    "Ko'p variantli va moslashtirish mashqlarini bajaring - ko'pchilik talabalar shu yerda ball yo'qotadi.",
    "Vaqtingizni o'lchang: har bir matn uchun maksimal 20 daqiqa.",
  ],
};

// History card gradient palette - two harmonious hues, teal to violet
const CARD_COLORS = [
  { bg: "rgba(45,212,191,.07)",  border: "rgba(45,212,191,.18)"  },  // teal
  { bg: "rgba(55,200,180,.07)",  border: "rgba(55,200,180,.16)"  },
  { bg: "rgba(80,180,200,.07)",  border: "rgba(80,180,200,.15)"  },
  { bg: "rgba(100,165,210,.07)", border: "rgba(100,165,210,.15)" },
  { bg: "rgba(130,148,220,.07)", border: "rgba(130,148,220,.15)" },
  { bg: "rgba(155,135,230,.07)", border: "rgba(155,135,230,.15)" },
  { bg: "rgba(167,139,250,.07)", border: "rgba(167,139,250,.18)" },  // violet
];

const ENTRIES_KEY = "nylc_ielts_rl_entries";
const ENTRIES_VERSION = 1;
const SETTINGS_KEY = "nylc_ielts_rl_settings";
const DEFAULT_SETTINGS = {
  theme: "system",
  insights: {
    showKpis: true,
    showComparison: true,
    showTargets: true,
    showProgress: true,
    showRadar: true,
    showTips: true,
    showAiCoach: false,
  }
};

function isValidDateString(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function genEntryId() {
  return "e_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 9);
}

function clampBand(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return null;
  return Math.min(40, Math.max(0, Math.round(num)));
}

function normalizeEntry(raw) {
  if (!raw || !isValidDateString(raw.date)) return null;

  const entry = {
    id: (raw.id && typeof raw.id === "string") ? raw.id : genEntryId(),
    date: raw.date,
    manualOverall: !!raw.manualOverall,
    mood: String(raw.mood || "").trim(),
  };

  let sum = 0;
  for (const section of SECTIONS) {
    const safe = clampBand(raw[section.key]);
    if (safe === null) return null;
    entry[section.key] = safe;
    sum += safe;
  }

  const rawOverall = clampBand(raw.umumiy);
  entry.umumiy = rawOverall === null ? Math.round(sum / SECTIONS.length) : rawOverall;
  return entry;
}

function loadEntries() {
  try {
    const raw = localStorage.getItem(ENTRIES_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    const list = Array.isArray(parsed) ? parsed : parsed?.entries;
    if (!Array.isArray(list)) return [];

    const dedup = new Map();
    for (const item of list) {
      const normalized = normalizeEntry(item);
      if (!normalized) continue;
      dedup.set(normalized.id, normalized);
    }

    const result = Array.from(dedup.values()).sort((a, b) => a.date.localeCompare(b.date));
    return result;
  } catch {
    return [];
  }
}

function saveEntries() {
  try {
    const payload = {
      version: ENTRIES_VERSION,
      entries: [...entries].sort((a, b) => a.date.localeCompare(b.date)),
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(ENTRIES_KEY, JSON.stringify(payload));
  } catch {}
}

let entries = loadEntries();
let settings = loadSettings();

const TARGETS_KEY = "nylc_ielts_rl_targets";
let umumiyEnabled = false;
let moodOpen = false;
let currentPeriod = "all";
let historyFilter = "all";
let lineChart = null;
let radarChart = null;
let targets = loadMaqsadlar();
let editingEntryId = null;

// в”Ђв”Ђ INIT в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
document.getElementById("entryDate").value = new Date().toISOString().split("T")[0];
buildSliders();
renderMaqsadlar();
renderHistory();
renderCharts();
renderMaslahatlar();
updateAiMaslahatlarVisibility();
window.addEventListener("themechange", () => {
  renderCharts();
  renderMaslahatlar();
  updateAiMaslahatlarVisibility();
});

// в”Ђв”Ђ SLIDERS в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
function buildSliders() {
  const wrap = document.getElementById("sliders");
  wrap.innerHTML = SECTIONS.map(s => sliderHTML(s.key, s.label, s.icon, s.color, 18)).join("");

  const owrap = document.getElementById("overallSliderWrap");
  owrap.innerHTML = sliderHTML("umumiy", "Overall", "\u2605", "#F5C842", 18);

  document.querySelectorAll(".ielts-slider").forEach(el => {
    updateSliderFill(el);
    el.addEventListener("input", function() {
      updateSliderFill(this);
      const key = this.dataset.key;
      const val = parseFloat(this.value);
      document.getElementById("score-" + key).textContent = val.toFixed(0);
      document.getElementById("score-" + key).style.color = scoreColor(val);
    });
  });
}

function sliderHTML(key, label, icon, color, def) {
  return `
  <div class="section-row">
    <div class="section-head">
      <div class="section-name">
        <div class="section-icon" style="background:${color}18">${icon}</div>
        ${label}
      </div>
      <div class="section-score" id="score-${key}" style="color:${scoreColor(def)}">${def.toFixed(0)}</div>
    </div>
    <div class="slider-wrap">
      <input type="range" class="ielts-slider" id="slider-${key}" data-key="${key}"
             min="0" max="40" step="1" value="${def}" style="--c:${color}"/>
    </div>
  </div>`;
}

function updateSliderFill(el) {
  const pct = (el.value / 40) * 100;
  const color = el.style.getPropertyValue("--c") || "#F5C842";
  el.style.background = `linear-gradient(to right, ${color} ${pct}%, var(--surface2) ${pct}%)`;
}

function scoreColor(v) {
  if (v >= 30) return "#4ADE80";
  if (v >= 25) return "#2DD4BF";
  if (v >= 18) return "#F5C842";
  return "#FB7185";
}

function isLightTheme() {
  return document.documentElement.getAttribute("data-theme") === "light";
}

function getChartTheme() {
  if (isLightTheme()) {
    return {
      umumiyLine: "#2f3b52",
      umumiyBg: "rgba(47,59,82,.08)",
      legend: "rgba(47,59,82,.74)",
      tick: "rgba(47,59,82,.68)",
      tickSoft: "rgba(47,59,82,.58)",
      tickSofter: "rgba(47,59,82,.5)",
      grid: "rgba(47,59,82,.12)",
      angle: "rgba(47,59,82,.14)",
      tooltipBg: "#ffffff",
      tooltipBorder: "rgba(47,59,82,.2)",
      tooltipTitle: "#1f2937",
      tooltipBody: "rgba(31,41,55,.8)",
      radarOverallLabel: "#2f3b52",
      radarArea: "rgba(215,169,63,.12)",
      radarBorder: "rgba(177,132,41,.75)",
    };
  }

  return {
    umumiyLine: "#ffffff",
    umumiyBg: "rgba(255,255,255,.05)",
    legend: "rgba(240,244,255,.65)",
    tick: "rgba(240,244,255,.4)",
    tickSoft: "rgba(240,244,255,.35)",
    tickSofter: "rgba(240,244,255,.3)",
    grid: "rgba(255,255,255,.06)",
    angle: "rgba(255,255,255,.08)",
    tooltipBg: "#1a2235",
    tooltipBorder: "rgba(255,255,255,.12)",
    tooltipTitle: "#F0F4FF",
    tooltipBody: "rgba(240,244,255,.75)",
    radarOverallLabel: "#ffffff",
    radarArea: "rgba(245,200,66,.1)",
    radarBorder: "rgba(245,200,66,.7)",
  };
}

// в”Ђв”Ђ OVERALL TOGGLE в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
function toggleOverall() {
  setOverallMode(!umumiyEnabled);
}

// в”Ђв”Ђ MOOD TOGGLE в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
function toggleMood() {
  setMoodOpen(!moodOpen);
}

// в”Ђв”Ђ ADD ENTRY в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
function addEntry() {
  const date = document.getElementById("entryDate").value;
  if (!date) { showToast("Avval sana tanlang"); return; }

  const mood = document.getElementById("moodNote").value.trim();
  const entry = { date, manualOverall: umumiyEnabled, mood };
  let sum = 0;
  SECTIONS.forEach(s => {
    const v = parseFloat(document.getElementById("slider-" + s.key).value);
    entry[s.key] = v;
    sum += v;
  });

  const calculatedOverall = Math.round(sum / SECTIONS.length);
  if (umumiyEnabled) {
    entry.umumiy = parseFloat(document.getElementById("slider-umumiy").value);
    if (Math.abs(entry.umumiy - calculatedOverall) > 0.001) {
      const ok = window.confirm(
        `Manual umumiy (${entry.umumiy.toFixed(0)}) hisoblanganidan farq qiladi (${calculatedOverall.toFixed(0)}). Qo'lda kiritilgan qiymatni saqlamoqchi?`
      );
      if (!ok) {
        showToast("Saqlash bekor qilindi");
        return;
      }
    }
  } else {
    entry.umumiy = calculatedOverall;
  }

  if (editingEntryId) {
    entry.id = editingEntryId;
    entries = entries.filter(e => e.id !== editingEntryId);
    entries.push(entry);
  } else {
    entry.id = genEntryId();
    entries.push(entry);
  }
  entries.sort((a,b) => a.date.localeCompare(b.date));
  saveEntries();

  const wasTahrirlashing = Boolean(editingEntryId);
  resetEntryForm();
  exitTahrirlashMode();

  renderHistory();
  renderCharts();
  renderMaslahatlar();
  updateAiMaslahatlarVisibility();
  showToast(wasTahrirlashing ? "Yozuv yangilandi \u2713" : "Yozuv saqlandi \u2713");
  switchTab("history");
}

// в”Ђв”Ђ HISTORY в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
function renderHistory() {
  const el = document.getElementById("historyList");
  const filtered = getFilteredHistoryEntries();
  if (!filtered.length) {
    el.innerHTML = `<div class="empty"><div class="empty-icon">\u{1F4CB}</div><p>Bu filtr uchun hali yozuvlar yo'q.<br/>Boshqa filtr tanlang yoki natija qo'shing.</p></div>`;
    return;
  }
  const sorted = [...filtered].reverse();
  const total = sorted.length;
  // sorted is newest first, so "prev" = next in sorted array (older entry)
  el.innerHTML = sorted.map((e, i) => entryWrapHTML(e, i, total, sorted[i+1])).join("");
}

function cardColor(i, total) {
  if (total <= 1) return CARD_COLORS[0];
  const t = i / (total - 1);
  const idx = Math.round(t * (CARD_COLORS.length - 1));
  return CARD_COLORS[idx];
}

function entryWrapHTML(e, i, total, prev) {
  const col = cardColor(i, total);
  return entryCardHTML(e, col, prev);
}

function entryCardHTML(e, col, prev) {
  col = col || CARD_COLORS[0];
  const isTahrirlashing = editingEntryId === e.id;
  const d = new Date(e.date);
  const dateStr = d.toLocaleDateString("uz-UZ", { day:"numeric", month:"short", year:"numeric" });
  const bars = SECTIONS.map(s => `
    <div class="entry-bar-item">
      <div class="entry-bar-label">${s.label}</div>
      <div class="entry-bar-track">
        <div class="entry-bar-fill" style="width:${(e[s.key]/40*100).toFixed(0)}%;background:${s.color}"></div>
      </div>
      <div class="entry-bar-val" style="color:${s.color}">${e[s.key].toFixed(0)}</div>
    </div>`).join("");

  const moodHTML = e.mood ? `<div class="entry-mood">${e.mood}</div>` : "";

  let deltaHTML = "";
  if (prev) {
    const diff = e.umumiy - prev.umumiy;
    const sign = diff > 0 ? "+" : "";
    const col2 = diff > 0 ? "var(--green)" : diff < 0 ? "var(--rose)" : "var(--muted2)";
    const arrow = diff > 0 ? "\u2191" : diff < 0 ? "\u2193" : "\u2192";
    deltaHTML = `<div style="font-size:11px;font-family:'Poppins',sans-serif;color:${col2};margin-top:2px">${arrow} ${sign}${diff.toFixed(0)} umumiy</div>`;
  }

  return `
  <div class="entry-card ${isTahrirlashing ? 'is-editing' : ''}" data-id="${e.id}"
       style="background:${col.bg};border-color:${col.border}">
    <div class="entry-top">
      <div>
        <div class="entry-date">${dateStr}</div>
        <button type="button" class="btn-entry-edit" onclick="startTahrirlashEntry('${e.id}')">Tahrirlash</button>
        ${e.manualOverall ? '<div style="font-size:10px;color:var(--muted2);margin-top:2px;font-family:Poppins,sans-serif">rasmiy</div>' : ''}
        ${deltaHTML}
      </div>
      <div class="entry-actions">
        <button type="button" class="btn-entry-delete" onclick="deleteEntry('${e.id}')">O'chirish</button>
        <div class="entry-umumiy">${e.umumiy.toFixed(0)}<span>umumiy</span></div>
      </div>
    </div>
    <div class="entry-bars">${bars}</div>
    ${moodHTML}
  </div>`;
}

function deleteEntry(id) {
  const targetId = String(id).trim();
  const removeAndRefresh = () => {
    const before = entries.length;
    entries = entries.filter(e => String(e.id).trim() !== targetId);
    if (entries.length === before) {
      showToast("O\'chirish muvaffaqiyatsiz: yozuv topilmadi");
      return;
    }
    saveEntries();
    renderHistory();
    renderCharts();
    renderMaslahatlar();
    updateAiMaslahatlarVisibility();
    showToast("Yozuv o\'chirildi");
  };

  const card = document.querySelector(`.entry-card[data-id="${targetId}"]`);
  if (!card) {
    removeAndRefresh();
    return;
  }

  card.classList.add("deleting");
  setTimeout(removeAndRefresh, 300);
}

// в”Ђв”Ђ CHARTS в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
function filteredEntries() {
  return filterByPeriod(entries, currentPeriod);
}

function renderCharts() {
  applyInsightsVisibility();
  if (settings.insights.showProgress) {
    renderLineChart();
  } else if (lineChart) {
    lineChart.destroy();
    lineChart = null;
  }
  if (settings.insights.showRadar) {
    renderRadarChart();
  } else if (radarChart) {
    radarChart.destroy();
    radarChart = null;
  }
  renderInsights();
}

let modalChart = null;
let modalPeriod = "all";

function openChartModal() {
  document.getElementById("chartModal").classList.add("open");
  document.body.style.overflow = "hidden";
  renderModalChart();
}

function closeChartModal() {
  document.getElementById("chartModal").classList.remove("open");
  document.body.style.overflow = "";
}

function setModalPeriod(p, btn) {
  modalPeriod = p;
  document.querySelectorAll(".chart-modal-period .period-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  renderModalChart();
}

function filteredModalEntries() {
  return filterByPeriod(entries, modalPeriod);
}

function renderModalChart() {
  const chartTheme = getChartTheme();
  const data = filteredModalEntries();
  const labels = data.map(e => {
    const d = new Date(e.date);
    return d.toLocaleDateString("uz-UZ", { day:"numeric", month:"short" });
  });
  const modalPoint = getPointRadius(labels.length, true);
  const canvas = document.getElementById("lineChartModal");
  const body = canvas.closest(".chart-modal-body");
  const bodyWidth = body ? body.clientWidth : 700;
  const desiredWidth = Math.max(bodyWidth, labels.length * 62, 520);
  canvas.style.width = `${desiredWidth}px`;
  canvas.width = desiredWidth;
  const datasets = [
    ...SECTIONS.map(s => ({
      label: s.label,
      data: data.map(e => e[s.key]),
      borderColor: s.color,
      backgroundColor: s.color + "15",
      borderWidth: 2.5,
      pointRadius: modalPoint,
      pointHoverRadius: modalPoint + 2,
      pointBackgroundColor: s.color,
      tension: 0.4,
      fill: false,
    })),
    {
      label: "Overall",
      data: data.map(e => e.umumiy),
      borderColor: chartTheme.umumiyLine,
      backgroundColor: chartTheme.umumiyBg,
      borderWidth: 3,
      borderDash: [6,3],
      pointRadius: modalPoint + 1,
      pointHoverRadius: modalPoint + 3,
      pointBackgroundColor: chartTheme.umumiyLine,
      tension: 0.4,
      fill: false,
    }
  ];

  if (modalChart) modalChart.destroy();
  const ctx = document.getElementById("lineChartModal").getContext("2d");
  modalChart = new Chart(ctx, {
    type: "line",
    data: { labels, datasets },
    options: {
      responsive: false,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: {
          labels: {
            color: chartTheme.legend,
            font: { family: "Poppins", size: 11 },
            boxWidth: 14, padding: 16,
          }
        },
        tooltip: {
          backgroundColor: chartTheme.tooltipBg,
          borderColor: chartTheme.tooltipBorder,
          borderWidth: 1,
          titleColor: chartTheme.tooltipTitle,
          bodyColor: chartTheme.tooltipBody,
          titleFont: { family: "Poppins", size: 12 },
          bodyFont: { family: "Poppins", size: 12 },
          padding: 14,
        }
      },
      scales: {
        y: {
          min: 0, max: 40,
          ticks: { stepSize: 1.5, color: chartTheme.tick, font: { family: "Poppins", size: 11 } },
          grid: { color: chartTheme.grid },
          border: { display: false },
        },
        x: {
          ticks: { color: chartTheme.tick, font: { family: "Poppins", size: 11 }, maxRotation: 0 },
          grid: { display: false },
          border: { display: false },
        }
      }
    }
  });
}

function renderLineChart() {
  const chartTheme = getChartTheme();
  const data = filteredEntries();
  const labels = data.map(e => {
    const d = new Date(e.date);
    return d.toLocaleDateString("uz-UZ", { day:"numeric", month:"short" });
  });
  const point = getPointRadius(labels.length, false);

  const datasets = [
    ...SECTIONS.map(s => ({
      label: s.label,
      data: data.map(e => e[s.key]),
      borderColor: s.color,
      backgroundColor: s.color + "15",
      borderWidth: 2,
      pointRadius: point,
      pointHoverRadius: point + 1,
      pointBackgroundColor: s.color,
      tension: 0.4,
      fill: false,
    })),
    {
      label: "Overall",
      data: data.map(e => e.umumiy),
      borderColor: chartTheme.umumiyLine,
      backgroundColor: chartTheme.umumiyBg,
      borderWidth: 2.5,
      borderDash: [5,3],
      pointRadius: point + 1,
      pointHoverRadius: point + 2,
      pointBackgroundColor: chartTheme.umumiyLine,
      tension: 0.4,
      fill: false,
    }
  ];

  if (lineChart) lineChart.destroy();
  const canvas = document.getElementById("lineChart");
  const ctx = canvas.getContext("2d");
  lineChart = new Chart(ctx, {
    type: "line",
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: {
          labels: {
            color: chartTheme.legend,
            font: { family: "Poppins", size: 10 },
            boxWidth: 12,
            padding: 12,
          }
        },
        tooltip: {
          backgroundColor: chartTheme.tooltipBg,
          borderColor: chartTheme.tooltipBorder,
          borderWidth: 1,
          titleColor: chartTheme.tooltipTitle,
          bodyColor: chartTheme.tooltipBody,
          titleFont: { family: "Poppins", size: 11 },
          bodyFont: { family: "Poppins", size: 11 },
          padding: 12,
        }
      },
      scales: {
        y: {
          min: 0, max: 40,
          ticks: {
            stepSize: 1.5,
            color: chartTheme.tickSoft,
            font: { family: "Poppins", size: 10 },
          },
          grid: { color: chartTheme.grid },
          border: { display: false },
        },
        x: {
          ticks: {
            color: chartTheme.tickSoft,
            font: { family: "Poppins", size: 10 },
            maxRotation: 0,
          },
          grid: { display: false },
          border: { display: false },
        }
      }
    }
  });
}

function renderRadarChart() {
  const chartTheme = getChartTheme();
  const avgs = {};
  SECTIONS.forEach(s => {
    avgs[s.key] = entries.length ? entries.reduce((a,e) => a + e[s.key], 0) / entries.length : 0;
  });
  avgs.umumiy = entries.length ? entries.reduce((a,e) => a + e.umumiy, 0) / entries.length : 0;

  const labels = [...SECTIONS.map(s => s.label), "Overall"];
  const dataVals = [...SECTIONS.map(s => avgs[s.key]), avgs.umumiy];
  const colors = [...SECTIONS.map(s => s.color), chartTheme.radarOverallLabel];

  if (radarChart) radarChart.destroy();
  const ctx = document.getElementById("radarChart").getContext("2d");
  radarChart = new Chart(ctx, {
    type: "radar",
    data: {
      labels,
      datasets: [{
        label: "Average Score",
        data: dataVals,
        backgroundColor: chartTheme.radarArea,
        borderColor: chartTheme.radarBorder,
        borderWidth: 2,
        pointBackgroundColor: colors,
        pointBorderColor: "transparent",
        pointRadius: 6,
        fill: true,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      aspectRatio: 1.05,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: chartTheme.tooltipBg,
          titleColor: chartTheme.tooltipTitle,
          bodyColor: chartTheme.tooltipBody,
          titleFont: { family: "Poppins", size: 11 },
          bodyFont: { family: "Poppins", size: 12 },
          padding: 12,
          borderColor: chartTheme.tooltipBorder,
          borderWidth: 1,
          callbacks: { label: ctx => ` ${ctx.raw.toFixed(0)}` }
        }
      },
      scales: {
        r: {
          min: 0, max: 40,
          ticks: {
            stepSize: 3,
            color: chartTheme.tickSofter,
            font: { family: "Poppins", size: 9 },
            backdropColor: "transparent",
          },
          grid: { color: chartTheme.angle },
          angleLines: { color: chartTheme.angle },
          pointLabels: {
            color: colors,
            font: { family: "Poppins", size: 12, weight: "500" },
          }
        }
      }
    }
  });
}

// в”Ђв”Ђ TIPS в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
function renderMaslahatlar() {
  if (!settings.insights.showTips) {
    const tipsEl = document.getElementById("tipsSection");
    if (tipsEl) tipsEl.innerHTML = "";
    return;
  }

  if (!entries.length) {
    document.getElementById("tipsSection").innerHTML = "";
    return;
  }

  const last = entries[entries.length - 1];
  const scored = SECTIONS.map(s => ({ ...s, score: last[s.key] }))
    .sort((a,b) => a.score - b.score)
    .slice(0, 2);

  const html = `
    <div class="chart-label" style="margin-bottom:12px;font-size:11px;font-family:'Poppins',sans-serif;letter-spacing:.8px;text-transform:uppercase;color:var(--muted)">Siz uchun maslahatlar</div>
    ${scored.map(s => {
      const tip = TIPS[s.key][Math.floor(Math.random() * TIPS[s.key].length)];
      return `
      <div class="tip-card">
        <div class="tip-section">${s.icon} ${s.label} &middot; ${s.score.toFixed(0)}</div>
        <div class="tip-text">${tip}</div>
      </div>`;
    }).join('')}`;

  document.getElementById("tipsSection").innerHTML = html;
}

// в”Ђв”Ђ AI TIPS в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
function updateAiMaslahatlarVisibility() {
  const card = document.getElementById("aiTipsCard");
  if (!card) return;
  if (!settings.insights.showAiCoach) {
    card.style.display = "none";
    return;
  }
  card.style.display = entries.length >= 2 ? "block" : "none";
}

function pickRepresentativeEntries() {
  if (!entries.length) return [];
  const sorted = [...entries].sort((a,b) => a.umumiy - b.umumiy);
  const worst = sorted[0];
  const best = sorted[sorted.length - 1];
  const midIdx = Math.floor(sorted.length / 2);
  const mid = sorted[midIdx];
  // deduplicate
  const seen = new Set();
  return [worst, mid, best].filter(e => {
    if (seen.has(e.date)) return false;
    seen.add(e.date);
    return true;
  });
}

async function fetchAiMaslahatlar() {
  const btn = document.getElementById("btnAiTips");
  const result = document.getElementById("aiTipsResult");

  btn.disabled = true;
  btn.innerHTML = '<span class="ai-typing"> Tahlil qilinmoqda</span>';
  result.style.display = "block";
  result.textContent = "";
  result.classList.add("ai-typing");

  const rep = pickRepresentativeEntries();

  // Build a clean summary for the prompt
  const summary = rep.map(e => {
    const d = new Date(e.date).toLocaleDateString("uz-UZ", { month:"short", year:"numeric" });
    const parts = SECTIONS.map(s => `${s.label}: ${e[s.key]}`).join(", ");
    return `${d} - ${parts}, Overall: ${e.umumiy}${e.mood ? ` (note: "${e.mood}")` : ''}`;
  }).join("\n");

  const allOveralls = entries.map(e => e.umumiy);
  const trend = allOveralls.length >= 2
    ? (allOveralls[allOveralls.length-1] - allOveralls[0]).toFixed(0)
    : "0";

  const prompt = `Siz tajribali til testi (CEFR) murabbiyisiz. Ushbu talabaning natijalarini tahlil qiling va qisqa, to'g'ridan-to'g'ri, shaxsiylashtirilgan murabbiylik javobi bering (maksimal 3-5 ta jumla). Eng zaif bo'limlarga, sezilarli tendensiyalarga va ular qabul qilishi mumkin bo'lgan bitta aniq harakatga e'tibor bering. Aniq va rag'batlantiruvchi bo'ling, umumiy emas. Javobni o'zbek tilida bering.

Student's representative results (worst, middle, best):
${summary}

Overall trend: ${trend > 0 ? '+' : ''}${trend} ball since first test.
Total tests logged: ${entries.length}.

Tahlilni o'zbek tilida oddiy matn ko'rinishida bering, markdown yoki ro'yxat belgisiz.`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }]
      })
    });

    const data = await response.json();
    const text = data.content?.find(b => b.type === "text")?.text || "Tahlil yaratib bo'lmadi.";

    result.classList.remove("ai-typing");
    result.textContent = text;
    btn.innerHTML = "<span>\u2726</span> Tahlilni yangilash";
    btn.disabled = false;
  } catch (err) {
    result.classList.remove("ai-typing");
    result.textContent = "Xatolik yuz berdi. Qayta urinib ko\'ring.";
    btn.innerHTML = "<span>\u2726</span> Qayta urinish";
    btn.disabled = false;
  }
}

// в”Ђв”Ђ PERIOD в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
function setPeriod(p, btn) {
  currentPeriod = p;
  document.querySelectorAll("#page-charts .chart-period .period-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  renderLineChart();
}

function filterByPeriod(list, period) {
  if (period === "all") return list;
  if (!list.length) return [];

  // Use latest logged test date as reference, not system "today".
  const latestDate = list.reduce((max, e) => (e.date > max ? e.date : max), list[0].date);
  const latest = new Date(latestDate + "T00:00:00");
  const days = period === "month" ? 30 : 7;
  const cutoffDate = new Date(latest.getTime() - days * 86400000).toISOString().split("T")[0];
  return list.filter(e => e.date >= cutoffDate);
}

function getPointRadius(pointCount, isModal) {
  const mobile = window.innerWidth <= 540;
  if (mobile) {
    if (pointCount >= 18) return isModal ? 2 : 1;
    if (pointCount >= 12) return 2;
    return 3;
  }
  if (pointCount >= 24) return isModal ? 3 : 2;
  if (pointCount >= 14) return isModal ? 4 : 3;
  return isModal ? 5 : 4;
}

// в”Ђв”Ђ TABS в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
function switchTab(name) {
  document.querySelectorAll(".tab").forEach((t,i) => {
    const names = ["add","history","charts"];
    const isActive = names[i] === name;
    t.classList.toggle("active", isActive);
    t.setAttribute("aria-selected", isActive ? "true" : "false");
    t.setAttribute("tabindex", isActive ? "0" : "-1");
  });
  document.querySelectorAll(".page").forEach(p => {
    p.classList.toggle("active", p.id === "page-" + name);
  });
  if (name === "charts") { renderCharts(); renderMaslahatlar(); updateAiMaslahatlarVisibility(); }
  if (name === "history") renderHistory();
}

function normalizeSettings(raw) {
  const fallback = DEFAULT_SETTINGS;
  const safe = {
    theme: raw?.theme === "light" || raw?.theme === "dark" ? raw.theme : "system",
    insights: {}
  };

  for (const key of Object.keys(fallback.insights)) {
    if (key === "showAiCoach") {
      safe.insights[key] = false;
      continue;
    }
    safe.insights[key] = raw?.insights?.[key] !== false;
  }
  return safe;
}

function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return normalizeSettings(DEFAULT_SETTINGS);
    return normalizeSettings(JSON.parse(raw));
  } catch {
    return normalizeSettings(DEFAULT_SETTINGS);
  }
}

function applyInsightsVisibility() {
  const visibilityMap = [
    ["kpiGrid", settings.insights.showKpis],
    ["comparisonCard", settings.insights.showComparison],
    ["targetsCard", settings.insights.showTargets],
    ["lineChartContainer", settings.insights.showProgress],
    ["radarCard", settings.insights.showRadar],
    ["tipsSection", settings.insights.showTips],
    ["aiTipsCard", settings.insights.showAiCoach],
  ];

  visibilityMap.forEach(([id, visible]) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.style.display = visible ? "" : "none";
  });
}

function loadMaqsadlar() {
  const fallback = Object.fromEntries(SECTIONS.map(s => [s.key, 25]));
  try {
    const raw = localStorage.getItem(TARGETS_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    SECTIONS.forEach(s => {
      const v = Number(parsed?.[s.key]);
      parsed[s.key] = Number.isFinite(v) ? Math.min(40, Math.max(0, v)) : fallback[s.key];
    });
    return parsed;
  } catch {
    return fallback;
  }
}

function saveMaqsadlar() {
  try { localStorage.setItem(TARGETS_KEY, JSON.stringify(targets)); } catch {}
}

function renderMaqsadlar() {
  const wrap = document.getElementById("targets");
  if (!wrap) return;

  wrap.innerHTML = SECTIONS.map(s => `
    <div class="section-row">
      <div class="section-head">
        <div class="section-name">
          <div class="section-icon" style="background:${s.color}18">${s.icon}</div>
          ${s.label} target
        </div>
        <div class="section-score" id="target-score-${s.key}" style="color:${scoreColor(targets[s.key])}">${targets[s.key].toFixed(0)}</div>
      </div>
      <div class="slider-wrap">
        <input type="range" class="target-slider" data-key="${s.key}"
               min="0" max="40" step="1" value="${targets[s.key]}" style="--c:${s.color}"/>
      </div>
    </div>
  `).join("");

  document.querySelectorAll(".target-slider").forEach(el => {
    updateSliderFill(el);
    el.addEventListener("input", function() {
      updateSliderFill(this);
      const key = this.dataset.key;
      const val = parseFloat(this.value);
      targets[key] = val;
      const score = document.getElementById("target-score-" + key);
      score.textContent = val.toFixed(0);
      score.style.color = scoreColor(val);
      saveMaqsadlar();
    });
  });
}

function resetMaqsadlar() {
  targets = Object.fromEntries(SECTIONS.map(s => [s.key, 25]));
  saveMaqsadlar();
  renderMaqsadlar();
  showToast("Maqsadlar reset");
}

function getFilteredHistoryEntries() {
  if (historyFilter === "rasmiy") return entries.filter(e => e.manualOverall);
  if (historyFilter === "notes") return entries.filter(e => (e.mood || "").trim().length > 0);
  return entries;
}

function setHistoryFilter(mode, btn) {
  historyFilter = mode;
  document.querySelectorAll(".history-filter").forEach(b => b.classList.remove("active"));
  if (btn) btn.classList.add("active");
  renderHistory();
}


function cancelTahrirlash() {
  if (!editingEntryId) return;
  resetEntryForm();
  exitTahrirlashMode();
  renderHistory();
  showToast("Tahrirlash rejimi bekor qilindi");
}

function setOverallMode(enabled) {
  umumiyEnabled = !!enabled;
  const tog = document.getElementById("overallToggle");
  if (tog) tog.classList.toggle("on", umumiyEnabled);
  const wrap = document.getElementById("overallSliderWrap");
  if (wrap) wrap.style.display = umumiyEnabled ? "block" : "none";
}

function setMoodOpen(open) {
  moodOpen = !!open;
  const expand = document.getElementById("moodExpand");
  if (expand) expand.classList.toggle("open", moodOpen);
  const arrow = document.getElementById("moodArrow");
  if (arrow) arrow.textContent = moodOpen ? "\u2715" : "\u{1F4AC}";
}

function setSliderValue(key, value) {
  const slider = document.getElementById("slider-" + key);
  if (!slider) return;
  slider.value = value;
  updateSliderFill(slider);
  const score = document.getElementById("score-" + key);
  if (score) {
    score.textContent = Number(value).toFixed(0);
    score.style.color = scoreColor(Number(value));
  }
}

function resetEntryForm() {
  document.getElementById("entryDate").value = new Date().toISOString().split("T")[0];
  SECTIONS.forEach(s => setSliderValue(s.key, 18));
  setSliderValue("umumiy", 18);
  setOverallMode(false);
  document.getElementById("moodNote").value = "";
  setMoodOpen(false);
}

function exitTahrirlashMode() {
  editingEntryId = null;
  const btn = document.getElementById("cancelEditBtn");
  if (btn) btn.style.display = "none";
  const title = document.getElementById("entryFormTitle");
  if (title) title.textContent = "Yangi Test Natijasi";
  const saveBtn = document.getElementById("saveEntryBtn");
  if (saveBtn) saveBtn.textContent = "Natijani Saqlash";
}

function startTahrirlashEntry(id) {
  const entry = entries.find(e => e.id === id);
  if (!entry) {
    showToast("Yozuv topilmadi");
    return;
  }

  editingEntryId = entry.id;
  document.getElementById("entryDate").value = entry.date;
  SECTIONS.forEach(s => setSliderValue(s.key, entry[s.key]));

  setOverallMode(!!entry.manualOverall);
  setSliderValue("umumiy", entry.umumiy);

  document.getElementById("moodNote").value = entry.mood || "";
  setMoodOpen(Boolean((entry.mood || "").trim()));

  const btn = document.getElementById("cancelEditBtn");
  if (btn) btn.style.display = "inline-flex";
  const title = document.getElementById("entryFormTitle");
  if (title) title.textContent = "Test Natijasini Tahrirlash";
  const saveBtn = document.getElementById("saveEntryBtn");
  if (saveBtn) saveBtn.textContent = "Natijani Yangilash";

  switchTab("add");
  renderHistory();
  showToast("Yozuv tahrirlanmoqda");
}

function renderInsights() {
  const kpiGrid = document.getElementById("kpiGrid");
  const cmp = document.getElementById("comparisonSummary");
  if (!kpiGrid || !cmp) return;

  if (!entries.length) {
    kpiGrid.innerHTML = "";
    cmp.innerHTML = `<div class="empty"><p>Tahlilni ko'rish uchun natija qo'shing.</p></div>`;
    return;
  }

  const latest = entries[entries.length - 1];
  const first = entries[0];
  const avgOverall = entries.reduce((acc, e) => acc + e.umumiy, 0) / entries.length;
  const delta = latest.umumiy - first.umumiy;
  const deltaSign = delta > 0 ? "+" : "";

  kpiGrid.innerHTML = `
    <div class="kpi-card"><div class="kpi-label">So'nggi Umumiy</div><div class="kpi-value">${latest.umumiy.toFixed(0)}</div></div>
    <div class="kpi-card"><div class="kpi-label">O'rtacha Umumiy</div><div class="kpi-value">${avgOverall.toFixed(0)}</div></div>
    <div class="kpi-card"><div class="kpi-label">Tendensiya</div><div class="kpi-value">${deltaSign}${delta.toFixed(0)}</div></div>
  `;

  const weakest = SECTIONS
    .map(s => ({ ...s, score: latest[s.key], gap: targets[s.key] - latest[s.key] }))
    .sort((a, b) => a.score - b.score)[0];

  cmp.innerHTML = `
    <div class="tip-text">
      So'nggi test <strong>${latest.umumiy.toFixed(0)}</strong>.
      Hozir zaif soha: <strong style="color:${weakest.color}">${weakest.label} (${weakest.score.toFixed(0)})</strong>.
      Maqsadga farq: <strong>${weakest.gap.toFixed(0)}</strong>.
    </div>
  `;
}

// в”Ђв”Ђ TOAST в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
function showToast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2200);
}
