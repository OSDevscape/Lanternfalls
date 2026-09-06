## Lanternfalls: The Hidden Archive

<p align="center">
  <strong>An offline-first reading tracker, personal library, and fantasy RPG powered by real reading time.</strong>
</p><p align="center">
  Read minutes. Build your library. Become legendary.
</p><p align="center">
  <img src="https://img.shields.io/badge/Reading-becomes%20the%20Adventure-B7791F?style=flat-square&logo=dungeonsanddragons&logoColor=white" alt="Reading becomes an adventure badge" />
</p>
<br><br>
<p align="center">
  <img src="https://img.shields.io/badge/platform-Android-3DDC84?style=for-the-badge&logo=android&logoColor=white" alt="Android badge" />
  <img src="https://img.shields.io/badge/built%20with-Capacitor-119EFF?style=for-the-badge&logo=capacitor&logoColor=white" alt="Capacitor badge" />
  <img src="https://img.shields.io/badge/offline--first-yes-6C63FF?style=for-the-badge" alt="Offline-first badge" />
  <img src="https://img.shields.io/badge/status-active%20development-B7791F?style=for-the-badge" alt="Active development badge" />
</p><p align="center">
  <img src="https://img.shields.io/badge/metadata-Google%20Books%20%2B%20Open%20Library-8A5CF6?style=flat-square" alt="Metadata providers badge" />
  <img src="https://img.shields.io/badge/import-Goodreads%20CSV-553B08?style=flat-square&logo=goodreads&logoColor=white" alt="Goodreads CSV import badge" />
  <img src="https://img.shields.io/badge/cloud-Cloudflare%20Worker-F38020?style=flat-square&logo=cloudflare&logoColor=white" alt="Cloudflare Worker badge" />
  <img src="https://img.shields.io/badge/backup-Google%20Drive-34A853?style=flat-square&logo=google-drive&logoColor=white" alt="Google Drive backup badge" />
  <img src="https://img.shields.io/badge/widget-Android%20Home%20Screen-2E7D32?style=flat-square" alt="Android home-screen widget badge" />
</p><p align="center">
  <img src="https://img.shields.io/github/license/OSDevscape/ReadQuest?style=flat-square&color=8A5CF6" alt="License badge" />
  <img src="https://img.shields.io/github/last-commit/OSDevscape/ReadQuest?style=flat-square&color=B7791F" alt="Last commit badge" />
  <img src="https://img.shields.io/github/issues/OSDevscape/ReadQuest?style=flat-square&color=D69E2E" alt="Open issues badge" />
  <img src="https://img.shields.io/github/stars/OSDevscape/ReadQuest?style=flat-square&color=F6C343" alt="GitHub stars badge" />
</p>
<br><br><p align="center">
  <a href="https://discord.gg/DPmxWrE58x">
    <img
      src="https://img.shields.io/discord/1536577151732817961?style=for-the-badge&logo=discord&logoColor=white&label=Discord&color=5865F2"
      alt="Join the Lanternfalls Discord"
    />
  </a>
  <br>
  <a href="https://top.gg/discord/servers/877985802158972928">
    <img
      src="https://top.gg/api/v1/widgets/large/877985802158972928"
      alt="Lanternfalls Discord server"
    />
  </a>
</p>---

What is Lanternfalls: The Hidden Archive?

Lanternfalls: The Hidden Archive is a reading app for people who want more than a timer and more than a spreadsheet shelf.

It combines a personal book library, real reading-session tracking, and a fantasy RPG progression system in one Android-first experience. Instead of relying on vague habit check-ins, Lanternfalls uses the minutes you actually spend reading or listening to drive character growth, rewards, quests, loot, trophies, and Book Boss encounters.

Your reading is the adventure.

Why It Exists

Most reading apps focus on one of two things:

- Cataloging books
- Tracking habits

Lanternfalls brings these ideas together and adds a purposeful game layer.

Your library becomes a world. Reading sessions become meaningful progress. Consistency helps build your character. The RPG systems are designed to make reading feel more rewarding without turning it into another noisy productivity chore.

Highlights

