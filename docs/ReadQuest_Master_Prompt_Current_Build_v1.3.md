# ReadQuest / BookShelf
## Master Product & Implementation Prompt v1.3
### Current-build baseline, target rules, and remaining alignment

## 1. Product identity

ReadQuest is an offline-first Android book-library and reading-time tracker, packaged with Capacitor. It turns real reading and listening time into a lightweight fantasy RPG.

> Read minutes. Defeat Book Bosses. Become legendary.

The real reading record is always authoritative. RPG mechanics make that accomplishment visible; they never invent progress, require pages, block logging, or make the app dependent on AI, internet, or the home-screen widget.

## 2. Current-build baseline

The current build already includes:

- Offline book add, edit, delete, import, export, status, rating, genre, notes, ISBN, and search.
- Manual minutes logging with an optional linked book and date.
- Native Android widget session capture and JavaScript session import.
- A visible Adventure area with class selection, level, XP, gold, rewards, Book Boss naming, combat feedback, trophies, loot, and expandable trophy details.
- A session ledger using `session:<sessionId>` transaction keys, plus a completion key convention of `bookCompletion:<bookId>`.
- Dashboard refresh wrapping `BookStorage.saveBooks()`.
- Appearance/accent persistence and a profile widget-install guide.
- Native widget provider/layout resources, widget refresh hooks, and Android activity/plugin support.

This baseline must be preserved unless a task explicitly replaces it.

## 3. Non-negotiable Version 1.0 rules

### 3.1 Minutes-first

**Minutes read/listened are the only required progression metric in Version 1.0.**

- Minutes drive session XP, session gold, displayed combat damage, quests, streaks, statistics, and completion reward calculations.
- Pages, chapters, page count, page estimates, and page-derived completion are not Version 1.0 requirements.
- A book may be completed manually by setting its status to `finished`.
- Never infer a finished book solely from logged time.

### 3.2 Offline-first

- Books persist through the native Capacitor filesystem when available, with localStorage fallback.
- Sessions, character progress, ledger, boss identity, loot, trophies, and settings persist locally.
- The app works without Google Drive, AI, the widget, or internet.
- Google Drive is optional manual backup/sync, never required for basic use.

### 3.3 Claim safety

No reward may be applied more than once.

- Session key: `session:<sessionId>`
- Completion key: `bookCompletion:<bookId>`
- Ledger state is authoritative, not a rendered card or a `finished` status alone.
- Pending rewards must be visually distinct from claimed rewards.

## 4. Book and session data

### Book

```json
{
  "id": "stable-book-id",
  "title": "",
  "author": "",
  "isbn": "",
  "genre": "",
  "price": 0,
  "format": "",
  "status": "to-read|reading|finished|wishlist|loaned",
  "rating": 0,
  "notes": "",
  "dateAdded": "ISO-8601 timestamp"
}
```

### Session

```json
{
  "id": "time-unique-id",
  "bookId": "optional-book-id",
  "minutes": 25,
  "date": "YYYY-MM-DD",
  "createdAt": "ISO-8601 timestamp",
  "source": "manual|home-widget",
  "mode": "read|listen|unspecified",
  "notes": "optional"
}
```

Validation:

- Minutes must be a positive whole number.
- Book association is optional; only a linked session contributes to that book’s combat/trophy history.
- Preserve unusual entries rather than silently rejecting them.
- Repair missing widget dates from `endedAt` during import/migration.

## 5. Rewards, XP, and gold

### Session reward

```text
XP = minutes × 10
Gold = max(1, floor(minutes ÷ 2))
```

No daily XP cap exists.

The current supported class bonuses are modest and inspectable:

- Rogue: +5% XP for a 10–44 minute session.
- Bard: +5% XP for a session after a prior-day session.
- Warrior: +5% completion gold.

Future class bonuses must follow the same principles: deterministic, capped, reward-only, and never a substitute for reading.

### Combat presentation

```text
Damage = floor(minutes × (1 + STR ÷ 500))
Crit chance = min(25%, 5% + LCK ÷ 20)
Crit damage = 1.5× displayed damage
```

Combat is presentation. It must never determine completion, alter a book’s status, or create fake reading progress.

### Completion reward

When a Reading book changes to Finished, create one pending completion claim.

Target completion formula:

```text
Completion XP = 100 + (book logged minutes × 5)
Completion Gold = 100 + floor(book logged minutes ÷ 2)
```

The current build must be aligned so completion XP, gold, trophy, and deterministic loot are all awarded by the same `bookCompletion:<bookId>` ledger claim. No parallel completion-award path may remain.

