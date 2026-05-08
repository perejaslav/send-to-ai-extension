import {
  DEFAULT_OPTIONS_TAB_ID,
  OPTIONS_TAB_GROUPS,
  getOptionsTabByHeading,
  isPanelVisibleForState,
  normalizeSearchQuery
} from "./options-ui-core.js";

const STORAGE_KEY = "optionsUiActiveTab";

const state = {
  activeTabId: DEFAULT_OPTIONS_TAB_ID,
  searchQuery: "",
  panels: []
};

function storageGet(key) {
  return new Promise((resolve) => {
    chrome.storage.local.get([key], (result) => {
      resolve(result?.[key]);
    });
  });
}

function storageSet(key, value) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [key]: value }, () => resolve());
  });
}

function createToolbar() {
  const main = document.querySelector("main.container");
  const lead = document.querySelector(".lead");
  if (!main || !lead || document.getElementById("optionsUiToolbar")) {
    return null;
  }

  const toolbar = document.createElement("section");
  toolbar.id = "optionsUiToolbar";
  toolbar.className = "options-ui-toolbar";

  const tabs = document.createElement("div");
  tabs.className = "options-tabs";
  tabs.setAttribute("role", "tablist");

  for (const group of OPTIONS_TAB_GROUPS) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "options-tab";
    button.dataset.tabId = group.id;
    button.textContent = group.title;
    button.setAttribute("role", "tab");
    button.addEventListener("click", () => setActiveTab(group.id));
    tabs.append(button);
  }

  const searchWrap = document.createElement("label");
  searchWrap.className = "options-search";
  searchWrap.textContent = "Поиск по настройкам";

  const searchInput = document.createElement("input");
  searchInput.id = "optionsSearchInput";
  searchInput.type = "search";
  searchInput.placeholder = "Например: YouTube, Qwen, диагностика";
  searchInput.addEventListener("input", () => {
    state.searchQuery = searchInput.value;
    applyUiState();
  });
  searchWrap.append(searchInput);

  const bulk = document.createElement("div");
  bulk.className = "options-bulk-actions";

  const enableVisible = document.createElement("button");
  enableVisible.type = "button";
  enableVisible.className = "secondary";
  enableVisible.textContent = "Включить видимое";
  enableVisible.addEventListener("click", () => setVisibleCheckboxes(true));

  const disableVisible = document.createElement("button");
  disableVisible.type = "button";
  disableVisible.className = "secondary";
  disableVisible.textContent = "Выключить видимое";
  disableVisible.addEventListener("click", () => setVisibleCheckboxes(false));

  bulk.append(enableVisible, disableVisible);
  toolbar.append(tabs, searchWrap, bulk);
  lead.insertAdjacentElement("afterend", toolbar);
  return toolbar;
}

function collectPanels() {
  const panels = Array.from(document.querySelectorAll("main.container > section.panel"));
  state.panels = panels.map((panel) => {
    const heading = panel.querySelector("h2")?.textContent || "";
    const tabId = getOptionsTabByHeading(heading);
    panel.dataset.optionsTab = tabId;
    panel.dataset.optionsHeading = heading;

    return {
      element: panel,
      heading,
      tabId
    };
  });
}

function updateTabs() {
  document.querySelectorAll(".options-tab").forEach((button) => {
    const isActive = button.dataset.tabId === state.activeTabId;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-selected", isActive ? "true" : "false");
  });
}

function updatePanels() {
  let visibleCount = 0;

  for (const panel of state.panels) {
    const text = panel.element.textContent || "";
    const visible = isPanelVisibleForState({
      panelTabId: panel.tabId,
      activeTabId: state.activeTabId,
      panelText: text,
      searchQuery: state.searchQuery
    });

    panel.element.hidden = !visible;
    panel.element.classList.toggle("search-match", visible && normalizeSearchQuery(state.searchQuery).length > 0);
    if (visible) {
      visibleCount += 1;
    }
  }

  renderEmptySearchState(visibleCount);
}

function renderEmptySearchState(visibleCount) {
  let empty = document.getElementById("optionsSearchEmpty");
  if (!empty) {
    empty = document.createElement("div");
    empty.id = "optionsSearchEmpty";
    empty.className = "empty-state options-search-empty";
    empty.textContent = "Ничего не найдено. Попробуй другой запрос.";
    const toolbar = document.getElementById("optionsUiToolbar");
    toolbar?.insertAdjacentElement("afterend", empty);
  }

  empty.hidden = visibleCount > 0 || normalizeSearchQuery(state.searchQuery).length === 0;
}

function applyUiState() {
  updateTabs();
  updatePanels();
}

async function setActiveTab(tabId) {
  if (!OPTIONS_TAB_GROUPS.some((group) => group.id === tabId)) {
    return;
  }

  state.activeTabId = tabId;
  await storageSet(STORAGE_KEY, tabId);
  applyUiState();
}

function setVisibleCheckboxes(checked) {
  const visiblePanels = state.panels
    .filter((panel) => !panel.element.hidden)
    .map((panel) => panel.element);

  for (const panel of visiblePanels) {
    const checkboxes = Array.from(panel.querySelectorAll('input[type="checkbox"]'));
    for (const checkbox of checkboxes) {
      if (checkbox.disabled || checkbox.checked === checked) {
        continue;
      }

      checkbox.checked = checked;
      checkbox.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }
}

function observeDynamicPanelText() {
  const observer = new MutationObserver(() => {
    if (normalizeSearchQuery(state.searchQuery).length > 0) {
      updatePanels();
    }
  });

  for (const panel of state.panels) {
    observer.observe(panel.element, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }
}

async function initOptionsUi() {
  createToolbar();
  collectPanels();

  const storedTabId = await storageGet(STORAGE_KEY);
  if (OPTIONS_TAB_GROUPS.some((group) => group.id === storedTabId)) {
    state.activeTabId = storedTabId;
  }

  applyUiState();
  observeDynamicPanelText();
}

initOptionsUi();