Area| What it does
Library| Catalog books with title, author, ISBN, genre, format, price, notes, rating, difficulty, status, tags, series, collection, publisher, page count, and cover information.
Reading log| Track real reading and listening sessions by minute, optionally tied to a book.
Adventure| Earn XP, gold, rewards, loot, trophies, and progression through real reading.
Book Bosses| Face deterministic encounters tied to books in your library.
Realm| Explore character progression, classes, inventory systems, achievements, and the Bookwyrm Bazaar.
Metadata| Enrich books through ISBN lookup backed by Google Books and Open Library.
Android tools| Scan ISBN barcodes with the Android camera and use an optional home-screen reading widget.
Import and backup| Import Goodreads CSV exports, import or export Lanternfalls JSON, and back up or restore with Google Drive.

Features

Library Management

- Add, edit, and remove books.
- Search by title or author.
- Catalog ISBN, genre, format, price, notes, rating, difficulty, and reading status.
- Add tags, series details, collection, publisher, publication year, language, page count, description, and custom cover URLs.
- Cache book covers and metadata when available.
- Organize books with the following status states: To Read, Reading, Paused, Finished, Gave Up, Wishlist, and Loaned Out.

Goodreads Import

Lanternfalls can import a Goodreads library CSV export directly on your device.

- Import Goodreads books as new Lanternfalls library entries.
- Restore and merge Goodreads data into an existing Lanternfalls library.
- Restore and replace the current Lanternfalls book list from a Goodreads CSV after confirmation.
- Map Goodreads shelves to Lanternfalls reading statuses: "read" to Finished, "currently-reading" to Reading, and "to-read" to To Read.
- Preserve Goodreads shelves as Lanternfalls tags.
- Import supported Goodreads fields including title, author, ISBN, personal rating, average rating, publisher, binding, page count, publication years, date read, date added, review text, and private notes when available.
- Match books by Goodreads Book ID when available, then ISBN, then normalized title and author.

«Goodreads import is intended for library migration and update. It does not replace a full Lanternfalls backup because Goodreads does not contain Lanternfalls-specific RPG progress, settings, reading-session history, or all custom library metadata.»

Reading Tracking

- Log reading or listening minutes manually.
- Attach sessions to a specific book.
- Select a session date.
- Review reading history.
- Keep game progression grounded in actual time spent reading.
- Use daily reading reminders on supported Android devices.

RPG Progression

- Choose from six classes: Scholar, Warrior, Mage, Rogue, Ranger, and Bard.
- Earn XP and gold from reading activity.
- Build stats and level progression.
- Claim reading-session and book-completion rewards.
- Face deterministic Book Bosses tied to your books.
- Collect loot, artifacts, trophies, achievements, and other progression rewards.
- Explore class rules and class-specific identity within the wider adventure.

Realm Systems

- Manage class, level, stats, and progression from the Character area.
- Visit The Bookwyrm Bazaar for marketplace and reading-enchantment systems.
- Build collections connected to your library and adventure systems.
- Explore quests, achievements, trophies, loot, rewards, and boss encounters.
- Preview future Realm destinations: Equipment, Collection, World Map, and Dungeon Party.

Metadata and Scanning

- Enter ISBNs manually.
- Scan ISBN barcodes with the Android camera.
- Support ISBN-10 and ISBN-13 normalization.
- Fetch metadata through a Cloudflare Worker endpoint.
- Look up book and edition information through Google Books and Open Library.
- Cache metadata and cover results for repeat use.
- Use saved custom cover URLs when available.

Backup, Restore, and Widget Support

- Export the Lanternfalls library as a local JSON backup.
- Import and merge a Lanternfalls JSON backup.
- Connect Google Drive for manual private backups.
- Restore a Google Drive backup by merge or full replacement.
- Back up Lanternfalls books, supported metadata, and app settings through Google Drive.
- Use the optional Android home-screen widget for quick reading-session controls.
- Start, pause, resume, and stop reading sessions from the widget.
- Refresh or pin the widget on supported Android launchers.

Import and Backup

Lanternfalls supports three data-transfer options. Each serves a different purpose.

