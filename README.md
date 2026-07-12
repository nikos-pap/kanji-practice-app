# Kanji Practice

A static, file-driven kanji practice app for GitHub Pages.

## Practice modes

1. **Meaning → Kanji** — build each word from a reusable kanji pool.
2. **Kanji → Reading** — type the reading in kana or accepted romaji.
3. **Kanji → Meaning** — type an accepted meaning.

## Edit the words

Edit:

```text
data/kanji-practice.json
```

A complete entry can look like this:

```json
{
  "id": "school",
  "word": "学校",
  "meaning": "school",
  "meanings": ["school"],
  "readings": ["がっこう"],
  "romaji": ["gakkou", "gakko"]
}
```

- `word` is the kanji word used by all three modes.
- `meaning` is the prompt shown in Meaning → Kanji mode.
- `meanings` contains every typed meaning that should be accepted.
- `readings` contains every accepted kana reading.
- `romaji` contains every accepted romaji spelling.

Romaji comparison ignores capitalization, spaces, apostrophes, hyphens, and accents. Add spelling variants explicitly when you want both forms accepted, such as `gakkou` and `gakko`.

The kanji pool is generated automatically from the selected set. Each unique kanji appears once and remains reusable after placement.

## Test on this computer and a phone

On Windows, double-click:

```text
serve-lan.bat
```

The window prints two addresses, for example:

```text
Computer: http://localhost:8000/
Phone:    http://192.168.1.25:8000/
```

Open the `Phone` address on a phone connected to the same Wi-Fi or local network. Keep the server window open. If Windows Firewall asks, allow access on **Private networks**.

The app itself does not use Python. The launcher only uses Python as a local static-file server when it is installed; otherwise it tries Node.js.

## Host on GitHub Pages

1. Create a GitHub repository.
2. Put all files from this folder in the repository root.
3. Open **Settings → Pages**.
4. Choose **Deploy from a branch**.
5. Select `main` and `/ (root)`.
6. Save.

No build step or backend is required.
