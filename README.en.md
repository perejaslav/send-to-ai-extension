# Send to AI Extension

A Chrome/Edge browser extension that adds context menu commands to quickly send selected text to popular AI assistants.

## Features

- Right-click selected text and send it to an AI assistant in one click
- Reuse an already opened AI tab (focus + insert), or open a new popup window
- Auto-insert selected text into chat input
- YouTube link integration for Gemini with URL normalization

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

- **Send and translate to Qwen** - Translates selected text to Russian before sending
- **Send and translate to ChatGPT** - Translates selected text to Russian before sending
- **Summarize in ChatGPT** - Creates a concise summary of selected text
- **Open in Gemini** - Opens a YouTube link in Gemini with a summary prompt (link context menu)

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
2. Choose **"Open in Gemini"** (separate link-context menu item)
3. Gemini opens with a normalized YouTube URL and summary prompt

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
- Host permissions for AI domains

## Project Structure

```text
send-to-ai-extension/
|- manifest.json
|- background.js
|- icon16.png
|- icon48.png
|- icon128.png
|- README.md
|- README.en.md
```

## Changelog

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
