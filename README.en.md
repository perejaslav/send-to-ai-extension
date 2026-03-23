# Send to AI Extension

A Chrome/Edge browser extension that adds context menu commands to quickly send selected text to popular AI assistants.

## Features

- Right-click selected text and send it to an AI assistant in one click
- Reuse an already opened AI tab (focus + insert), or open a new popup window
- Auto-insert selected text into chat input
- YouTube link integration for Gemini with URL normalization
- Configurable services list (order, enable/disable, default service)
- Separate show/hide toggle for special commands in the context menu
- Unified extension icon for toolbar and context menu
- Insertion result badge on the toolbar icon (`OK` / `ERR`)

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
- **Открыть в Gemini** - Opens a YouTube link in Gemini with a summary prompt (link context menu)
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
2. Choose **"Открыть в Gemini"** (separate link-context menu item)
3. Gemini opens with a normalized YouTube URL and summary prompt

### Menu Configuration

1. Open the extension settings from the browser extensions page
2. Reorder services with drag and drop
3. Disable services you do not need
4. Choose a default service for the quick action
5. Optionally hide the special commands in the main AI menu
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
|- options.html
|- options.css
|- options.js
|- package.json
|- test/
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