Option| Best for| Includes| Important limitation
Goodreads CSV Import| Moving a Goodreads library into Lanternfalls| Goodreads book, shelf, rating, publisher, page, date, review, and note data when present| Does not contain Lanternfalls RPG data, settings, or complete app history
Lanternfalls JSON Export| Creating a portable local library backup| Lanternfalls book-library data| Does not include every separate app setting or progression store
Google Drive Backup| Backing up and restoring Lanternfalls across devices| Books, supported metadata, and Lanternfalls settings| Uses a manual backup and restore flow and requires Google Drive access

Goodreads CSV Workflow

1. Export your Goodreads library as a CSV file.
2. Open the Lanternfalls Library menu.
3. Choose an import option:
   - Import Goodreads CSV: Adds books that do not already match your library.
   - Restore and Merge from Goodreads: Adds missing books and enriches matched books with available Goodreads data.
   - Restore and Replace from Goodreads: Replaces the current Lanternfalls book list with the selected Goodreads CSV.
4. Select the exported Goodreads ".csv" file.
5. Review the confirmation message before saving.

Before using Restore and Replace from Goodreads, create a Lanternfalls JSON export or Google Drive backup so you can restore your previous library if needed.

Google Drive Workflow

1. Open the Lanternfalls Library menu.
2. Connect Google Drive.
3. Choose Back Up to Google Drive to create or update a private Lanternfalls backup.
4. On another device, choose a restore option:
   - Restore and Merge from Google Drive: Combines the backup with the current library.
   - Restore and Replace from Google Drive: Replaces the current library and supported settings with the saved backup.

Google Drive backup is recommended before major library changes because it preserves more Lanternfalls-specific information than Goodreads CSV import. The current Drive snapshot contains the book list, stored metadata, and app settings.

Technical Stack

Layer| Technology
App shell| Capacitor
Platform focus| Android
Web UI| HTML, CSS, and JavaScript
Local data| Browser local storage and Capacitor Filesystem on Android
Book metadata| Google Books and Open Library
Metadata proxy| Cloudflare Workers
Authentication and backup| Google Sign-In and Google Drive app-data storage
ISBN scanning| Android CameraX and Google ML Kit barcode scanning
Notifications| Capacitor Local Notifications
Home-screen widget| Native Android AppWidget APIs

Offline-First Approach

Lanternfalls is designed so that your core reading library and progress remain available on-device.

- Books are stored locally.
- Reading sessions and RPG progression use local application state.
- Goodreads CSV import reads a file selected on your device.
- JSON exports provide a local backup option.
- Google Drive backup is an optional manual sync path.
- Metadata lookups and cover fetching require network access.

When Capacitor Filesystem is available on Android, Lanternfalls maintains a native "books.json" copy alongside browser local storage.

Data Safety

Before testing an import, a large library change, or a replace operation:

1. Export a local Lanternfalls JSON backup.
2. Optionally create a Google Drive backup.
3. Test unfamiliar CSV files with a small sample library first.
4. Use Goodreads Merge before Goodreads Replace whenever possible.
5. Avoid clearing Android app storage until you have verified a current backup.

Roadmap

Lanternfalls: The Hidden Archive is actively developed. Priorities may change as the app grows through testing, feedback, and new ideas.

v0.2.0: Scan and Discover

- Add ISBN barcode scanning for fast book discovery and library entry.
- Improve metadata handling, ISBN lookup support, and cover-image recovery.
- Add tooltips and in-app guidance for unfamiliar features, rewards, mechanics, and controls.
- Improve accessibility, readable layouts, touch targets, and mobile responsiveness.

v0.3.0: The Golden Age

- Add a gold-sink economy with meaningful ways to spend, save, and invest earned gold.
- Expand loot drops, collectible rewards, trophies, and progression incentives.
- Develop more distinct class-specific mechanics, bonuses, rewards, and play styles.

v0.4.0: Forge of Legends

- Expand combat with stronger foes, deeper encounter mechanics, and more meaningful victories.
- Make artifacts and relics usable through abilities, bonuses, and gameplay effects.
- Expand Book Boss behavior, quest challenges, achievements, trophies, and milestone rewards.

