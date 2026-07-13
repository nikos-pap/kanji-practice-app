const DATA_URL = './data/kanji-practice.json';
const KANJI_READINGS_URL = './data/kanji-readings.txt';
const MODE_IDS = ['pool', 'reading', 'meaning'];
const KANJI_PATTERN = /[\u3400-\u4DBF\u4E00-\u9FFF々〆ヵヶ]/u;
const PROGRESS_STORAGE_KEY = 'genki-kanji-progress-v1';
const ACTIVE_ENTRY_LIMIT = 8;
const MASTERED_LEVEL = 4;
const REVIEW_INTERVALS_MS = [0, 10 * 60 * 1000, 24 * 60 * 60 * 1000, 3 * 24 * 60 * 60 * 1000, 7 * 24 * 60 * 60 * 1000];
// Unicode 17 kRSUnicode radical/residual-stroke order, limited to kanji used by this app.
const KANJI_DICTIONARY_ORDER = [
  '一七丈三上下不世両中主久乏乗九乳乾予事二五交人今介仕他付代以仲伎休会伝伺似低住体何作使例供価便係保信俳個借停健側傘備働僕僚優元兄先光免入全八公六共具内円冊再最写冬冷出分切刈初別利券',
  '刺刻前割加助勉動勝募包化北匹医十午半卒南単危卵厳去参友反取受口古句召台史右号合同名吐君吸吹呂告味呼咲品員問喉喫器四回困図国園土地坊堂報場塾境壊士売変夏夕外多夜夢大天太夫失奥奨女好妹',
  '姉始婚婦嫌嬢子字季学宅宇守安官宙定宝実客室家容宿寂寄密寒寝察寮寺対専将射小少就尻局屋履山川工左差布師席帯帰帳帽年幸幹広店府度座庫庭康建弁式引弟張強弾当形彼往待後復徹心忘忙念怖思怠急',
  '性恥悩悪悲情想意感慢慣慮成我戻所扇手払抗折押招拾持指振捕捨掃授探接推描換携撮支改攻放政敗教散敬数整敵文料新方旅族日早明昔映春昨是昼時晩普晴暑暇暖暗暮曇曜曲書替月有服朝期木末本札机束',
  '来杯東板枚果査校格案桜棒業楽構様機次欲歌止正歩歯歳歴死残殴段母毎比毛氏気水汚池決沸油治泉泊法泣泥注泳洗活浴海消涼混渇済渡温港湖湯準滴漢漫濯火灰点無然焼煙照熱父片牛物特犬犯状狭猫猿現',
  '球理環甘生産用由申男町画界留番疲疹病症痛痢発登白皆皮皿盆盗目直相眉看真眠眼着知短砂研磨礼社祈神祭禁私秋科秘税種究空窓立笑符筆答節簡粉粧糖系約紅紙素紫紹紺終経結絡給統絵絶続緊緑緒線締',
  '編練績置美習翻考者耳聞職肉肩育背胸脱膚自致興舞船色花若英茶荷菓菜落葉蔵薦薬虫蚊行術表袋西見覚覧親観角触言計記許訳証試話誠誌誕誘語説読調談講謝警議護豚象負財貧買貸貼賃賛質赤走起越趣足',
  '踊踏身車転軽輩輪辛辞込迎近返迷送通速連週遅遊運道違遠遣選邪部郵都配酒酔重野金鉄鉛銀鍵鏡長閉開間関防降院除険階際隣集雑離難雨雪電震青静非面靴韓音頂預頑領頭頼題額顔願類風飛食飯飲飼館首',
  '駄駅験骨高髪魚鶏黄黒鼻々',
].join('');
const KANJI_DICTIONARY_RANK = new Map(
  Array.from(KANJI_DICTIONARY_ORDER, (kanji, index) => [kanji, index]),
);

const state = {
  data: null,
  mode: null,
  setId: null,
  answers: new Map(),
  poolTiles: [],
  selectedTileId: null,
  activeSlot: null,
  checked: false,
  poolFilter: '',
  progress: {},
  activeEntryIds: [],
  lastStudyEntryId: null,
  skippedStudyEntryIds: new Set(),
  kanjiReadings: new Map(),
};

const els = {
  appTitle: document.querySelector('#appTitle'),
  subtitle: document.querySelector('#screenSubtitle'),
  loading: document.querySelector('#loadingScreen'),
  error: document.querySelector('#errorScreen'),
  errorMessage: document.querySelector('#errorMessage'),
  modeScreen: document.querySelector('#modeScreen'),
  modeCards: document.querySelector('#modeCards'),
  practiceScreen: document.querySelector('#practiceScreen'),
  backButton: document.querySelector('#backButton'),
  resetButton: document.querySelector('#resetButton'),
  setSelect: document.querySelector('#setSelect'),
  skipButton: document.querySelector('#skipButton'),
  checkButton: document.querySelector('#checkButton'),
  poolCheckButton: document.querySelector('#poolCheckButton'),
  poolStudyActions: document.querySelector('#poolStudyActions'),
  questionsPanel: document.querySelector('#questionsPanel'),
  studyContext: document.querySelector('#studyContext'),
  studyCounter: document.querySelector('#studyCounter'),
  studyMastered: document.querySelector('#studyMastered'),
  studyProgressTrack: document.querySelector('#studyProgressTrack'),
  studyStartedBar: document.querySelector('#studyStartedBar'),
  studyProgressBar: document.querySelector('#studyProgressBar'),
  poolPanel: document.querySelector('#poolPanel'),
  poolHint: document.querySelector('#poolHint'),
  poolFilter: document.querySelector('#poolFilter'),
  clearPoolFilter: document.querySelector('#clearPoolFilter'),
  poolFilterStatus: document.querySelector('#poolFilterStatus'),
  kanjiPool: document.querySelector('#kanjiPool'),
  status: document.querySelector('#statusMessage'),
  progressPanel: document.querySelector('#progressPanel'),
  progressMastered: document.querySelector('#progressMastered'),
  progressLearning: document.querySelector('#progressLearning'),
  progressNew: document.querySelector('#progressNew'),
  progressDue: document.querySelector('#progressDue'),
  progressStartedBar: document.querySelector('#progressStartedBar'),
  progressMasteredBar: document.querySelector('#progressMasteredBar'),
  progressTrack: document.querySelector('.progress-track'),
  progressNote: document.querySelector('#progressNote'),
  clearCurrentProgress: document.querySelector('#clearCurrentProgress'),
  clearAllProgress: document.querySelector('#clearAllProgress'),
  questionTemplate: document.querySelector('#questionTemplate'),
};

