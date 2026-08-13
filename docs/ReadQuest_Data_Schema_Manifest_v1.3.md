# ReadQuest Data Schema Manifest v1.3

## Purpose

This document is the authoritative map of active persisted data used by the current ReadQuest build. It satisfies checklist item **A.4**.

Use it before changing storage, migration, import/export, backup, reward claims, widget behavior, or Android native files.

## Storage rules

1. `DATA/books.json` is the canonical native book file when Capacitor Filesystem is available.
2. `bookshelf-data` is the localStorage cache/fallback for books.
3. Other current RPG/profile/session data is stored in localStorage under versioned `bookshelf-*` keys.
4. A stable book id is the relationship key across book, session, boss, ledger, trophy, and loot data.
5. Session and completion reward claims are identified by ledger keys, not by visual UI state.
6. Future complete backup/restore must include every key listed in the **Backup set** section.

---

## 1. Canonical books

### Native file

```text
DATA/books.json
```

### Local cache/fallback

```text
bookshelf-data
```

### Owner

```text
storage.js
app.js
```

### Shape

```json
{
  "version": 1.1,
  "books": [
    {
      "id": "stable-book-id",
      "title": "",
      "author": "",
      "isbn": "",
      "genre": "",
      "price": 0,
      "format": "paperback|hardback-special|ebook|kindle|audiobook|",
      "status": "to-read|reading|finished|wishlist|loaned",
      "rating": 0,
      "notes": "",
      "dateAdded": "ISO-8601 timestamp"
    }
  ]
}
```

### Compatibility

`storage.js` accepts PascalCase import fields including `Id`, `Title`, `Author`, `ISBN`, `Genre`, `Price`, `Format`, `Status`, `Rating`, `Notes`, and `DateAdded`.

### Relationships

- `book.id` is referenced by `ReadingSession.bookId`.
- `book.id` keys deterministic boss definitions, boss events, completion ledger transactions, trophy events, and loot items.

---

## 2. Reading sessions

### Key

```text
bookshelf-reading-log-v1
```

### Owner

```text
reading-profile.js
widget-session-sync.js
adventure-rewards.js
adventure-combat.js
adventure-progression.js
adventure-loot.js
adventure-trophy-details.js
```

### Shape

```json
[
  {
    "id": "time-unique-id or widget-uuid",
    "bookId": "optional-book-id",
    "minutes": 25,
    "date": "YYYY-MM-DD",
    "createdAt": "ISO-8601 timestamp",
    "source": "manual|home-widget",
    "bookTitle": "optional widget display title",
    "author": "optional widget-derived author",
    "bookAuthor": "optional widget-derived author",
    "endedAt": 0
  }
]
```

### Required fields for new manual sessions

```text
id, bookId, minutes, date, createdAt
```

### Widget migration behavior

Widget-session import reconstructs missing `date` from `endedAt` and fills missing author fields from the currently stored book list.

### Relationships

- Session claim ledger key: `session:<session.id>`.
- `bookId` contributes to book minutes, combat history, trophy details, and completion calculations.

---

## 3. Reading-profile settings

### Key

```text
bookshelf-reading-profile-v1
```

### Owner

```text
reading-profile.js
```

### Shape

```json
{
  "name": "optional display name",
  "age": 0
}
```

### Notes

This is profile identity/settings for the minutes logging screen. It is separate from the Adventure class/profile key.

---

## 4. Adventure class/profile

### Key

```text
bookshelf-adventure-v1
```

### Owner

```text
adventure.js
adventure-rewards.js
adventure-progression.js
```

### Shape

```json
{
  "className": "Scholar|Warrior|Mage|Rogue|Ranger|Bard"
}
```

### Notes

`className` affects currently implemented Rogue, Bard, and Warrior reward behaviors. Other selected classes are identity data until their reward behavior is implemented.

---

## 5. Character progression

### Key

```text
bookshelf-adventure-progression-v1
```

### Owner

