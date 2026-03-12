const STORAGE_KEYS = {
  sessions: "sts_sessions_v1",
};

const DEFAULT_DATASET_FALLBACK = {
  name: "Starter Demo Set",
  version: "1.0",
  items: [
    {
      id: "real-1",
      title: "Suburban House",
      description: "A daylight suburban home advert featuring warm, natural shadows.",
      truth: "real",
      image: "assets/images/real-1.svg",
      source: "Prototype synthetic artwork",
    },
    {
      id: "real-2",
      title: "Rustic Cottage",
      description: "A countryside property listing with realistic texture and lighting cues.",
      truth: "real",
      image: "assets/images/real-2.svg",
      source: "Prototype synthetic artwork",
    },
    {
      id: "real-3",
      title: "Product Card Mockup",
      description: "A clean lifestyle campaign mockup showing a genuine product scene.",
      truth: "real",
      image: "assets/images/real-3.svg",
      source: "Prototype synthetic artwork",
    },
    {
      id: "ai-1",
      title: "Dream Portrait",
      description: "A stylized portrait ad with polished details and synthetic composition.",
      truth: "ai",
      image: "assets/images/ai-1.svg",
      source: "Prototype synthetic artwork",
    },
    {
      id: "ai-2",
      title: "Geometric Core",
      description: "A conceptual campaign visual generated with geometric AI aesthetics.",
      truth: "ai",
      image: "assets/images/ai-2.svg",
      source: "Prototype synthetic artwork",
    },
    {
      id: "ai-3",
      title: "Neural Glow",
      description: "An abstract glowing ad graphic with typical AI texture artifacts.",
      truth: "ai",
      image: "assets/images/ai-3.svg",
      source: "Prototype synthetic artwork",
    },
  ],
};

const views = {
  consent: document.getElementById("consentView"),
  profile: document.getElementById("profileView"),
  game: document.getElementById("gameView"),
  result: document.getElementById("resultView"),
  dashboard: document.getElementById("dashboardView"),
};

const ui = {
  consentCheckbox: document.getElementById("consentCheckbox"),
  startProfileBtn: document.getElementById("startProfileBtn"),
  toConsentBtn: document.getElementById("toConsentBtn"),
  beginGameBtn: document.getElementById("beginGameBtn"),
  profileForm: document.getElementById("profileForm"),

  swipeCard: document.getElementById("swipeCard"),
  cardImage: document.getElementById("cardImage"),
  choiceTint: document.getElementById("choiceTint"),
  cardImageCounter: document.getElementById("cardImageCounter"),
  imagePrevBtn: document.getElementById("imagePrevBtn"),
  imageNextBtn: document.getElementById("imageNextBtn"),
  cardTitle: document.getElementById("cardTitle"),
  cardPrice: document.getElementById("cardPrice"),
  cardDescription: document.getElementById("cardDescription"),
  cardDescriptionMoreBtn: document.getElementById("cardDescriptionMoreBtn"),
  leftHint: document.getElementById("leftHint"),
  rightHint: document.getElementById("rightHint"),
  guessAiBtn: document.getElementById("guessAiBtn"),
  guessRealBtn: document.getElementById("guessRealBtn"),

  descriptionOverlay: document.getElementById("descriptionOverlay"),
  descriptionOverlayBackdrop: document.getElementById("descriptionOverlayBackdrop"),
  descriptionOverlayText: document.getElementById("descriptionOverlayText"),
  closeDescriptionOverlayBtn: document.getElementById("closeDescriptionOverlayBtn"),

  finalHeadline: document.getElementById("finalHeadline"),
  finalSummary: document.getElementById("finalSummary"),
  correctCount: document.getElementById("correctCount"),
  avgTime: document.getElementById("avgTime"),
  percentile: document.getElementById("percentile"),
  downloadSessionBtn: document.getElementById("downloadSessionBtn"),
  downloadCsvBtn: document.getElementById("downloadCsvBtn"),
  playAgainBtn: document.getElementById("playAgainBtn"),
  downloadAllBtn: document.getElementById("downloadAllBtn"),
  clearAllBtn: document.getElementById("clearAllBtn"),
  wrongAnswersSection: document.getElementById("wrongAnswersSection"),
  wrongAnswersGrid: document.getElementById("wrongAnswersGrid"),

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
};

const state = {
  dataset: null,
  activeCards: [],
  currentIndex: 0,
  correct: 0,
  profile: null,
  responses: [],
  cardStartedAt: 0,
  currentImageIndex: 0,
  sessionStartedAt: 0,
  latestSession: null,
  swipeLock: false,
  pointer: {
    isDown: false,
    startX: 0,
    deltaX: 0,
    mode: "choice",
  },
  overlayOpen: false,
};

function normalizeCardText(value, fallback = "") {
  const normalized = String(value || "").trim();
  return normalized || fallback;
}

