# Genki Kanji Practice

A static GitHub Pages app generated from the **Genki 3rd Edition Vocabulary Index** workbook.

## Included data

- 23 practice sets: Lesson 1 through Lesson 23.
- Entries come from the workbook's Conversation/Grammar lesson references (`会L1` through `会L23`).
- Lesson-end column references such as `会L4(e)` are included in the same lesson.
- Only vocabulary with an actual kanji written form is included.
- A word referenced by more than one lesson appears in each relevant lesson set.

The generated data is in:

```text
data/kanji-practice.json
```

## Practice modes

1. **Meaning → Kanji** — fill only the kanji positions from a reusable pool. Kana and punctuation remain visible. For example, `食べる` displays a slot for `食` followed by fixed `べる`. The pool can be filtered by literal kanji, vocabulary reading, or individual kanji on/kun reading in romaji. Parentheses are ignored, so searches such as `taka(i)` match `高`. English meanings are intentionally not searchable because the meaning is already the test prompt.
2. **Kanji → Reading** — type the reading in kana or generated romaji.
3. **Kanji → Meaning** — type an accepted English meaning.

## Test locally or on a phone

On Windows, double-click:

```text
serve-lan.bat
```

Open the printed `Phone` address on a phone connected to the same Wi-Fi or local network.

## Publish on GitHub Pages

Put these files at the repository root, commit, and push. In GitHub, open **Settings → Pages**, choose **Deploy from a branch**, then select `main` and `/ (root)`.

No build step or backend is required.

## Learning progress

Progress is stored in the browser on the current device with `localStorage` and is separate for each lesson and practice mode.

Meaning → Kanji serves one randomly ordered ready/new vocabulary entry at a time in a continuous flow. Skipping defers a word without marking it wrong or changing its learning level. The pool always contains every unique kanji from the selected lesson in Japanese dictionary-style radical-and-stroke order; it is never reduced to answer-specific choices or shuffled. The ordering data comes from Unicode 17's `kRSUnicode` radical/residual-stroke values, with code point order used only to break ties.

Individual kanji reading search uses Unicode 17 Unihan `kJapaneseOn` and `kJapaneseKun` data. The local search index covers all 731 kanji used by the app; `々` is handled as an iteration mark rather than a kanji with its own reading.

The two typed modes show up to eight ready/new vocabulary entries at once in deterministic lesson order.

A correct answer moves a word through these review intervals:

1. 10 minutes
2. 1 day
3. 3 days
4. 7 days (`7-day level`)

A wrong answer becomes ready immediately and moves back one learning level. Unanswered rows are not counted when checking.

Use **Clear this lesson/mode** to reset only the open lesson and mode, or **Clear all progress** to remove all locally saved learning progress.

### If the phone cannot connect over the LAN

- Do not open `localhost` on the phone; `localhost` means the phone itself.
- Open one of the `http://192.168...:8000/` or `http://10...:8000/` addresses printed by `serve-lan.bat`.
- Keep the server window open and connect both devices to the same non-guest Wi-Fi/LAN.
- Make the Windows network profile **Private** and allow Python/Node through Windows Firewall for **Private networks**.
- Guest Wi-Fi, client isolation, some VPNs, and corporate networks can block device-to-device connections.


## Updating the GitHub Pages app

This version does not register an offline service worker. It also removes caches left by older versions automatically. After pushing an update, a normal reload is enough; a forced/hard refresh should not be part of the workflow.