function characters(text) {
  return Array.from(text || '');
}

function isKanjiCharacter(character) {
  return KANJI_PATTERN.test(character);
}

function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function wordFor(entry) {
  return entry.word || entry.answer || '';
}

function kanjiCharactersFor(entry) {
  return characters(wordFor(entry)).filter(isKanjiCharacter);
}

function wordSegmentsFor(entry) {
  const segments = [];
  let fixedText = '';
  let slotIndex = 0;

  const flushFixed = () => {
    if (!fixedText) return;
    segments.push({ type: 'fixed', text: fixedText });
    fixedText = '';
  };

  for (const character of characters(wordFor(entry))) {
    if (isKanjiCharacter(character)) {
      flushFixed();
      segments.push({ type: 'kanji', expected: character, slotIndex });
      slotIndex += 1;
    } else {
      fixedText += character;
    }
  }
  flushFixed();
  return segments;
}

function meaningsFor(entry) {
  if (Array.isArray(entry.meanings) && entry.meanings.length) return entry.meanings;
  const primary = entry.meaning || entry.prompt;
  return typeof primary === 'string' && primary.trim() ? [primary] : [];
}

function primaryMeaningFor(entry) {
  return entry.meaning || meaningsFor(entry)[0] || entry.prompt || '';
}

function readingsFor(entry) {
  return Array.isArray(entry.readings) ? entry.readings : [];
}

function romajiFor(entry) {
  if (Array.isArray(entry.romaji)) return entry.romaji;
  if (typeof entry.romaji === 'string' && entry.romaji.trim()) return [entry.romaji];
  return [];
}

function validateData(data) {
  if (!data || typeof data !== 'object') throw new Error('The JSON root must be an object.');
  if (!Array.isArray(data.practiceSets) || data.practiceSets.length === 0) {
    throw new Error('practiceSets must contain at least one practice set.');
  }

  for (const set of data.practiceSets) {
    if (!set.id || !set.title || !Array.isArray(set.entries) || set.entries.length === 0) {
      throw new Error('Each practice set needs id, title, and at least one entry.');
    }

    for (const entry of set.entries) {
      if (!entry.id || !wordFor(entry)) {
        throw new Error(`Invalid entry in set "${set.id}". Each entry needs id and word.`);
      }
      if (kanjiCharactersFor(entry).length === 0) {
        throw new Error(`Entry "${entry.id}" has no kanji in its written form.`);
      }
      if (meaningsFor(entry).length === 0) {
        throw new Error(`Entry "${entry.id}" needs meaning or meanings.`);
      }
      if (readingsFor(entry).length === 0) {
        throw new Error(`Entry "${entry.id}" needs at least one reading.`);
      }
    }
  }
}

async function loadData() {
  try {
    const [response, readingsResponse] = await Promise.all([
      fetch(DATA_URL, { cache: 'no-store' }),
      fetch(KANJI_READINGS_URL, { cache: 'no-store' }),
    ]);
    if (!response.ok) throw new Error(`HTTP ${response.status} while loading ${DATA_URL}`);
    if (!readingsResponse.ok) {
      throw new Error(`HTTP ${readingsResponse.status} while loading ${KANJI_READINGS_URL}`);
    }
    const [data, readingsText] = await Promise.all([response.json(), readingsResponse.text()]);
    validateData(data);
    state.data = data;
    state.kanjiReadings = parseKanjiReadings(readingsText);
    if (state.kanjiReadings.size === 0) throw new Error('The kanji reading index is empty.');
    state.progress = loadStoredProgress();
    state.setId = data.practiceSets[0].id;
    els.appTitle.textContent = data.app?.title || 'Kanji Practice';
    renderModeScreen();
    showScreen('modes');
  } catch (error) {
    els.loading.classList.add('hidden');
    els.error.classList.remove('hidden');
    els.errorMessage.textContent = error instanceof Error ? error.message : String(error);
  }
}

function parseKanjiReadings(text) {
  const readingsByKanji = new Map();

  for (const record of String(text).trim().split('|')) {
    const separator = record.indexOf('=');
    if (separator <= 0) continue;

    const kanji = record.slice(0, separator);
    const readings = record
      .slice(separator + 1)
      .split(',')
      .map(normalizeRomaji)
      .filter(Boolean);
    if (readings.length > 0) readingsByKanji.set(kanji, new Set(readings));
  }

  return readingsByKanji;
}