v0.5.0: Chronicles and Collections

- Improve Goodreads CSV import and migration support.
- Add import previews, row-level conflict resolution, duplicate handling, and clearer control over imported data.
- Add a book-rating system.
- Display total completed-book pages in the reading statistics experience.
- Improve series support, collections, filters, sorting, and general library organization.

v0.6.0: Worlds of Stories

- Add a genre-based world map shaped by reading activity and completed books.
- Expand the Realm with destinations, locations, landmarks, lore, and connected world-building systems.
- Add quests, narrative events, reading challenges, and story-driven goals.

v0.7.0: Gather Your Party

- Add Dungeon Parties for shared reading challenges and book-club-style groups.
- Explore cooperative goals, party progress, group quests, and community features.

Ongoing Improvements

- Improve Android home-screen widget reliability and behavior.
- Refine reading-session controls and tracking flows.
- Improve offline reliability, local-data resilience, navigation, and performance.
- Continue accessibility improvements, including clearer labels, tooltips, and readable interfaces.
- Fix bugs, balance RPG systems, and deliver quality-of-life improvements.
- Expand metadata sources, cover recovery, and library-data accuracy.

«More adventures await beyond the horizon. Submit a feature request to help shape the future of Lanternfalls: The Hidden Archive.»

Contributing

Lanternfalls: The Hidden Archive is actively evolving, and thoughtful feedback helps shape what comes next.

Report a Bug

Open a bug report with a clear description of what happened, what you expected instead, and the steps needed to reproduce it.

When relevant, include your Lanternfalls version, Android version, device model, screenshots, screen recordings, or logs. The more reproducible the report, the easier it is to diagnose and fix.

Suggest a Feature

Open a feature request for ideas that would make Lanternfalls more useful, more enjoyable, or more immersive. Include:

- What you would like to see.
- Why it would improve the experience.
- How you imagine it working.
- Examples, screenshots, or references where useful.

Ideas related to reading tools, library organization, RPG progression, combat, loot, character systems, world-building, accessibility, and visual polish are welcome.

Contribution Guidelines

- Search open issues before creating a new issue.
- Keep each issue focused on one bug, improvement, or feature request.
- Do not share private reading data, exported backups, account details, or access tokens.
- For import or backup issues, state whether you used Goodreads CSV, Lanternfalls JSON, or Google Drive, and whether you selected Import, Merge, or Replace.
- Be kind, specific, and constructive.

License

See "LICENSE" (LICENSE).  <img src="https://img.shields.io/badge/status-active%20development-B7791F?style=for-the-badge" alt="Active development badge" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/metadata-Google%20Books%20%2B%20Open%20Library-8A5CF6?style=flat-square" alt="Metadata providers badge" />
  <img src="https://img.shields.io/badge/import-Goodreads%20CSV-553B08?style=flat-square&logo=goodreads&logoColor=white" alt="Goodreads CSV import badge" />
  <img src="https://img.shields.io/badge/cloud-Cloudflare%20Worker-F38020?style=flat-square&logo=cloudflare&logoColor=white" alt="Cloudflare Worker badge" />
  <img src="https://img.shields.io/badge/backup-Google%20Drive-34A853?style=flat-square&logo=google-drive&logoColor=white" alt="Google Drive backup badge" />
  <img src="https://img.shields.io/badge/widget-Android%20Home%20Screen-2E7D32?style=flat-square" alt="Android home-screen widget badge" />
</p>

<p align="center">
  <img src="https://img.shields.io/github/license/OSDevscape/ReadQuest?style=flat-square&color=8A5CF6" alt="License badge" />
  <img src="https://img.shields.io/github/last-commit/OSDevscape/ReadQuest?style=flat-square&color=B7791F" alt="Last commit badge" />
  <img src="https://img.shields.io/github/issues/OSDevscape/ReadQuest?style=flat-square&color=D69E2E" alt="Open issues badge" />
  <img src="https://img.shields.io/github/stars/OSDevscape/ReadQuest?style=flat-square&color=F6C343" alt="GitHub stars badge" />
