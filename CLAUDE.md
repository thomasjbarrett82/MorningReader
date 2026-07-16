# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Morning Reader — a Chrome extension (Manifest V3) that opens a user-defined list of websites as tabs, filtered by day of week. Plain vanilla JavaScript with no build step, no package.json, no tests, and no framework; Bootstrap is vendored directly in `css/` and `scripts/`.

## Commands

- **Format:** `npx prettier --write .` (config in `prettier.config.js`, uses `bracketSameLine`)
- **Release build:** `build_release.bat` — copies extension files into `release/MorningReader/` and zips with 7-Zip (requires `C:\Program Files\7-Zip\7z.exe`)
- **Manual testing:** load the repo root as an unpacked extension via `chrome://extensions` (Developer mode → "Load unpacked"). After editing `background.js`, click the extension's reload button there; the options page only needs a page refresh.

## Architecture

Two independent contexts that communicate only through `chrome.storage.sync`:

- **`scripts/background.js`** — MV3 service worker. Handles the toolbar button click, browser startup (`optionsOpenOnStartup`), and the "Add current page" context menu. `LoadReaderLinks(data)` filters links by today's day and opens tabs via `doAction()`. Tabs are created with an explicit `index` — do not remove that; without it Chrome's placement heuristics can reorder/reverse the tabs.
- **`options.html` + `scripts/options.js`** — options page. Keeps an in-memory `readerLinks` array mirroring storage; every mutation writes the whole array back with `chrome.storage.sync.set` and re-renders via `ReloadReaderLinks()`. Also handles bookmark import, JSON file import/export, and Bootstrap modals.
- **`scripts/dragdrop.js`** — standalone `DragDropManager` class used by the options page for list reordering; it reorders the DOM itself and calls back into `HandleDragDropReorder` to update the array (no re-render after drag).

### Data model (chrome.storage.sync keys)

- `readerLinks`: array of `{ days, url }`. `days` is a 7-character "0"/"1" string indexed Sunday-first, matching `Date.getDay()` (e.g. `"0101010"` = Mon/Wed/Fri).
- `optionsSelectLocation` (`"existing"` | `"new"`), `optionsSelectOrder` (`"list"` | `"random"`), `optionsOpenOnStartup` (boolean).

The 8 KB sync-storage item limit is enforced by checking the serialized size before saving, duplicated in both `options.js` (`SaveLinkModal`) and `background.js` (`onClickContextHandler`) — keep the two checks consistent if you change one.

## Releasing a version

Bump `version` in `manifest.json` and add an entry to the History section of `README.md`, then run `build_release.bat`.
