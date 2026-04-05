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
    "\n\nЧто обязательно извлечь:" +
    "\n- Все факты, цифры, статистику, даты, имена, названия и конкретные данные" +
    "\n- Ключевые идеи, тезисы и выводы автора, включая неочевидные и косвенно высказанные" +
    "\n- Причинно-следственные связи и логику аргументации автора" +
    "\n- Практические действия, задачи, рекомендации и решения" +
    "\n- Примеры, кейсы и истории, которые иллюстрируют главные мысли" +
    "\n- Противоречия, оговорки или нюансы, которые автор намеренно подчёркивает" +
    "\n\nПринципы обработки:" +
    "\nУдаляй только явную \"воду\": повторы одной и той же мысли, приветствия, благодарности аудитории, слова-паразиты и риторические конструкции без смысловой нагрузки. Всё остальное сохраняй." +
    "\n\nЕсли удаление фрагмента создаёт риск потери смысла или контекста, оставь его. Точность важнее краткости." +
    "\n\nСохраняй авторскую логику и последовательность изложения. Не переставляй блоки информации и не переформулируй идеи так, чтобы изменился их оттенок или акцент." +
    "\n\nЕсли в ролике есть несколько смысловых блоков или тем, раздели результат на соответствующие разделы с понятными заголовками." +
    "\n\nРезультат должен быть настолько полным, чтобы человек, не смотревший ролик, получил исчерпывающее представление о его содержании, не потеряв ни одной важной детали."
  );
}
