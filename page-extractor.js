const DEFAULT_MAX_TEXT_LENGTH = 30000;
const BLOCK_TAGS = new Set([
  "ARTICLE",
  "ASIDE",
  "BLOCKQUOTE",
  "BR",
  "DD",
  "DIV",
  "DL",
  "DT",
  "FIGCAPTION",
  "FIGURE",
  "FOOTER",
  "H1",
  "H2",
  "H3",
  "H4",
  "H5",
  "H6",
  "HEADER",
  "HR",
  "LI",
  "MAIN",
  "NAV",
  "OL",
  "P",
  "PRE",
  "SECTION",
  "TABLE",
  "TBODY",
  "TD",
  "TFOOT",
  "TH",
  "THEAD",
  "TR",
  "UL"
]);

const IGNORED_TAGS = new Set([
  "SCRIPT",
  "STYLE",
  "NOSCRIPT",
  "SVG",
  "CANVAS",
  "IFRAME",
  "OBJECT",
  "EMBED",
  "TEMPLATE"
]);

function isElementHidden(element) {
  if (!element || element.nodeType !== Node.ELEMENT_NODE) {
    return false;
  }

  if (element.hidden || element.getAttribute("aria-hidden") === "true") {
    return true;
  }

  const style = window.getComputedStyle(element);
  return style.display === "none" || style.visibility === "hidden" || style.opacity === "0";
}

function normalizeText(value) {
  return String(value || "")
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function appendTextPart(parts, text) {
  const normalized = String(text || "").replace(/\s+/g, " ").trim();
  if (normalized) {
    parts.push(normalized);
  }
}

function appendBreak(parts) {
  if (parts.length > 0 && parts[parts.length - 1] !== "\n") {
    parts.push("\n");
  }
}

function walkNode(node, parts) {
  if (!node) {
    return;
  }

  if (node.nodeType === Node.TEXT_NODE) {
    appendTextPart(parts, node.textContent);
    return;
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return;
  }

  const tagName = node.tagName;
  if (IGNORED_TAGS.has(tagName) || isElementHidden(node)) {
    return;
  }

  if (BLOCK_TAGS.has(tagName)) {
    appendBreak(parts);
  }

  for (const child of node.childNodes) {
    walkNode(child, parts);
  }

  if (BLOCK_TAGS.has(tagName)) {
    appendBreak(parts);
  }
}

function readMetaDescription() {
  const element = document.querySelector('meta[name="description"], meta[property="og:description"]');
  return element?.getAttribute("content")?.trim() || "";
}

export function extractVisiblePageText(options = {}) {
  const maxTextLength = Number(options.maxTextLength) > 0
    ? Number(options.maxTextLength)
    : DEFAULT_MAX_TEXT_LENGTH;

  const root = document.querySelector("main, article") || document.body || document.documentElement;
  const parts = [];
  walkNode(root, parts);

  const fullText = normalizeText(parts.join(" ").replace(/\s*\n\s*/g, "\n"));
  const wasTruncated = fullText.length > maxTextLength;
  const text = wasTruncated ? fullText.slice(0, maxTextLength).trimEnd() : fullText;
  const selection = window.getSelection?.().toString().trim() || "";

  return {
    status: text ? "success" : "empty",
    url: location.href || "",
    title: document.title || "",
    description: readMetaDescription(),
    selection,
    text,
    textLength: fullText.length,
    returnedTextLength: text.length,
    wasTruncated,
    maxTextLength
  };
}
