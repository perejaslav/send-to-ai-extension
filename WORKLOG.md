# Worklog

## 2026-03-24

- Branch: `options1`
- Last pushed commit: `1f9b4cb` (`Unify page and link context actions`)
- Current state: branch is synced with `origin/options1`

### Done today

- Modularized the extension code into `services.js`, `settings.js`, `menus.js`, `youtube.js`, `insertion.js`, and `link-prompts.js`
- Tightened host permissions and added `aistudio.google.com`
- Flattened special commands into the main `Отправить в AI` submenu
- Added drag-and-drop ordering on the options page
- Added toolbar badge feedback for insertion results
- Added a new link-context command for any URL: `Сделать саммари страницы в ChatGPT`
- Updated README files and added unit tests for menu and prompt builders
- Added per-command toggles for special actions in settings
- Added a quick popup for selected text actions and special commands
- Improved popup contrast and auto-close behavior after sending
- Bumped extension version to `3.0` (current release state)
- Unified page/link actions into one `Страницы и ссылки` submenu
- Added a shared prompt builder for page/link actions
- Preserved per-command toggles for special actions
- Popup still closes after sending and uses the updated, higher-contrast styles

### Where to look next

- `background.js` for routing and service actions
- `menus.js` for context menu structure
- `options.js` and `options.css` for settings UI behavior
- `popup.js` and `popup.css` for quick-action UI behavior
- `link-prompts.js` for the generic link summary prompt
- `README.md` and `README.en.md` for user-facing documentation
- `context-prompts.js` for shared page/link prompt building

## 2026-03-26

- Branch: `options1`
- Started the YouTube transcript feature planning and implementation
- Added transcript-related settings keys to `settings.js`
- Added YouTube video ID helpers to `youtube.js`
- Added a new shared `youtube-transcript.js` module with timestamp formatting, cleanup, Markdown formatting, and transcript option normalization helpers
- Added YouTube host permissions plus `downloads` and `clipboardWrite` permissions in `manifest.json` for the upcoming transcript export flow
- Next step: implement transcript fetching/export and then wire it into the context menu and toolbar UI

- Implemented the transcript backend in `youtube-transcript.js`: YouTube player-response parsing, caption-track selection, transcript segment parsing, Markdown formatting, transcript filename sanitizing, and an in-memory cache
- Added background message handlers for future transcript fetch/download actions
- Added unit tests for transcript URL parsing, formatting, cleanup, and filename generation

- Added a new YouTube transcript tool UI (`transcript.html`, `transcript.css`, `transcript.js`) with URL input, timestamps toggle, cleanup toggle, language input, source-info toggle, copy, and save actions
- Added a YouTube transcript context-menu entry that opens the transcript tool and passes the clicked link through session storage
- Added a transcript launcher button to the main popup so the toolbar entry can reach the same workflow
- Updated popup UI to surface the transcript tool from the toolbar path
- Added the new YouTube transcript menu id to the menu test coverage

- Updated `README.md` and `README.en.md` with the YouTube transcript workflow, toolbar access, permissions, and project structure entries
- Added a `v3.1 (work in progress)` changelog block describing the transcript feature set

- Polished the transcript export flow: added a clipboard fallback for copy, switched markdown downloads to data URLs, and improved no-transcript/error messages with available language details

- Bumped the extension version to `3.1` in `manifest.json` and `3.1.0` in `package.json`, and finalized the `v3.1` changelog entries in both README files

## 2026-03-26

- Fixed the YouTube transcript save flow by replacing `Response.json()` with safe text parsing in `youtube-transcript.js`
- Added a regression test for empty and invalid transcript response bodies
- Ran the full test/syntax check suite after the fix

- Added an XML fallback parser for transcript responses and fixed the transcript UI/backend option key mismatch

- Added InnerTube-based player-response fallback and explicit playability error handling so unavailable videos are reported before transcript fetch

## 2026-03-26

- Added a new page-side YouTube transcript extractor in `youtube-page-transcript.js` that opens the transcript panel on the active YouTube tab and collects segment text from the page DOM
- Wired the background worker to execute the page-side extractor on the active tab before falling back to the network-based transcript path
- Updated the transcript tool to prefer the active-tab page extraction result and format it into Markdown on the extension side
- Extended the check script to cover the new page extractor module and ran the full verification suite successfully

- Reworked the wiring to extract transcripts from the target YouTube URL itself: background now reuses a matching YouTube tab when available or opens a temporary background tab, runs the page extractor, and closes the temp tab after extraction
- Updated the transcript UI to request URL-based page extraction before falling back to the network-based transcript path

