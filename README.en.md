# Send to AI Extension

A Chrome/Edge browser extension that adds context menu commands to quickly send selected text to popular AI assistants.

## Features

- Send selected text to an AI assistant from the context menu in one click
- Reuse an already opened AI tab (focus + insert), or open a new tab
- Auto-insert selected text into the chat input with fallback strategies
- **ChatGPT**, **Qwen AI**, and **Grok** are pinned at the top of the menu with nested command submenus
- Other services can be enabled, disabled, and reordered
- Unified page/link command blocks in ChatGPT, Qwen, and Grok: summary, fact-checking, translation, and key points
- Five editable YouTube templates: article, summary, fact list, Telegram post, and research points — with service selection and the `{youtubeUrl}` variable
- Custom user commands with their own prompt templates
- Command profiles: base, marketing, editing, translation, research, YouTube, and Hermes Agent
- Visible page text extraction for commands using the `{pageText}` variable
- Settings import/export as JSON
- Diagnostics log of recent errors without storing prompt text
- Light and dark theme for the options page
- Insertion result badge on the toolbar icon (`OK` / `ERR`)
- Quick popup for sending selected text and triggering commands

## Supported AI Services

| Service | Features |
|---------|----------|
| **ChatGPT** | Send, translate to Russian, summary, fact-checking |
| **Qwen AI** | Send, translate to Russian |
| **Grok** | Send, translate to Russian, summary, fact-checking |
| **Google Gemini** | Send text |
| **Google AI Studio** | Send text |
| **Claude** | Send text |
| **DeepSeek** | Send text |
| **Z.ai** | Send text |
| **Kimi AI** | Send text |
| **Ernie** | Send text |
| **Minimax** | Send text |
| **StepFun** | Send text |

## Service Commands

The context menu has no extra intermediate item. ChatGPT, Qwen AI, and Grok are pinned at the top because they have several built-in actions. Other services follow in user-defined order.

Example menu structure for selected text:

```text
Send to AI
|- ChatGPT
|  |- Send selection
|  |- Translate to Russian
|  |- Make summary
|  |- Perform fact-checking
|- Qwen AI
|  |- Send selection
|  |- Translate to Russian
|- Grok
|  |- Send selection
|  |- Translate to Russian
|  |- Make summary
|  |- Perform fact-checking
|- Google Gemini
|- Google AI Studio
|- Claude
|- DeepSeek
|- Z.ai
|- Kimi AI
|- Ernie
|- Minimax
|- StepFun
|- My commands
|- Pages and links
|- Pages and links in Qwen
|- Pages and links in Grok
```

When you right-click a page or a link, the service submenus are replaced with the **Pages and links**, **Pages and links in Qwen**, and **Pages and links in Grok** blocks. When you right-click a YouTube link, enabled YouTube templates appear as well.

Available service commands:

- **ChatGPT → Send selection** - sends the selected text as is
- **ChatGPT → Translate to Russian** - translates the selected text to Russian before sending
- **ChatGPT → Make summary** - creates a concise summary of the selected text
- **ChatGPT → Perform fact-checking** - fact-checks claims in the selected text with reliability classification and a structured answer per claim
- **Qwen AI → Send selection** - sends the selected text as is
- **Qwen AI → Translate to Russian** - translates the selected text to Russian before sending
- **Grok → Send selection** - sends the selected text as is
- **Grok → Translate to Russian** - translates the selected text to Russian before sending
- **Grok → Make summary** - creates a concise summary of the selected text
- **Grok → Perform fact-checking** - fact-checks claims in the selected text with reliability classification
- **Pages and links** - summary, fact-checking, translation, and key points commands for a page or link in ChatGPT
- **Pages and links in Qwen** - the same commands powered by Qwen
- **Pages and links in Grok** - the same commands powered by Grok
- **My commands** - custom prompt commands from settings

## Installation

1. Download or clone this repository
2. Open Chrome or Edge and go to the extensions page
   - Chrome: `chrome://extensions/`
   - Edge: `edge://extensions/`
3. Enable **Developer mode**
4. Click **Load unpacked**
5. Select the extension folder containing `manifest.json`

## Usage

### Basic Usage

1. Select any text on a webpage
2. Right-click to open the context menu
3. Choose **Send to AI**
4. Pick the target AI assistant
5. If the service has nested commands, pick an action, e.g. **ChatGPT → Send selection** or **Grok → Make summary**
6. The assistant page opens or focuses and your text is inserted into the input field

### YouTube Integration

1. Right-click a YouTube link (`youtube.com` or `youtu.be`) on any webpage
2. Pick a YouTube template: transcript article, short summary, fact list, Telegram post, or research points
3. The extension opens the configured service and inserts a prepared prompt with a normalized YouTube URL

Templates are editable on the options page: prompt text, title, target service, and menu visibility. The `{youtubeUrl}` variable is replaced with the normalized link.

### Any Link

1. Right-click any link on a webpage
2. Pick a command from **Pages and links**, **Pages and links in Qwen**, or **Pages and links in Grok**
3. The extension opens the chosen service and inserts a prompt to process the link

### Current Page

1. Right-click any empty area on the current page
2. Pick a command from **Pages and links**, **Pages and links in Qwen**, or **Pages and links in Grok**
3. The extension opens the chosen service and inserts a prompt to process the current page

### Custom Commands

1. Open the extension settings
2. In the **My commands** section click **Add command**
3. Set a name, service, context, and prompt template
4. Optionally bind the command to one or several profiles
5. Use the variables: `{selection}`, `{url}`, `{title}`, `{date}`, `{service}`, `{pageText}`, `{youtubeUrl}`
6. Click **Save**
7. Open the context menu on a page and pick the command in the **My commands** submenu