```text
adventure-progression.js
adventure-rewards.js
adventure-combat.js
adventure-loot.js
```

### Shape

```json
{
  "xp": 0,
  "gold": 0,
  "processedSessions": {
    "session-id": true
  },
  "claimedBosses": {
    "bookCompletion:book-id": true
  },
  "stats": {
    "str": 10,
    "vit": 10,
    "int": 10,
    "wis": 10,
    "dex": 10,
    "lck": 10
  }
}
```

### Notes

- `processedSessions` is a legacy/session-claim compatibility map; the ledger is the current reward authority.
- `claimedBosses` is a legacy completion-award path and must be consolidated into the ledger before release.
- Current `xp` is mutable when a session reward is reversed. The future lifetime-XP policy remains unresolved.

---

## 6. Reward ledger

### Key

```text
bookshelf-adventure-ledger-v1
```

### Owner

```text
adventure-rewards.js
reading-profile.js
adventure-progression.js
```

### Shape

```json
{
  "version": 1,
  "transactions": {
    "session:time-id": {
      "id": "session:time-id",
      "type": "session",
      "sourceId": "time-id",
      "status": "claimed|reversed",
      "minutes": 25,
      "xp": 250,
      "gold": 12,
      "bonus": "optional description",
      "bookId": "optional-book-id",
      "bookTitle": "optional title",
      "createdAt": "ISO-8601 timestamp",
      "reversedAt": "ISO-8601 timestamp",
      "readingEntryRemovedAt": "ISO-8601 timestamp",
      "note": "optional"
    },
    "bookCompletion:book-id": {
      "id": "bookCompletion:book-id",
      "type": "bookCompletion",
      "sourceId": "book-id",
      "status": "claimed",
      "minutes": 0,
      "xp": 0,
      "gold": 0,
      "createdAt": "ISO-8601 timestamp"
    },
    "reversal:session:time-id": {
      "id": "reversal:session:time-id",
      "type": "reversal",
      "sourceId": "time-id",
      "status": "reversed",
      "xp": -250,
      "gold": -12,
      "createdAt": "ISO-8601 timestamp"
    }
  }
}
```

### Required idempotency conventions

```text
session:<sessionId>
bookCompletion:<bookId>
reversal:session:<sessionId>
```

### Migration

Existing `processedSessions` entries migrate to historical ledger records with `migrated: true` and unknown reward values (`xp: null`, `gold: null`). Historical migrated rewards cannot automatically be reversed.

### Release alignment requirement

The completion transaction must become the only authority for completion XP, gold, trophy, and loot. The current schema allows a completion entry, but current reward logic still has a parallel legacy completion path.

---

## 7. Deterministic boss definitions

### Key

```text
bookshelf-book-bosses-v1
```

### Owner

```text
adventure-bosses.js
```

### Shape

```json
{
  "book-id": {
    "bookId": "book-id",
    "titleFingerprint": "title|genre",
    "name": "The Inkbound Guardian",
    "region": "The Reading Realm",
    "createdAt": "ISO-8601 timestamp",
    "version": 1
  }
}
```

### Notes

A title/genre fingerprint change regenerates the local boss identity. This system is local, deterministic, and does not require AI.

---

## 8. Pending boss-defeat events

### Key

```text
bookshelf-boss-events-v1
```

### Owner

```text
adventure-bosses.js
```

### Shape

```json
{
  "bossDefeat:book-id": {
    "id": "bossDefeat:book-id",
    "bookId": "book-id",
    "bookTitle": "",
    "bossName": "",
    "defeatedAt": "ISO-8601 timestamp",
    "status": "pending-claim"
  }
}
```

### Release alignment requirement

Completion event status must eventually be updated or reconciled from the ledger after a claim. The ledger, not this event, is the final source of reward truth.

---

## 9. Loot and trophies

### Key

```text
bookshelf-adventure-loot-v1
```

### Owner

```text
adventure-loot.js
adventure-trophy-details.js
adventure.js
```

### Shape