function showScreen(name) {
  els.loading.classList.add('hidden');
  els.error.classList.add('hidden');
  els.modeScreen.classList.toggle('hidden', name !== 'modes');
  els.practiceScreen.classList.toggle('hidden', name !== 'practice');
  els.backButton.classList.toggle('hidden', name !== 'practice');
  els.resetButton.classList.toggle('hidden', name !== 'practice' || state.mode === 'pool');
  requestAnimationFrame(updatePoolTrayHeight);
}

function defaultModes() {
  return [
    {
      id: 'pool',
      label: 'Meaning → Kanji',
      description: 'Build each word from the shared reusable kanji pool.',
    },
    {
      id: 'reading',
      label: 'Kanji → Reading',
      description: 'See the written word and type its reading.',
    },
    {
      id: 'meaning',
      label: 'Kanji → Meaning',
      description: 'See the written word and type its meaning.',
    },
  ];
}

function modeIcon(modeId) {
  if (modeId === 'pool') return '組';
  if (modeId === 'reading') return '読';
  return '意';
}

function renderModeScreen() {
  const configured = state.data.app?.availableModes;
  const modes = Array.isArray(configured) && configured.length ? configured : defaultModes();

  els.subtitle.textContent = 'Choose how you want to practice.';
  els.modeCards.replaceChildren();

  for (const mode of modes.filter((item) => MODE_IDS.includes(item.id))) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'mode-card';
    button.innerHTML = `
      <span class="mode-icon" aria-hidden="true">${modeIcon(mode.id)}</span>
      <h2>${escapeHtml(mode.label)}</h2>
      <p>${escapeHtml(mode.description || '')}</p>
      <span class="enter">Open mode →</span>
    `;
    button.addEventListener('click', () => openMode(mode.id));
    els.modeCards.append(button);
  }
}

function openMode(mode) {
  state.mode = mode;
  state.lastStudyEntryId = null;
  state.skippedStudyEntryIds.clear();
  state.poolFilter = '';
  els.poolFilter.value = '';
  populateSetSelect();
  selectActiveEntries();
  resetPractice();

  const subtitles = {
    pool: 'Build the word shown by its meaning.',
    reading: 'Type the reading of each written word.',
    meaning: 'Type the meaning of each written word.',
  };
  els.subtitle.textContent = subtitles[mode];
  els.poolPanel.classList.toggle('hidden', mode !== 'pool');
  els.studyContext.classList.toggle('hidden', mode !== 'pool');
  els.poolStudyActions.classList.toggle('hidden', mode !== 'pool');
  els.checkButton.classList.toggle('hidden', mode === 'pool');
  els.practiceScreen.classList.toggle('pool-mode', mode === 'pool');
  els.practiceScreen.classList.toggle('typed-mode', mode !== 'pool');
  document.body.classList.toggle('pool-practice', mode === 'pool');
  showScreen('practice');
}

function currentSet() {
  return state.data.practiceSets.find((set) => set.id === state.setId) || state.data.practiceSets[0];
}

function allEntries() {
  return currentSet().entries;
}

function currentEntries() {
  const activeIds = new Set(state.activeEntryIds);
  return allEntries().filter((entry) => activeIds.has(entry.id));
}

function progressRecordKey(entryId, setId = state.setId, mode = state.mode) {
  return `${setId}|${mode}|${entryId}`;
}

function progressRecordFor(entryId) {
  return state.progress[progressRecordKey(entryId)] || null;
}