For commands with the **Page text** context, the extension extracts the visible text of the current page and substitutes it into `{pageText}`.

### Menu Configuration

1. Open the extension settings
2. In the **Services** section enable or disable services
3. Note that **ChatGPT**, **Qwen AI**, and **Grok** are pinned first
4. Reorder the remaining services with drag and drop
5. In the **Service commands** section toggle the nested commands of ChatGPT, Qwen AI, and Grok
6. In the **Qwen for pages and links** and **Grok for pages and links** sections configure the page/link commands
7. Click **Save**

### YouTube Templates

1. Open the extension settings
2. In the **YouTube templates** section expand a template
3. Edit its title, target service, and prompt text (the `{youtubeUrl}` variable is available)
4. Optionally disable the template so it does not appear in the menu
5. Click **Save**

### Command Profiles

1. Open the extension settings
2. In the **Command profiles** section choose active profiles
3. In the custom command form mark which profiles the command belongs to
4. Click **Save**

With **All profiles** selected, the menu shows every enabled custom command. With a specific profile selected (e.g. **Marketing**), the extension shows commands of that profile plus commands without a profile, which are treated as universal.

### Settings Theme

1. Open the extension settings
2. On the **Main** tab find the **Options appearance** section
3. Click **Enable dark theme** or **Enable light theme**

The theme choice is saved immediately and applied the next time the options page opens.

### Diagnostics

1. Open the extension settings
2. Go to the **Diagnostics** section
3. Review the recent send errors
4. Use **Refresh** or **Clear log** if needed

The diagnostics log stores error status, service, command, URL, input selector, insertion method, and technical numbers. The prompt text is never stored.

### Moving Settings

1. Open the extension settings
2. In the **Import/export** section click **Export settings**
3. Save the JSON file
4. On another computer install the extension and open settings
5. Click **Import settings**
6. Select the saved JSON file
7. Confirm replacing the current settings

Import goes through normalization: if the file contains outdated or redundant data, the extension safely brings it to the current format.

### Toolbar Icon

- Clicking the toolbar icon opens the extension popup
- After sending text, the icon briefly shows `OK` when insertion succeeds and `ERR` when the page opens but no editor is found or insertion fails

## Technical Details

- **Manifest V3**
- **Config-driven routing** for services and commands
- **Service-based menu grouping** in the context menu
- **Pinned priority for ChatGPT, Qwen AI, and Grok** in the service menu
- **Unified text insertion pipeline** with fallback strategies and result verification:
  - React/contenteditable services (ChatGPT, Qwen, Grok, Claude, DeepSeek, Ernie, Kimi, Minimax, StepFun) use **paste-first**: a synthetic paste event, then a wait of up to 800 ms for the framework's async commit before falling back to `execCommand`/`textContent`;
  - repeated attempts are guarded against re-entry, and an idempotent already-present check prevents duplicate insertion into an already opened tab;
  - after insertion the value is re-checked after `settleMs`; if the framework wipes the text, the attempt is repeated.
- **Strict YouTube hostname validation** and URL cleanup
- **Editable YouTube templates** with the `{youtubeUrl}` variable and service selection
- **Custom prompt templates** with context variables
- **Command profiles** filtering custom commands in the menu
- **Visible page text extraction** with a length limit
- **Settings import/export** as JSON with a schema version
- **Error diagnostics** via `chrome.storage.local` without storing prompts
- **Options page theme** via `chrome.storage.local` and the `data-options-theme` attribute

### Required Permissions

- `contextMenus` - context menu access
- `tabs` - tab query/activate/focus
- `scripting` - script injection for insertion and page text extraction
- `activeTab` - quick access to the current tab selection from the popup
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
|- youtube-templates.js
|- youtube-options.js
|- insertion.js
|- link-prompts.js
|- context-prompts.js
|- custom-commands.js
|- diagnostics.js
|- profiles.js
|- page-extractor.js
|- popup.html
|- popup.css
|- popup.js
|- options.html
|- options.css
|- options-theme.css
|- options.js
|- options-theme.js
|- options-ui.js
|- options-ui-core.js
|- package.json
|- scripts/
|  |- build-zip.js
|- test/
|  |- context-prompts.test.js
|  |- custom-commands.test.js
|  |- diagnostics.test.js
|  |- link-prompts.test.js
|  |- menus.test.js
|  |- options-theme.test.js
|  |- options-ui-core.test.js
|  |- profiles.test.js
|  |- services-profiles.test.js
|  |- settings.test.js
|  |- youtube-templates.test.js
|  |- youtube.test.js
|- icon16.png
|- icon48.png
|- icon128.png
|- CHANGELOG.md
|- CONTRIBUTING.md
|- RELEASE.md
|- RELEASE_CHECKLIST.md
|- TECHNICAL_SPEC.md
|- README.md
|- README.en.md
```

## Checks

- `npm run test` - run unit tests
- `npm run check` - run unit tests plus syntax checks for the extension modules
- `npm run build:zip` - build a ZIP archive of the extension into the `dist/` folder

## Project Documentation

- `TECHNICAL_SPEC.md` - technical specification and development roadmap
- `CHANGELOG.md` - change history
- `CONTRIBUTING.md` - developer guide
- `RELEASE.md` - release process guide
- `RELEASE_CHECKLIST.md` - detailed pre-release checklist

## Changelog

The change history is kept in `CHANGELOG.md`.

## License

MIT License
