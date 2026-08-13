ReadQuest Active Source Map v1.3
Purpose
This document satisfies checklist item A.1 by identifying the active web entry points and distinguishing current source files from historical/archive copies.

Authoritative rule: www/index.html is the web-build source manifest. A script is active only when it is loaded there, or when it is a native Android resource referenced by the Android manifest/build configuration.

Active web entry point
text
www/index.html
Active web scripts
Storage and core library
text
js/storage.js
js/cover-cache.js
js/isbn-lookup.js
js/app.js
js/library-counts.js
js/status-pages.js
js/status-pages-view-mode.js
js/status-filters.js
js/book-details.js
js/book-metadata.js
js/series-related-books.js
js/view-modes.js
js/search-toggle.js
Dashboard and backup
text
js/dashboard.js
js/dashboard-refresh.js
js/dashboard-series.js
js/dashboard-time-streak.js
js/dashboard-daily-statistics.js
js/dashboard-scroll-fix.js
js/google-drive-sync.js
Navigation, profile, and reading sessions
text
js/bottom-navigation.js
js/reading-profile.js
js/widget-session-sync.js
js/profile-widget-access.js
Adventure / RPG
text
js/adventure.js
js/adventure-rewards.js
js/adventure-progression.js
js/adventure-class-details.js
js/adventure-combat.js
js/adventure-bosses.js
js/adventure-loot.js
js/adventure-loot-collapsible.js
js/adventure-trophy-details.js
Appearance and widget appearance bridge
text
js/appearance-mode.js
js/accent-selection-fill.js
js/widget-appearance-sync.js
js/widget-appearance-live-sync.js
Active web styles
text
css/style.css
css/unified-ui.css
css/accent-enhancements.css
Active native Android widget sources
text
android/app/src/main/AndroidManifest.xml
android/app/src/main/java/com/osmays/bookorganizer/MainActivity.java
android/app/src/main/java/com/osmays/bookorganizer/ReadingWidgetProvider.java
android/app/src/main/java/com/osmays/bookorganizer/WidgetRefreshPlugin.java
android/app/src/main/res/layout/reading_widget.xml
android/app/src/main/res/xml/reading_widget_info.xml
android/app/src/main/res/drawable/widget_background.xml
android/app/src/main/res/drawable/widget_action_button.xml
android/app/src/main/res/drawable/widget_stop_button.xml
android/app/src/main/res/drawable/widget_timer_idle.xml
android/app/src/main/res/drawable/widget_timer_paused.xml
android/app/src/main/res/drawable/widget_timer_running.xml
Historical / inactive copies
Files with numbered suffixes are historical snapshots and must not be edited as live app source unless they are intentionally copied back into the active path.

Examples:

text
app-11.js
app-12.js
storage-9.js
storage-10.js
status-pages-7.js
status-pages-8.js
appearance-mode-12.js
appearance-mode-13.js
index-17.html
The Archive may retain these files for reference, but they are not part of the active build when www/index.html loads the unsuffixed current files.

Legacy / removal candidates
These require an explicit decision before release:

text
bookshelf-boss-worker.js
wrangler.toml
They currently support AI image generation, which conflicts with Master Prompt v1.3’s text-only/no-AI-images policy. Disable, remove, or replace them with a text-only AI service before release.

Source-editing rule
Before changing a file:

Confirm it is listed in this map as active.

Confirm its script tag still exists in www/index.html, if it is a web script.

Do not edit historical numbered copies.

Update this map if script load order or native source ownership changes.