function loadStoredProgress() {
  try {
    const parsed = JSON.parse(localStorage.getItem(PROGRESS_STORAGE_KEY) || '{}');
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function saveStoredProgress() {
  try {
    localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(state.progress));
  } catch {
    // Practice still works when storage is unavailable; only persistence is lost.
  }
}

function selectActiveEntries() {
  const now = Date.now();
  const entries = allEntries();
  const dueReviewed = [];
  const newEntries = [];

  entries.forEach((entry, sourceIndex) => {
    const record = progressRecordFor(entry.id);
    if (!record) {
      newEntries.push({ entry, sourceIndex });
      return;
    }
    if (Number(record.dueAt || 0) <= now) {
      dueReviewed.push({ entry, sourceIndex, dueAt: Number(record.dueAt || 0) });
    }
  });

  dueReviewed.sort((a, b) => a.dueAt - b.dueAt || a.sourceIndex - b.sourceIndex);
  const orderedCandidates = [...dueReviewed, ...newEntries];
  const candidates = state.mode === 'pool' ? shuffle(orderedCandidates) : orderedCandidates;
  let selected;

  if (state.mode === 'pool') {
    let available = candidates.filter(({ entry }) => (
      entry.id !== state.lastStudyEntryId && !state.skippedStudyEntryIds.has(entry.id)
    ));
    if (available.length === 0) {
      available = candidates.filter(({ entry }) => !state.skippedStudyEntryIds.has(entry.id));
    }
    if (available.length === 0 && candidates.length > 0) {
      state.skippedStudyEntryIds.clear();
      available = candidates.filter(({ entry }) => entry.id !== state.lastStudyEntryId);
    }
    selected = [available[0] || candidates[0]].filter(Boolean);
  } else {
    selected = candidates.slice(0, ACTIVE_ENTRY_LIMIT);
  }
  state.activeEntryIds = selected.map(({ entry }) => entry.id);
}

function progressStats() {
  const now = Date.now();
  let newCount = 0;
  let learning = 0;
  let mastered = 0;
  let due = 0;
  let nextDueAt = null;

  for (const entry of allEntries()) {
    const record = progressRecordFor(entry.id);
    if (!record) {
      newCount += 1;
      due += 1;
      continue;
    }

    if (Number(record.level || 0) >= MASTERED_LEVEL) mastered += 1;
    else learning += 1;

    const dueAt = Number(record.dueAt || 0);
    if (dueAt <= now) due += 1;
    else if (nextDueAt === null || dueAt < nextDueAt) nextDueAt = dueAt;
  }

  return { total: allEntries().length, newCount, learning, mastered, due, nextDueAt };
}

function formatNextReview(timestamp) {
  if (!timestamp) return '';
  const milliseconds = Math.max(0, timestamp - Date.now());
  const minutes = Math.ceil(milliseconds / 60000);
  if (minutes < 60) return `in ${minutes} minute${minutes === 1 ? '' : 's'}`;
  const hours = Math.ceil(minutes / 60);
  if (hours < 48) return `in ${hours} hour${hours === 1 ? '' : 's'}`;
  const days = Math.ceil(hours / 24);
  return `in ${days} day${days === 1 ? '' : 's'}`;
}

function renderProgress() {
  if (!state.mode) return;
  const stats = progressStats();
  const started = stats.learning + stats.mastered;
  const startedPercent = stats.total ? (started / stats.total) * 100 : 0;
  const masteredPercent = stats.total ? (stats.mastered / stats.total) * 100 : 0;

  els.progressMastered.textContent = `${stats.mastered} / ${stats.total}`;
  els.progressLearning.textContent = String(stats.learning);
  els.progressNew.textContent = String(stats.newCount);
  els.progressDue.textContent = String(stats.due);
  els.progressStartedBar.style.width = `${startedPercent}%`;
  els.progressMasteredBar.style.width = `${masteredPercent}%`;
  els.progressTrack.setAttribute('aria-valuenow', String(Math.round(masteredPercent)));

  if (state.activeEntryIds.length > 0) {
    els.progressNote.textContent = state.mode === 'pool'
      ? 'One word at a time. Progress is saved on this device.'
      : `${state.activeEntryIds.length} shown in lesson order. Progress is saved on this device.`;
  } else if (stats.nextDueAt) {
    els.progressNote.textContent = `Nothing is due now. Next review ${formatNextReview(stats.nextDueAt)}.`;
  } else {
    els.progressNote.textContent = 'No vocabulary remains in this lesson and mode.';
  }
}

function populateSetSelect() {
  els.setSelect.replaceChildren();
  for (const set of state.data.practiceSets) {
    const option = document.createElement('option');
    option.value = set.id;
    option.textContent = `${set.title} (${set.entries.length})`;
    option.selected = set.id === state.setId;
    els.setSelect.append(option);
  }
}

function resetPractice({ preservePool = false } = {}) {
  state.answers.clear();
  state.selectedTileId = null;
  state.activeSlot = null;
  state.checked = false;
  els.skipButton.disabled = false;
  els.checkButton.textContent = 'Check answers';
  els.poolCheckButton.textContent = 'Check word';
  hideStatus();

  for (const entry of currentEntries()) {
    const initialAnswer = state.mode === 'pool'
      ? Array(kanjiCharactersFor(entry).length).fill(null)
      : '';
    state.answers.set(entry.id, initialAnswer);
  }

  if (state.mode === 'pool') {
    if (!preservePool || state.poolTiles.length === 0) createPool();
  } else {
    state.poolTiles = [];
  }

  activateFirstEmptyStudySlot();

  renderQuestions();
  renderPool();
  renderProgress();
  requestAnimationFrame(updatePoolTrayHeight);
}

function currentStudyEntry() {
  return currentEntries()[0] || null;
}

function activateFirstEmptyStudySlot() {
  if (state.mode !== 'pool' || state.checked) return;
  const entry = currentStudyEntry();
  const answers = entry ? state.answers.get(entry.id) : null;
  const index = answers?.findIndex((value) => !value) ?? -1;
  state.activeSlot = entry && index >= 0 ? { entryId: entry.id, index } : null;
}

function renderStudyContext() {
  if (state.mode !== 'pool') return;
  const stats = progressStats();
  const started = stats.learning + stats.mastered;
  const startedPercent = stats.total ? (started / stats.total) * 100 : 0;
  const masteredPercent = stats.total ? (stats.mastered / stats.total) * 100 : 0;
  els.studyCounter.textContent = stats.due > 0 ? `${stats.due} due` : 'All caught up';
  els.studyMastered.textContent = `${stats.mastered} / ${stats.total} mastered`;
  els.studyStartedBar.style.width = `${startedPercent}%`;
  els.studyProgressBar.style.width = `${masteredPercent}%`;
  els.studyProgressTrack.setAttribute('aria-valuenow', String(Math.round(startedPercent)));
}

function createPool() {
  const orderedKanji = uniqueKanji().sort((left, right) => {
    const leftRank = KANJI_DICTIONARY_RANK.get(left) ?? Number.MAX_SAFE_INTEGER;
    const rightRank = KANJI_DICTIONARY_RANK.get(right) ?? Number.MAX_SAFE_INTEGER;
    return leftRank - rightRank || left.codePointAt(0) - right.codePointAt(0);
  });
  state.poolTiles = orderedKanji.map((kanji, index) => ({ id: `tile-${index}`, kanji }));
}

function renderQuestions() {
  els.questionsPanel.replaceChildren();
  renderStudyContext();

  if (currentEntries().length === 0) {
    const empty = document.createElement('div');
    empty.className = 'panel empty-questions';
    const stats = progressStats();
    empty.textContent = stats.nextDueAt
      ? `Nothing is due now. Next review ${formatNextReview(stats.nextDueAt)}.`
      : 'No vocabulary remains in this lesson and mode.';
    els.questionsPanel.append(empty);
    els.checkButton.disabled = true;
    els.poolCheckButton.disabled = true;
    els.skipButton.disabled = true;
    return;
  }

  els.checkButton.disabled = false;
  els.poolCheckButton.disabled = false;
  const entriesToRender = state.mode === 'pool'
    ? [currentStudyEntry()].filter(Boolean)
    : currentEntries();
  for (const entry of entriesToRender) {
    const fragment = els.questionTemplate.content.cloneNode(true);
    const card = fragment.querySelector('.question-card');
    const promptLabel = fragment.querySelector('.prompt-label');
    const prompt = fragment.querySelector('.prompt-text');
    const slots = fragment.querySelector('.slots');
    const typedAnswer = fragment.querySelector('.typed-answer');
    const typedLabel = fragment.querySelector('.typed-label');
    const typedInput = fragment.querySelector('.typed-input');
    const result = fragment.querySelector('.result-text');

    card.dataset.entryId = entry.id;
    result.dataset.resultFor = entry.id;

    if (state.mode === 'pool') {
      promptLabel.textContent = 'Meaning';
      prompt.textContent = primaryMeaningFor(entry);
      slots.classList.remove('hidden');
      renderSlots(entry, slots);
    } else {
      promptLabel.textContent = 'Written word';
      prompt.textContent = wordFor(entry);
      prompt.lang = 'ja';
      typedAnswer.classList.remove('hidden');
      typedLabel.textContent = state.mode === 'reading' ? 'Reading (kana or romaji)' : 'Meaning';
      typedInput.placeholder = state.mode === 'reading' ? 'Type kana or romaji…' : 'Type the meaning…';
      typedInput.value = state.answers.get(entry.id) || '';
      typedInput.disabled = state.checked;
      typedInput.lang = state.mode === 'reading' ? 'ja' : 'en';
      typedInput.spellcheck = state.mode === 'meaning';
      typedInput.setAttribute('aria-label', `${typedLabel.textContent} for ${wordFor(entry)}`);
      typedInput.addEventListener('input', () => {
        state.answers.set(entry.id, typedInput.value);
        clearCheckedVisuals();
      });
    }

    if (state.checked) renderResult(entry, card, result);
    els.questionsPanel.append(fragment);
  }
}

function renderSlots(entry, slots) {
  const answerValues = state.answers.get(entry.id);

  for (const segment of wordSegmentsFor(entry)) {
    if (segment.type === 'fixed') {
      const fixed = document.createElement('span');
      fixed.className = 'fixed-text';
      fixed.textContent = segment.text;
      fixed.lang = 'ja';
      slots.append(fixed);
      continue;
    }

    const index = segment.slotIndex;
    const value = answerValues[index];
    const slot = document.createElement('button');
    slot.type = 'button';
    slot.className = 'slot';
    slot.dataset.entryId = entry.id;
    slot.dataset.slotIndex = String(index);
    slot.setAttribute('aria-label', `Kanji slot ${index + 1} for ${primaryMeaningFor(entry)}`);

    if (value?.kanji) {
      slot.textContent = value.kanji;
      slot.classList.add('filled');
    }

    const isActive = state.activeSlot?.entryId === entry.id && state.activeSlot?.index === index;
    slot.classList.toggle('active', isActive);
    slot.setAttribute('aria-pressed', String(isActive));

    if (state.checked && isEntryAttempted(entry)) {
      slot.classList.add(slot.textContent === segment.expected ? 'correct' : 'incorrect');
    }
    slot.disabled = state.checked;

    slot.addEventListener('click', () => onSlotClick(entry.id, index));
    slot.addEventListener('dragover', (event) => event.preventDefault());
    slot.addEventListener('drop', (event) => {
      event.preventDefault();
      const tileId = event.dataTransfer.getData('text/plain');
      if (tileId) placePoolTile(tileId, entry.id, index);
    });
    slots.append(slot);
  }
}

function renderResult(entry, card, result) {
  if (!isEntryAttempted(entry)) return;
  const correct = isEntryCorrect(entry);
  card.classList.add(correct ? 'answer-correct' : 'answer-incorrect');

  if (correct) {
    result.textContent = state.mode === 'pool' ? 'Correct — nice recall.' : 'Correct';
    result.classList.add('good');
    return;
  }

  if (state.mode === 'pool') {
    result.textContent = `Correct answer: ${wordFor(entry)}`;
  } else if (state.mode === 'reading') {
    const accepted = [...readingsFor(entry), ...romajiFor(entry)];
    result.textContent = `Accepted reading: ${accepted.join(' / ')}`;
  } else {
    result.textContent = `Accepted meaning: ${meaningsFor(entry).join(' / ')}`;
  }
  result.classList.add('bad');
}

function onSlotClick(entryId, index) {
  const occupiedValue = state.answers.get(entryId)[index];
  const isSameActiveSlot = state.activeSlot?.entryId === entryId && state.activeSlot?.index === index;

  if (state.checked) {
    els.poolHint.textContent = 'Review the answer, then continue.';
  } else if (state.selectedTileId) {
    placePoolTile(state.selectedTileId, entryId, index);
    return;
  }

  if (occupiedValue) {
    clearSlot(entryId, index, true);
    return;
  }

  state.activeSlot = isSameActiveSlot ? null : { entryId, index };
  clearCheckedState();
  renderQuestions();
  renderPool();
}

function onPoolTileClick(tileId) {
  if (state.activeSlot) {
    const { entryId, index } = state.activeSlot;
    placePoolTile(tileId, entryId, index);
    return;
  }

  state.selectedTileId = state.selectedTileId === tileId ? null : tileId;
  renderPool();
}

function nextEmptySlotAfter(entryId, index) {
  let passedCurrentSlot = false;
  const entries = state.mode === 'pool'
    ? [currentStudyEntry()].filter(Boolean)
    : currentEntries();

  for (const entry of entries) {
    const answers = state.answers.get(entry.id);
    for (let slotIndex = 0; slotIndex < answers.length; slotIndex += 1) {
      if (!passedCurrentSlot) {
        if (entry.id === entryId && slotIndex === index) passedCurrentSlot = true;
        continue;
      }
      if (!answers[slotIndex]) return { entryId: entry.id, index: slotIndex };
    }
  }

  return null;
}

function placePoolTile(tileId, entryId, index) {
  const tile = state.poolTiles.find((item) => item.id === tileId);
  if (!tile) return;

  state.answers.get(entryId)[index] = { kanji: tile.kanji };
  state.selectedTileId = null;
  state.activeSlot = nextEmptySlotAfter(entryId, index);
  clearCheckedState();
  renderQuestions();
  renderPool();
  requestAnimationFrame(keepActiveSlotVisible);
}

function clearSlot(entryId, index, keepSlotActive = false) {
  const answers = state.answers.get(entryId);
  if (!answers[index]) return;

  answers[index] = null;
  state.activeSlot = keepSlotActive ? { entryId, index } : null;
  clearCheckedState();
  renderQuestions();
  renderPool();
}

function renderPool() {
  if (state.mode !== 'pool') {
    updatePoolTrayHeight();
    return;
  }

  els.kanjiPool.replaceChildren();

  if (state.selectedTileId) {
    const selected = state.poolTiles.find((tile) => tile.id === state.selectedTileId);
    els.poolHint.textContent = selected ? `${selected.kanji} selected — tap a slot.` : 'Tap a tile, then a slot.';
  } else if (state.activeSlot) {
    els.poolHint.textContent = 'Tap a kanji to place it in the highlighted slot.';
  } else {
    els.poolHint.textContent = 'Tap a filled slot to change it.';
  }

  const visibleTiles = filteredPoolTiles();
  els.clearPoolFilter.classList.toggle('hidden', state.poolFilter.length === 0);
  els.poolFilterStatus.textContent = state.poolFilter
    ? `${visibleTiles.length} of ${state.poolTiles.length} kanji shown`
    : `${state.poolTiles.length} kanji`;

  if (visibleTiles.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'empty-bank';
    empty.textContent = 'No kanji match this filter.';
    els.kanjiPool.append(empty);
  }

  for (const tile of visibleTiles) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'kanji-tile';
    button.textContent = tile.kanji;
    button.draggable = !state.checked;
    button.disabled = state.checked;
    button.dataset.tileId = tile.id;
    button.classList.toggle('selected', state.selectedTileId === tile.id);
    button.setAttribute('aria-pressed', String(state.selectedTileId === tile.id));
    button.addEventListener('click', () => onPoolTileClick(tile.id));
    button.addEventListener('dragstart', (event) => {
      event.dataTransfer.setData('text/plain', tile.id);
      event.dataTransfer.effectAllowed = 'copy';
    });
    els.kanjiPool.append(button);
  }

  requestAnimationFrame(updatePoolTrayHeight);
}

