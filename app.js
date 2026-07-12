const DATA_URL = './data/kanji-practice.json';
const MODE_IDS = ['pool', 'reading', 'meaning'];

const state = {
  data: null,
  mode: null,
  setId: null,
  answers: new Map(),
  poolTiles: [],
  selectedTileId: null,
  activeSlot: null,
  checked: false,
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
  checkButton: document.querySelector('#checkButton'),
  shuffleButton: document.querySelector('#shuffleButton'),
  questionsPanel: document.querySelector('#questionsPanel'),
  poolPanel: document.querySelector('#poolPanel'),
  poolHint: document.querySelector('#poolHint'),
  kanjiPool: document.querySelector('#kanjiPool'),
  status: document.querySelector('#statusMessage'),
  questionTemplate: document.querySelector('#questionTemplate'),
};

function characters(text) {
  return Array.from(text);
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
    const response = await fetch(DATA_URL, { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status} while loading ${DATA_URL}`);
    const data = await response.json();
    validateData(data);
    state.data = data;
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

function showScreen(name) {
  els.loading.classList.add('hidden');
  els.error.classList.add('hidden');
  els.modeScreen.classList.toggle('hidden', name !== 'modes');
  els.practiceScreen.classList.toggle('hidden', name !== 'practice');
  els.backButton.classList.toggle('hidden', name !== 'practice');
  els.resetButton.classList.toggle('hidden', name !== 'practice');
  requestAnimationFrame(updatePoolTrayHeight);
}

function defaultModes() {
  return [
    {
      id: 'pool',
      label: 'Meaning → Kanji',
      description: 'Build each kanji word from the shared reusable pool.',
    },
    {
      id: 'reading',
      label: 'Kanji → Reading',
      description: 'See the kanji word and type its reading.',
    },
    {
      id: 'meaning',
      label: 'Kanji → Meaning',
      description: 'See the kanji word and type its meaning.',
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
  populateSetSelect();
  resetPractice();

  const subtitles = {
    pool: 'Build the word shown by its meaning.',
    reading: 'Type the reading of each kanji word.',
    meaning: 'Type the meaning of each kanji word.',
  };
  els.subtitle.textContent = subtitles[mode];
  els.poolPanel.classList.toggle('hidden', mode !== 'pool');
  els.practiceScreen.classList.toggle('pool-mode', mode === 'pool');
  els.practiceScreen.classList.toggle('typed-mode', mode !== 'pool');
  showScreen('practice');
}

function currentSet() {
  return state.data.practiceSets.find((set) => set.id === state.setId) || state.data.practiceSets[0];
}

function populateSetSelect() {
  els.setSelect.replaceChildren();
  for (const set of state.data.practiceSets) {
    const option = document.createElement('option');
    option.value = set.id;
    option.textContent = set.title;
    option.selected = set.id === state.setId;
    els.setSelect.append(option);
  }
}

function resetPractice() {
  state.answers.clear();
  state.selectedTileId = null;
  state.activeSlot = null;
  state.checked = false;
  hideStatus();

  for (const entry of currentSet().entries) {
    const initialAnswer = state.mode === 'pool'
      ? Array(characters(wordFor(entry)).length).fill(null)
      : '';
    state.answers.set(entry.id, initialAnswer);
  }

  if (state.mode === 'pool') createPool();
  else state.poolTiles = [];

  renderQuestions();
  renderPool();
  requestAnimationFrame(updatePoolTrayHeight);
}

function createPool() {
  state.poolTiles = shuffle(
    uniqueKanji().map((kanji, index) => ({ id: `tile-${index}`, kanji })),
  );
}

function renderQuestions() {
  els.questionsPanel.replaceChildren();

  for (const entry of currentSet().entries) {
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
      promptLabel.textContent = 'Kanji word';
      prompt.textContent = wordFor(entry);
      prompt.lang = 'ja';
      typedAnswer.classList.remove('hidden');
      typedLabel.textContent = state.mode === 'reading' ? 'Reading' : 'Meaning';
      typedInput.placeholder = state.mode === 'reading' ? 'Type kana or romaji…' : 'Type the meaning…';
      typedInput.value = state.answers.get(entry.id) || '';
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

  answerValues.forEach((value, index) => {
    const slot = document.createElement('button');
    slot.type = 'button';
    slot.className = 'slot';
    slot.dataset.entryId = entry.id;
    slot.dataset.slotIndex = String(index);
    slot.setAttribute('aria-label', `Slot ${index + 1} for ${primaryMeaningFor(entry)}`);

    if (value?.kanji) {
      slot.textContent = value.kanji;
      slot.classList.add('filled');
    }

    const isActive = state.activeSlot?.entryId === entry.id && state.activeSlot?.index === index;
    slot.classList.toggle('active', isActive);
    slot.setAttribute('aria-pressed', String(isActive));

    if (state.checked) {
      const expected = characters(wordFor(entry))[index];
      slot.classList.add(slot.textContent === expected ? 'correct' : 'incorrect');
    }

    slot.addEventListener('click', () => onSlotClick(entry.id, index));
    slot.addEventListener('dragover', (event) => event.preventDefault());
    slot.addEventListener('drop', (event) => {
      event.preventDefault();
      const tileId = event.dataTransfer.getData('text/plain');
      if (tileId) placePoolTile(tileId, entry.id, index);
    });
    slots.append(slot);
  });
}

function renderResult(entry, card, result) {
  const correct = isEntryCorrect(entry);
  card.classList.add(correct ? 'answer-correct' : 'answer-incorrect');

  if (correct) {
    result.textContent = 'Correct';
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

  if (state.selectedTileId) {
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
  const entries = currentSet().entries;
  let passedCurrentSlot = false;

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
    els.poolHint.textContent = 'Slot selected — tap a kanji.';
  } else {
    els.poolHint.textContent = 'Tap a tile, then a slot — or choose a slot first.';
  }

  for (const tile of state.poolTiles) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'kanji-tile';
    button.textContent = tile.kanji;
    button.draggable = true;
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
  for (const entry of currentSet().entries) {
    for (const kanji of characters(wordFor(entry))) {
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
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[\s'’._-]+/g, '');
}

function normalizeMeaning(value) {
  return String(value)
    .normalize('NFKC')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[.!?]+$/g, '');
}

function actualPoolAnswer(entryId) {
  return state.answers.get(entryId).map((value) => value?.kanji || '').join('');
}

function isEntryCorrect(entry) {
  if (state.mode === 'pool') return actualPoolAnswer(entry.id) === wordFor(entry);

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
  state.checked = true;
  state.selectedTileId = null;
  state.activeSlot = null;
  const entries = currentSet().entries;
  const correctCount = entries.filter(isEntryCorrect).length;
  renderQuestions();
  renderPool();

  els.status.className = `status ${correctCount === entries.length ? 'good' : 'bad'}`;
  els.status.textContent = `${correctCount} of ${entries.length} answers correct.`;
}

function clearCheckedVisuals() {
  if (!state.checked) return;
  state.checked = false;
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
  const isMobilePool = state.mode === 'pool'
    && window.matchMedia('(max-width: 900px)').matches
    && !els.practiceScreen.classList.contains('hidden')
    && !els.poolPanel.classList.contains('hidden');

  const height = isMobilePool ? Math.ceil(els.poolPanel.getBoundingClientRect().height) : 0;
  document.documentElement.style.setProperty('--pool-tray-height', `${height}px`);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

els.backButton.addEventListener('click', () => {
  state.mode = null;
  state.activeSlot = null;
  state.selectedTileId = null;
  els.practiceScreen.classList.remove('pool-mode', 'typed-mode');
  renderModeScreen();
  showScreen('modes');
});

els.resetButton.addEventListener('click', resetPractice);
els.checkButton.addEventListener('click', checkAnswers);
els.shuffleButton.addEventListener('click', () => {
  state.poolTiles = shuffle(state.poolTiles);
  renderPool();
});
els.setSelect.addEventListener('change', () => {
  state.setId = els.setSelect.value;
  resetPractice();
});
window.addEventListener('resize', updatePoolTrayHeight);

if ('ResizeObserver' in window) {
  new ResizeObserver(updatePoolTrayHeight).observe(els.poolPanel);
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}

loadData();
