const STORAGE_KEYS = {
  sessions: "sts_sessions_v1",
  customDataset: "sts_custom_dataset_v1",
};

const views = {
  consent: document.getElementById("consentView"),
  profile: document.getElementById("profileView"),
  game: document.getElementById("gameView"),
  result: document.getElementById("resultView"),
  dashboard: document.getElementById("dashboardView"),
  builder: document.getElementById("builderView"),
};

const ui = {
  consentCheckbox: document.getElementById("consentCheckbox"),
  startProfileBtn: document.getElementById("startProfileBtn"),
  toConsentBtn: document.getElementById("toConsentBtn"),
  beginGameBtn: document.getElementById("beginGameBtn"),
  profileForm: document.getElementById("profileForm"),

  roundLabel: document.getElementById("roundLabel"),
  scoreLabel: document.getElementById("scoreLabel"),
  swipeCard: document.getElementById("swipeCard"),
  cardImage: document.getElementById("cardImage"),
  cardTitle: document.getElementById("cardTitle"),
  leftHint: document.getElementById("leftHint"),
  rightHint: document.getElementById("rightHint"),
  guessAiBtn: document.getElementById("guessAiBtn"),
  guessRealBtn: document.getElementById("guessRealBtn"),

  finalHeadline: document.getElementById("finalHeadline"),
  finalSummary: document.getElementById("finalSummary"),
  correctCount: document.getElementById("correctCount"),
  avgTime: document.getElementById("avgTime"),
  percentile: document.getElementById("percentile"),
  downloadSessionBtn: document.getElementById("downloadSessionBtn"),
  downloadCsvBtn: document.getElementById("downloadCsvBtn"),
  playAgainBtn: document.getElementById("playAgainBtn"),
  openDashboardFromResultBtn: document.getElementById("openDashboardFromResultBtn"),
  downloadAllBtn: document.getElementById("downloadAllBtn"),
  clearAllBtn: document.getElementById("clearAllBtn"),

  openDashboardBtn: document.getElementById("openDashboardBtn"),
  closeDashboardBtn: document.getElementById("closeDashboardBtn"),
  filterAgeGroup: document.getElementById("filterAgeGroup"),
  filterGender: document.getElementById("filterGender"),
  filterAiFamiliarity: document.getElementById("filterAiFamiliarity"),
  resetDashboardFiltersBtn: document.getElementById("resetDashboardFiltersBtn"),
  dashSessionCount: document.getElementById("dashSessionCount"),
  dashDecisionCount: document.getElementById("dashDecisionCount"),
  dashAccuracy: document.getElementById("dashAccuracy"),
  dashAvgTime: document.getElementById("dashAvgTime"),
  dashTP: document.getElementById("dashTP"),
  dashFP: document.getElementById("dashFP"),
  dashFN: document.getElementById("dashFN"),
  dashTN: document.getElementById("dashTN"),
  dashSegmentBody: document.getElementById("dashSegmentBody"),
  dashEmptyState: document.getElementById("dashEmptyState"),

  openBuilderBtn: document.getElementById("openBuilderBtn"),
  closeBuilderBtn: document.getElementById("closeBuilderBtn"),
  builderForm: document.getElementById("builderForm"),
  addCardBtn: document.getElementById("addCardBtn"),
  exportDatasetBtn: document.getElementById("exportDatasetBtn"),
  importDatasetInput: document.getElementById("importDatasetInput"),
  resetDatasetBtn: document.getElementById("resetDatasetBtn"),
  builderList: document.getElementById("builderList"),
};

const state = {
  dataset: null,
  activeCards: [],
  currentIndex: 0,
  correct: 0,
  profile: null,
  responses: [],
  cardStartedAt: 0,
  sessionStartedAt: 0,
  latestSession: null,
  swipeLock: false,
  pointer: {
    isDown: false,
    startX: 0,
    deltaX: 0,
  },
};

function showView(viewName) {
  Object.values(views).forEach((view) => view.classList.remove("active"));
  views[viewName].classList.add("active");
}

function shuffle(array) {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function loadSessions() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.sessions) || "[]");
  } catch {
    return [];
  }
}

function saveSessions(sessions) {
  localStorage.setItem(STORAGE_KEYS.sessions, JSON.stringify(sessions));
}