- Replaced the DOM-based YouTube page extractor with a pot-aware main-world extractor modeled after the working cpdown extension: it reads `ytInitialPlayerResponse`, captures `pot` from real timedtext XHRs, fetches `fmt=srt`, and parses SRT into transcript segments
- Added regression tests for SRT parsing in the new page extractor module

- Updated `README.md` and `README.en.md` to describe the new page-derived YouTube transcript flow more accurately

## 2026-03-26 (continued)

- Fixed the "Transcript response was empty" error by implementing the working cpdown extension approach:
  - Added `web_accessible_resources` to `manifest.json` for `youtube-main-world.js`
  - Created `youtube-main-world.js` - a script that injects into YouTube's MAIN world to capture `pot` parameter and `ytInitialPlayerResponse` via XHR interception and message passing
  - Updated `background.js` with new functions:
    - `injectMainWorldScript()` - injects the main world script into a YouTube tab
    - `requestPlayerResponse()` - sends message to main world script and waits for response with player response and pot
    - `extractTranscriptFromActiveYouTubeTab()` - new implementation using the main world approach
    - Updated `executePageExtractorOnTab()` to use the new main world approach
  - Updated `transcript.js` to handle the new response format with captionTracks and pot, and load actual transcript using SRT format fetch
  - Added `parseSrtTranscript()` function to `youtube-transcript.js` to parse SRT format transcripts

## 2026-03-26 (diagnostics)

- Diagnosed the "Transcript response was empty" error - found the root cause:
  - The `injectMainWorldScript` and `requestPlayerResponse` functions used an incorrect communication pattern
  - `chrome.scripting.executeScript` with `world: "MAIN"` injects code but doesn't support message passing
  - `window.addEventListener("message", ...)` in background script cannot receive messages from MAIN world page context
  - The working cpdown extension uses a content script as a bridge between background and MAIN world

- Implemented the correct architecture:
  - Rewrote `youtube-main-world.js` as a self-executing IIFE that:
    - Intercepts XMLHttpRequest to capture `pot` parameter from timedtext requests
    - Listens for `window.postMessage` with type `GET_YT_INITIAL_PLAYER_RESPONSE`
    - Returns `ytInitialPlayerResponse` and `pot` via `window.postMessage`
  - Created `youtube-transcript-content.js` - a content script that acts as a bridge:
    - Injects `youtube-main-world.js` into the YouTube page via `<script>` tag
    - Listens for messages from background via `chrome.runtime.onMessage`
    - Forwards requests to MAIN world via `window.postMessage`
    - Receives responses from MAIN world via `window.addEventListener("message", ...)`
    - Returns responses to background via `chrome.runtime.sendMessage`
  - Updated `manifest.json`:
    - Added `content_scripts` section for YouTube domains to inject `youtube-transcript-content.js`
    - Updated `web_accessible_resources` to include both scripts
- Updated `background.js`:
    - Replaced `injectMainWorldScript()` and `requestPlayerResponse()` with `getPlayerResponseFromTab()`
    - Simplified `executePageExtractorOnTab()` to use the content script communication pattern
    - Updated `extractYouTubeTranscriptFromActiveTab` handler to use the new pattern

## 2026-03-26 (fix pass 1)

- Fixed a background-script runtime error by restoring the missing `services.js` imports in `background.js` (`SERVICES_BY_ID`, `SPECIAL_ACTIONS_BY_ID`, `CONTEXT_ACTIONS_BY_ID`, `QUICK_DEFAULT_MENU_ID`, `YOUTUBE_MENU_ID`, `YOUTUBE_TRANSCRIPT_MENU_ID`)
- Re-ran `npm run check` after the fix; all tests and syntax checks passed

## 2026-03-26 (rollback)

- Rolled the repository back to GitHub state at commit `1f9b4cb` (`Unify page and link context actions`)
- Removed the YouTube transcript experiment files and restored the working `options1` baseline
- Re-ran `npm run check` after rollback; the baseline suite passed

## 2026-04-05

- Found the YouTube link flow in `youtube.js` and confirmed that the menu label `Открыть в Gemini` is defined separately in `services.js`
- Started the prompt replacement work for YouTube links and prepared the README/test updates to match the new detailed extraction prompt
- Bumped the extension version to `3.1` / `3.1.0` and documented the `v3.1` changes in both README files
- Applied the v3.1 release update in the current repo state: expanded the YouTube prompt in `background.js`, raised the manifest version to `3.1`, and synced the README changelogs
