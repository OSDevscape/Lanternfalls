# ReadQuest / BookShelf
## Current-Build Implementation Checklist v1.3

**Legend:** ✅ verified in current files · 🟡 implemented but needs alignment/testing · 🔴 not complete · ⚠️ conflicts with the final v1.3 master prompt

This checklist reflects the project files currently loaded in the Archive. It is not based on older prototype versions.

---

## A. Scope and source cleanup

- [x] ✅ Minutes-first reading is reflected in Adventure and Profile wording.
- [x] ✅ Current build loads dedicated reward, boss, progression, loot, trophy-detail, dashboard-refresh, appearance, and widget scripts from `index.html`.
- [ ] 🟡 Remove obsolete prototype files or confirm they are inactive.
- [ ] 🟡 Add the v1.3 master prompt and this checklist to the repository documentation.
- [ ] 🔴 Update the repository README: it still describes only basic v1 book storage and says no cloud sync, while the build has Adventure, Drive sync, and native widget code.
- [ ] 🔴 Establish one documented data-schema/version manifest covering books plus all `bookshelf-*` RPG keys.

## B. Books and library

- [x] ✅ Add books.
- [x] ✅ Edit books.
- [x] ✅ Delete books.
- [x] ✅ Use To Read, Reading, Finished, Wishlist, and Loaned statuses.
- [x] ✅ Store ISBN, genre, format, price, rating, and notes.
- [x] ✅ Search title and author.
- [x] ✅ Save books natively to `DATA/books.json` with localStorage fallback.
- [x] ✅ Import/merge books by stable id.
- [x] ✅ Export books as JSON.
- [x] ✅ Dashboard refresh wrapper runs after `BookStorage.saveBooks()`.
- [ ] 🟡 Verify Dashboard refresh after add, edit, delete, status change, and import on device.
- [ ] 🟡 Replace or hide dashboard cards that display fixed placeholder values: paused books, gave-up books, calendar, streak, annual chart, and rewind.

## C. Minutes sessions

- [x] ✅ Profile supports manual minutes entry.
- [x] ✅ Profile allows an optional associated book.
- [x] ✅ Profile stores date and created timestamp for manually entered sessions.
- [x] ✅ Profile displays recent sessions and reward claim state.
- [x] ✅ Widget-session importer guards duplicate session ids and reconstructs a local date from `endedAt`.
- [x] ✅ Profile supports removing a session while retaining a ledger record.
- [x] ✅ Profile supports reversing eligible claimed session rewards.
- [ ] 🟡 Add explicit optional session fields for read/listen mode and note, or remove those from the master-data schema.
- [ ] 🟡 Add explicit anomaly flag/review behavior for implausible minutes.
- [ ] 🟡 Verify legacy sessions never display `Date unavailable` after migration.
- [ ] 🔴 Add a durable audit log for session edit/delete/reversal actions; ledger notes alone are not a complete audit model.

## D. Reward ledger and formulas

- [x] ✅ `adventure-rewards.js` provides ledger storage at `bookshelf-adventure-ledger-v1`.
- [x] ✅ Session claim keys use `session:<sessionId>`.
- [x] ✅ Completion claim keys use `bookCompletion:<bookId>`.
- [x] ✅ Session claims persist XP/gold transaction records.
- [x] ✅ Session rewards use minutes × 10 XP and `max(1, floor(minutes ÷ 2))` gold.
- [x] ✅ Rogue and Bard session bonuses are implemented.
- [x] ✅ Warrior completion-gold bonus is implemented.
- [x] ✅ Session reversals create a reversal transaction where a non-migrated session reward exists.
- [x] ✅ Historical processed-session migration is present.
- [ ] 🟡 Decide and document the lifetime-XP rule. Current reversal subtracts from `game.xp`; v1.3 requires a clearly separate lifetime-progress policy or explicitly reversible level policy.
- [ ] 🟡 Verify claim transactions survive backup/restore and import without duplication.
- [ ] 🔴 Add an atomic backup/restore strategy for all ledger data, not only books/settings.

## E. Completion rewards, bosses, loot

- [x] ✅ Deterministic local boss names/regions are generated from book id/title/genre.
- [x] ✅ `reading → finished` status transition triggers a pending boss-defeat event and victory overlay.
- [x] ✅ Victory overlay says rewards are ready to claim.
- [x] ✅ Adventure can show pending boss completion rewards.
- [x] ✅ Completion claim key convention is implemented.
- [x] ✅ Trophy and loot inventory UI exist.
- [x] ✅ Trophy details can show minutes, session count, rewards, damage/crit summary, sessions, and defeat details.
- [ ] ⚠️ Consolidate completion awarding into the reward ledger.
- [ ] ⚠️ Current `adventure-rewards.js` completion calculation grants **0 XP**, while `adventure-loot.js` separately calculates and directly awards completion XP/gold on finish. This conflicts with v1.3’s single claim-gated completion transaction.
- [ ] ⚠️ Prevent `adventure-loot.js` from awarding completion loot/XP/gold merely when it detects a Finished book.
- [ ] 🔴 Make `bookCompletion:<bookId>` the only path for completion XP, gold, trophy, and loot.
- [ ] 🔴 Ensure completion reward includes `100 + book minutes × 5` XP in the ledger transaction.
- [ ] 🔴 Remove or migrate `claimedBosses`, `known`, and legacy event paths after ledger consolidation.
- [ ] 🟡 Test finish/reload/navigate/re-finish/import flows to prove no duplicate boss rewards.

