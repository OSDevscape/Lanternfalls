# Book Shelf

A personal book collection organizer for Android — plain HTML/CSS/JS, packaged with Capacitor.

## What's in v1

- Add, edit, and delete books (title, author, ISBN, genre, notes)
- Status per book: To Read / Reading / Finished
- 5-star rating
- Search by title or author
- Library stored on-device as a single JSON file
- Export the whole library to a `.json` file (Android share sheet); import merges a `.json` file back in

Cloud sync isn't built yet — data lives only on the device until you export it.

## Data format

The library is stored as one file, `books.json`, shaped like this:

```json
{
  "version": 1,
  "books": [
    {
      "id": "b1a2b3c4d5",
      "title": "Project Hail Mary",
      "author": "Andy Weir",
      "isbn": "9780593135204",
      "genre": "Sci-Fi",
      "status": "finished",
      "rating": 5,
      "notes": "",
      "dateAdded": "2026-08-08T12:00:00.000Z"
    }
  ]
}
```

`storage.js` also accepts PascalCase field names (`Title`, `Author`, `ISBN`, `Status`, `Rating`, `Notes`, `DateAdded`) so a JSON export from the Personal Library C# app can be dropped straight into Import without editing. **I guessed at that mapping** — if your `Book` class in Personal Library uses different property names, tell me what they are and I'll adjust `normalizeBook()` in `storage.js` to match exactly, so export/import lines up byte-for-byte between the two apps.

## First-time setup

You'll need [Node.js](https://nodejs.org), [Android Studio](https://developer.android.com/studio), and a JDK (Android Studio can install one for you).

```bash
cd book-organizer
npm install
npx cap add android
npx cap sync android
npx cap open android
```

That last command opens the project in Android Studio — click Run to install it on a device or emulator.

## After changing code in www/

```bash
npx cap sync android
```

then rebuild from Android Studio (or `npx cap run android` if you have the Android SDK command-line tools set up).

## Project layout

```
book-organizer/
├── capacitor.config.json
├── package.json
└── www/                  ← this folder is the actual app
    ├── index.html
    ├── css/style.css
    └── js/
        ├── storage.js    ← load/save/export/import (Filesystem plugin)
        └── app.js        ← rendering + UI logic
```

## Notes for next time

- No barcode/ISBN lookup yet — that's a natural v2 (would need `@capacitor/camera` or a barcode-scanning plugin, plus a call to something like the Open Library or Google Books API to auto-fill title/author/cover from the ISBN).
- No cloud sync yet — when you're ready, the cleanest path is probably swapping `storage.js`'s read/write calls for calls to whatever backend you pick, while keeping the same book object shape so the rest of the app doesn't need to change.
- The Android hardware back button currently isn't wired to close the add/edit sheet — it'll fall through to the default WebView behavior. Worth adding `@capacitor/app`'s back-button listener in a later pass.
