const ALLOWED_YOUTUBE_HOSTS = new Set(["youtube.com", "www.youtube.com", "m.youtube.com"]);

export function normalizeYouTubeUrl(linkUrl) {
  let url;

  try {
    url = new URL(linkUrl);
  } catch {
    return null;
  }

  const host = url.hostname.toLowerCase();

  if (host === "youtu.be") {
    const videoId = url.pathname.split("/").filter(Boolean)[0];
    if (!videoId) {
      return null;
    }

    return `https://www.youtube.com/watch?v=${videoId}`;
  }

  if (!ALLOWED_YOUTUBE_HOSTS.has(host)) {
    return null;
  }

  if (url.pathname === "/watch") {
    const videoId = url.searchParams.get("v");
    if (videoId) {
      return `https://www.youtube.com/watch?v=${videoId}`;
    }
  }

  const keepParams = ["v", "list", "index"];
  const filteredParams = new URLSearchParams();
  for (const param of keepParams) {
    const value = url.searchParams.get(param);
    if (value) {
      filteredParams.set(param, value);
    }
  }

  const normalizedBase = `https://www.youtube.com${url.pathname}`;
  const normalizedQuery = filteredParams.toString();
  return normalizedQuery ? `${normalizedBase}?${normalizedQuery}` : normalizedBase;
}

export function buildYouTubePrompt(cleanUrl) {
  return (
    cleanUrl +
    "\n\nТвоя задача — обработать предоставленный ролик: извлечь всю важную информацию и удалить \"воду\"." +
    "\n\nЧто считается важной информацией:" +
    "\n- Факты, цифры и конкретные данные" +
    "\n- Ключевые идеи и выводы автора" +
    "\n- Действия, задачи и решения" +
    "\n\nСохрани ВСЕ содержательные детали БЕЗ ИСКЛЮЧЕНИЯ. Не сокращай намеренно, если это грозит потерей смысла. " +
    "Результат должен быть точным и полностью сохранять смысл оригинала."
  );
}