function uniqueKanji() {
  const seen = new Set();
  const output = [];
  for (const entry of allEntries()) {
    for (const kanji of kanjiCharactersFor(entry)) {
      if (!seen.has(kanji)) {
        seen.add(kanji);
        output.push(kanji);
      }
    }
  }
  return output;
}

function normalizeReading(value) {
  return String(value)
    .normalize('NFKC')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[ァ-ヶ]/g, (character) => String.fromCharCode(character.charCodeAt(0) - 0x60));
}

function normalizeRomaji(value) {
  return String(value)
    .replace(/[āĀ]/g, 'aa')
    .replace(/[īĪ]/g, 'ii')
    .replace(/[ūŪ]/g, 'uu')
    .replace(/[ēĒ]/g, 'ei')
    .replace(/[ōŌ]/g, 'ou')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[\s'’._+()（）［］\[\]{}「」『』・,，/／~〜～-]+/g, '');
}

function normalizeMeaning(value) {
  return String(value)
    .normalize('NFKC')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[.!?]+$/g, '');
}

function kanjiFromMatchedEntries(entries) {
  const entryKanji = entries.map((entry) => new Set(kanjiCharactersFor(entry)));
  return new Set(entryKanji.flatMap((kanji) => [...kanji]));
}

function filteredPoolTiles() {
  const query = state.poolFilter.trim();
  if (!query) return state.poolTiles;

  const queryCharacters = characters(query);
  const kanjiQuery = queryCharacters.length > 0 && queryCharacters.every(isKanjiCharacter);

  if (kanjiQuery) {
    const requested = new Set(queryCharacters);
    return state.poolTiles.filter((tile) => requested.has(tile.kanji));
  }

  const normalizedWritten = query.normalize('NFKC').toLowerCase();
  const normalizedKana = normalizeReading(query);
  const normalizedRomaji = normalizeRomaji(query);
  const exactReadingKanji = new Set();
  const partialReadingKanji = new Set();
  const exactEntryMatches = [];
  const partialEntryMatches = [];

  if (normalizedRomaji.length > 0) {
    for (const tile of state.poolTiles) {
      const readings = state.kanjiReadings.get(tile.kanji);
      if (!readings) continue;

      if (readings.has(normalizedRomaji)) exactReadingKanji.add(tile.kanji);
      else if ([...readings].some((reading) => reading.startsWith(normalizedRomaji))) {
        partialReadingKanji.add(tile.kanji);
      }
    }
  }

  for (const entry of allEntries()) {
    const written = wordFor(entry).normalize('NFKC').toLowerCase();
    const readings = readingsFor(entry).map(normalizeReading);
    const romaji = romajiFor(entry).map(normalizeRomaji);

    const exactMatch = written === normalizedWritten
      || (normalizedKana.length > 0 && readings.includes(normalizedKana))
      || (normalizedRomaji.length > 0 && romaji.includes(normalizedRomaji));

    const partialMatch = written.includes(normalizedWritten)
      || (normalizedKana.length > 0 && readings.some((reading) => reading.includes(normalizedKana)))
      || (normalizedRomaji.length > 0 && romaji.some((reading) => reading.includes(normalizedRomaji)));

    if (exactMatch) exactEntryMatches.push(entry);
    else if (partialMatch) partialEntryMatches.push(entry);
  }

  const matchedKanji = exactReadingKanji.size > 0
      ? exactReadingKanji
    : partialReadingKanji.size > 0
      ? partialReadingKanji
      : exactEntryMatches.length > 0
        ? kanjiFromMatchedEntries(exactEntryMatches)
        : kanjiFromMatchedEntries(partialEntryMatches);
  return state.poolTiles.filter((tile) => matchedKanji.has(tile.kanji));
}