function extractPriceAndDescription(item) {
  const descriptionRaw = normalizeCardText(item?.description, "");
  const explicitPrice = normalizeCardText(item?.price, "");

  if (explicitPrice) {
    return {
      price: explicitPrice,
      description: descriptionRaw,
    };
  }

  const leadingPriceMatch = descriptionRaw.match(
    /^((?:EUR|USD|GBP)\s?\d[\d.,]*|[€$£]\s?\d[\d.,]*)\s*[-:|]\s*/i,
  );

  if (!leadingPriceMatch) {
    return {
      price: "Not listed",
      description: descriptionRaw,
    };
  }

  const extractedPrice = normalizeCardText(leadingPriceMatch[1], "Not listed");
  const trimmedDescription = normalizeCardText(
    descriptionRaw.slice(leadingPriceMatch[0].length),
    descriptionRaw,
  );

  return {
    price: extractedPrice,
    description: trimmedDescription,
  };
}

function normalizeDataset(rawDataset) {
  const dataset = rawDataset && typeof rawDataset === "object" ? rawDataset : {};
  const items = Array.isArray(dataset.items) ? dataset.items : [];

  const normalizedItems = items
    .map((item) => {
      const imageList = [];

      if (typeof item?.image === "string" && item.image.trim()) {
        imageList.push(item.image.trim());
      }

      if (Array.isArray(item?.images)) {
        item.images.forEach((image) => {
          if (typeof image === "string" && image.trim()) {
            imageList.push(image.trim());
          }
        });
      }

      const uniqueImages = [...new Set(imageList)];
      if (uniqueImages.length === 0) return null;

      const textMeta = extractPriceAndDescription(item);

      return {
        ...item,
        price: textMeta.price,
        description: textMeta.description,
        image: uniqueImages[0],
        images: uniqueImages,
      };
    })
    .filter(Boolean);

  return {
    name: dataset.name || "Untitled Dataset",
    version: dataset.version || "1.0",
    items: normalizedItems,
  };
}

function getCardImages(card) {
  if (!card) return [];
  if (Array.isArray(card.images) && card.images.length > 0) return card.images;
  if (typeof card.image === "string" && card.image.trim()) return [card.image];
  return [];
}

function resolveImageSrc(src) {
  if (!src) return "";
  if (/^(data:|blob:|https?:|file:)/i.test(src)) return src;
  if (src.startsWith("/")) {
    return `${window.location.origin}${src}`;
  }
  return new URL(src, window.location.href).href;
}

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
  try {
    const response = await fetch("data/default-dataset.json");
    if (!response.ok) {
      throw new Error(`Default dataset request failed with ${response.status}`);
    }
    state.dataset = normalizeDataset(await response.json());
  } catch {
    // Fallback keeps the app functional when opened via file:// or when fetch paths fail.
    state.dataset = normalizeDataset(DEFAULT_DATASET_FALLBACK);
  }
}

function beginGame() {
  if (!state.dataset || !Array.isArray(state.dataset.items) || state.dataset.items.length < 3) {
    alert("Please provide at least 3 dataset cards before starting.");
    showView("consent");
    return;
  }

  state.activeCards = shuffle(state.dataset.items);
  state.currentIndex = 0;
  state.correct = 0;
  state.responses = [];
  state.sessionStartedAt = Date.now();
  state.currentImageIndex = 0;
  state.swipeLock = false;
  showView("game");
  renderCurrentCard();
}

function preloadCardImages(cardIndex) {
  const card = state.activeCards[cardIndex];
  if (!card) return;
  getCardImages(card).forEach((src) => {
    const img = new Image();
    img.src = resolveImageSrc(src);
  });
}

function updateDescriptionOverflowControl() {
  if (!ui.cardDescription || !ui.cardDescriptionMoreBtn) return;
  requestAnimationFrame(() => {
    const hasOverflow = ui.cardDescription.scrollHeight - ui.cardDescription.clientHeight > 1;
    ui.cardDescriptionMoreBtn.hidden = !hasOverflow;
  });
}

function openDescriptionOverlay() {
  const card = state.activeCards[state.currentIndex];
  if (!card) return;

  const fullDescription = normalizeCardText(card.description, "No description provided for this ad.");
  ui.descriptionOverlayText.textContent = fullDescription;
  ui.descriptionOverlay.hidden = false;
  state.overlayOpen = true;
  document.body.style.overflow = "hidden";
}

function closeDescriptionOverlay() {
  ui.descriptionOverlay.hidden = true;
  state.overlayOpen = false;
  document.body.style.overflow = "";
}