function downloadFile(fileName, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function formToObject(form) {
  const entries = new FormData(form).entries();
  return Object.fromEntries(entries);
}

function percentileLabel(value) {
  const suffix = (v) => {
    if (v % 100 >= 11 && v % 100 <= 13) return "th";
    if (v % 10 === 1) return "st";
    if (v % 10 === 2) return "nd";
    if (v % 10 === 3) return "rd";
    return "th";
  };
  return `${value}${suffix(value)}`;
}

function estimatePercentile(scorePct) {
  const sessions = loadSessions();
  const scoreList = sessions.map((s) => s.scorePct);
  if (scoreList.length === 0) {
    return 50;
  }
  const lowerOrEqual = scoreList.filter((s) => s <= scorePct).length;
  return Math.max(1, Math.min(99, Math.round((lowerOrEqual / scoreList.length) * 100)));
}

function sanitizeProfileValue(value) {
  if (!value) return "Unknown";
  return String(value).trim() || "Unknown";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function uniqueSortedValues(sessions, profileKey) {
  const unique = new Set(
    sessions.map((session) => sanitizeProfileValue(session.profile?.[profileKey])),
  );
  return [...unique].sort((a, b) => a.localeCompare(b));
}

function setSelectOptions(selectEl, values) {
  const currentValue = selectEl.value || "all";
  selectEl.innerHTML = "";
  const allOption = document.createElement("option");
  allOption.value = "all";
  allOption.textContent = "All";
  selectEl.appendChild(allOption);

  values.forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    selectEl.appendChild(option);
  });

  if (currentValue === "all" || values.includes(currentValue)) {
    selectEl.value = currentValue;
  } else {
    selectEl.value = "all";
  }
}

function populateDashboardFilters() {
  const sessions = loadSessions();
  setSelectOptions(ui.filterAgeGroup, uniqueSortedValues(sessions, "ageGroup"));
  setSelectOptions(ui.filterGender, uniqueSortedValues(sessions, "gender"));
  setSelectOptions(ui.filterAiFamiliarity, uniqueSortedValues(sessions, "aiFamiliarity"));
}

function dashboardFilterValues() {
  return {
    ageGroup: ui.filterAgeGroup.value,
    gender: ui.filterGender.value,
    aiFamiliarity: ui.filterAiFamiliarity.value,
  };
}

function applyDashboardFilters(sessions, filters) {
  return sessions.filter((session) => {
    const ageGroup = sanitizeProfileValue(session.profile?.ageGroup);
    const gender = sanitizeProfileValue(session.profile?.gender);
    const aiFamiliarity = sanitizeProfileValue(session.profile?.aiFamiliarity);
    if (filters.ageGroup !== "all" && filters.ageGroup !== ageGroup) return false;
    if (filters.gender !== "all" && filters.gender !== gender) return false;
    if (filters.aiFamiliarity !== "all" && filters.aiFamiliarity !== aiFamiliarity) return false;
    return true;
  });
}

function buildSegmentRows(sessions, profileKey, label) {
  const map = new Map();
  sessions.forEach((session) => {
    const key = sanitizeProfileValue(session.profile?.[profileKey]);
    const mapKey = `${label}: ${key}`;
    const current = map.get(mapKey) || { scoreSum: 0, count: 0 };
    current.scoreSum += Number(session.scorePct || 0);
    current.count += 1;
    map.set(mapKey, current);
  });

  return [...map.entries()].map(([segment, stats]) => ({
    segment,
    sessions: stats.count,
    meanScore: stats.count ? Math.round(stats.scoreSum / stats.count) : 0,
  }));
}

function renderDashboard() {
  const filters = dashboardFilterValues();
  const allSessions = loadSessions();
  const sessions = applyDashboardFilters(allSessions, filters);

  let totalDecisions = 0;
  let totalCorrect = 0;
  let totalTime = 0;
  const matrix = { tp: 0, fp: 0, fn: 0, tn: 0 };

  sessions.forEach((session) => {
    (session.responses || []).forEach((response) => {
      totalDecisions += 1;
      if (response.correct) totalCorrect += 1;
      totalTime += Number(response.responseTimeMs || 0);

      if (response.truth === "ai" && response.userChoice === "ai") matrix.tp += 1;
      if (response.truth === "real" && response.userChoice === "ai") matrix.fp += 1;
      if (response.truth === "ai" && response.userChoice === "real") matrix.fn += 1;
      if (response.truth === "real" && response.userChoice === "real") matrix.tn += 1;
    });
  });

  const accuracy = totalDecisions ? Math.round((totalCorrect / totalDecisions) * 100) : 0;
  const avgTime = totalDecisions ? (totalTime / totalDecisions / 1000).toFixed(1) : "0.0";

  ui.dashSessionCount.textContent = String(sessions.length);
  ui.dashDecisionCount.textContent = String(totalDecisions);
  ui.dashAccuracy.textContent = `${accuracy}%`;
  ui.dashAvgTime.textContent = `${avgTime}s`;

  ui.dashTP.textContent = String(matrix.tp);
  ui.dashFP.textContent = String(matrix.fp);
  ui.dashFN.textContent = String(matrix.fn);
  ui.dashTN.textContent = String(matrix.tn);

  const segmentRows = [
    ...buildSegmentRows(sessions, "ageGroup", "Age"),
    ...buildSegmentRows(sessions, "gender", "Gender"),
    ...buildSegmentRows(sessions, "aiFamiliarity", "AI Familiarity"),
  ].sort((a, b) => b.meanScore - a.meanScore || b.sessions - a.sessions);

  if (segmentRows.length === 0) {
    ui.dashSegmentBody.innerHTML = "";
    ui.dashEmptyState.hidden = false;
  } else {
    ui.dashSegmentBody.innerHTML = segmentRows
      .map(
        (row) => `
          <tr>
            <td>${escapeHtml(row.segment)}</td>
            <td>${row.sessions}</td>
            <td>${row.meanScore}%</td>
          </tr>
        `,
      )
      .join("");
    ui.dashEmptyState.hidden = true;
  }
}

