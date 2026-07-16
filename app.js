const DATA_URL = './data/kanji-practice.json?v=deduplicated-vocabulary-20260716';
const KANJI_READINGS_URL = './data/kanji-readings.txt';
const MODE_IDS = ['pool', 'japanese', 'reading', 'meaning'];
const DISABLED_MODE_IDS = new Set(['reading', 'meaning']);
const KANJI_PATTERN = /[\u3400-\u4DBF\u4E00-\u9FFF々〆ヵヶ]/u;
const STATS_STORAGE_KEY = 'genki-kanji-stats-v2';
const ACTIVE_ENTRY_LIMIT = 8;
const SINGLE_WORD_MODES = new Set(['pool', 'japanese']);
const ROMAJI_TO_HIRAGANA = {
  a: 'あ', i: 'い', u: 'う', e: 'え', o: 'お',
  ka: 'か', ki: 'き', ku: 'く', ke: 'け', ko: 'こ',
  ga: 'が', gi: 'ぎ', gu: 'ぐ', ge: 'げ', go: 'ご',
  sa: 'さ', shi: 'し', si: 'し', su: 'す', se: 'せ', so: 'そ',
  za: 'ざ', ji: 'じ', zi: 'じ', zu: 'ず', ze: 'ぜ', zo: 'ぞ',
  ta: 'た', chi: 'ち', ti: 'ち', tsu: 'つ', tu: 'つ', te: 'て', to: 'と',
  da: 'だ', di: 'ぢ', du: 'づ', de: 'で', do: 'ど',
  na: 'な', ni: 'に', nu: 'ぬ', ne: 'ね', no: 'の',
  ha: 'は', hi: 'ひ', fu: 'ふ', hu: 'ふ', he: 'へ', ho: 'ほ',
  ba: 'ば', bi: 'び', bu: 'ぶ', be: 'べ', bo: 'ぼ',
  pa: 'ぱ', pi: 'ぴ', pu: 'ぷ', pe: 'ぺ', po: 'ぽ',
  ma: 'ま', mi: 'み', mu: 'む', me: 'め', mo: 'も',
  ya: 'や', yu: 'ゆ', yo: 'よ',
  ra: 'ら', ri: 'り', ru: 'る', re: 'れ', ro: 'ろ',
  wa: 'わ', wi: 'うぃ', we: 'うぇ', wo: 'を',
  kya: 'きゃ', kyu: 'きゅ', kyo: 'きょ',
  gya: 'ぎゃ', gyu: 'ぎゅ', gyo: 'ぎょ',
  sha: 'しゃ', shu: 'しゅ', sho: 'しょ', sya: 'しゃ', syu: 'しゅ', syo: 'しょ',
  ja: 'じゃ', ju: 'じゅ', jo: 'じょ', jya: 'じゃ', jyu: 'じゅ', jyo: 'じょ',
  cha: 'ちゃ', chu: 'ちゅ', cho: 'ちょ', cya: 'ちゃ', cyu: 'ちゅ', cyo: 'ちょ',
  nya: 'にゃ', nyu: 'にゅ', nyo: 'にょ',
  hya: 'ひゃ', hyu: 'ひゅ', hyo: 'ひょ',
  bya: 'びゃ', byu: 'びゅ', byo: 'びょ',
  pya: 'ぴゃ', pyu: 'ぴゅ', pyo: 'ぴょ',
  mya: 'みゃ', myu: 'みゅ', myo: 'みょ',
  rya: 'りゃ', ryu: 'りゅ', ryo: 'りょ',
  she: 'しぇ', je: 'じぇ', che: 'ちぇ',
  fa: 'ふぁ', fi: 'ふぃ', fe: 'ふぇ', fo: 'ふぉ',
  va: 'ゔぁ', vi: 'ゔぃ', vu: 'ゔ', ve: 'ゔぇ', vo: 'ゔぉ',
  tsa: 'つぁ', tsi: 'つぃ', tse: 'つぇ', tso: 'つぉ',
  tha: 'てゃ', thi: 'てぃ', thu: 'てゅ', the: 'てぇ', tho: 'てょ',
  dha: 'でゃ', dhi: 'でぃ', dhu: 'でゅ', dhe: 'でぇ', dho: 'でょ',
  kwa: 'くぁ', kwi: 'くぃ', kwe: 'くぇ', kwo: 'くぉ',
  gwa: 'ぐぁ', gwi: 'ぐぃ', gwe: 'ぐぇ', gwo: 'ぐぉ',
  xa: 'ぁ', xi: 'ぃ', xu: 'ぅ', xe: 'ぇ', xo: 'ぉ',
  la: 'ぁ', li: 'ぃ', lu: 'ぅ', le: 'ぇ', lo: 'ぉ',
  xya: 'ゃ', xyu: 'ゅ', xyo: 'ょ', lya: 'ゃ', lyu: 'ゅ', lyo: 'ょ',
  xtsu: 'っ', ltsu: 'っ',
};
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
  stats: { words: {}, tests: [] },
  run: null,
  studyAttempts: new Map(),
  lastSubmittedAnswers: new Map(),
  incorrectEntryId: null,
  revealedEntryId: null,
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
  dontKnowButton: document.querySelector('#dontKnowButton'),
  checkButton: document.querySelector('#checkButton'),
  poolCheckButton: document.querySelector('#poolCheckButton'),
  poolStudyActions: document.querySelector('#poolStudyActions'),
  questionsPanel: document.querySelector('#questionsPanel'),
  studyContext: document.querySelector('#studyContext'),
  studyCounter: document.querySelector('#studyCounter'),
  studyProgressTrack: document.querySelector('#studyProgressTrack'),
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