function renderCurrentCard() {
  const card = state.activeCards[state.currentIndex];
  if (!card) {
    finishGame();
    return;
  }

  state.currentImageIndex = 0;
  renderCardImage();
  ui.cardTitle.textContent = card.title;
  ui.cardPrice.textContent = `Price: ${normalizeCardText(card.price, "Not listed")}`;
  ui.cardDescription.textContent =
    normalizeCardText(card.description, "No description provided for this ad.");
  ui.cardDescriptionMoreBtn.hidden = true;
  closeDescriptionOverlay();
  updateDescriptionOverflowControl();
  resetCardTransform();
  state.cardStartedAt = Date.now();

  // Preload all images for current card + the next two cards
  preloadCardImages(state.currentIndex);
  preloadCardImages(state.currentIndex + 1);
  preloadCardImages(state.currentIndex + 2);
}

function renderCardImage() {
  const card = state.activeCards[state.currentIndex];
  const images = getCardImages(card);
  if (images.length === 0) {
    ui.cardImage.removeAttribute("src");
    ui.cardImageCounter.hidden = true;
    ui.imagePrevBtn.hidden = true;
    ui.imageNextBtn.hidden = true;
    return;
  }

  if (state.currentImageIndex >= images.length) {
    state.currentImageIndex = images.length - 1;
  }
  if (state.currentImageIndex < 0) {
    state.currentImageIndex = 0;
  }

  ui.cardImage.src = resolveImageSrc(images[state.currentImageIndex]);
  const hasMultiple = images.length > 1;
  ui.cardImageCounter.hidden = !hasMultiple;
  ui.cardImageCounter.textContent = `${state.currentImageIndex + 1} / ${images.length}`;
  ui.imagePrevBtn.hidden = !hasMultiple;
  ui.imageNextBtn.hidden = !hasMultiple;
  ui.imagePrevBtn.disabled = state.currentImageIndex === 0;
  ui.imageNextBtn.disabled = state.currentImageIndex === images.length - 1;
}

function moveCardImage(step) {
  const card = state.activeCards[state.currentIndex];
  const images = getCardImages(card);
  if (images.length <= 1) return false;

  const nextIndex = state.currentImageIndex + step;
  if (nextIndex < 0 || nextIndex >= images.length) return false;

  const currentImg = ui.cardImage;
  const stage = currentImg.parentElement;
  const direction = step > 0 ? 1 : -1;
  const imgHeight = currentImg.offsetHeight || currentImg.clientHeight || 300;

  // Create incoming image element
  const incomingImg = document.createElement("img");
  incomingImg.src = resolveImageSrc(images[nextIndex]);
  incomingImg.alt = currentImg.alt;
  incomingImg.style.cssText = [
    "position:absolute",
    "top:0",
    "left:0",
    "width:100%",
    `height:${imgHeight}px`,
    "object-fit:cover",
    "background:#e6ebf4",
    `transform:translateX(${direction * 100}%)`,
    "transition:transform 320ms cubic-bezier(0.25,0.46,0.45,0.94)",
    "will-change:transform",
  ].join(";");
  stage.appendChild(incomingImg);

  // Slide current image out
  currentImg.style.transition = "transform 320ms cubic-bezier(0.25,0.46,0.45,0.94)";
  currentImg.style.willChange = "transform";

  // Trigger transition on next frame
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      incomingImg.style.transform = "translateX(0%)";
      currentImg.style.transform = `translateX(${-direction * 100}%)`;
    });
  });

  incomingImg.addEventListener("transitionend", () => {
    // Swap: update the real img src and reset
    state.currentImageIndex = nextIndex;
    currentImg.style.transition = "";
    currentImg.style.transform = "";
    currentImg.style.willChange = "";
    renderCardImage();
    stage.removeChild(incomingImg);
  }, { once: true });

  return true;
}

function resetCardTransform() {
  ui.swipeCard.style.transition = "transform 180ms ease";
  ui.swipeCard.style.transform = "translateX(0) rotate(0deg)";
  ui.cardImage.style.transition = "transform 180ms ease";
  ui.cardImage.style.transform = "translateX(0)";
  ui.choiceTint.style.opacity = "0";
  ui.choiceTint.classList.remove("ai", "real");
  ui.leftHint.style.opacity = "0";
  ui.rightHint.style.opacity = "0";
}

function getCardPrimaryImage(card) {
  const images = getCardImages(card);
  if (images.length === 0) return "";
  return resolveImageSrc(images[0]);
}

