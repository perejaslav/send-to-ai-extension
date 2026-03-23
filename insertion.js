export function insertTextIntoPage(text, profile) {
  const selectors = Array.isArray(profile?.selectors) && profile.selectors.length > 0
    ? profile.selectors
    : ["textarea", 'div[contenteditable="true"]'];

  const intervalMs = Number(profile?.intervalMs) > 0 ? Number(profile.intervalMs) : 200;
  const timeoutMs = Number(profile?.timeoutMs) > 0 ? Number(profile.timeoutMs) : 15000;
  const usePasteFirst = Boolean(profile?.usePasteFirst);

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
        inputType: "insertText",
        data: text
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

  const setContentEditableValue = (element, value) => {
    element.focus();
    element.click();
    clearEditableContent(element);

    let inserted = false;

    if (usePasteFirst) {
      inserted = tryPasteEvent(element, value);
    }

    if (!inserted) {
      try {
        inserted = document.execCommand("insertText", false, value);
      } catch {
        inserted = false;
      }
    }

    if (!inserted || !isMeaningfullyInserted(element.textContent, value)) {
      element.textContent = value;
    }

    dispatchStandardEvents(element);
    placeCursorAtEnd(element);
    return isMeaningfullyInserted(element.textContent, value);
  };

  const tryInsert = (element, value) => {
    if (!element) {
      return false;
    }

    const isTextInput = element.tagName === "TEXTAREA" || element.tagName === "INPUT";

    if (isTextInput) {
      element.focus();
      setNativeInputValue(element, value);
      dispatchStandardEvents(element);
      return isMeaningfullyInserted(element.value, value);
    }

    if (isEditableElement(element)) {
      return setContentEditableValue(element, value);
    }

    return false;
  };

  return new Promise((resolve) => {
    let finished = false;
    let waitForInput = null;
    let timeoutId = null;

    const finish = (result) => {
      if (finished) {
        return;
      }

      finished = true;

      if (waitForInput !== null) {
        clearInterval(waitForInput);
      }

      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }

      resolve(result);
    };

    const attemptInsert = () => {
      const match = findInputElement();
      if (!match) {
        return;
      }

      const inserted = tryInsert(match.element, text);
      if (!inserted) {
        finish({
          status: "insert_failed",
          selector: match.selector,
          tagName: match.element.tagName.toLowerCase()
        });
        return;
      }

      match.element.scrollIntoView({ behavior: "smooth", block: "center" });
      finish({
        status: "success",
        selector: match.selector,
        tagName: match.element.tagName.toLowerCase()
      });
    };

    waitForInput = setInterval(attemptInsert, intervalMs);
    timeoutId = setTimeout(() => {
      finish({ status: "input_not_found" });
    }, timeoutMs);

    attemptInsert();
  });
}
