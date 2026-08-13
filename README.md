# ReadQuest

ReadQuest is an offline-first Android book-library organizer and reading-time tracker with a lightweight fantasy RPG layer.

> Read minutes. Defeat Book Bosses. Become legendary.

The user’s actual reading time is the source of truth. The RPG layer makes reading progress visible through XP, gold, levels, Book Bosses, trophies, and loot. It never requires page counts, invents reading progress, or depends on an internet connection.

## Version 1.0 rules

- **Minutes-first:** minutes read or listened drive XP, gold, displayed combat damage, streaks, quests, and completion reward calculations.
- **Offline-first:** core library, reading, Adventure, and reward flows work without an account, AI, Google Drive, or the home-screen widget.
- **Claim-safe rewards:** sessions use `session:<sessionId>` and book completions use `bookCompletion:<bookId>` identifiers to prevent duplicate rewards.
- **Book completion:** a user marks a Reading book as Finished; this creates a Book Boss completion reward that is claimed in Adventure.
- **No AI-generated images:** Version 1.0 uses deterministic local Book Boss names and regions. Optional future AI is text-only, spoiler-safe flavor.

See [`docs/Documentation_Index.md`](docs/Documentation_Index.md) for the authoritative design and current-build documents.

## Current features

### Library

- Add, edit, remove, import, and export books.
- Store title, author, ISBN, genre, format, price, rating, notes, and status.
- Statuses: To Read, Reading, Finished, Wishlist, and Loaned.
- Search by title or author.
- Local native storage through Capacitor Filesystem, with localStorage fallback.
- ISBN lookup and cached covers where metadata is available.

### Reading profile

- Log reading/listening minutes manually.
- Optionally associate a session with a book.
- Choose the session date.
- Review recent sessions and their reward state.
- Remove a time record while retaining claimed rewards.
- Reverse eligible claimed session rewards explicitly.

### Adventure

- Choose a class: Scholar, Warrior, Mage, Rogue, Ranger, or Bard.
- Earn session XP and gold from minutes logged.
- View level, XP progress, gold, stat points, and STR/VIT/INT/WIS/DEX/LCK.
- Allocate earned stat points.
- Receive deterministic combat feedback based on minutes, Strength, and Luck.
- Fight deterministic local Book Bosses based on each book’s title and genre.
- Claim reading-session and Book Boss completion rewards.
- Collect boss trophies and deterministic loot.
- Open trophy details to inspect reading sessions, minutes, rewards, damage summary, and completion history.

### Dashboard and appearance

- Dashboard library overview and random book draw.
- Dashboard refresh after book saves.
- Daily minutes statistic.
- Dark/light mode.
- Configurable accent color.

### Backup and sync

- Local JSON library export/import.
- Optional manual Google Drive backup, restore-and-merge, and restore-and-replace flow.

### Android home-screen widget

The widget is optional. It is intended to display the current Reading book and provide reading-timer controls. Finished widget sessions sync into ReadQuest as normal reading records.

Widget behavior must always be treated as an optional convenience feature; manual time logging remains the primary supported flow.

## Documentation

The `docs/` folder contains the project source-of-truth documents:

| Document | Purpose |
|---|---|
| `ReadQuest_Master_Prompt_Current_Build_v1.3.md` | Product rules, Version 1.0 boundaries, minutes-first formulas, AI policy, and definition of done |
| `ReadQuest_Current_Build_Checklist_v1.3.md` | Verified work, remaining work, conflicts, and release gates |
| `ReadQuest_Completion_Log.md` | Running record of completed checklist items |
| `ReadQuest_Active_Source_Map_v1.3.md` | Active source files, archive snapshots, and release-removal candidates |
| `Documentation_Index.md` | How the documents relate and which document wins on conflicts |

## Data and reward keys

### Native book file

On Android, the library is stored as:

```text
DATA/books.json
```

Book data is shaped like:

```json
{
  "version": 1.1,
  "books": [
    {
      "id": "b1a2b3c4d5",
      "title": "Example Book",
      "author": "Example Author",
      "isbn": "9780000000000",
      "genre": "Fantasy",
      "format": "paperback",
      "status": "reading",
      "rating": 5,
      "notes": "",
      "dateAdded": "2026-08-11T00:00:00.000Z"
    }
  ]
}
```

### Local RPG keys

The current build stores reading and Adventure data in versioned local keys, including:

```text
bookshelf-reading-log-v1
bookshelf-reading-profile-v1
bookshelf-adventure-v1
bookshelf-adventure-progression-v1
bookshelf-adventure-ledger-v1
bookshelf-book-bosses-v1
bookshelf-boss-events-v1
bookshelf-adventure-loot-v1
bookshelf-appearance
```

Do not manually edit these values during normal use. The planned schema manifest in the documentation folder will describe their full shapes and migrations.

## Project structure

```text
book-organizer/
├── docs/                         # Product rules, checklist, completion log, source map
├── www/                          # Web application shipped in Capacitor
│   ├── index.html                # Active web script manifest
│   ├── css/
│   └── js/
│       ├── storage.js            # Book persistence/import/export
│       ├── app.js                # Library UI
│       ├── reading-profile.js    # Minutes logging and session history
│       ├── adventure-rewards.js  # Reward ledger and claims
│       ├── adventure-*.js        # Adventure, bosses, combat, loot, trophies
│       ├── dashboard-*.js        # Dashboard modules
│       ├── widget-*.js           # Widget session/appearance bridges
│       └── appearance-mode.js    # Theme and accent settings
└── android/app/                  # Capacitor Android project and native widget sources
```

For the authoritative list of live versus historical files, see:

```text
docs/ReadQuest_Active_Source_Map_v1.3.md
```

## Development setup

Prerequisites:

- Node.js
- Android Studio
- Android SDK/JDK
- An Android device or emulator for testing

Initial setup:

```bash
npm install
npx cap sync android
npx cap open android
```

After changing files under `www/`:

```bash
npx cap sync android
```

Then rebuild/install through Android Studio.

After changing native Android widget resources or Java files:

1. Run `npx cap sync android` if web assets changed.
2. In Android Studio, use **Build → Clean Project**.
3. Use **Build → Rebuild Project**.
4. Install a fresh APK.
5. Remove and re-add the home-screen widget if its layout changed.

## Contribution rules

1. Read the Master Prompt before changing progression, reward, boss, AI, storage, or release-scope behavior.
2. Work from the next unresolved item in the current-build checklist.
3. Update the Completion Log after an item is implemented and again after it is verified.
4. Do not edit numbered Archive snapshots as if they are active source files.
5. Do not add page-based rewards, AI image generation, or a second reward path without an approved Master Prompt revision.
6. Preserve idempotent reward keys and avoid UI-driven award logic.

## Release status

ReadQuest is under active Version 1.0 development. Before release, complete every release gate in:

```text
docs/ReadQuest_Current_Build_Checklist_v1.3.md
```

In particular, consolidate Book Boss completion rewards behind the ledger, remove the legacy AI image-generation path, validate full backup/restore, and finish the physical-device widget test suite.