function isEntryAttempted(entry) {
  if (state.mode === 'pool') {
    const answer = state.answers.get(entry.id) || [];
    return answer.some((value) => Boolean(value?.kanji));
  }
  return String(state.answers.get(entry.id) || '').trim().length > 0;
}

function reviewEntry(entry, correct) {
  const key = progressRecordKey(entry.id);
  const previous = state.progress[key] || { level: 0, correct: 0, wrong: 0 };
  const now = Date.now();
  const previousLevel = Number(previous.level || 0);
  const level = correct
    ? Math.min(MASTERED_LEVEL, previousLevel + 1)
    : Math.max(0, previousLevel - 1);

  state.progress[key] = {
    level,
    dueAt: correct ? now + REVIEW_INTERVALS_MS[level] : now,
    correct: Number(previous.correct || 0) + (correct ? 1 : 0),
    wrong: Number(previous.wrong || 0) + (correct ? 0 : 1),
    lastReviewedAt: now,
  };
}

function isEntryCorrect(entry) {
  if (state.mode === 'pool') {
    const expected = kanjiCharactersFor(entry);
    const actual = state.answers.get(entry.id).map((value) => value?.kanji || '');
    return expected.length === actual.length && expected.every((kanji, index) => actual[index] === kanji);
  }

  const typed = state.answers.get(entry.id) || '';
  if (state.mode === 'reading') {
    const normalizedKana = normalizeReading(typed);
    const normalizedRomaji = normalizeRomaji(typed);
    const matchesKana = normalizedKana.length > 0
      && readingsFor(entry).some((reading) => normalizeReading(reading) === normalizedKana);
    const matchesRomaji = normalizedRomaji.length > 0
      && romajiFor(entry).some((romaji) => normalizeRomaji(romaji) === normalizedRomaji);
    return matchesKana || matchesRomaji;
  }

  const normalized = normalizeMeaning(typed);
  return normalized.length > 0 && meaningsFor(entry).some((meaning) => normalizeMeaning(meaning) === normalized);
}

