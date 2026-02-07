# Send to AI Extension

A Chrome/Chromium browser extension that adds a context menu to quickly send selected text to various AI assistants.

## Features

Right-click on any selected text and choose an AI assistant to send it to. The extension will:
- Open the AI chat in a new popup window (or focus existing tab)
- Automatically insert the selected text into the input field

## Supported AI Services

| Service | Features |
|---------|----------|
| **Grok** | Send text |
| **ChatGPT** | Send text, Translate to Russian, Summarize |
| **Google Gemini** | Send text |
| **DeepSeek** | Send text |
| **Z.ai** | Send text |
| **Kimi AI** | Send text |
| **Qwen AI** | Send text, Translate to Russian |

## Special Commands

- **Send and translate to Qwen** — Translates selected text to Russian before sending
- **Send and translate to ChatGPT** — Translates selected text to Russian before sending
- **Summarize in ChatGPT** — Creates a concise summary of the selected text

## Installation

1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable **Developer mode** (toggle in top right)
4. Click **Load unpacked**
5. Select the extension folder

## Usage

1. Select any text on a webpage
2. Right-click to open context menu
3. Navigate to **"Отправить в AI"** (Send to AI)
4. Choose your preferred AI assistant
5. A new window will open with your text ready to send

## License

MIT License

---

Made with ⚒️ by [perejaslav](https://github.com/perejaslav)