function openDashboard() {
  populateDashboardFilters();
  renderDashboard();
  showView("dashboard");
}

async function loadDataset() {
  const customRaw = localStorage.getItem(STORAGE_KEYS.customDataset);
  if (customRaw) {
    try {
      state.dataset = JSON.parse(customRaw);
      renderBuilderList();
      return;
    } catch {
      localStorage.removeItem(STORAGE_KEYS.customDataset);
    }
  }

  const response = await fetch("data/default-dataset.json");
  state.dataset = await response.json();
  renderBuilderList();
}

function saveCustomDataset() {
  localStorage.setItem(STORAGE_KEYS.customDataset, JSON.stringify(state.dataset));
  renderBuilderList();
}

function renderBuilderList() {
  if (!state.dataset || !Array.isArray(state.dataset.items)) {
    ui.builderList.innerHTML = "<p>No dataset loaded.</p>";
    return;
  }

  const rows = state.dataset.items
    .map(
      (item, index) => `
      <article class="builder-item">
        <img src="${item.image}" alt="${item.title}" />
        <div>
          <strong>${item.title}</strong>
          <span class="tag ${item.truth}">${item.truth.toUpperCase()}</span>
          <p>ID: ${item.id}</p>
        </div>
        <button class="ghost-btn" data-remove-index="${index}" type="button">Remove</button>
      </article>
    `,
    )
    .join("");

  ui.builderList.innerHTML = rows;

  ui.builderList.querySelectorAll("[data-remove-index]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const index = Number(btn.getAttribute("data-remove-index"));
      state.dataset.items.splice(index, 1);
      saveCustomDataset();
    });
  });
}

function beginGame() {
  if (!state.dataset || !Array.isArray(state.dataset.items) || state.dataset.items.length < 3) {
    alert("Please provide at least 3 dataset cards before starting.");
    showView("builder");
    return;
  }

  state.activeCards = shuffle(state.dataset.items);
  state.currentIndex = 0;
  state.correct = 0;
  state.responses = [];
  state.sessionStartedAt = Date.now();
  state.swipeLock = false;
  showView("game");
  renderCurrentCard();
}

function renderCurrentCard() {
  const card = state.activeCards[state.currentIndex];
  if (!card) {
    finishGame();
    return;
  }

  ui.roundLabel.textContent = `Round ${state.currentIndex + 1} / ${state.activeCards.length}`;
  ui.scoreLabel.textContent = `Score: ${state.correct}`;
  ui.cardImage.src = card.image;
  ui.cardTitle.textContent = card.title;
  resetCardTransform();
  state.cardStartedAt = Date.now();
}

function resetCardTransform() {
  ui.swipeCard.style.transition = "transform 180ms ease";
  ui.swipeCard.style.transform = "translateX(0) rotate(0deg)";
  ui.leftHint.style.opacity = "0";
  ui.rightHint.style.opacity = "0";
}

function registerChoice(choice) {
  if (state.swipeLock) return;
  state.swipeLock = true;

  const card = state.activeCards[state.currentIndex];
  const responseTimeMs = Date.now() - state.cardStartedAt;
  const isCorrect = card.truth === choice;
  if (isCorrect) state.correct += 1;

  state.responses.push({
    itemId: card.id,
    title: card.title,
    truth: card.truth,
    userChoice: choice,
    correct: isCorrect,
    responseTimeMs,
  });

  animateChoice(choice, () => {
    state.currentIndex += 1;
    state.swipeLock = false;
    renderCurrentCard();
  });
}

