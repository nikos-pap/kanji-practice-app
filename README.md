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

1. **Meaning → Kanji** — fill only the kanji positions from a reusable pool. Kana and punctuation remain visible. For example, `食べる` displays a slot for `食` followed by fixed `べる`.
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