## 6. Character progression

- Stats: STR, VIT, INT, WIS, DEX, LCK.
- Base value: 10 each.
- Level formula currently implemented:

```text
Level = floor(sqrt((XP + 100) ÷ 100)), minimum 1
```

- Each level provides 2 allocatable stat points.
- XP/gold reversal must be explicit and ledger-backed.
- Lifetime progression policy must be documented: either preserve lifetime XP separately or clearly define reversible XP behavior. Do not silently create contradictory totals.

Classes: Scholar, Warrior, Mage, Rogue, Ranger, Bard. Classes provide identity and modest reward behavior only.

## 7. Deterministic Book Bosses

Every book gets a local, deterministic boss identity generated from its id, title, genre, and a versioned naming algorithm.

- Genre maps to a region.
- Boss identity is spoiler-safe.
- Unknown genres receive a generic Reading Realm fallback.
- Editing title or genre may deliberately regenerate the local boss identity through a versioned fingerprint.

Book completion flow:

1. Book status changes `reading → finished`.
2. Record a pending boss-defeat event and show the Boss Defeated overlay.
3. Adventure shows the pending completion reward.
4. User claims it once.
5. Ledger records completion XP/gold; trophy and loot are created once.

## 8. AI policy: text only

**Version 1.0 must not generate, request, store, or display AI-generated boss images.**

Allowed optional AI output:

- Boss name/title
- Spoiler-safe description
- Archetype, abstract elements, region suggestion
- Cosmetic ability text
- Loot-theme labels

Forbidden:

- Image-generation APIs, image workers, base64 art, image URLs, visual prompts, cover-art analysis, boss portraits, or monster portraits.

AI failure must fall back to the existing deterministic local boss generator. Existing image-worker code is legacy and must be removed or disabled before release.

AI text must not provide endings, twists, deaths, secret identities, hidden relationships, plot facts, copyrighted character imitation, or living-artist style imitation.

## 9. Trophies and loot

Rarities: Common, Uncommon, Rare, Epic, Legendary, Mythic.

- Loot is deterministic from a saved seed/book identity.
- Loot must be created after successful completion claim only.
- Items are cosmetic or tiny capped reward modifiers; never reduce required minutes.
- Trophy detail exposes actual stored/derived data: book, boss, minutes, sessions, XP, gold, damage/crit summary where available, defeat date, and item.

## 10. Profile, dashboard, and widget

### Profile

Profile is the fast reading entry surface:

```text
Open Profile → choose optional book → enter minutes/date → save → claim from Adventure
```

It shows recent sessions, claim state, retained reward state, and reversible claimed rewards where the ledger supports reversal.

### Dashboard

Dashboard refreshes after book saves and shows library-level data. Placeholder cards must either be implemented or clearly deferred/hidden; no fake zero statistics should be presented as live data.

### Widget

The Android widget is optional. It may show current Reading book, accent/branding, Start, Pause/Resume, Stop, and sync a finished timer to a local session file.

- It must use only RemoteViews-compatible layout classes.
- It must remain functional if cover data or accent data is unavailable.
- Widget failure cannot block app logging.
- Native widget code is release-ready only after a physical-device test of rendering, book refresh, Start/Pause/Resume/Stop, session sync, and date repair.

## 11. Persistence and backup

Current book data lives in versioned `books.json`; reading/RPG state uses named local keys. Version 1.0 must make backup and restore include:

- Books and metadata
- Reading sessions
- Character/profile/class/stats
- Ledger transactions and reversals
- Boss identity/events
- Loot/trophies
- Appearance/settings

Import must preserve stable IDs and must not duplicate claimed rewards.

## 12. Accessibility and tone

- Dynamic text and screen-reader-friendly labels.
- Color-independent status indicators.
- Reduced-motion support; fireworks/animation must be nonessential.
- Optional sound/haptics only.
- Supportive, never guilt-based reminder language.

## 13. Deferred from Version 1.0

- Pages and chapters
- AI images
- Pets, equipment loadouts, crafting, and decorations
- Multiplayer/social systems
- Marketplace, ads, energy systems, or real-money mechanics
- Mandatory cloud accounts

## 14. Definition of done

Version 1.0 is done when a user can add a book, mark it Reading, log minutes manually or through the optional widget, claim session rewards once, finish a book, claim exactly one completion reward with XP/gold/trophy/loot, reload without duplication/loss, back up and restore the full data set, and use all core flows without pages, internet, AI, or widget access.
