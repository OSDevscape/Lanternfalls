# ReadQuest

<p align="center">
  <strong>An offline-first reading tracker, personal library, and fantasy RPG powered by real reading time.</strong>
</p>

<p align="center">
  Read minutes. Build your library. Become legendary.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/platform-Android-3DDC84?style=for-the-badge&logo=android&logoColor=white" alt="Android badge" />
  <img src="https://img.shields.io/badge/built%20with-Capacitor-119EFF?style=for-the-badge&logo=capacitor&logoColor=white" alt="Capacitor badge" />
  <img src="https://img.shields.io/badge/offline--first-yes-6C63FF?style=for-the-badge" alt="Offline first badge" />
  <img src="https://img.shields.io/badge/status-active%20development-B7791F?style=for-the-badge" alt="Active development badge" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/metadata-Google%20Books%20%2B%20Open%20Library-8A5CF6?style=flat-square" alt="Metadata providers badge" />
  <img src="https://img.shields.io/badge/cloud-Cloudflare%20Worker-F38020?style=flat-square&logo=cloudflare&logoColor=white" alt="Cloudflare Worker badge" />
  <img src="https://img.shields.io/badge/backup-Google%20Drive-34A853?style=flat-square&logo=google-drive&logoColor=white" alt="Google Drive badge" />
  <img src="https://img.shields.io/badge/widget-Android%20Home%20Screen-2E7D32?style=flat-square" alt="Android widget badge" />
</p>

---

## What is ReadQuest?

ReadQuest is a reading app for people who want more than a timer and more than a spreadsheet shelf.

It combines a personal book library, a real reading-session log, and a fantasy RPG progression system into one Android-first experience. Instead of relying on fake progress bars or vague habit check-ins, ReadQuest uses the minutes you actually spend reading or listening to power your character growth, rewards, quests, loot, and Book Boss encounters.

## Why it exists

Most reading apps do one of two things:

- They catalog books.
- They track habits.

ReadQuest tries to do something more interesting.

It treats reading like an adventure. Your library becomes a world, your sessions become progress, and your consistency becomes a character-building system. The result is a reader-focused RPG where the game layer exists to make reading feel richer, not noisier.

## Highlights

| Area | What it does |
|---|---|
| **Library** | Catalog books with title, author, ISBN, genre, format, price, notes, rating, difficulty, and status. |
| **Reading log** | Track real reading and listening sessions by minute, optionally tied to a specific book. |
| **Adventure** | Earn XP, gold, rewards, loot, trophies, and progress by reading. |
| **Realm** | Navigate the wider world of ReadQuest through Character and the Bookwyrm Bazaar. |
| **Metadata** | Enrich books through ISBN lookup backed by Google Books and Open Library. |
| **Android features** | Use native ISBN barcode scanning and an optional home-screen widget. |
| **Backup** | Export JSON locally or manually back up and restore through Google Drive. |

## Feature grid

### Library management

- Add, edit, and remove books.
- Import and export library data as JSON.
- Search by title or author.
- Cache covers and book metadata where available.
- Organize books with status states:
  - To Read
  - Reading
  - Paused
  - Finished
  - Gave Up
  - Wishlist
  - Loaned

### Reading tracking

- Log reading or listening minutes manually.
- Attach sessions to a book.
- Choose the session date.
- Review recent reading history.
- Keep reading progress grounded in actual time spent.

### RPG progression

- Choose a class:
  - Scholar
  - Warrior
  - Mage
  - Rogue
  - Ranger
  - Bard
- Earn XP and gold from reading activity.
- Build stats and level progression.
- Claim session and completion rewards.
- Face deterministic Book Bosses tied to your books.
- Collect loot, trophies, and achievement progress.

### Realm systems

- Visit **Character** to manage your class, level, stats, and progression.
- Enter **The Bookwyrm Bazaar** to work with reading enchantment-style systems.
- See future-facing destinations already surfaced in the app UI:
  - Equipment
  - Collection
  - World Map
  - Dungeon Party

### Metadata and scanning

- Enter ISBNs manually.
- Scan ISBN barcodes with the Android camera.
- Normalize ISBN-10 and ISBN-13 values.
- Fetch book data through a Cloudflare Worker endpoint.
- Pull edition data from Google Books and Open Library.
- Cache metadata results for repeat searches.

### Backup and widget support

- Export and import the library locally as JSON.
- Connect Google Drive for manual backups.
- Restore by merge or full replace.
- Use the optional Android home-screen widget for reading convenience.
- Refresh or pin the widget on supported Android launchers.

## Screenshots

> Replace these stubs with actual screenshots once you export them.

### Library

```md