function splitReadingAlternatives(value) {
  const alternatives = [];
  let current = '';
  let depth = 0;

  for (const character of characters(String(value))) {
    if (character === '(' || character === '（') depth += 1;
    if ((character === '/' || character === '／') && depth === 0) {
      if (current.trim()) alternatives.push(current.trim());
      current = '';
      continue;
    }
    current += character;
    if ((character === ')' || character === '）') && depth > 0) depth -= 1;
  }

  if (current.trim()) alternatives.push(current.trim());
  return alternatives;
}

function readingsFor(entry) {
  return Array.isArray(entry.readings)
    ? entry.readings.flatMap(splitReadingAlternatives)
    : [];
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
    state.stats = loadStoredStats();
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
  els.resetButton.classList.toggle('hidden', name !== 'practice' || isSingleWordMode());
  requestAnimationFrame(updatePoolTrayHeight);
}

function isSingleWordMode(mode = state.mode) {
  return SINGLE_WORD_MODES.has(mode);
}

function usesKanjiPool(mode = state.mode) {
  return mode === 'pool';
}

function defaultModes() {
  return [
    {
      id: 'pool',
      label: 'Kanji Spelling',
      description: 'Recall a vocabulary word’s kanji spelling from its meaning.',
    },
    {
      id: 'japanese',
      label: 'Word → Japanese',
      description: 'See an English meaning and recall the Japanese word in kana or kanji.',
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
  if (modeId === 'japanese') return '書';
  if (modeId === 'reading') return '読';
  return '意';
}

function renderModeScreen() {
  const configured = state.data.app?.availableModes;
  const modes = Array.isArray(configured) && configured.length ? configured : defaultModes();

  els.subtitle.textContent = 'Choose how you want to practice.';
  els.modeCards.replaceChildren();

  for (const mode of modes.filter((item) => MODE_IDS.includes(item.id))) {
    const disabled = DISABLED_MODE_IDS.has(mode.id);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'mode-card';
    button.disabled = disabled;
    button.innerHTML = `
      <span class="mode-icon" aria-hidden="true">${modeIcon(mode.id)}</span>
      <h2>${escapeHtml(mode.label)}</h2>
      <p>${escapeHtml(mode.description || '')}</p>
      <span class="enter">${disabled ? 'Unavailable for now' : 'Open mode →'}</span>
    `;
    if (!disabled) button.addEventListener('click', () => openMode(mode.id));
    els.modeCards.append(button);
  }
}

function openMode(mode) {
  if (DISABLED_MODE_IDS.has(mode)) return;
  state.mode = mode;
  state.lastStudyEntryId = null;
  state.skippedStudyEntryIds.clear();
  state.poolFilter = '';
  els.poolFilter.value = '';
  populateSetSelect();
  beginRun();

  const subtitles = {
    pool: 'Recall the kanji spelling of the word shown by its meaning.',
    japanese: 'Recall the Japanese word from its English meaning.',
    reading: 'Type the reading of each written word.',
    meaning: 'Type the meaning of each written word.',
  };
  els.subtitle.textContent = subtitles[mode];
  els.poolPanel.classList.toggle('hidden', mode !== 'pool');
  els.studyContext.classList.toggle('hidden', !isSingleWordMode(mode));
  els.poolStudyActions.classList.toggle('hidden', !isSingleWordMode(mode));
  els.checkButton.classList.toggle('hidden', isSingleWordMode(mode));
  els.practiceScreen.classList.toggle('pool-mode', mode === 'pool');
  els.practiceScreen.classList.toggle('japanese-mode', mode === 'japanese');
  els.practiceScreen.classList.toggle('typed-mode', !isSingleWordMode(mode));
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

function statsRecordKey(entryId, setId = state.setId, mode = state.mode) {
  return `${setId}|${mode}|${entryId}`;
}

function loadStoredStats() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STATS_STORAGE_KEY) || '{}');
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Invalid statistics');
    return {
      words: parsed.words && typeof parsed.words === 'object' && !Array.isArray(parsed.words) ? parsed.words : {},
      tests: Array.isArray(parsed.tests) ? parsed.tests : [],
    };
  } catch {
    return { words: {}, tests: [] };
  }
}