```json
{
  "initialized": true,
  "known": {
    "book-id": "to-read|reading|finished"
  },
  "items": [
    {
      "id": "loot-book-id",
      "bookId": "book-id",
      "bookTitle": "",
      "rarity": "Common|Uncommon|Rare|Epic|Legendary|Mythic",
      "name": "",
      "theme": "",
      "earnedAt": "ISO-8601 timestamp"
    }
  ],
  "events": [
    {
      "bookId": "book-id",
      "title": "",
      "xp": 0,
      "gold": 0,
      "loot": "",
      "rarity": "",
      "earnedAt": "ISO-8601 timestamp"
    }
  ]
}
```

### Release alignment requirement

`known`, legacy events, and `claimedBosses` currently support direct detection/awarding of Finished books. This path must be migrated to completion-ledger claims before release.

---

## 10. Appearance settings

### Key

```text
bookshelf-appearance
```

### Owner

```text
appearance-mode.js
accent-selection-fill.js
widget-appearance-sync.js
widget-appearance-live-sync.js
```

### Shape

```json
{
  "mode": "dark|light",
  "accent": "red|blue|green|yellow|teal|purple|orange|brown|pink|cyan"
}
```

---

## 11. Metadata and related library data

### Key

```text
bookshelf-metadata-v12
```

### Owner

```text
book-metadata.js
google-drive-sync.js
```

### Shape

Object keyed by book id. The exact nested metadata fields are owned by `book-metadata.js` and must be preserved verbatim by backup/restore.

---

## 12. Widget native files

### Native session queue

```text
DATA/reading-widget-sessions.json
```

### Owner

```text
ReadingWidgetProvider.java
widget-session-sync.js
```

### Shape

```json
[
  {
    "id": "widget-uuid",
    "minutes": 25,
    "bookId": "book-id",
    "bookTitle": "",
    "endedAt": 0
  }
]
```

The JavaScript importer copies valid, unknown items into `bookshelf-reading-log-v1` and then clears this native queue.

### Native widget appearance file

```text
DATA/reading-widget-appearance.json
```

### Owner

```text
widget-appearance-sync.js
ReadingWidgetProvider.java
```

### Shape

```json
{
  "accent": "#8B3A3A"
}
```

---

## 13. Google Drive backup envelope

### Remote file

```text
bookshelf-sync.json
```

### Owner

```text
google-drive-sync.js
```

### Current shape

```json
{
  "format": "bookshelf-drive-sync",
  "version": 1,
  "updatedAt": "ISO-8601 timestamp",
  "books": [],
  "metadata": {},
  "settings": {}
}
```

### Current limitation

The `settings` object captures `bookshelf-*` localStorage text values except selected exclusions, but the envelope does not provide a documented migration/validation model for every RPG entity. A future full-backup schema must explicitly version and validate all entities in this manifest before replacement or merge.

---

## Backup set required for Version 1.0

A complete backup/restore must include:

```text
books.json / bookshelf-data
bookshelf-reading-log-v1
bookshelf-reading-profile-v1
bookshelf-adventure-v1
bookshelf-adventure-progression-v1
bookshelf-adventure-ledger-v1
bookshelf-book-bosses-v1
bookshelf-boss-events-v1
bookshelf-adventure-loot-v1
bookshelf-appearance
bookshelf-metadata-v12
any future quest, achievement, streak, and audit-log keys
```

The temporary native widget session queue should be imported before backup whenever possible; it is a queue, not permanent user history.

---

## Migration and editing rules

1. Never generate a new book id while importing a record that already has an id.
2. Never create a second `session:<sessionId>` or `bookCompletion:<bookId>` ledger transaction during import or restore.
3. Preserve migrated historical reward records even if exact XP/gold values are unavailable.
4. Preserve detached-session ledger records when a user chooses to keep rewards.
5. Do not delete legacy keys until a tested migration writes the replacement data and backup is confirmed.
6. Any schema change requires a new manifest version, migration notes, and an upgrade test from this v1.3 shape.
