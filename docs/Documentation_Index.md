ReadQuest Documentation Index
Purpose
This folder contains the authoritative product and implementation documents for ReadQuest / BookShelf.

Before changing gameplay rules, data structures, reward calculations, AI behavior, or release scope, review the Master Prompt and current-build checklist.

Authoritative documents
Master Product & Implementation Prompt
File: ReadQuest_Master_Prompt_Current_Build_v1.3.md

This is the source of truth for:

Product identity and Version 1.0 boundaries.

Minutes-first progression.

Book, session, character, and reward rules.

XP, gold, damage, classes, Book Bosses, loot, and trophies.

Text-only AI policy.

Offline-first and backup requirements.

Deferred features and release definition of done.

Current-Build Implementation Checklist
File: ReadQuest_Current_Build_Checklist_v1.3.md

This is the working plan for:

What has been verified in the current build.

What still needs physical-device validation.

What remains to be implemented.

What conflicts with the Master Prompt and must be aligned before release.

Version 1.0 release gates.

Working rules
Master Prompt v1.3 wins when a feature request conflicts with current prototype behavior.

The checklist records implementation state; it does not override the Master Prompt.

Reading minutes—not pages—are the Version 1.0 progression metric.

AI may generate optional spoiler-safe text only. AI-generated images are not part of Version 1.0.

session:<sessionId> and bookCompletion:<bookId> are the required one-time reward identifiers.

New work should begin with the next unresolved checklist item, not with unrelated UI polish.

Suggested project placement
Store this document and the two authoritative documents in the repository’s top-level docs/ directory:

text
docs/
├── Documentation_Index.md
├── ReadQuest_Master_Prompt_Current_Build_v1.3.md
└── ReadQuest_Current_Build_Checklist_v1.3.md
The repository README should link to this folder and briefly state that these documents govern Version 1.0 development.