function saveStoredStats() {
  try {
    localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(state.stats));
  } catch {
    // Practice still works when storage is unavailable; only statistics are lost.
  }
}

function selectActiveEntries() {
  if (isSingleWordMode()) {
    state.activeEntryIds = state.run?.queue.length ? [state.run.queue[0]] : [];
    return;
  }
  state.activeEntryIds = allEntries().slice(0, ACTIVE_ENTRY_LIMIT).map((entry) => entry.id);
}

function beginRun() {
  const entries = allEntries();
  state.run = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    startedAt: Date.now(),
    queue: shuffle(entries.map((entry) => entry.id)),
    completed: new Set(),
    results: [],
    saved: false,
    summaryVisible: false,
  };
  els.practiceScreen.classList.remove('run-summary');
  els.skipButton.classList.remove('hidden');
  els.dontKnowButton.classList.remove('hidden');
  document.body.classList.toggle('pool-practice', state.mode === 'pool');
  state.studyAttempts.clear();
  state.lastSubmittedAnswers.clear();
  state.incorrectEntryId = null;
  state.revealedEntryId = null;
  state.lastStudyEntryId = null;
  state.skippedStudyEntryIds.clear();
  selectActiveEntries();
  resetPractice();
}

function progressStats() {
  const total = allEntries().length;
  const completed = state.run?.completed.size || 0;
  return { total, completed, remaining: Math.max(0, total - completed) };
}