function checkAnswers() {
  if (state.mode === 'pool') {
    checkStudyWord();
    return;
  }

  if (state.checked) {
    selectActiveEntries();
    resetPractice();
    return;
  }

  const attemptedEntries = currentEntries().filter(isEntryAttempted);
  if (attemptedEntries.length === 0) {
    els.status.className = 'status bad';
    els.status.textContent = 'Answer at least one item before checking.';
    return;
  }

  let correctCount = 0;
  for (const entry of attemptedEntries) {
    const correct = isEntryCorrect(entry);
    if (correct) correctCount += 1;
    reviewEntry(entry, correct);
  }
  saveStoredProgress();

  state.checked = true;
  state.selectedTileId = null;
  state.activeSlot = null;
  els.checkButton.textContent = 'Continue';
  renderQuestions();
  renderPool();
  renderProgress();

  els.status.className = `status ${correctCount === attemptedEntries.length ? 'good' : 'bad'}`;
  els.status.textContent = `${correctCount} of ${attemptedEntries.length} attempted answers correct. Press Continue to load what is due next.`;
}

function checkStudyWord() {
  const entry = currentStudyEntry();
  if (!entry) return;

  if (state.checked) {
    state.lastStudyEntryId = entry.id;
    selectActiveEntries();
    resetPractice({ preservePool: true });
    return;
  }

  const answer = state.answers.get(entry.id) || [];
  if (answer.some((value) => !value?.kanji)) {
    els.status.className = 'status bad';
    els.status.textContent = 'Fill every kanji slot before checking.';
    return;
  }

  const correct = isEntryCorrect(entry);
  reviewEntry(entry, correct);
  saveStoredProgress();
  state.checked = true;
  state.selectedTileId = null;
  state.activeSlot = null;
  els.skipButton.disabled = true;
  els.poolCheckButton.textContent = 'Next word';
  renderQuestions();
  renderPool();
  renderProgress();
  hideStatus();
}