</p>
<br><br>
<p align="center">
  <a href="https://discord.gg/DPmxWrE58x">
    <img
      src="https://img.shields.io/discord/1536577151732817961?style=for-the-badge&logo=discord&logoColor=white&label=Discord&color=5865F2"
      alt="Join the ReadQuest Discord"
    />
  </a>
  <br>
  <a href="https://top.gg/discord/servers/877985802158972928">
    <img
      src="https://top.gg/api/v1/widgets/large/877985802158972928"
      alt="ReadQuest Discord server"
    />
  </a>
</p>

---

## What is ReadQuest?

ReadQuest is a reading app for people who want more than a timer and more than a spreadsheet shelf.

It combines a personal book library, real reading-session tracking, and a fantasy RPG progression system in one Android-first experience. Instead of relying on vague habit check-ins, ReadQuest uses the minutes you actually spend reading or listening to drive character growth, rewards, quests, loot, trophies, and Book Boss encounters.

Your reading is the adventure.

## Why It Exists

Most reading apps focus on one of two things:

- Cataloging books
- Tracking habits

ReadQuest brings these ideas together and adds a purposeful game layer.

Your library becomes a world. Reading sessions become meaningful progress. Consistency helps build your character. The RPG systems are designed to make reading feel more rewarding without turning it into another noisy productivity chore.

## Highlights

| Area | What it does |
| --- | --- |
| **Library** | Catalog books with title, author, ISBN, genre, format, price, notes, rating, difficulty, status, tags, series, collection, publisher, page count, and cover information. |
| **Reading log** | Track real reading and listening sessions by minute, optionally tied to a book. |
| **Adventure** | Earn XP, gold, rewards, loot, trophies, and progression through real reading. |
| **Book Bosses** | Face deterministic encounters tied to books in your library. |
| **Realm** | Explore character progression, classes, inventory systems, achievements, and the Bookwyrm Bazaar. |
| **Metadata** | Enrich books through ISBN lookup backed by Google Books and Open Library. |
| **Android tools** | Scan ISBN barcodes with the Android camera and use an optional home-screen reading widget. |
| **Import and backup** | Import Goodreads CSV exports, import or export ReadQuest JSON, and back up or restore with Google Drive. |

## Features

### Library Management

- Add, edit, and remove books.
- Search by title or author.
- Catalog ISBN, genre, format, price, notes, rating, difficulty, and reading status.
- Add tags, series details, collection, publisher, publication year, language, page count, description, and custom cover URLs.
- Cache book covers and metadata when available.
- Organize books with the following status states: To Read, Reading, Paused, Finished, Gave Up, Wishlist, and Loaned Out.

### Goodreads Import

ReadQuest can import a Goodreads library CSV export directly on your device.

- Import Goodreads books as new ReadQuest library entries.
- Restore and merge Goodreads data into an existing ReadQuest library.
- Restore and replace the current ReadQuest book list from a Goodreads CSV after confirmation.
- Map Goodreads shelves to ReadQuest reading statuses: `read` to Finished, `currently-reading` to Reading, and `to-read` to To Read.
- Preserve Goodreads shelves as ReadQuest tags.
- Import supported Goodreads fields including title, author, ISBN, personal rating, average rating, publisher, binding, page count, publication years, date read, date added, review text, and private notes when available.
- Match books by Goodreads Book ID when available, then ISBN, then normalized title and author.

> Goodreads import is intended for library migration and update. It does not replace a full ReadQuest backup because Goodreads does not contain ReadQuest-specific RPG progress, settings, reading-session history, or all custom library metadata.

### Reading Tracking

- Log reading or listening minutes manually.
- Attach sessions to a specific book.
- Select a session date.
- Review reading history.
- Keep game progression grounded in actual time spent reading.
- Use daily reading reminders on supported Android devices.

### RPG Progression

- Choose from six classes: Scholar, Warrior, Mage, Rogue, Ranger, and Bard.
- Earn XP and gold from reading activity.
- Build stats and level progression.
- Claim reading-session and book-completion rewards.
- Face deterministic Book Bosses tied to your books.
- Collect loot, artifacts, trophies, achievements, and other progression rewards.
- Explore class rules and class-specific identity within the wider adventure.