function renderProgress() {
  if (!state.mode) return;
  const stats = progressStats();
  const completedPercent = stats.total ? (stats.completed / stats.total) * 100 : 0;
  els.progressMastered.textContent = `${stats.completed} / ${stats.total}`;
  els.progressLearning.textContent = '—';
  els.progressNew.textContent = '—';
  els.progressDue.textContent = String(stats.remaining);
  els.progressStartedBar.style.width = `${completedPercent}%`;
  els.progressMasteredBar.style.width = '0%';
  els.progressTrack.setAttribute('aria-valuenow', String(Math.round(completedPercent)));
  els.progressNote.textContent = `${stats.completed} of ${stats.total} completed in this test.`;
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
  state.incorrectEntryId = null;
  state.revealedEntryId = null;
  els.skipButton.disabled = false;
  els.dontKnowButton.disabled = false;
  els.checkButton.textContent = 'Check answers';
  els.poolCheckButton.textContent = 'Check word';
  hideStatus();

  for (const entry of currentEntries()) {
    const initialAnswer = state.mode === 'pool'
      ? Array(kanjiCharactersFor(entry).length).fill(null)
      : '';
    state.answers.set(entry.id, initialAnswer);
  }

  if (usesKanjiPool()) {
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
  if (!isSingleWordMode()) return;
  const stats = progressStats();
  const completedPercent = stats.total ? (stats.completed / stats.total) * 100 : 0;
  els.studyCounter.textContent = `${stats.completed} / ${stats.total} completed`;
  els.studyProgressBar.style.width = `${completedPercent}%`;
  els.studyProgressTrack.setAttribute('aria-valuenow', String(Math.round(completedPercent)));
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

  if (state.run?.summaryVisible) {
    renderRunSummary();
    els.checkButton.disabled = true;
    els.poolCheckButton.disabled = false;
    els.skipButton.disabled = true;
    els.dontKnowButton.disabled = true;
    return;
  }

  if (currentEntries().length === 0) {
    const empty = document.createElement('div');
    empty.className = 'panel empty-questions';
    empty.textContent = 'Test complete.';
    els.questionsPanel.append(empty);
    els.checkButton.disabled = true;
    els.poolCheckButton.disabled = true;
    els.skipButton.disabled = true;
    els.dontKnowButton.disabled = true;
    return;
  }

  els.checkButton.disabled = false;
  els.poolCheckButton.disabled = false;
  const entriesToRender = isSingleWordMode()
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
      const writesJapanese = state.mode === 'japanese';
      promptLabel.textContent = writesJapanese ? 'Meaning' : 'Written word';
      prompt.textContent = writesJapanese ? primaryMeaningFor(entry) : wordFor(entry);
      prompt.lang = writesJapanese ? 'en' : 'ja';
      typedAnswer.classList.remove('hidden');
      typedLabel.textContent = writesJapanese
        ? 'Japanese word (kana or kanji)'
        : state.mode === 'reading' ? 'Reading (kana or romaji)' : 'Meaning';
      typedInput.placeholder = writesJapanese
        ? 'Type romaji, kana, or kanji…'
        : state.mode === 'reading' ? 'Type kana or romaji…' : 'Type the meaning…';
      typedInput.value = state.answers.get(entry.id) || '';
      typedInput.disabled = state.checked;
      typedInput.lang = writesJapanese || state.mode === 'reading' ? 'ja' : 'en';
      typedInput.spellcheck = state.mode === 'meaning';
      typedInput.setAttribute(
        'aria-label',
        writesJapanese ? `Japanese answer for ${primaryMeaningFor(entry)}` : `${typedLabel.textContent} for ${wordFor(entry)}`,
      );
      typedInput.addEventListener('input', (event) => {
        if (writesJapanese && !event.isComposing) {
          convertJapaneseInput(entry, typedInput, event);
        }
        state.answers.set(entry.id, typedInput.value);
        clearCheckedVisuals();
      });
      if (writesJapanese) {
        typedInput.addEventListener('compositionend', () => {
          state.answers.set(entry.id, typedInput.value);
          clearCheckedVisuals();
        });
        typedInput.addEventListener('blur', () => delete typedInput.dataset.pendingTrailingN);
      }
    }

    if (state.checked || state.incorrectEntryId === entry.id) renderResult(entry, card, result);
    els.questionsPanel.append(fragment);
  }

  focusJapaneseAnswerOnDesktop();
}

function focusJapaneseAnswerOnDesktop() {
  if (
    state.mode !== 'japanese'
    || state.checked
    || state.run?.summaryVisible
    || !window.matchMedia('(min-width: 901px)').matches
  ) return;

  requestAnimationFrame(() => {
    const input = els.questionsPanel.querySelector('.typed-input:not(:disabled)');
    input?.focus({ preventScroll: true });
  });
}

function renderRunSummary() {
  const results = state.run?.results || [];
  const total = results.length;
  const firstTry = results.filter((result) => result.attempts === 1).length;
  const retryResults = results.filter((result) => result.attempts > 1);
  const failedAttempts = results.reduce((sum, result) => sum + Math.max(0, result.attempts - 1), 0);

  const summary = document.createElement('section');
  summary.className = 'panel test-summary';

  const heading = document.createElement('h2');
  heading.textContent = 'Test complete';
  summary.append(heading);

  const completed = document.createElement('p');
  completed.className = 'test-summary-completed';
  completed.textContent = `You completed all ${total} words.`;
  summary.append(completed);

  const metrics = document.createElement('dl');
  metrics.className = 'test-summary-metrics';
  for (const [label, value] of [
    ['Correct on first attempt', `${firstTry} / ${total}`],
    ['Needed more attempts', String(retryResults.length)],
    ['Failed attempts', String(failedAttempts)],
  ]) {
    const metric = document.createElement('div');
    const term = document.createElement('dt');
    const result = document.createElement('dd');
    term.textContent = label;
    result.textContent = value;
    metric.append(term, result);
    metrics.append(metric);
  }
  summary.append(metrics);

  if (retryResults.length > 0) {
    const details = document.createElement('details');
    details.className = 'test-summary-review';
    const detailsHeading = document.createElement('summary');
    detailsHeading.textContent = `Words that needed more attempts (${retryResults.length})`;
    details.append(detailsHeading);

    const list = document.createElement('ul');
    const entriesById = new Map(allEntries().map((entry) => [entry.id, entry]));
    for (const runResult of [...retryResults].sort((left, right) => right.attempts - left.attempts)) {
      const entry = entriesById.get(runResult.entryId);
      if (!entry) continue;
      const item = document.createElement('li');
      const word = state.mode === 'japanese'
        ? japaneseAnswerForms(entry).join(' / ')
        : wordFor(entry);
      const wordDetails = document.createElement('span');
      const meaning = document.createElement('strong');
      const writtenWord = document.createElement('span');
      const attempts = document.createElement('span');
      meaning.textContent = primaryMeaningFor(entry);
      writtenWord.textContent = word;
      writtenWord.lang = 'ja';
      attempts.textContent = `${runResult.attempts} attempts`;
      wordDetails.append(meaning, writtenWord);
      item.append(wordDetails, attempts);
      list.append(item);
    }
    details.append(list);
    summary.append(details);
  }

  els.questionsPanel.append(summary);
}