function renderWrongAnswers(session) {
  const wrongResponses = (session.responses || []).filter((response) => !response.correct);
  ui.wrongAnswersGrid.innerHTML = "";

  if (wrongResponses.length === 0) {
    ui.wrongAnswersSection.hidden = true;
    return;
  }

  wrongResponses.forEach((response) => {
    const sourceCard = state.dataset?.items?.find((item) => item.id === response.itemId);
    const item = document.createElement("article");
    item.className = "wrong-answer-item";

    const imageSrc = getCardPrimaryImage(sourceCard);
    if (imageSrc) {
      const image = document.createElement("img");
      image.src = imageSrc;
      image.alt = `${response.title || "Item"} preview`;
      item.appendChild(image);
    }

    const meta = document.createElement("div");
    meta.className = "wrong-answer-meta";

    const title = document.createElement("p");
    title.className = "wrong-answer-title";
    title.textContent = response.title || "Untitled item";

    const detail = document.createElement("p");
    detail.className = "wrong-answer-detail";
    detail.textContent = `You chose ${String(response.userChoice || "").toUpperCase()} | Actual ${String(response.truth || "").toUpperCase()}`;

    meta.appendChild(title);
    meta.appendChild(detail);
    item.appendChild(meta);
    ui.wrongAnswersGrid.appendChild(item);
  });

  ui.wrongAnswersSection.hidden = false;
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
  ui.choiceTint.classList.remove("ai", "real");
  ui.choiceTint.classList.add(choice);
  ui.choiceTint.style.opacity = "0.82";
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
  renderWrongAnswers(session);

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
  const choiceThreshold = 90;
  const imageThreshold = 50;

  ui.swipeCard.addEventListener("pointerdown", (event) => {
    if (state.swipeLock) return;
    if (event.target instanceof Element && event.target.closest(".image-nav-btn")) return;
    const card = state.activeCards[state.currentIndex];
    const imageCount = getCardImages(card).length;

    state.pointer.isDown = true;
    state.pointer.startX = event.clientX;
    state.pointer.deltaX = 0;
    state.pointer.mode =
      imageCount > 1 && event.target instanceof Element && event.target.closest(".image-stage")
        ? "image"
        : "choice";

    if (state.pointer.mode === "image") {
      ui.cardImage.style.transition = "none";
    } else {
      ui.swipeCard.style.transition = "none";
    }

    ui.swipeCard.setPointerCapture(event.pointerId);
  });

  ui.swipeCard.addEventListener("pointermove", (event) => {
    if (!state.pointer.isDown || state.swipeLock) return;
    state.pointer.deltaX = event.clientX - state.pointer.startX;

    if (state.pointer.mode === "image") {
      ui.cardImage.style.transform = `translateX(${state.pointer.deltaX}px)`;
      return;
    }

    const rotate = state.pointer.deltaX * 0.05;
    ui.swipeCard.style.transform = `translateX(${state.pointer.deltaX}px) rotate(${rotate}deg)`;

    const opacity = Math.min(Math.abs(state.pointer.deltaX) / choiceThreshold, 1);
    ui.leftHint.style.opacity = state.pointer.deltaX < 0 ? String(opacity) : "0";
    ui.rightHint.style.opacity = state.pointer.deltaX > 0 ? String(opacity) : "0";

    const tintClass = state.pointer.deltaX < 0 ? "ai" : "real";
    ui.choiceTint.classList.remove("ai", "real");
    ui.choiceTint.classList.add(tintClass);
    ui.choiceTint.style.opacity = String(Math.min(opacity * 0.68, 0.68));
  });

  const endPointer = () => {
    if (!state.pointer.isDown || state.swipeLock) return;
    state.pointer.isDown = false;

    if (state.pointer.mode === "image") {
      if (state.pointer.deltaX <= -imageThreshold) {
        moveCardImage(1);
      } else if (state.pointer.deltaX >= imageThreshold) {
        moveCardImage(-1);
      }
      ui.cardImage.style.transition = "transform 180ms ease";
      ui.cardImage.style.transform = "translateX(0)";
      state.pointer.mode = "choice";
      return;
    }

    if (state.pointer.deltaX <= -choiceThreshold) {
      registerChoice("ai");
      return;
    }
    if (state.pointer.deltaX >= choiceThreshold) {
      registerChoice("real");
      return;
    }
    state.pointer.mode = "choice";
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

  ui.imagePrevBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    moveCardImage(-1);
  });
  ui.imageNextBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    moveCardImage(1);
  });

  ui.cardDescriptionMoreBtn.addEventListener("click", () => openDescriptionOverlay());
  ui.closeDescriptionOverlayBtn.addEventListener("click", () => closeDescriptionOverlay());
  ui.descriptionOverlayBackdrop.addEventListener("click", () => closeDescriptionOverlay());

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && state.overlayOpen) {
      closeDescriptionOverlay();
    }
  });

  window.addEventListener("resize", () => {
    if (!views.game.classList.contains("active")) return;
    updateDescriptionOverflowControl();
  });

  [ui.imagePrevBtn, ui.imageNextBtn].forEach((btn) => {
    btn.addEventListener("pointerdown", (event) => event.stopPropagation());
    btn.addEventListener("pointerup", (event) => event.stopPropagation());
  });

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

  bindSwipe();
}

async function init() {
  await loadDataset();
  bindEvents();
  showView("consent");
}

init();