function animateChoice(choice, onDone) {
  const direction = choice === "ai" ? -1 : 1;
  ui.swipeCard.style.transition = "transform 220ms ease";
  ui.swipeCard.style.transform = `translateX(${direction * 380}px) rotate(${direction * 18}deg)`;
  ui.leftHint.style.opacity = choice === "ai" ? "1" : "0";
  ui.rightHint.style.opacity = choice === "real" ? "1" : "0";
  setTimeout(onDone, 220);
}

function finishGame() {
  const total = state.responses.length;
  const scorePct = total ? Math.round((state.correct / total) * 100) : 0;
  const avgTimeMs = total
    ? Math.round(state.responses.reduce((sum, r) => sum + r.responseTimeMs, 0) / total)
    : 0;
  const percentile = estimatePercentile(scorePct);

  const session = {
    sessionId: `sess_${Date.now()}`,
    startedAt: new Date(state.sessionStartedAt).toISOString(),
    finishedAt: new Date().toISOString(),
    profile: state.profile,
    scorePct,
    total,
    correct: state.correct,
    avgTimeMs,
    percentile,
    datasetName: state.dataset.name,
    responses: state.responses,
  };

  state.latestSession = session;
  const sessions = loadSessions();
  sessions.push(session);
  saveSessions(sessions);

  ui.finalHeadline.textContent = `You scored ${scorePct}%`;
  ui.finalSummary.textContent =
    scorePct >= 80
      ? "Excellent eye. You are spotting subtle synthetic cues quickly."
      : scorePct >= 55
        ? "Solid performance. A few tricky cards still slipped through."
        : "This set was intentionally difficult. Review cues and try another run.";
  ui.correctCount.textContent = `${state.correct} / ${total}`;
  ui.avgTime.textContent = `${(avgTimeMs / 1000).toFixed(1)}s`;
  ui.percentile.textContent = percentileLabel(percentile);

  showView("result");
}

function convertSessionToCsv(session) {
  const profile = session.profile || {};
  const header = [
    "sessionId",
    "startedAt",
    "finishedAt",
    "participantCode",
    "ageGroup",
    "gender",
    "region",
    "education",
    "aiFamiliarity",
    "datasetName",
    "itemId",
    "title",
    "truth",
    "userChoice",
    "correct",
    "responseTimeMs",
    "scorePct",
    "percentile",
  ];

  const rows = session.responses.map((r) => [
    session.sessionId,
    session.startedAt,
    session.finishedAt,
    profile.participantCode || "",
    profile.ageGroup || "",
    profile.gender || "",
    profile.region || "",
    profile.education || "",
    profile.aiFamiliarity || "",
    session.datasetName,
    r.itemId,
    r.title,
    r.truth,
    r.userChoice,
    String(r.correct),
    String(r.responseTimeMs),
    String(session.scorePct),
    String(session.percentile),
  ]);

  const toCsvCell = (value) => `"${String(value).replaceAll("\"", "\"\"")}"`;
  return [header, ...rows].map((row) => row.map(toCsvCell).join(",")).join("\n");
}

function bindSwipe() {
  const threshold = 90;

  ui.swipeCard.addEventListener("pointerdown", (event) => {
    if (state.swipeLock) return;
    state.pointer.isDown = true;
    state.pointer.startX = event.clientX;
    state.pointer.deltaX = 0;
    ui.swipeCard.style.transition = "none";
    ui.swipeCard.setPointerCapture(event.pointerId);
  });

  ui.swipeCard.addEventListener("pointermove", (event) => {
    if (!state.pointer.isDown || state.swipeLock) return;
    state.pointer.deltaX = event.clientX - state.pointer.startX;
    const rotate = state.pointer.deltaX * 0.05;
    ui.swipeCard.style.transform = `translateX(${state.pointer.deltaX}px) rotate(${rotate}deg)`;

    const opacity = Math.min(Math.abs(state.pointer.deltaX) / threshold, 1);
    ui.leftHint.style.opacity = state.pointer.deltaX < 0 ? String(opacity) : "0";
    ui.rightHint.style.opacity = state.pointer.deltaX > 0 ? String(opacity) : "0";
  });

  const endPointer = () => {
    if (!state.pointer.isDown || state.swipeLock) return;
    state.pointer.isDown = false;
    if (state.pointer.deltaX <= -threshold) {
      registerChoice("ai");
      return;
    }
    if (state.pointer.deltaX >= threshold) {
      registerChoice("real");
      return;
    }
    resetCardTransform();
  };

  ui.swipeCard.addEventListener("pointerup", endPointer);
  ui.swipeCard.addEventListener("pointercancel", endPointer);
}

