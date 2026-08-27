// Floating AI Overlay — Shadow DOM (Phase 6 fixes: autoSend, size/theme, idempotent guard)
(() => {
  if (globalThis.__sendToAiOverlayInitialized) {
    return;
  }
  globalThis.__sendToAiOverlayInitialized = true;

  const HOST_ID = "send-to-ai-floating-overlay-host";

  function getHost() {
    return document.getElementById(HOST_ID);
  }

  function createStyles() {
    return `
      :host { all: initial; }
      .overlay {
        position: fixed;
        right: 20px;
        bottom: 20px;
        width: 460px;
        height: 620px;
        min-width: 360px;
        min-height: 400px;
        max-width: min(800px, 90vw);
        max-height: min(900px, 90vh);
        display: flex;
        flex-direction: column;
        background: #ffffff;
        color: #1f2a37;
        border: 1px solid #dbe3ef;
        border-radius: 16px;
        box-shadow: 0 12px 40px rgba(15,23,42,0.18), 0 4px 12px rgba(15,23,42,0.12);
        overflow: hidden;
        z-index: 2147483646;
        font-family: "Segoe UI", system-ui, -apple-system, sans-serif;
        font-size: 14px;
        line-height: 1.45;
        resize: both;
      }
      .overlay[data-theme="light"] {
        background: #ffffff;
        color: #1f2a37;
        border-color: #dbe3ef;
      }
      .overlay[data-theme="light"] .header { background: #f8fafc; border-color: #e2e8f0; }
      .overlay[data-theme="light"] .messages { background: #ffffff; }
      .overlay[data-theme="light"] .composer { background: #ffffff; border-color: #e2e8f0; }
      .overlay[data-theme="light"] .composer textarea { background: #ffffff; color: #1f2a37; border-color: #cbd5e1; }
      .overlay[data-theme="light"] .msg-user { background: #1d4ed8; color: #ffffff; }
      .overlay[data-theme="light"] .msg-assistant { background: #f1f5f9; color: #0f172a; }
      .overlay[data-theme="light"] .toolbar { background: #ffffff; border-color: #f1f5f9; }

      .overlay[data-theme="dark"] {
        background: #0f172a;
        color: #e2e8f0;
        border-color: #1e293b;
      }
      .overlay[data-theme="dark"] .header { background: #0f172a; border-color: #1e293b; }
      .overlay[data-theme="dark"] .messages { background: #0f172a; }
      .overlay[data-theme="dark"] .composer { background: #0f172a; border-color: #1e293b; }
      .overlay[data-theme="dark"] .composer textarea { background: #1e293b; color: #e2e8f0; border-color: #334155; }
      .overlay[data-theme="dark"] .msg-user { background: #1e40af; color: #ffffff; }
      .overlay[data-theme="dark"] .msg-assistant { background: #1e293b; color: #e2e8f0; }
      .overlay[data-theme="dark"] .toolbar { background: #0f172a; border-color: #1e293b; }

      @media (prefers-color-scheme: dark) {
        .overlay[data-theme="system"] { background: #0f172a; color: #e2e8f0; border-color: #1e293b; }
        .overlay[data-theme="system"] .header { background: #0f172a; border-color: #1e293b; }
        .overlay[data-theme="system"] .messages { background: #0f172a; }
        .overlay[data-theme="system"] .composer { background: #0f172a; border-color: #1e293b; }
        .overlay[data-theme="system"] .composer textarea { background: #1e293b; color: #e2e8f0; border-color: #334155; }
        .overlay[data-theme="system"] .msg-user { background: #1e40af; color: #ffffff; }
        .overlay[data-theme="system"] .msg-assistant { background: #1e293b; color: #e2e8f0; }
        .overlay[data-theme="system"] .toolbar { background: #0f172a; border-color: #1e293b; }
      }

      .overlay.minimized {
        height: 48px !important;
        min-height: 48px !important;
        resize: none;
        overflow: hidden;
      }
      .overlay.minimized .messages,
      .overlay.minimized .status,
      .overlay.minimized .composer,
      .overlay.minimized .toolbar { display: none; }
      .header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        padding: 10px 12px;
        background: #f8fafc;
        border-bottom: 1px solid #e2e8f0;
        cursor: move;
        user-select: none;
        flex-shrink: 0;
      }
      .header-title {
        font-weight: 700;
        font-size: 13px;
        letter-spacing: 0.02em;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .header-actions { display: flex; gap: 6px; }
      .header-actions button {
        width: 28px; height: 28px;
        border: 1px solid #cbd5e1;
        background: #ffffff;
        border-radius: 8px;
        cursor: pointer;
        font-size: 14px;
        line-height: 1;
        display: grid; place-items: center;
      }
      .header-actions button:hover { background: #f1f5f9; }
      .toolbar {
        display: flex;
        gap: 8px;
        padding: 6px 12px;
        border-bottom: 1px solid #f1f5f9;
        background: #ffffff;
        flex-shrink: 0;
      }
      .toolbar button {
        padding: 6px 10px;
        border-radius: 8px;
        border: 1px solid #cbd5e1;
        background: #ffffff;
        font-size: 12px;
        cursor: pointer;
      }
      .messages {
        flex: 1;
        overflow-y: auto;
        padding: 12px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        background: #ffffff;
      }
      .msg {
        max-width: 92%;
        padding: 10px 12px;
        border-radius: 12px;
        white-space: pre-wrap;
        overflow-wrap: anywhere;
        line-height: 1.5;
      }
      .msg-user {
        align-self: flex-end;
        background: #1d4ed8;
        color: #ffffff;
        border-bottom-right-radius: 4px;
      }
      .msg-assistant {
        align-self: flex-start;
        background: #f1f5f9;
        color: #0f172a;
        border-bottom-left-radius: 4px;
      }
      .msg-system { display: none; }
      .status {
        padding: 8px 12px;
        font-size: 12px;
        color: #64748b;
        min-height: 18px;
        border-top: 1px solid #f1f5f9;
      }
      .status.error { color: #b91c1c; }
      .composer {
        display: flex;
        gap: 8px;
        padding: 10px 12px;
        border-top: 1px solid #e2e8f0;
        background: #ffffff;
        align-items: flex-end;
        flex-shrink: 0;
      }
      .composer textarea {
        flex: 1;
        min-height: 44px;
        max-height: 120px;
        resize: none;
        padding: 10px 12px;
        border-radius: 10px;
        border: 1px solid #cbd5e1;
        font: inherit;
        outline: none;
      }
      .composer textarea:focus { border-color: #1d4ed8; box-shadow: 0 0 0 2px rgba(29,78,216,0.12); }
      .composer button {
        padding: 10px 14px;
        border-radius: 10px;
        border: 1px solid #1d4ed8;
        background: #1d4ed8;
        color: #ffffff;
        font-weight: 600;
        cursor: pointer;
        white-space: nowrap;
      }
      .composer button:disabled { opacity: 0.5; cursor: default; }
      .composer button.stop { background: #b91c1c; border-color: #b91c1c; }
    `;
  }

  function clampPosition(x, y, width, height) {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const minVisible = 40;
    const maxX = vw - minVisible;
    const minX = minVisible - width;
    const maxY = vh - minVisible;
    const minY = minVisible - height;
    return {
      left: Math.min(maxX, Math.max(minX, x)),
      top: Math.min(maxY, Math.max(minY, y))
    };
  }

  function applyOverlayConfig(overlay, config) {
    if (!overlay || !config) return;
    const width = Number.isFinite(config.width) ? config.width : 460;
    const height = Number.isFinite(config.height) ? config.height : 620;
    // Clamp already done in background via normalize, but also clamp to viewport
    const clampedW = Math.min(Math.max(width, 360), Math.min(800, window.innerWidth * 0.9));
    const clampedH = Math.min(Math.max(height, 400), Math.min(900, window.innerHeight * 0.9));
    overlay.style.width = clampedW + "px";
    overlay.style.height = clampedH + "px";
    const theme = config.theme === "light" || config.theme === "dark" ? config.theme : "system";
    overlay.dataset.theme = theme;
    if (config.model) {
      const titleEl = overlay.querySelector(".header-title");
      if (titleEl) titleEl.textContent = config.model;
    }
  }

  function createOverlay(initialPrompt = "", config = {}) {
    if (getHost()) return getHost();

    const host = document.createElement("div");
    host.id = HOST_ID;
    host.style.all = "initial";
    host.style.position = "fixed";
    host.style.inset = "0";
    host.style.width = "0";
    host.style.height = "0";
    host.style.overflow = "visible";
    host.style.zIndex = "2147483646";
    host.style.pointerEvents = "none";

    document.documentElement.append(host);

    const shadow = host.attachShadow({ mode: "open" });
    const styleEl = document.createElement("style");
    styleEl.textContent = createStyles();
    shadow.append(styleEl);

    const overlay = document.createElement("div");
    overlay.className = "overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-label", "AI mini-chat");
    overlay.style.pointerEvents = "auto";
    applyOverlayConfig(overlay, config.overlayMode || config);

    const header = document.createElement("div");
    header.className = "header";
    const title = document.createElement("div");
    title.className = "header-title";
    title.textContent = (config.overlayMode && config.model) || config.model || "AI Chat";
    const actions = document.createElement("div");
    actions.className = "header-actions";
    const btnMin = document.createElement("button");
    btnMin.type = "button";
    btnMin.title = "Свернуть";
    btnMin.textContent = "—";
    const btnClose = document.createElement("button");
    btnClose.type = "button";
    btnClose.title = "Закрыть";
    btnClose.textContent = "×";
    actions.append(btnMin, btnClose);
    header.append(title, actions);

    const toolbar = document.createElement("div");
    toolbar.className = "toolbar";
    const btnClear = document.createElement("button");
    btnClear.type = "button";
    btnClear.textContent = "Новый чат";
    btnClear.title = "Очистить историю";
    toolbar.append(btnClear);

    const messages = document.createElement("div");
    messages.className = "messages";

    const status = document.createElement("div");
    status.className = "status";

    const composer = document.createElement("div");
    composer.className = "composer";
    const textarea = document.createElement("textarea");
    textarea.placeholder = "Сообщение...";
    textarea.rows = 2;
    if (initialPrompt) textarea.value = initialPrompt;
    const btnSend = document.createElement("button");
    btnSend.type = "button";
    btnSend.textContent = "Send";
    composer.append(textarea, btnSend);

    overlay.append(header, toolbar, messages, status, composer);
    shadow.append(overlay);

    let dragging = false;
    let startX = 0, startY = 0, startLeft = 0, startTop = 0;

    function getOverlayRect() {
      return overlay.getBoundingClientRect();
    }

    header.addEventListener("mousedown", (e) => {
      if (e.target === btnMin || e.target === btnClose) return;
      dragging = true;
      const rect = getOverlayRect();
      startX = e.clientX;
      startY = e.clientY;
      startLeft = rect.left;
      startTop = rect.top;
      overlay.style.right = "auto";
      overlay.style.bottom = "auto";
      overlay.style.left = startLeft + "px";
      overlay.style.top = startTop + "px";
      e.preventDefault();
    });

    window.addEventListener("mousemove", (e) => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      const rect = getOverlayRect();
      const next = clampPosition(startLeft + dx, startTop + dy, rect.width, rect.height);
      overlay.style.left = next.left + "px";
      overlay.style.top = next.top + "px";
    });

    window.addEventListener("mouseup", () => {
      if (dragging) {
        dragging = false;
        try {
          const rect = getOverlayRect();
          const pos = { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
          chrome.storage?.local?.set?.({ sendToAiOverlayPos: pos });
        } catch {}
      }
    });

    btnMin.addEventListener("click", () => overlay.classList.toggle("minimized"));
    btnClose.addEventListener("click", () => host.remove());

    function addMessage(role, text) {
      const div = document.createElement("div");
      div.className = "msg " + (role === "user" ? "msg-user" : role === "assistant" ? "msg-assistant" : "msg-system");
      div.textContent = text;
      messages.append(div);
      messages.scrollTop = messages.scrollHeight;
      return div;
    }

    function clearMessages() {
      messages.textContent = "";
    }

    function setStatus(text, isError = false) {
      status.textContent = text;
      status.classList.toggle("error", isError);
    }

    function setTitle(text) {
      title.textContent = text;
    }

    let currentRequestId = null;
    let isGenerating = false;

    function setGenerating(generating) {
      isGenerating = generating;
      if (generating) {
        btnSend.textContent = "Stop";
        btnSend.classList.add("stop");
        btnSend.disabled = false;
      } else {
        btnSend.textContent = "Send";
        btnSend.classList.remove("stop");
        btnSend.disabled = false;
      }
    }

    function sendChat(prompt) {
      if (!prompt || !prompt.trim()) return;
      const text = prompt.trim();
      addMessage("user", text);
      textarea.value = "";
      setStatus("Thinking...");
      setGenerating(true);
      const requestId = String(Date.now()) + Math.random().toString(36).slice(2, 7);
      currentRequestId = requestId;

      chrome.runtime.sendMessage({ type: "overlay.chat.send", requestId, prompt: text }, (response) => {
        if (chrome.runtime.lastError) {
          setStatus(`Ошибка: ${chrome.runtime.lastError.message}`, true);
          setGenerating(false);
          return;
        }
        if (!response) {
          setStatus("Нет ответа от background", true);
          setGenerating(false);
          return;
        }
        if (response.ok && response.text) {
          addMessage("assistant", response.text);
          setStatus("");
        } else if (response.error) {
          setStatus(response.error, true);
        } else if (response.ok === false) {
          setStatus(response.error || "Ошибка запроса", true);
        }
        setGenerating(false);
      });
    }

    function requestHistory() {
      return new Promise((resolve) => {
        chrome.runtime.sendMessage({ type: "overlay.chat.history" }, (response) => {
          if (chrome.runtime.lastError) { resolve(); return; }
          if (response && Array.isArray(response.messages)) {
            clearMessages();
            for (const m of response.messages) {
              if (m.role === "system") continue;
              addMessage(m.role, m.content);
            }
            if (response.model) setTitle(response.model);
          }
          resolve();
        });
      });
    }

    btnSend.addEventListener("click", () => {
      if (isGenerating) {
        if (currentRequestId) {
          chrome.runtime.sendMessage({ type: "overlay.chat.abort", requestId: currentRequestId });
        }
        setStatus("Stopped", false);
        setGenerating(false);
        return;
      }
      const text = textarea.value.trim();
      if (!text) return;
      sendChat(text);
    });

    textarea.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        btnSend.click();
      } else if (e.key === "Escape") {
        overlay.classList.add("minimized");
      }
    });

    btnClear.addEventListener("click", () => {
      chrome.runtime.sendMessage({ type: "overlay.chat.clear" }, () => {
        clearMessages();
        setStatus("Чат очищен");
        setTimeout(() => setStatus(""), 1500);
      });
    });

    // Ordered init: history first, then prompt (prevents race where history clears new message)
    requestHistory().then(() => {
      if (initialPrompt) {
        if (config.autoSend) {
          sendChat(initialPrompt);
        } else {
          textarea.value = initialPrompt;
          setStatus("Готово к отправке. Нажми Send.");
          textarea.focus();
        }
      } else {
        if (messages.children.length === 0 && !textarea.value) {
          setStatus("Готово к отправке. Нажми Send.");
        } else {
          setStatus("");
        }
        textarea.focus();
      }
    });

    host._sendToAi = {
      addMessage,
      clearMessages,
      setStatus,
      setTitle,
      applyConfig: (cfg) => applyOverlayConfig(overlay, cfg),
      setPrompt: (prompt, opts = {}) => {
        textarea.value = prompt;
        textarea.focus();
        setStatus("Промпт обновлён");
        if (opts.autoSend) {
          sendChat(prompt);
        }
      },
      focus: () => textarea.focus(),
      expand: () => overlay.classList.remove("minimized"),
      sendChat
    };

    return host;
  }

  function ensureFloatingOverlay(prompt = "", config = {}) {
    // config may be { overlayMode, model, autoSend } or direct overlayMode
    const overlayConfig = config.overlayMode ? config : { overlayMode: config, autoSend: config.autoSend, model: config.model };
    let host = getHost();
    if (host) {
      if (host._sendToAi) {
        host._sendToAi.expand();
        if (host._sendToAi.applyConfig && overlayConfig.overlayMode) {
          host._sendToAi.applyConfig(overlayConfig.overlayMode);
        } else if (host._sendToAi.applyConfig && config.width) {
          host._sendToAi.applyConfig(config);
        }
        if (prompt) {
          host._sendToAi.setPrompt(prompt, { autoSend: !!overlayConfig.autoSend });
          if (!overlayConfig.autoSend) host._sendToAi.focus();
        } else {
          host._sendToAi.focus();
        }
      }
      return host;
    }
    return createOverlay(prompt, { overlayMode: overlayConfig.overlayMode || config, model: overlayConfig.model, autoSend: !!overlayConfig.autoSend });
  }

  function closeFloatingOverlay() {
    const host = getHost();
    if (host) host.remove();
  }

  const api = { ensureFloatingOverlay, closeFloatingOverlay, getHost, HOST_ID };
  try { window.__sendToAiOverlay = api; } catch {}
  try { globalThis.__sendToAiOverlay = api; } catch {}

  try {
    chrome.runtime?.onMessage?.addListener((msg, sender, sendResponse) => {
      if (!msg || typeof msg.type !== "string") return false;
      if (msg.type === "overlay.open") {
        ensureFloatingOverlay(msg.prompt || "", { overlayMode: msg.overlayMode, model: msg.model, autoSend: !!msg.autoSend });
        sendResponse({ ok: true });
        return true;
      }
      if (msg.type === "overlay.prompt") {
        const host = ensureFloatingOverlay(msg.prompt || "", { overlayMode: msg.overlayMode, model: msg.model, autoSend: !!msg.autoSend });
        if (host?._sendToAi && msg.prompt && !msg.autoSend) host._sendToAi.setPrompt(msg.prompt, { autoSend: false });
        sendResponse({ ok: true });
        return true;
      }
      if (msg.type === "overlay.close") {
        closeFloatingOverlay();
        sendResponse({ ok: true });
        return true;
      }
      return false;
    });
  } catch {}

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { clampPosition, HOST_ID };
  }
})();
