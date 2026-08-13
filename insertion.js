export function insertTextIntoPage(text, profile) {
  const selectors = Array.isArray(profile?.selectors) && profile.selectors.length > 0
    ? profile.selectors
    : ["textarea", 'div[contenteditable="true"]'];

  const intervalMs = Number(profile?.intervalMs) > 0 ? Number(profile.intervalMs) : 200;
  const timeoutMs = Number(profile?.timeoutMs) > 0 ? Number(profile.timeoutMs) : 15000;
  const usePasteFirst = Boolean(profile?.usePasteFirst);
  const settleMs = Number(profile?.settleMs) > 0 ? Number(profile.settleMs) : 0;
  const retryOnInsertFail = Boolean(profile?.retryOnInsertFail);
  const startedAt = Date.now();
  const attemptedSelectors = [];

  const isEditableElement = (element) => {
    if (!element) {
      return false;
    }

    if (element.tagName === "TEXTAREA") {
      return true;
    }

    if (element.tagName === "INPUT" && element.type !== "hidden") {
      return true;
    }

    const contenteditable = element.getAttribute("contenteditable");
    return contenteditable === "true" || contenteditable === "plaintext-only" || element.isContentEditable;
  };

  const findInputElement = () => {
    for (const selector of selectors) {
      if (!attemptedSelectors.includes(selector)) {
        attemptedSelectors.push(selector);
      }

      const candidate = document.querySelector(selector);
      if (!candidate) {
        continue;
      }

      if (isEditableElement(candidate)) {
        return { element: candidate, selector };
      }

      const nestedEditable = candidate.querySelector(
        'textarea, input[type="text"], input:not([type]), [contenteditable="true"], [contenteditable="plaintext-only"]'
      );
      if (nestedEditable && isEditableElement(nestedEditable)) {
        return { element: nestedEditable, selector };
      }
    }

    return null;
  };

  const dispatchStandardEvents = (element) => {
    ["input", "change", "keydown", "keyup"].forEach((eventType) => {
      element.dispatchEvent(new Event(eventType, { bubbles: true, cancelable: true }));
    });

    try {
      element.dispatchEvent(new InputEvent("input", {
        bubbles: true,
        cancelable: true,
        inputType: "insertText"
      }));
    } catch {
      // noop
    }
  };

  const setNativeInputValue = (element, value) => {
    const prototype = element.tagName === "TEXTAREA"
      ? window.HTMLTextAreaElement.prototype
      : window.HTMLInputElement.prototype;

    const descriptor = Object.getOwnPropertyDescriptor(prototype, "value");
    const setter = descriptor?.set;

    if (setter) {
      setter.call(element, value);
    } else {
      element.value = value;
    }
  };

  const placeCursorAtEnd = (element) => {
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(element);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
  };

  const tryPasteEvent = (element, value) => {
    try {
      if (typeof DataTransfer === "undefined" || typeof ClipboardEvent === "undefined") {
        return false;
      }

      const clipboardData = new DataTransfer();
      clipboardData.setData("text/plain", value);

      const pasteEvent = new ClipboardEvent("paste", {
        bubbles: true,
        cancelable: true,
        clipboardData
      });

      element.dispatchEvent(pasteEvent);
      return Boolean(element.textContent && element.textContent.trim().length > 0);
    } catch {
      return false;
    }
  };

  const clearEditableContent = (element) => {
    try {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(element);
      selection.removeAllRanges();
      selection.addRange(range);
    } catch {
      // noop
    }

    try {
      document.execCommand("delete");
    } catch {
      // noop
    }

    if (element.textContent) {
      element.textContent = "";
    }
  };

  const normalizeForCompare = (value) => String(value || "").replace(/\s+/g, " ").trim();

  const isMeaningfullyInserted = (actualValue, expectedValue) => {
    const actual = normalizeForCompare(actualValue);
    const expected = normalizeForCompare(expectedValue);

    if (!actual || !expected) {
      return false;
    }

    if (actual === expected) {
      return true;
    }

    const head = expected.slice(0, Math.min(80, expected.length));
    const tail = expected.slice(Math.max(0, expected.length - 80));
    const longEnough = actual.length >= Math.floor(expected.length * 0.75);

    return longEnough && actual.includes(head) && (tail.length < 20 || actual.includes(tail));
  };

  const getElementValue = (element) => {
    if (!element) {
      return "";
    }

    if (element.tagName === "TEXTAREA" || element.tagName === "INPUT") {
      return element.value || "";
    }

    return element.textContent || "";
  };

  const setContentEditableValue = async (element, value) => {
    if (isMeaningfullyInserted(getElementValue(element), value)) {
      return { inserted: true, method: "already-present", skipped: true };
    }

    element.focus();
    element.click();
    clearEditableContent(element);

    let inserted = false;
    let method = "fallback-textContent";
    let pasteInsertedSynchronously = false;

    if (usePasteFirst) {
      const pasteInserted = tryPasteEvent(element, value);
      pasteInsertedSynchronously = pasteInserted;
      if (pasteInserted) {
        method = "paste-event";
      }

      // React may commit the pasted content asynchronously — give it a short
      // window before falling back to execCommand/textContent.
      if (pasteInserted) {
        const pastedAt = Date.now();
        while (Date.now() - pastedAt < 800) {
          if (isMeaningfullyInserted(element.textContent, value)) {
            inserted = true;
            break;
          }
          await new Promise((resolve) => setTimeout(resolve, 50));
        }
      }
    }

    if (!inserted && !pasteInsertedSynchronously) {
      try {
        inserted = document.execCommand("insertText", false, value);
        if (inserted) {
          method = "execCommand-insertText";
        }
      } catch {
        inserted = false;
      }
    }

    if (!inserted || !isMeaningfullyInserted(element.textContent, value)) {
      element.textContent = value;
      method = "textContent";
    }

    dispatchStandardEvents(element);
    placeCursorAtEnd(element);

    return {
      inserted: isMeaningfullyInserted(element.textContent, value),
      method
    };
  };

  const tryInsert = async (element, value) => {
    if (!element) {
      return { inserted: false, method: "none", actualLength: 0 };
    }

    const isTextInput = element.tagName === "TEXTAREA" || element.tagName === "INPUT";

    if (isTextInput) {
      element.focus();
      element.click();
      setNativeInputValue(element, value);
      dispatchStandardEvents(element);
      return {
        inserted: isMeaningfullyInserted(element.value, value),
        method: "native-value-setter",
        actualLength: getElementValue(element).length
      };
    }

    if (isEditableElement(element)) {
      const result = await setContentEditableValue(element, value);
      return {
        ...result,
        actualLength: getElementValue(element).length
      };
    }

    return { inserted: false, method: "unsupported-element", actualLength: getElementValue(element).length };
  };

  const buildBaseDiagnostic = () => ({
    url: location.href || "",
    title: document.title || "",
    expectedLength: String(text || "").length,
    elapsedMs: Date.now() - startedAt,
    attemptedSelectors: [...attemptedSelectors]
  });

  return new Promise((resolve) => {
    let finished = false;
    let waitForInput = null;
    let timeoutId = null;
    let observer = null;
    let settleId = null;
    let lastMatch = null;
    let lastInsertResult = null;
    let inserting = false;

    const finish = (result) => {
      if (finished) {
        return;
      }

      finished = true;
      inserting = false;

      if (waitForInput !== null) {
        clearInterval(waitForInput);
      }

      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }

      if (observer !== null) {
        observer.disconnect();
      }

      if (settleId !== null) {
        clearTimeout(settleId);
      }

      resolve({
        ...buildBaseDiagnostic(),
        ...result,
        elapsedMs: Date.now() - startedAt
      });
    };

    const attemptInsert = async () => {
      if (finished || inserting) {
        return;
      }

      // If a settle re-check is pending, don't start a new attempt yet.
      if (settleId !== null) {
        return;
      }

      const match = findInputElement();
      if (!match) {
        return;
      }

      inserting = true;
      lastMatch = match;
      let insertResult;
      try {
        insertResult = await tryInsert(match.element, text);
      } catch {
        insertResult = { inserted: false, method: "error", actualLength: 0 };
      }
      lastInsertResult = insertResult;
      inserting = false;

      if (!insertResult.inserted) {
        if (retryOnInsertFail) {
          return; // element not ready yet — keep polling
        }

        finish({
          status: "insert_failed",
          selector: match.selector,
          tagName: match.element.tagName.toLowerCase(),
          method: insertResult.method,
          actualLength: insertResult.actualLength
        });
        return;
      }

      if (settleMs <= 0) {
        match.element.scrollIntoView({ behavior: "smooth", block: "center" });
        finish({
          status: "success",
          selector: match.selector,
          tagName: match.element.tagName.toLowerCase(),
          method: insertResult.method,
          actualLength: insertResult.actualLength
        });
        return;
      }

      // Immediate check passed — wait settleMs for the framework to re-render,
      // then re-verify the value is still present (not wiped by React).
      settleId = setTimeout(() => {
        settleId = null;
        if (finished) {
          return;
        }

        const current = getElementValue(match.element);
        if (isMeaningfullyInserted(current, text)) {
          match.element.scrollIntoView({ behavior: "smooth", block: "center" });
          finish({
            status: "success",
            selector: match.selector,
            tagName: match.element.tagName.toLowerCase(),
            method: insertResult.method,
            actualLength: current.length
          });
          return;
        }

        // Framework wiped the value — fall through; polling will retry on the next tick.
      }, settleMs);
    };

    if (typeof MutationObserver !== "undefined") {
      observer = new MutationObserver(() => {
        if (!finished) {
          attemptInsert();
        }
      });

      observer.observe(document.body || document.documentElement, {
        childList: true,
        subtree: true
      });
    }

    waitForInput = setInterval(attemptInsert, intervalMs);
    timeoutId = setTimeout(() => {
      if (lastMatch && lastInsertResult) {
        finish({
          status: "insert_failed",
          selector: lastMatch.selector,
          tagName: lastMatch.element.tagName.toLowerCase(),
          method: lastInsertResult.method,
          actualLength: lastInsertResult.actualLength
        });
        return;
      }

      finish({
        status: "input_not_found",
        timeoutMs
      });
    }, timeoutMs);

    attemptInsert();
  });
}