function bindEvents() {
  ui.consentCheckbox.addEventListener("change", () => {
    ui.startProfileBtn.disabled = !ui.consentCheckbox.checked;
  });

  ui.startProfileBtn.addEventListener("click", () => showView("profile"));
  ui.toConsentBtn.addEventListener("click", () => showView("consent"));

  ui.beginGameBtn.addEventListener("click", () => {
    if (!ui.profileForm.checkValidity()) {
      ui.profileForm.reportValidity();
      return;
    }
    state.profile = formToObject(ui.profileForm);
    beginGame();
  });

  ui.guessAiBtn.addEventListener("click", () => registerChoice("ai"));
  ui.guessRealBtn.addEventListener("click", () => registerChoice("real"));

  ui.playAgainBtn.addEventListener("click", () => {
    showView("profile");
  });

  ui.downloadSessionBtn.addEventListener("click", () => {
    if (!state.latestSession) return;
    const file = JSON.stringify(state.latestSession, null, 2);
    downloadFile(`session-${state.latestSession.sessionId}.json`, file, "application/json");
  });

  ui.downloadCsvBtn.addEventListener("click", () => {
    if (!state.latestSession) return;
    const csv = convertSessionToCsv(state.latestSession);
    downloadFile(`session-${state.latestSession.sessionId}.csv`, csv, "text/csv");
  });

  ui.downloadAllBtn.addEventListener("click", () => {
    const sessions = loadSessions();
    downloadFile(
      `all-local-sessions-${Date.now()}.json`,
      JSON.stringify(sessions, null, 2),
      "application/json",
    );
  });

  ui.clearAllBtn.addEventListener("click", () => {
    const proceed = window.confirm("Clear all locally stored sessions on this browser?");
    if (!proceed) return;
    localStorage.removeItem(STORAGE_KEYS.sessions);
    alert("Local session store has been cleared.");
    renderDashboard();
  });

  ui.openDashboardBtn.addEventListener("click", () => openDashboard());
  ui.openDashboardFromResultBtn.addEventListener("click", () => openDashboard());
  ui.closeDashboardBtn.addEventListener("click", () => showView("consent"));
  ui.resetDashboardFiltersBtn.addEventListener("click", () => {
    ui.filterAgeGroup.value = "all";
    ui.filterGender.value = "all";
    ui.filterAiFamiliarity.value = "all";
    renderDashboard();
  });

  [ui.filterAgeGroup, ui.filterGender, ui.filterAiFamiliarity].forEach((select) => {
    select.addEventListener("change", () => renderDashboard());
  });

  ui.openBuilderBtn.addEventListener("click", () => showView("builder"));
  ui.closeBuilderBtn.addEventListener("click", () => showView("consent"));

  ui.addCardBtn.addEventListener("click", async () => {
    if (!ui.builderForm.checkValidity()) {
      ui.builderForm.reportValidity();
      return;
    }

    const data = new FormData(ui.builderForm);
    const file = data.get("imageFile");
    if (!(file instanceof File)) return;

    const imageDataUrl = await fileToDataUrl(file);
    const title = String(data.get("title") || "Untitled");
    const truth = String(data.get("truth") || "ai");
    const id = `${truth}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    state.dataset.items.push({
      id,
      title,
      truth,
      image: imageDataUrl,
      source: "Uploaded by researcher",
    });

    saveCustomDataset();
    ui.builderForm.reset();
  });

  ui.exportDatasetBtn.addEventListener("click", () => {
    if (!state.dataset) return;
    downloadFile("dataset-export.json", JSON.stringify(state.dataset, null, 2), "application/json");
  });

  ui.importDatasetInput.addEventListener("change", async (event) => {
    const target = event.target;
    const file = target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed.items)) {
        throw new Error("Dataset JSON must include an items array.");
      }
      state.dataset = parsed;
      saveCustomDataset();
      alert("Dataset imported.");
    } catch (error) {
      alert(`Import failed: ${error.message}`);
    } finally {
      target.value = "";
    }
  });

  ui.resetDatasetBtn.addEventListener("click", async () => {
    localStorage.removeItem(STORAGE_KEYS.customDataset);
    await loadDataset();
    alert("Dataset reset to default.");
  });

  bindSwipe();
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read image file."));
    reader.readAsDataURL(file);
  });
}

async function init() {
  await loadDataset();
  bindEvents();
  showView("consent");
}

init();
