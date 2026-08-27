// Floating AI Overlay — Shadow DOM shell (Phase 2, no AI transport yet)
(() => {
  const HOST_ID = "send-to-ai-floating-overlay-host";
  const STORAGE_KEY_POS = "sendToAiOverlayPos";

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
      .overlay.minimized {
        height: 48px !important;
        min-height: 48px !important;
        resize: none;
        overflow: hidden;
      }
      .overlay.minimized .messages,
      .overlay.minimized .status,
      .overlay.minimized .composer {
        display: none;
      }
      @media (prefers-color-scheme: dark) {
        .overlay { background: #0f172a; color: #e2e8f0; border-color: #1e293b; }
        .header { background: #0f172a; border-color: #1e293b; }
        .messages { background: #0f172a; }
        .composer { background: #0f172a; border-color: #1e293b; }
        .composer textarea { background: #1e293b; color: #e2e8f0; border-color: #334155; }
        .msg-user { background: #1e40af; color: #ffffff; }
        .msg-assistant { background: #1e293b; color: #e2e8f0; }
      }
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

  function createOverlay(initialPrompt = "") {
    if (getHost()) return getHost();

    const host = document.createElement("div");
    host.id = HOST_ID;
    // Ensure host itself doesn't affect page layout
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

    // Header
    const header = document.createElement("div");
    header.className = "header";
    const title = document.createElement("div");
    title.className = "header-title";
    title.textContent = "AI Chat";
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

    // Messages
    const messages = document.createElement("div");
    messages.className = "messages";

    // Status
    const status = document.createElement("div");
    status.className = "status";

    // Composer
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

    overlay.append(header, messages, status, composer);
    shadow.append(overlay);

    // Drag handling
    let dragging = false;
    let startX = 0, startY = 0, startLeft = 0, startTop = 0;
    let hasDragged = false;

    function getOverlayRect() {
      return overlay.getBoundingClientRect();
    }

    header.addEventListener("mousedown", (e) => {
      if (e.target === btnMin || e.target === btnClose) return;
      dragging = true;
      hasDragged = false;
      const rect = getOverlayRect();
      startX = e.clientX;
      startY = e.clientY;
      // Convert right/bottom to left/top for dragging
      const computedLeft = rect.left;
      const computedTop = rect.top;
      startLeft = computedLeft;
      startTop = computedTop;
      // Switch to left/top positioning
      overlay.style.right = "auto";
      overlay.style.bottom = "auto";
      overlay.style.left = computedLeft + "px";
      overlay.style.top = computedTop + "px";
      e.preventDefault();
    });

    window.addEventListener("mousemove", (e) => {
      if (!dragging) return;
      hasDragged = true;
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
        // Persist position (best-effort)
        try {
          const rect = getOverlayRect();
          const pos = { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
          // Store via runtime if needed, fallback to localStorage
          chrome.storage?.local?.set?.({ sendToAiOverlayPos: pos });
        } catch {}
      }
    });

    // Minimize / Close
    btnMin.addEventListener("click", () => {
      overlay.classList.toggle("minimized");
    });
    btnClose.addEventListener("click", () => {
      host.remove();
    });

    // Composer logic (local echo for shell phase)
    function addMessage(role, text) {
      const div = document.createElement("div");
      div.className = "msg " + (role === "user" ? "msg-user" : role === "assistant" ? "msg-assistant" : "msg-system");
      div.textContent = text;
      messages.append(div);
      messages.scrollTop = messages.scrollHeight;
      return div;
    }

    function setStatus(text, isError = false) {
      status.textContent = text;
      status.classList.toggle("error", isError);
    }

    // If initial prompt provided, show it in composer and as user message preview
    if (initialPrompt) {
      setStatus("Готово к отправке. Нажми Send.");
    }

    btnSend.addEventListener("click", async () => {
      const text = textarea.value.trim();
      if (!text) return;
      addMessage("user", text);
      textarea.value = "";
      setStatus("Отправка... (AI transport будет в следующей фазе)");
      btnSend.disabled = true;
      // Simulate local echo until transport is implemented
      setTimeout(() => {
        addMessage("assistant", "AI transport ещё не подключён. Это shell-оверлей Phase 2. Настрой AI в следующей фазе и отправка будет работать.");
        setStatus("");
        btnSend.disabled = false;
        textarea.focus();
      }, 400);
    });

    textarea.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        btnSend.click();
      } else if (e.key === "Escape") {
        overlay.classList.add("minimized");
      }
    });

    // Focus handling: don't trap global keys
    textarea.focus();

    // Expose API on host for background messaging
    host._sendToAi = {
      addMessage,
      setStatus,
      setPrompt: (prompt) => { textarea.value = prompt; textarea.focus(); setStatus("Промпт обновлён"); },
      focus: () => textarea.focus(),
      expand: () => overlay.classList.remove("minimized")
    };

    return host;
  }

  function ensureFloatingOverlay(prompt = "") {
    let host = getHost();
    if (host) {
      // Reuse existing
      if (host._sendToAi) {
        host._sendToAi.expand();
        if (prompt) host._sendToAi.setPrompt(prompt);
        host._sendToAi.focus();
      }
      return host;
    }
    return createOverlay(prompt);
  }

  function closeFloatingOverlay() {
    const host = getHost();
    if (host) host.remove();
  }

  // Expose globally for executeScript func and for runtime message handler
  const api = { ensureFloatingOverlay, closeFloatingOverlay, getHost, HOST_ID };
  try {
    window.__sendToAiOverlay = api;
  } catch {}
  // Also attach to globalThis for isolated world
  try { globalThis.__sendToAiOverlay = api; } catch {}

  // Runtime message listener for background → overlay communication (Phase 3+)
  try {
    chrome.runtime?.onMessage?.addListener((msg, sender, sendResponse) => {
      if (!msg || typeof msg.type !== "string") return false;
      if (msg.type === "overlay.open") {
        const host = ensureFloatingOverlay(msg.prompt || "");
        sendResponse({ ok: true });
        return true;
      }
      if (msg.type === "overlay.prompt") {
        const host = ensureFloatingOverlay(msg.prompt || "");
        if (host?._sendToAi && msg.prompt) host._sendToAi.setPrompt(msg.prompt);
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

  // If this file is injected via <script> tag, auto-create if needed (no-op for Phase 2 injection via func)
  // No auto-create on load; background will call ensureFloatingOverlay via messaging or executeScript func.

  // Export for node tests (pure helpers)
  if (typeof module !== "undefined" && module.exports) {
    module.exports = { clampPosition, HOST_ID };
  }
})();