### Realm Systems

- Manage class, level, stats, and progression from the Character area.
- Visit The Bookwyrm Bazaar for marketplace and reading-enchantment systems.
- Build collections connected to your library and adventure systems.
- Explore quests, achievements, trophies, loot, rewards, and boss encounters.
- Preview future Realm destinations: Equipment, Collection, World Map, and Dungeon Party.

### Metadata and Scanning

- Enter ISBNs manually.
- Scan ISBN barcodes with the Android camera.
- Support ISBN-10 and ISBN-13 normalization.
- Fetch metadata through a Cloudflare Worker endpoint.
- Look up book and edition information through Google Books and Open Library.
- Cache metadata and cover results for repeat use.
- Use saved custom cover URLs when available.

### Backup, Restore, and Widget Support

- Export the ReadQuest library as a local JSON backup.
- Import and merge a ReadQuest JSON backup.
- Connect Google Drive for manual private backups.
- Restore a Google Drive backup by merge or full replacement.
- Back up ReadQuest books, supported metadata, and app settings through Google Drive.
- Use the optional Android home-screen widget for quick reading-session controls.
- Start, pause, resume, and stop reading sessions from the widget.
- Refresh or pin the widget on supported Android launchers.

## Import and Backup

ReadQuest supports three data-transfer options. Each serves a different purpose.

| Option | Best for | Includes | Important limitation |
| --- | --- | --- | --- |
| **Goodreads CSV Import** | Moving a Goodreads library into ReadQuest | Goodreads book, shelf, rating, publisher, page, date, review, and note data when present | Does not contain ReadQuest RPG data, settings, or complete app history |
| **ReadQuest JSON Export** | Creating a portable local library backup | ReadQuest book-library data | Does not include every separate app setting or progression store |
| **Google Drive Backup** | Backing up and restoring ReadQuest across devices | Books, supported metadata, and ReadQuest settings | Uses a manual backup and restore flow and requires Google Drive access |

### Goodreads CSV Workflow

1. Export your Goodreads library as a CSV file.
2. Open the ReadQuest Library menu.
3. Choose an import option:
   - **Import Goodreads CSV:** Adds books that do not already match your library.
   - **Restore and Merge from Goodreads:** Adds missing books and enriches matched books with available Goodreads data.
   - **Restore and Replace from Goodreads:** Replaces the current ReadQuest book list with the selected Goodreads CSV.
4. Select the exported Goodreads `.csv` file.
5. Review the confirmation message before saving.

Before using **Restore and Replace from Goodreads**, create a ReadQuest JSON export or Google Drive backup so you can restore your previous library if needed.

### Google Drive Workflow

1. Open the ReadQuest Library menu.
2. Connect Google Drive.
3. Choose **Back Up to Google Drive** to create or update a private ReadQuest backup.
4. On another device, choose a restore option:
   - **Restore and Merge from Google Drive:** Combines the backup with the current library.
   - **Restore and Replace from Google Drive:** Replaces the current library and supported settings with the saved backup.

Google Drive backup is recommended before major library changes because it preserves more ReadQuest-specific information than Goodreads CSV import. The current Drive snapshot contains the book list, stored metadata, and app settings.

## Technical Stack

| Layer | Technology |
| --- | --- |
| App shell | Capacitor |
| Platform focus | Android |
| Web UI | HTML, CSS, and JavaScript |
| Local data | Browser local storage and Capacitor Filesystem on Android |
| Book metadata | Google Books and Open Library |
| Metadata proxy | Cloudflare Workers |
| Authentication and backup | Google Sign-In and Google Drive app-data storage |
| ISBN scanning | Android CameraX and Google ML Kit barcode scanning |
| Notifications | Capacitor Local Notifications |
| Home-screen widget | Native Android AppWidget APIs |

## Offline-First Approach

ReadQuest is designed so that your core reading library and progress remain available on-device.