function showRunSummary() {
  if (!state.run || state.run.queue.length > 0) return;
  state.run.summaryVisible = true;
  state.activeEntryIds = [];
  state.checked = false;
  state.incorrectEntryId = null;
  state.revealedEntryId = null;
  els.practiceScreen.classList.add('run-summary');
  els.skipButton.classList.add('hidden');
  els.dontKnowButton.classList.add('hidden');
  els.poolCheckButton.textContent = 'Start again';
  document.body.classList.remove('pool-practice');
  renderQuestions();
  renderProgress();
  hideStatus();
  window.scrollTo({ top: 0, behavior: 'smooth' });
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

    if ((state.checked || state.incorrectEntryId === entry.id) && isEntryAttempted(entry)) {
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
  const revealed = state.revealedEntryId === entry.id;
  if (!revealed && !isEntryAttempted(entry)) return;
  const correct = isEntryCorrect(entry);
  card.classList.add(correct && !revealed ? 'answer-correct' : 'answer-incorrect');

  if (correct && !revealed) {
    if (state.mode === 'pool') result.textContent = 'Correct — nice recall.';
    else if (state.mode === 'japanese') result.textContent = `Correct — ${stripTemplateMarkers(wordFor(entry))}`;
    else result.textContent = 'Correct';
    result.classList.add('good');
    return;
  }

  if (!revealed) {
    result.textContent = 'Not quite — try again.';
    result.classList.add('bad');
    return;
  }

  if (state.mode === 'pool') {
    result.textContent = `Answer: ${wordFor(entry)}`;
  } else if (state.mode === 'japanese') {
    result.textContent = `Answer: ${japaneseAnswerForms(entry).join(' / ')}`;
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

function stripTemplateMarkers(value) {
  return String(value).replace(/[~〜～]/g, '').trim();
}

function normalizeJapaneseWord(value) {
  return normalizeReading(stripTemplateMarkers(value))
    .replace(/[\u200B-\u200D\u2060\uFEFF]/g, '');
}

function japaneseAnswerForms(entry) {
  return [...new Set(
    [...readingsFor(entry), wordFor(entry)]
      .map(stripTemplateMarkers)
      .filter(Boolean),
  )];
}

function kanjiFromMatchedEntries(entries) {
  const entryKanji = entries.map((entry) => new Set(kanjiCharactersFor(entry)));
  return new Set(entryKanji.flatMap((kanji) => [...kanji]));
}

function filterKanjiTiles(filter, tiles = state.poolTiles) {
  const query = String(filter).trim();
  if (!query) return tiles;

  const queryCharacters = characters(query);
  const kanjiQuery = queryCharacters.length > 0 && queryCharacters.every(isKanjiCharacter);

  if (kanjiQuery) {
    const requested = new Set(queryCharacters);
    return tiles.filter((tile) => requested.has(tile.kanji));
  }

  const normalizedWritten = query.normalize('NFKC').toLowerCase();
  const normalizedKana = normalizeReading(query);
  const normalizedRomaji = normalizeRomaji(query);
  const exactReadingKanji = new Set();
  const partialReadingKanji = new Set();
  const exactEntryMatches = [];
  const partialEntryMatches = [];

  if (normalizedRomaji.length > 0) {
    for (const tile of tiles) {
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
  return tiles.filter((tile) => matchedKanji.has(tile.kanji));
}

function filteredPoolTiles() {
  return filterKanjiTiles(state.poolFilter);
}

function romajiToHiragana(value, { convertTrailingN = true } = {}) {
  const input = String(value).normalize('NFKC').toLowerCase().replaceAll('’', "'");
  let output = '';
  let index = 0;

  while (index < input.length) {
    const current = input[index];
    const next = input[index + 1] || '';

    if (current === 'n') {
      if (next === "'") {
        output += 'ん';
        index += 2;
        continue;
      }
      if (!next) {
        output += convertTrailingN ? 'ん' : 'n';
        index += 1;
        continue;
      }
      if (next === 'n' || (!/[aeiouy]/.test(next) && /[a-z]/.test(next))) {
        output += 'ん';
        index += 1;
        continue;
      }
    }

    if (current === next && /[bcdfghjklmpqrstvwxyz]/.test(current) && current !== 'n') {
      output += 'っ';
      index += 1;
      continue;
    }

    let matched = false;
    for (let length = 4; length >= 1; length -= 1) {
      const sequence = input.slice(index, index + length);
      const kana = ROMAJI_TO_HIRAGANA[sequence];
      if (!kana) continue;
      output += kana;
      index += length;
      matched = true;
      break;
    }

    if (!matched) {
      output += current;
      index += 1;
    }
  }

  return output;
}

function hiraganaToKatakana(value) {
  return characters(value).map((character) => {
    const codePoint = character.codePointAt(0);
    return codePoint >= 0x3041 && codePoint <= 0x3096
      ? String.fromCodePoint(codePoint + 0x60)
      : character;
  }).join('');
}

function shouldUseKatakana(entry) {
  const reading = readingsFor(entry)[0] || '';
  return /[ァ-ヶ]/.test(reading) && !/[ぁ-ゖ]/.test(reading);
}

function convertJapaneseTyping(entry, value, convertTrailingN = true) {
  const hiragana = romajiToHiragana(value, { convertTrailingN });
  return shouldUseKatakana(entry) ? hiraganaToKatakana(hiragana) : hiragana;
}

function convertJapaneseInput(entry, input, event) {
  let value = input.value;
  let start = input.selectionStart ?? value.length;
  let end = input.selectionEnd ?? start;
  const pendingIndex = Number(input.dataset.pendingTrailingN);
  const extendsPendingN = Number.isInteger(pendingIndex)
    && event.inputType === 'insertText'
    && typeof event.data === 'string'
    && event.data.length === 1
    && value[pendingIndex] === 'ん'
    && start === pendingIndex + 2;

  if (extendsPendingN) {
    value = `${value.slice(0, pendingIndex)}n${value.slice(pendingIndex + 1)}`;
  }

  delete input.dataset.pendingTrailingN;
  const hasPendingTrailingN = start === value.length && /n$/i.test(value);
  const convertedStart = convertJapaneseTyping(entry, value.slice(0, start)).length;
  const convertedEnd = convertJapaneseTyping(entry, value.slice(0, end)).length;
  input.value = convertJapaneseTyping(entry, value);
  input.setSelectionRange(convertedStart, convertedEnd);

  if (hasPendingTrailingN) {
    input.dataset.pendingTrailingN = String(convertedStart - 1);
  }
}

function isEntryAttempted(entry) {
  if (state.mode === 'pool') {
    const answer = state.answers.get(entry.id) || [];
    return answer.some((value) => Boolean(value?.kanji));
  }
  return String(state.answers.get(entry.id) || '').trim().length > 0;
}

function recordStudyResult(entry, result, attempts, score) {
  const completedAt = Date.now();
  const record = {
    testId: state.run.id,
    result,
    attempts,
    score,
    completedAt,
  };

  state.run.results.push({ entryId: entry.id, ...record });
  state.run.completed.add(entry.id);
  state.run.queue = state.run.queue.filter((entryId) => entryId !== entry.id);

  if (state.run.queue.length === 0 && !state.run.saved) {
    for (const runResult of state.run.results) {
      const { entryId, ...wordResult } = runResult;
      const wordKey = statsRecordKey(entryId);
      const wordHistory = Array.isArray(state.stats.words[wordKey]) ? state.stats.words[wordKey] : [];
      wordHistory.push(wordResult);
      state.stats.words[wordKey] = wordHistory;
    }

    state.stats.tests.push({
      id: state.run.id,
      setId: state.setId,
      mode: state.mode,
      startedAt: state.run.startedAt,
      completedAt,
      results: state.run.results.map((item) => ({ ...item })),
    });
    state.run.saved = true;
    saveStoredStats();
  }
}

function completeStudyWord(entry, result, attempts, score) {
  recordStudyResult(entry, result, attempts, score);
  state.checked = true;
  state.incorrectEntryId = null;
  state.revealedEntryId = null;
  state.selectedTileId = null;
  state.activeSlot = null;
  els.skipButton.disabled = true;
  els.dontKnowButton.disabled = true;
  els.poolCheckButton.textContent = state.run.queue.length === 0 ? 'View results' : 'Next word';
  renderQuestions();
  renderPool();
  renderProgress();
  hideStatus();
}

function isEntryCorrect(entry) {
  if (state.mode === 'pool') {
    const expected = kanjiCharactersFor(entry);
    const actual = state.answers.get(entry.id).map((value) => value?.kanji || '');
    return expected.length === actual.length && expected.every((kanji, index) => actual[index] === kanji);
  }

  const typed = state.answers.get(entry.id) || '';
  if (state.mode === 'japanese') {
    const normalizedJapanese = normalizeJapaneseWord(typed);
    const matchesWritten = normalizedJapanese.length > 0
      && normalizedJapanese === normalizeJapaneseWord(wordFor(entry));
    const matchesReading = normalizedJapanese.length > 0
      && readingsFor(entry).some((reading) => normalizeJapaneseWord(reading) === normalizedJapanese);
    const normalizedRomaji = normalizeRomaji(typed);
    const matchesRomaji = normalizedRomaji.length > 0
      && romajiFor(entry).some((romaji) => normalizeRomaji(romaji) === normalizedRomaji);
    return matchesWritten || matchesReading || matchesRomaji;
  }
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

function studyAnswerFingerprint(entry) {
  if (state.mode === 'pool') {
    return (state.answers.get(entry.id) || []).map((value) => value?.kanji || '').join('');
  }
  return String(state.answers.get(entry.id) || '').normalize('NFKC').trim();
}

function isStudyAnswerComplete() {
  const entry = currentStudyEntry();
  if (!entry) return false;
  const answer = state.answers.get(entry.id);
  return state.mode === 'pool'
    ? !(answer || []).some((value) => !value?.kanji)
    : String(answer || '').trim().length > 0;
}

function checkAnswers() {
  if (isSingleWordMode()) {
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
  }

  state.checked = true;
  state.selectedTileId = null;
  state.activeSlot = null;
  els.checkButton.textContent = 'Continue';
  renderQuestions();
  renderPool();
  renderProgress();

  els.status.className = `status ${correctCount === attemptedEntries.length ? 'good' : 'bad'}`;
  els.status.textContent = `${correctCount} of ${attemptedEntries.length} attempted answers correct. Press Continue to load what is ready next.`;
}

function checkStudyWord() {
  if (state.run?.summaryVisible) {
    beginRun();
    return;
  }

  if (state.checked && state.run?.queue.length === 0) {
    showRunSummary();
    return;
  }

  const entry = currentStudyEntry();
  if (!entry) return;

  if (state.checked) {
    selectActiveEntries();
    resetPractice({ preservePool: true });
    return;
  }

  let answer = state.answers.get(entry.id);
  if (state.mode === 'japanese') {
    const visibleInput = els.questionsPanel.querySelector('.typed-input');
    answer = visibleInput?.value ?? answer;
    answer = convertJapaneseTyping(entry, String(answer || ''), true);
    state.answers.set(entry.id, answer);
  }
  const incomplete = state.mode === 'pool'
    ? (answer || []).some((value) => !value?.kanji)
    : String(answer || '').trim().length === 0;
  if (incomplete) {
    els.status.className = 'status bad';
    els.status.textContent = state.mode === 'pool'
      ? 'Fill every kanji slot before checking.'
      : 'Write the Japanese word before checking.';
    return;
  }

  const correct = isEntryCorrect(entry);
  const answerFingerprint = studyAnswerFingerprint(entry);
  const repeatsLastSubmission = state.lastSubmittedAnswers.get(entry.id) === answerFingerprint;
  const attempts = (state.studyAttempts.get(entry.id) || 0) + (repeatsLastSubmission ? 0 : 1);
  if (!repeatsLastSubmission) {
    state.studyAttempts.set(entry.id, attempts);
    state.lastSubmittedAnswers.set(entry.id, answerFingerprint);
  }

  if (correct) {
    const result = attempts === 1 ? 'clean' : 'struggled';
    completeStudyWord(entry, result, attempts, 1 / attempts);
    return;
  }

  state.incorrectEntryId = entry.id;
  state.revealedEntryId = null;
  renderQuestions();
  renderPool();
  hideStatus();
}

function skipStudyWord() {
  if (!isSingleWordMode() || state.checked) return;
  const entry = currentStudyEntry();
  if (!entry) return;

  if (state.run.queue.length <= 1) {
    els.status.className = 'status bad';
    els.status.textContent = 'No other word remains to move ahead of this one.';
    return;
  }

  state.lastSubmittedAnswers.delete(entry.id);
  state.run.queue = [...state.run.queue.slice(1), state.run.queue[0]];
  selectActiveEntries();
  resetPractice({ preservePool: true });
}

function dontKnowStudyWord() {
  if (!isSingleWordMode() || state.checked) return;
  const entry = currentStudyEntry();
  if (!entry) return;

  state.studyAttempts.set(entry.id, (state.studyAttempts.get(entry.id) || 0) + 1);
  state.lastSubmittedAnswers.delete(entry.id);
  state.run.queue = [...state.run.queue.slice(1), state.run.queue[0]];
  state.checked = true;
  state.incorrectEntryId = null;
  state.revealedEntryId = entry.id;
  state.selectedTileId = null;
  state.activeSlot = null;
  els.skipButton.disabled = true;
  els.dontKnowButton.disabled = true;
  els.poolCheckButton.textContent = 'Continue';
  renderQuestions();
  renderPool();
  renderProgress();
  hideStatus();
}

function clearCheckedVisuals() {
  if (state.checked || !state.incorrectEntryId) return;
  state.incorrectEntryId = null;
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
  if (state.checked) return;
  state.incorrectEntryId = null;
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
  if (!window.confirm('Clear saved statistics for this lesson and mode?')) return;
  const prefix = `${state.setId}|${state.mode}|`;
  for (const key of Object.keys(state.stats.words)) {
    if (key.startsWith(prefix)) delete state.stats.words[key];
  }
  state.stats.tests = state.stats.tests.filter((test) => test.setId !== state.setId || test.mode !== state.mode);
  saveStoredStats();
  beginRun();
}

function clearAllProgress() {
  if (!window.confirm('Clear all saved statistics for every lesson and mode?')) return;
  state.stats = { words: {}, tests: [] };
  saveStoredStats();
  beginRun();
}

els.backButton.addEventListener('click', () => {
  state.mode = null;
  state.activeSlot = null;
  state.selectedTileId = null;
  state.skippedStudyEntryIds.clear();
  els.practiceScreen.classList.remove('pool-mode', 'typed-mode');
  els.practiceScreen.classList.remove('japanese-mode');
  els.studyContext.classList.add('hidden');
  els.poolStudyActions.classList.add('hidden');
  els.checkButton.classList.remove('hidden');
  document.body.classList.remove('pool-practice');
  renderModeScreen();
  showScreen('modes');
});

els.resetButton.addEventListener('click', resetPractice);
els.skipButton.addEventListener('click', skipStudyWord);
els.dontKnowButton.addEventListener('click', dontKnowStudyWord);
els.clearCurrentProgress.addEventListener('click', clearCurrentProgress);
els.clearAllProgress.addEventListener('click', clearAllProgress);
els.checkButton.addEventListener('click', checkAnswers);
els.poolCheckButton.addEventListener('click', checkAnswers);
document.addEventListener('keydown', (event) => {
  if (
    event.key !== 'Enter'
    || event.repeat
    || event.isComposing
    || !isSingleWordMode()
    || els.practiceScreen.classList.contains('hidden')
    || els.poolCheckButton.disabled
  ) return;

  const target = event.target;
  const answerControl = target instanceof HTMLElement && target.matches('.kanji-tile, .slot');
  if (
    target === els.poolFilter
    || target instanceof HTMLSelectElement
    || (target instanceof HTMLElement && target.tagName === 'SUMMARY')
    || (target instanceof HTMLButtonElement && !answerControl)
    || (answerControl && !isStudyAnswerComplete())
  ) return;

  event.preventDefault();
  checkStudyWord();
});
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
  beginRun();
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
