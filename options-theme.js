const THEME_STORAGE_KEY = "optionsTheme";
const DARK_THEME = "dark";
const LIGHT_THEME = "light";

function getStoredTheme() {
  return new Promise((resolve) => {
    chrome.storage.local.get([THEME_STORAGE_KEY], (result) => {
      resolve(result?.[THEME_STORAGE_KEY]);
    });
  });
}

function setStoredTheme(theme) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [THEME_STORAGE_KEY]: theme }, () => resolve());
  });
}

function getSystemTheme() {
  if (window.matchMedia?.("(prefers-color-scheme: dark)")?.matches) {
    return DARK_THEME;
  }

  return LIGHT_THEME;
}

function normalizeTheme(theme) {
  return theme === DARK_THEME || theme === LIGHT_THEME ? theme : getSystemTheme();
}

function applyTheme(theme) {
  const normalizedTheme = normalizeTheme(theme);
  document.documentElement.dataset.optionsTheme = normalizedTheme;
  document.documentElement.style.colorScheme = normalizedTheme;
  return normalizedTheme;
}

function updateToggleButton(button, theme) {
  if (!button) {
    return;
  }

  const isDark = theme === DARK_THEME;
  button.textContent = isDark ? "Включить светлую тему" : "Включить тёмную тему";
  button.setAttribute("aria-pressed", isDark ? "true" : "false");
  button.title = isDark ? "Сейчас включена тёмная тема" : "Сейчас включена светлая тема";
}

async function initOptionsTheme() {
  const button = document.getElementById("optionsThemeToggle");
  let currentTheme = applyTheme(await getStoredTheme());
  updateToggleButton(button, currentTheme);

  button?.addEventListener("click", async () => {
    currentTheme = currentTheme === DARK_THEME ? LIGHT_THEME : DARK_THEME;
    applyTheme(currentTheme);
    updateToggleButton(button, currentTheme);
    await setStoredTheme(currentTheme);
  });
}

initOptionsTheme();

export {
  DARK_THEME,
  LIGHT_THEME,
  THEME_STORAGE_KEY,
  applyTheme,
  normalizeTheme
};