- Books are stored locally.
- Reading sessions and RPG progression use local application state.
- Goodreads CSV import reads a file selected on your device.
- JSON exports provide a local backup option.
- Google Drive backup is an optional manual sync path.
- Metadata lookups and cover fetching require network access.

When Capacitor Filesystem is available on Android, ReadQuest maintains a native `books.json` copy alongside browser local storage.

## Data Safety

Before testing an import, a large library change, or a replace operation:

1. Export a local ReadQuest JSON backup.
2. Optionally create a Google Drive backup.
3. Test unfamiliar CSV files with a small sample library first.
4. Use Goodreads Merge before Goodreads Replace whenever possible.
5. Avoid clearing Android app storage until you have verified a current backup.

## Roadmap

ReadQuest is actively developed. Priorities may change as the app grows through testing, feedback, and new ideas.

### v0.2.0: Scan and Discover

- Add ISBN barcode scanning for fast book discovery and library entry.
- Improve metadata handling, ISBN lookup support, and cover-image recovery.
- Add tooltips and in-app guidance for unfamiliar features, rewards, mechanics, and controls.
- Improve accessibility, readable layouts, touch targets, and mobile responsiveness.

### v0.3.0: The Golden Age

- Add a gold-sink economy with meaningful ways to spend, save, and invest earned gold.
- Expand loot drops, collectible rewards, trophies, and progression incentives.
- Develop more distinct class-specific mechanics, bonuses, rewards, and play styles.

### v0.4.0: Forge of Legends

- Expand combat with stronger foes, deeper encounter mechanics, and more meaningful victories.
- Make artifacts and relics usable through abilities, bonuses, and gameplay effects.
- Expand Book Boss behavior, quest challenges, achievements, trophies, and milestone rewards.

### v0.5.0: Chronicles and Collections

- Improve Goodreads CSV import and migration support.
- Add import previews, row-level conflict resolution, duplicate handling, and clearer control over imported data.
- Add a book-rating system.
- Display total completed-book pages in the reading statistics experience.
- Improve series support, collections, filters, sorting, and general library organization.

### v0.6.0: Worlds of Stories

- Add a genre-based world map shaped by reading activity and completed books.
- Expand the Realm with destinations, locations, landmarks, lore, and connected world-building systems.
- Add quests, narrative events, reading challenges, and story-driven goals.

### v0.7.0: Gather Your Party

- Add Dungeon Parties for shared reading challenges and book-club-style groups.
- Explore cooperative goals, party progress, group quests, and community features.

### Ongoing Improvements

- Improve Android home-screen widget reliability and behavior.
- Refine reading-session controls and tracking flows.
- Improve offline reliability, local-data resilience, navigation, and performance.
- Continue accessibility improvements, including clearer labels, tooltips, and readable interfaces.
- Fix bugs, balance RPG systems, and deliver quality-of-life improvements.
- Expand metadata sources, cover recovery, and library-data accuracy.

> More adventures await beyond the horizon. Submit a feature request to help shape the future of ReadQuest RPG.

## Contributing

ReadQuest is actively evolving, and thoughtful feedback helps shape what comes next.

### Report a Bug

Open a bug report with a clear description of what happened, what you expected instead, and the steps needed to reproduce it.

When relevant, include your ReadQuest version, Android version, device model, screenshots, screen recordings, or logs. The more reproducible the report, the easier it is to diagnose and fix.

### Suggest a Feature

Open a feature request for ideas that would make ReadQuest more useful, more enjoyable, or more immersive. Include:

- What you would like to see.
- Why it would improve the experience.
- How you imagine it working.
- Examples, screenshots, or references where useful.

Ideas related to reading tools, library organization, RPG progression, combat, loot, character systems, world-building, accessibility, and visual polish are welcome.

### Contribution Guidelines

- Search open issues before creating a new issue.
- Keep each issue focused on one bug, improvement, or feature request.
- Do not share private reading data, exported backups, account details, or access tokens.
- For import or backup issues, state whether you used Goodreads CSV, ReadQuest JSON, or Google Drive, and whether you selected Import, Merge, or Replace.
- Be kind, specific, and constructive.

## License

See [LICENSE](LICENSE).