function skipStudyWord() {
  if (state.mode !== 'pool' || state.checked) return;
  const entry = currentStudyEntry();
  if (!entry) return;

  state.skippedStudyEntryIds.add(entry.id);
  state.lastStudyEntryId = entry.id;
  selectActiveEntries();
  resetPractice({ preservePool: true });
}

function clearCheckedVisuals() {
  if (!state.checked) return;
  state.checked = false;
  els.checkButton.textContent = 'Check answers';
  els.poolCheckButton.textContent = 'Check word';
  hideStatus();
  for (const card of els.questionsPanel.querySelectorAll('.question-card')) {
    card.classList.remove('answer-correct', 'answer-incorrect');
    for (const slot of card.querySelectorAll('.slot')) {
      slot.classList.remove('correct', 'incorrect');
    }
    const result = card.querySelector('.result-text');
    result.textContent = '';
    result.className = 'result-text';
  }
}

function clearCheckedState() {
  if (!state.checked) return;
  state.checked = false;
  hideStatus();
}

function hideStatus() {
  els.status.className = 'status hidden';
  els.status.textContent = '';
}

function updatePoolTrayHeight() {
  document.documentElement.style.setProperty('--pool-tray-height', '0px');
}

function keepActiveSlotVisible() {
  if (!state.activeSlot || !window.matchMedia('(max-width: 900px)').matches) return;
  const { entryId, index } = state.activeSlot;
  const selector = `.slot[data-entry-id="${CSS.escape(entryId)}"][data-slot-index="${index}"]`;
  const slot = els.questionsPanel.querySelector(selector);
  slot?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function clearCurrentProgress() {
  if (!window.confirm('Clear saved progress for this lesson and mode?')) return;
  const prefix = `${state.setId}|${state.mode}|`;
  for (const key of Object.keys(state.progress)) {
    if (key.startsWith(prefix)) delete state.progress[key];
  }
  saveStoredProgress();
  state.skippedStudyEntryIds.clear();
  selectActiveEntries();
  resetPractice();
}

function clearAllProgress() {
  if (!window.confirm('Clear all saved progress for every lesson and mode?')) return;
  state.progress = {};
  state.skippedStudyEntryIds.clear();
  saveStoredProgress();
  selectActiveEntries();
  resetPractice();
}

els.backButton.addEventListener('click', () => {
  state.mode = null;
  state.activeSlot = null;
  state.selectedTileId = null;
  state.skippedStudyEntryIds.clear();
  els.practiceScreen.classList.remove('pool-mode', 'typed-mode');
  els.studyContext.classList.add('hidden');
  els.poolStudyActions.classList.add('hidden');
  els.checkButton.classList.remove('hidden');
  document.body.classList.remove('pool-practice');
  renderModeScreen();
  showScreen('modes');
});

els.resetButton.addEventListener('click', resetPractice);
els.skipButton.addEventListener('click', skipStudyWord);
els.clearCurrentProgress.addEventListener('click', clearCurrentProgress);
els.clearAllProgress.addEventListener('click', clearAllProgress);
els.checkButton.addEventListener('click', checkAnswers);
els.poolCheckButton.addEventListener('click', checkAnswers);
function syncPoolFilter() {
  state.poolFilter = els.poolFilter.value;
  const visibleIds = new Set(filteredPoolTiles().map((tile) => tile.id));
  if (state.selectedTileId && !visibleIds.has(state.selectedTileId)) state.selectedTileId = null;
  renderPool();
}

for (const eventName of ['input', 'change', 'search', 'compositionend']) {
  els.poolFilter.addEventListener(eventName, syncPoolFilter);
}
els.clearPoolFilter.addEventListener('click', () => {
  state.poolFilter = '';
  els.poolFilter.value = '';
  renderPool();
  els.poolFilter.focus();
});
els.setSelect.addEventListener('change', () => {
  state.setId = els.setSelect.value;
  state.lastStudyEntryId = null;
  state.skippedStudyEntryIds.clear();
  state.poolFilter = '';
  els.poolFilter.value = '';
  selectActiveEntries();
  resetPractice();
});
window.addEventListener('resize', updatePoolTrayHeight);

if ('ResizeObserver' in window) {
  new ResizeObserver(updatePoolTrayHeight).observe(els.poolPanel);
}

async function removeLegacyOfflineCache() {
  if ('serviceWorker' in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));
    } catch {
      // The app still works if service-worker cleanup is unavailable.
    }
  }

  if ('caches' in window) {
    try {
      const keys = await caches.keys();
      await Promise.all(keys
        .filter((key) => key.startsWith('kanji-practice-'))
        .map((key) => caches.delete(key)));
    } catch {
      // Ignore cache cleanup failures. Normal browser revalidation still applies.
    }
  }
}

removeLegacyOfflineCache();
loadData();
