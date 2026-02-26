# Send to AI Extension

A Chrome/Chromium browser extension that adds a context menu to quickly send selected text to various AI assistants.

## Features

Right-click on any selected text and choose an AI assistant to send it to. The extension will:
- Open the AI chat in a new popup window (or focus existing tab)
- Automatically insert the selected text into the input field
- Support YouTube integration for quick video link sharing

## Supported AI Services

| Service | Features |
|---------|----------|
| **Grok** | Send text |
| **ChatGPT** | Send text, Translate to Russian, Summarize |
| **Google Gemini** | Send text |
| **Claude** | Send text |
| **DeepSeek** | Send text |
| **Z.ai** | Send text |
| **Kimi AI** | Send text |
| **Qwen AI** | Send text, Translate to Russian |
| **Ernie** | Send text |
| **Minimax** | Send text |

## Special Commands

- **Send and translate to Qwen** — Translates selected text to Russian before sending
- **Send and translate to ChatGPT** — Translates selected text to Russian before sending
- **Summarize in ChatGPT** — Creates a concise summary of the selected text
- **Open YT Link in Qwen** — Sends YouTube video link to Qwen with a summary request (YouTube pages only, auto-cleans URL)

## Installation

1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable **Developer mode** (toggle in top right)
4. Click **Load unpacked**
5. Select the extension folder

## Usage

### Basic Usage

1. Select any text on a webpage
2. Right-click to open context menu
3. Navigate to **"Отправить в AI"** (Send to AI)
4. Choose your preferred AI assistant
5. A new window will open with your text ready to send

### YouTube Integration

1. Open any YouTube video
2. Right-click on the page **OR** select text
3. Navigate to **"Отправить в AI"** (Send to AI)
4. Choose **"Open YT Link in Qwen"**
5. The video link will automatically open in Qwen with a prompt to extract a summary (URL parameters cleaned)

## Technical Details

- **Manifest V3** — Modern Chrome extension API
- **Universal insertion** — Works with React, Next.js, Slate.js and other frameworks
- **Polling** — Waits up to 20 seconds for input field to load
- **YouTube URL cleaning** — Automatically removes `&list=`, `&pp=`, `&t=` and other parameters

### Required Permissions

- `contextMenus` — Context menu access
- `tabs` — Tab management
- `scripting` — Script injection
- `windows` — Window management
- Host permissions for AI service domains

## Project Structure

```
send-to-ai-extension/
├── manifest.json       # Extension configuration
├── background.js       # Main logic
├── icon16.png          # 16x16 icon
├── icon48.png          # 48x48 icon
├── icon128.png         # 128x128 icon
├── README.md           # Documentation (Russian)
└── README.en.md        # Documentation (English)
```

## Contributing

Found a bug? Have an idea? Create an [Issue](https://github.com/perejaslav/send-to-ai-extension/issues) or Pull Request!

## License

MIT License

---

Made with ⚒️ by [perejaslav](https://github.com/perejaslav)
