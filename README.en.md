# Send to AI Extension

A Chrome/Edge browser extension that adds context menu commands to quickly send selected text to popular AI assistants.

## Features

- Right-click selected text and send it to an AI assistant in one click
- Reuse an already opened AI tab (focus + insert), or open a new popup window
- Auto-insert selected text into chat input
- YouTube link integration for Gemini with a detailed extraction prompt and URL normalization
- Unified page/link command block for summary, fact-checking, translation, and key points
- Configurable services list (order, enable/disable, default service)
- Separate per-command toggles for special commands in the context menu
- Unified extension icon for toolbar and context menu
- Insertion result badge on the toolbar icon (`OK` / `ERR`)
- Quick popup for sending selected text and triggering special commands

## Supported AI Services

| Service | Features |
|---------|----------|
| **Grok** | Send text |
| **ChatGPT** | Send text, Translate to Russian, Summarize |
| **Google Gemini** | Send text |
| **Google AI Studio** | Send text |
| **Claude** | Send text |
| **DeepSeek** | Send text |
| **Z.ai** | Send text |
| **Kimi AI** | Send text |
| **Qwen AI** | Send text, Translate to Russian |
| **Ernie** | Send text |
| **Minimax** | Send text |
| **StepFun** | Send text |

## Special Commands

- **Отправить и перевести в Qwen** - Translates selected text to Russian before sending
- **Отправить и перевести в ChatGPT** - Translates selected text to Russian before sending
- **Сделать саммари в ChatGPT** - Creates a concise summary of selected text
- **Провести фактчекинг в ChatGPT** - Fact-checks claims in selected text with reliability labels
- **YouTube transcript article in Gemini** - Opens a YouTube link in Gemini with a prompt to process the video transcript into a full literary article in Russian
- **YouTube video summary in Gemini** - Opens a YouTube link in Gemini with a prompt to summarize all key facts from the video
- **Страницы и ссылки** - Unified submenu for summary, fact-checking, translation, and key points by page or link in ChatGPT
- **Страницы и ссылки в Qwen** - Same unified submenu powered by Qwen
- **Send to <service> (default)** - Quick action for the service selected in extension settings

## Installation

1. Download or clone this repository
2. Open Chrome or Edge and go to extensions page
   - Chrome: `chrome://extensions/`
   - Edge: `edge://extensions/`
3. Enable **Developer mode**
4. Click **Load unpacked**
5. Select the extension folder

## Usage

### Basic Usage

1. Select any text on a webpage
2. Right-click to open context menu
3. Navigate to **"Отправить в AI"**
4. Choose the target AI assistant
5. The assistant page opens/focuses and your text is inserted into the input field

### YouTube Integration

1. On any webpage, right-click a YouTube link (`youtube.com` or `youtu.be`)
2. Choose **"YouTube transcript article in Gemini"** or **"YouTube video summary in Gemini"** (separate link-context menu items)
3. Gemini opens with a normalized YouTube URL and a prompt for the selected scenario: either a full literary article from the transcript or a short summary of the main facts

### Any Link Summary

1. Right-click any link on a webpage
2. Choose **"Сделать саммари страницы в ChatGPT"**
3. ChatGPT opens with the link and a detailed prompt to summarize the page

### Current Page Summary

1. Right-click any empty area on the current page
2. Choose **"Сделать саммари текущей страницы в ChatGPT"**
3. ChatGPT opens with the current page URL and a detailed summary prompt

### Menu Configuration

1. Open the extension settings from the browser extensions page
2. Reorder services with drag and drop
3. Disable services you do not need
4. Choose a default service for the quick action
5. Manage the special commands individually
6. Click **Save**

### Toolbar Action

- Clicking the toolbar icon opens the extension settings page
- After sending text, the icon briefly shows `OK` when insertion succeeds and `ERR` when the page opens but no editor is found or insertion fails

## Technical Details