## F. Character, classes, and Adventure

- [x] ✅ Adventure uses minutes wording and shows reading minutes, completed books, class, level, and achievements.
- [x] ✅ Six classes are available: Scholar, Warrior, Mage, Rogue, Ranger, Bard.
- [x] ✅ STR, VIT, INT, WIS, DEX, LCK allocation UI exists.
- [x] ✅ Level/XP bar, gold, pending-reward card, and stat-point allocation exist.
- [x] ✅ Combat card uses minutes, STR, LCK, and deterministic crit calculation.
- [x] ✅ Fireworks occur after a reward claim.
- [ ] 🟡 Implement or document all class effects. Scholar, Mage, and Ranger are selectable but their promised effects are not present in the current reward engine.
- [ ] 🟡 Ensure combat uses a claimed-session stat snapshot if historical trophy damage must remain stable after stat changes.
- [ ] 🟡 Test all six class bonuses.
- [ ] 🔴 Add real quest/streak systems; the current achievement list is derived display logic, not a durable quest/achievement engine.
- [ ] 🔴 Add durable achievement progress and unlock records.

## G. AI policy

- [x] ✅ Local deterministic boss names mean gameplay does not require AI.
- [ ] ⚠️ Disable/remove `bookshelf-boss-worker.js` before release.
- [ ] ⚠️ The existing worker calls the image-generation API and returns base64 boss artwork, which violates v1.3’s text-only/no-AI-images rule.
- [ ] 🔴 If optional AI text is retained, implement a text-only spoiler-safe endpoint/schema.
- [ ] 🔴 Store `generationSource` and `generationVersion` for AI/local boss text.
- [ ] 🔴 Add tests confirming no image-generation request, image data, visual prompt, or image URL remains in the release path.

## H. Backup and sync

- [x] ✅ Local JSON export/import exists for books.
- [x] ✅ Google Drive backup/restore/merge UI exists.
- [ ] ⚠️ Local export includes only books.
- [ ] ⚠️ Drive backup includes books, metadata, and selected `bookshelf-*` settings but does not explicitly validate/merge the ledger, sessions, loot, trophies, and all RPG state as a schema.
- [ ] 🔴 Create a complete versioned snapshot containing books, sessions, profile, character, ledger, bosses, events, trophies, loot, settings, achievements, streaks, and migration metadata.
- [ ] 🔴 Validate restore before any destructive replace.
- [ ] 🔴 Test merge/replace on a clean installation.
- [ ] 🔴 Verify restoring does not double-claim rewards.

## I. Widget

- [x] ✅ Native provider, layout, provider-info, manifest receiver, activity, and refresh-plugin source files are present.
- [x] ✅ JS imports sessions from `reading-widget-sessions.json` and prevents duplicate ids.
- [x] ✅ Profile includes a widget-install guide.
- [x] ✅ Widget appearance-sync/live-sync scripts are loaded.
- [ ] 🟡 Verify the archive native provider/layout are the same versions installed in the currently tested APK.
- [ ] 🟡 Run physical-device tests: render, current Reading book refresh, Start, Pause, Resume, Stop, session creation, session import, and accent change.
- [ ] 🟡 Confirm Stop resets to 00:00 and does not visually restart.
- [ ] 🔴 Add a written widget failure/recovery test procedure, including Logcat capture for RemoteViews inflation failures.

## J. Appearance, quality, and accessibility

- [x] ✅ Dark/light and accent setting code exist.
- [x] ✅ Accent-selection-fill script is loaded.
- [ ] 🟡 Verify selected color boxes are fully filled on a physical device.
- [ ] 🔴 Add reduced motion / disable-fireworks option.
- [ ] 🔴 Add screen-reader labels and accessibility audit.
- [ ] 🔴 Add dynamic-text and high-contrast testing.
- [ ] 🔴 Remove hardcoded placeholder/dashboard statistics or clearly label them as unavailable.

## K. Release gate

Do not call Version 1.0 complete until all of these are true:

- [ ] One source of truth exists for completion claim XP/gold/trophy/loot.
- [ ] Completion XP is claim-gated and ledger-backed.
- [ ] No AI image worker or image API remains active.
- [ ] Full backup/restore preserves complete RPG state and cannot duplicate rewards.
- [ ] All six class effects are implemented or class scope is reduced/documented.
- [ ] Widget passes the physical-device test suite or is shipped as an explicitly optional beta feature.
- [ ] Quest/streak/achievement scope is either implemented durably or explicitly deferred from v1.0.
- [ ] All placeholders and misleading zero statistics are removed/hidden.
- [ ] Fresh-install, upgrade/migration, offline, import/restore, and reward-duplication tests pass.
- [ ] Final APK build is tested on a physical Android device.
