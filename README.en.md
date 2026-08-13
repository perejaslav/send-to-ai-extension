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
- **Unified text insertion pipeline** with fallback strategies, result verification, and a retry when a framework wipes the inserted text
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
|- TECHNICAL_SPEC.md
|- README.md
|- README.en.md
```

## Checks

- `npm run test` - run unit tests
- `npm run check` - run unit tests plus syntax checks for the extension modules
- `npm run build:zip` - build a ZIP archive of the extension into the `dist/` folder

## Changelog

### v4.5

- Completely rewritten the **"Article from YouTube transcript"** template: added "Main principle", "Requirements" and "Completeness check" sections, detailed rules for preserving all content elements (facts, reasoning, names, dates, numbers, terms, caveats and author's conclusions), a rule against collapsing long reasoning into short conclusions, and priority of completeness and accuracy over brevity
- Version bumped to 4.5

### v4.4.1

- **Grok**: added `delayMs: 1500` — a pause after the SPA loads before insertion so the React input mounts and attaches its handlers
- **Grok**: enabled `usePasteFirst: true` — insertion into contenteditable via paste event (like ChatGPT in v4.3), with a safe fallback to `execCommand`/`textContent`
- **Grok**: added optional profile flags `settleMs: 300` and `retryOnInsertFail: true` — after a successful insertion the value is re-checked after 300 ms; if the framework (React) wipes the text, the attempt is repeated instead of finishing with "success"
- **`waitForTabComplete`**: added a current tab status check via `chrome.tabs.get` — if `status === "complete"` already fired before the listener attached, the wait finishes immediately instead of hitting the 15-second timeout

### v4.4

- Grok added to **pinned services** (third after ChatGPT and Qwen AI)
- Added **special commands for selected text** in Grok:
  - "Translate to Russian"
  - "Make summary"
  - "Perform factchecking"
- Added separate submenu **"Page and link actions in Grok"** with 8 commands:
  - For pages: summary, factchecking, translation, key points
  - For links: summary, factchecking, translation, key points
- Added settings section **"Grok for pages and links"** with visibility toggle and individual toggles for each command
- Grok now displays with submenu (like ChatGPT and Qwen), not as a single item
- Version bumped to 4.4
- Updated menu tests for the new structure with Grok in priority services

### v4.3

- Factcheck prompts updated: replaced table format with structured bullet lists using emojis (🔹 Claim → 📌 Status → 📖 Rationale → 🔍 What to clarify → 📚 Sources)
- Translate prompts optimized: clear rules for preserving paragraph structure, terms, numbers, names, and adapting idioms without commentary
- ChatGPT: enabled `usePasteFirst: true` for proper multiline text insertion via paste events
- Version bumped to 4.3

### v3.5

- Added a separate **"Pages and links in Qwen"** submenu with summary, fact-checking, translation, and key points commands for the current page and links
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
- Moved page and link scenarios into one **Pages and links** submenu
- Extracted prompt building for page/link actions into a shared builder
- Added a quick popup for sending selected text to AI services
- Popup can trigger special commands and open settings
- Clicking the toolbar icon now opens the popup instead of the options page

### v2.8

- Added a new special command for selected text: **"Perform factchecking in ChatGPT"**
- Added individual toggles for each special command in settings

### v2.6

- Added a context menu command for the current page: **"Make a summary of the current page in ChatGPT"**
- Added a dedicated prompt builder for current-page summaries by URL
- Updated the documentation for the new page-context workflow

### v2.5

- Added a context menu command for any link: **"Make a page summary in ChatGPT"**
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