- **Manifest V3**
- **Config-driven routing** for services and special actions
- **Deterministic tab focus** (uses the most recently accessed matching tab)
- **Robust insertion pipeline** with fallbacks for textarea/contenteditable editors
- **Strict YouTube hostname validation** and URL cleanup

### Required Permissions

- `contextMenus` - Context menu access
- `tabs` - Tab query/focus/update
- `scripting` - Script injection
- `activeTab` - Quick access to the current tab selection from the popup
- Exact host permissions only for the supported AI domains

## Project Structure

```text
send-to-ai-extension/
|- manifest.json
|- background.js
|- services.js
|- settings.js
|- menus.js
|- youtube.js
|- insertion.js
|- link-prompts.js
|- context-prompts.js
|- popup.html
|- popup.css
|- popup.js
|- options.html
|- options.css
|- options.js
|- package.json
|- test/
|  |- link-prompts.test.js
|  |- menus.test.js
|  |- settings.test.js
|  |- youtube.test.js
|- icon16.png
|- icon48.png
|- icon128.png
|- README.md
|- README.en.md
```

## Checks

- `npm run test` - run unit tests
- `npm run check` - run unit tests plus syntax checks for the extension modules

## Changelog

### v3.5

- Added a separate **"Страницы и ссылки в Qwen"** submenu with summary, fact-checking, translation, and key points commands for the current page and links
- Added toggles in settings to control Qwen page/link command visibility (global and per-item)
- Updated menu and settings tests

### v3.3

- Added two separate YouTube menu items in Gemini: one for a detailed transcript article and one for a short summary of the main facts
- Updated the YouTube prompt tests for both scenarios

### v3.2

- Replaced the YouTube prompt for Gemini: it now asks to process the video transcript into a full literary article in Russian instead of extracting key information
- Updated the YouTube prompt regression test for the new wording

### v3.1

- Expanded the YouTube prompt for Gemini so it now asks for all facts, figures, statistics, dates, names, titles, causal links, practical recommendations, examples, and caveats
- Updated the YouTube prompt regression test for the new detailed wording
- Synced the YouTube workflow description in the docs with the new prompt

### v3.0

- Added a unified page/link command block for summary, fact-checking, translation, and key points
- Moved page and link scenarios into one `Страницы и ссылки` submenu
- Extracted prompt building for page/link actions into a shared builder
- Added a quick popup for sending selected text to AI services
- Popup can trigger special commands and open settings
- Clicking the toolbar icon now opens the popup instead of the options page

### v2.8

- Added a new special command for selected text: **"Провести фактчекинг в ChatGPT"**
- Added individual toggles for each special command in settings

### v2.6

- Added a context menu command for the current page: **"Сделать саммари текущей страницы в ChatGPT"**
- Added a dedicated prompt builder for current-page summaries by URL
- Updated the documentation for the new page-context workflow

### v2.5

- Added a context menu command for any link: **"Сделать саммари страницы в ChatGPT"**
- Added a dedicated prompt builder for detailed page summaries by URL
- Updated the documentation for the new link-summary workflow

### v2.4

- Tightened `host_permissions` to the exact supported service domains and added `aistudio.google.com`
- Split `background.js` into separate modules for services, settings, menus, YouTube handling, and text insertion
- Added toolbar badge feedback for insertion results (`OK` / `ERR`)
- Clicking the toolbar icon now opens the settings page
- Kept special commands in the same `Отправить в AI` submenu and made them configurable from settings

### v2.3

- Added an extension options page
- Added configurable service order, enable/disable toggles, and default service selection
- Added quick context menu item **"Send to <service> (default)"**
- Updated extension icon set (`16/48/128`) and added explicit `action.default_icon` for toolbar rendering

### v2.2

- Added **Google AI Studio** (`https://aistudio.google.com/app/prompts/new_chat`) to the context menu
- Tuned selected text insertion for the **Google AI Studio** prompt field
- Bumped extension version to `2.2`

### v2.1

- Added **StepFun** (`https://stepfun.ai/chats/new`) to the context menu
- Improved selected text insertion for StepFun
- Bumped extension version to `2.1`

## License

MIT License
