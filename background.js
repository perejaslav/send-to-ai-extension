// Создаем главное меню и подменю при установке расширения
chrome.runtime.onInstalled.addListener(() => {
  // Главный пункт меню
  chrome.contextMenus.create({
    id: "sendToAI",
    title: "Отправить в AI",
    contexts: ["selection"]
  });

  // Подменю для каждого AI-ассистента

  chrome.contextMenus.create({
    id: "sendToGrok",
    parentId: "sendToAI",
    title: "Grok",
    contexts: ["selection"]
  });
  
  chrome.contextMenus.create({
    id: "sendToChatGPT",
    parentId: "sendToAI",
    title: "ChatGPT",
    contexts: ["selection"]
  });
  
  chrome.contextMenus.create({
    id: "sendToGemini",
    parentId: "sendToAI",
    title: "Google Gemini",
    contexts: ["selection"]
  });
  
  chrome.contextMenus.create({
    id: "sendToClaude",
    parentId: "sendToAI",
    title: "Claude",
    contexts: ["selection"]
  });
  
  chrome.contextMenus.create({
    id: "sendToDeepSeek",
    parentId: "sendToAI",
    title: "DeepSeek",
    contexts: ["selection"]
  });

  chrome.contextMenus.create({
    id: "sendToZai",
    parentId: "sendToAI",
    title: "Z.ai",
    contexts: ["selection"]
  });

  chrome.contextMenus.create({
    id: "sendToKimi",
    parentId: "sendToAI",
    title: "Kimi AI",
    contexts: ["selection"]
  });

  chrome.contextMenus.create({
    id: "sendToQwen",
    parentId: "sendToAI",
    title: "Qwen AI",
    contexts: ["selection"]
  });

  chrome.contextMenus.create({
    id: "sendToErnie",
    parentId: "sendToAI",
    title: "Ernie",
    contexts: ["selection"]
  });

  chrome.contextMenus.create({
    id: "sendToMinimax",
    parentId: "sendToAI",
    title: "Minimax",
    contexts: ["selection"]
  });

  chrome.contextMenus.create({
    id: "sendAndTranslateToQwen",
    parentId: "sendToAI",
    title: "Send and translate to Qwen",
    contexts: ["selection"]
  });

// --- НАЧАЛО ВСТАВКИ: Перевод в ChatGPT ---
  chrome.contextMenus.create({
    id: "sendAndTranslateToChatGPT",
    parentId: "sendToAI",
    title: "Send and translate to ChatGPT",
    contexts: ["selection"]
  });

  chrome.contextMenus.create({
    id: "summarizeInChatGPT",
    parentId: "sendToAI",
    title: "Summarize in ChatGPT",
    contexts: ["selection"]
  });  
  // --- КОНЕЦ ВСТАВКИ ---
  
});

// Обработчик клика по пункту меню
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!info.selectionText) return;

  const selectedText = info.selectionText;
  
  // Определяем, какой AI-ассистент выбран
  switch (info.menuItemId) {
    case "sendToQwen":
      openAndInsertText("https://chat.qwen.ai/*", "https://chat.qwen.ai/", selectedText, insertTextToQwen);
      break;
    case "sendToErnie":
      openAndInsertText("https://ernie.baidu.com/*", "https://ernie.baidu.com/chat", selectedText, insertTextToErnie);
      break;
    case "sendToMinimax":
      openAndInsertText("https://agent.minimax.io/*", "https://agent.minimax.io/", selectedText, insertTextToMinimax);
      break;
    case "sendAndTranslateToQwen":
      const textWithTranslatePrompt = "Ты - профессиональный переводчик. Переведи на русский язык разбиением на абзацы и минимальной литературной обработкой там, где это необходимо:\n\n" + selectedText;
      openAndInsertText("https://chat.qwen.ai/*", "https://chat.qwen.ai/", textWithTranslatePrompt, insertTextToQwen);
      break;
    case "sendToGrok":
      openAndInsertText("https://grok.com/*", "https://grok.com/", selectedText, insertTextToGrok);
      break;
    case "sendToZai":
      openAndInsertText("https://chat.z.ai/*", "https://chat.z.ai/", selectedText, insertTextToZai);
      break;
    case "sendToDeepSeek":
      openAndInsertText("https://chat.deepseek.com/*", "https://chat.deepseek.com/", selectedText, insertTextToDeepSeek);
      break;
    case "sendToClaude":
      openAndInsertText("https://claude.ai/*", "https://claude.ai/new", selectedText, insertTextToClaude);
      break;
    case "sendToKimi":
      openAndInsertText("https://www.kimi.com/*", "https://www.kimi.com/", selectedText, insertTextToKimi);
      break;
    case "sendToChatGPT":
      openAndInsertText("https://chatgpt.com/*", "https://chatgpt.com/", selectedText, insertTextToChatGPT);
      break;
// --- НАЧАЛО ВСТАВКИ ---
    case "sendAndTranslateToChatGPT":
      const textForChatGPT = "Ты - профессиональный переводчик. Переведи на русский язык разбиением на абзацы и минимальной литературной обработкой там, где это необходимо:\n\n" + selectedText;
      openAndInsertText("https://chatgpt.com/*", "https://chatgpt.com/", textForChatGPT, insertTextToChatGPT);
      break;
    // --- КОНЕЦ ВСТАВКИ ---	  
    case "sendToGemini":
      openAndInsertText("https://gemini.google.com/*", "https://gemini.google.com/app", selectedText, insertTextToGemini);
      break;
    case "summarizeInChatGPT":
      const textForSummary = "Без вступительного текста. Сделай краткое саммари --- \n\n" + selectedText;
      openAndInsertText("https://chatgpt.com/*", "https://chatgpt.com/", textForSummary, insertTextToChatGPT);
    break;
  }
});
// Универсальная функция для открытия всплывающего окна и вставки текста
function openAndInsertText(urlPattern, newUrl, text, insertFunction) {
  // Ищем открытые окна с нужным URL
  chrome.tabs.query({ url: urlPattern }, (tabs) => {
    if (tabs.length > 0) {
      // Если окно/вкладка уже открыта, фокусируемся на окне и вставляем текст
      const existingTab = tabs[0];
      chrome.windows.update(existingTab.windowId, { focused: true }, () => {
        chrome.tabs.update(existingTab.id, { active: true }, () => {
          chrome.scripting.executeScript({
            target: { tabId: existingTab.id },
            func: insertFunction,
            args: [text]
          });
        });
      });
    } else {
      // Если окно не открыто, создаем новое всплывающее окно
      chrome.windows.create({
        url: newUrl,
        type: 'popup',
        width: 1200,
        height: 800,
        left: 100,
        top: 100
      }, (newWindow) => {
        const newTab = newWindow.tabs[0];
        // Ждем загрузки страницы
        chrome.tabs.onUpdated.addListener(function listener(tabId, changeInfo) {
          if (tabId === newTab.id && changeInfo.status === 'complete') {
            chrome.tabs.onUpdated.removeListener(listener);
            // Вставляем текст после загрузки
            chrome.scripting.executeScript({
              target: { tabId: newTab.id },
              func: insertFunction,
              args: [text]
            });
          }
        });
      });
    }
  });
}

// Функция для вставки текста в Qwen
function insertTextToQwen(text) {
  const waitForInput = setInterval(() => {
    const textarea = document.querySelector('textarea');
    
    if (textarea) {
      clearInterval(waitForInput);
      textarea.focus();
      textarea.value = text;
      
      const inputEvent = new Event('input', { bubbles: true });
      textarea.dispatchEvent(inputEvent);
      
      const changeEvent = new Event('change', { bubbles: true });
      textarea.dispatchEvent(changeEvent);
      
      textarea.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, 100);
  
  setTimeout(() => clearInterval(waitForInput), 10000);
}

// Функция для вставки текста в Ernie (Baidu) - для Slate.js через Clipboard
function insertTextToErnie(text) {
  const waitForInput = setInterval(() => {
    let inputElement = document.querySelector('[data-slate-editor="true"]');
    
    if (!inputElement) {
      inputElement = document.querySelector('div[contenteditable="true"][role="textbox"]');
    }
    if (!inputElement) {
      inputElement = document.querySelector('div[contenteditable="true"]');
    }
    
    if (inputElement) {
      clearInterval(waitForInput);
      inputElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      setTimeout(() => {
        inputElement.focus();
        inputElement.click();
        
        setTimeout(() => {
          // Используем ClipboardEvent для симуляции реальной вставки
          const clipboardData = new DataTransfer();
          clipboardData.setData('text/plain', text);
          
          const pasteEvent = new ClipboardEvent('paste', {
            bubbles: true,
            cancelable: true,
            clipboardData: clipboardData
          });
          
          // Сначала выделяем и удаляем текущее содержимое
          const sel = window.getSelection();
          const range = document.createRange();
          range.selectNodeContents(inputElement);
          sel.removeAllRanges();
          sel.addRange(range);
          
          // Отправляем paste событие - Slate должен его обработать
          inputElement.dispatchEvent(pasteEvent);
          
          // Fallback: если paste не сработал, пробуем execCommand
          setTimeout(() => {
            if (!inputElement.textContent || inputElement.textContent.trim() === '') {
              document.execCommand('insertText', false, text);
            }
            
            // Триггерим input событие
            inputElement.dispatchEvent(new Event('input', { bubbles: true }));
          }, 100);
          
        }, 100);
      }, 300);
    }
  }, 200);
  
  setTimeout(() => clearInterval(waitForInput), 20000);
}

// Функция для вставки текста в Minimax
function insertTextToMinimax(text) {
  const waitForInput = setInterval(() => {
    let inputElement = null;
    
    // Minimax - ищем различные типы полей ввода
    const selectors = [
      '[data-slate-editor="true"]',
      'div[contenteditable="true"][role="textbox"]',
      'div[contenteditable="true"]',
      'textarea[placeholder*="输入"]',
      'textarea[placeholder*="Type"]',
      'textarea[placeholder*="Ask"]',
      'textarea',
      '[class*="input"]',
      '[class*="editor"]',
      '[class*="chat-input"]',
      '[aria-label*="input"]',
      '[aria-label*="message"]'
    ];
    
    for (const selector of selectors) {
      inputElement = document.querySelector(selector);
      if (inputElement) break;
    }
    
    if (inputElement) {
      clearInterval(waitForInput);
      inputElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      setTimeout(() => {
        inputElement.focus();
        inputElement.click();
        
        setTimeout(() => {
          // Пробуем ClipboardEvent (для Slate.js и React)
          const clipboardData = new DataTransfer();
          clipboardData.setData('text/plain', text);
          
          const pasteEvent = new ClipboardEvent('paste', {
            bubbles: true,
            cancelable: true,
            clipboardData: clipboardData
          });
          
          const sel = window.getSelection();
          const range = document.createRange();
          range.selectNodeContents(inputElement);
          sel.removeAllRanges();
          sel.addRange(range);
          
          inputElement.dispatchEvent(pasteEvent);
          
          // Fallback: execCommand
          setTimeout(() => {
            if (!inputElement.textContent || inputElement.textContent.trim() === '') {
              document.execCommand('insertText', false, text);
            }
            
            inputElement.dispatchEvent(new Event('input', { bubbles: true }));
          }, 100);
          
        }, 100);
      }, 300);
    }
  }, 200);
  
  setTimeout(() => clearInterval(waitForInput), 20000);
}

// Функция для вставки текста в Claude (React-based)
function insertTextToClaude(text) {
  const waitForInput = setInterval(() => {
    let inputElement = null;
    
    // Claude использует div[contenteditable="true"] с role="textbox"
    const selectors = [
      'div[contenteditable="true"][role="textbox"]',
      'div[contenteditable="true"]',
      'textarea[placeholder*="How can Claude help"]',
      'textarea',
      '[data-slate-editor="true"]',
      '[class*="input"]',
      '[class*="editor"]',
      '[aria-label*="message"]',
      '[aria-label*="input"]'
    ];
    
    for (const selector of selectors) {
      inputElement = document.querySelector(selector);
      if (inputElement) break;
    }
    
    if (inputElement) {
      clearInterval(waitForInput);
      inputElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      setTimeout(() => {
        inputElement.focus();
        inputElement.click();
        
        setTimeout(() => {
          // Для React используем ClipboardEvent
          const clipboardData = new DataTransfer();
          clipboardData.setData('text/plain', text);
          
          const pasteEvent = new ClipboardEvent('paste', {
            bubbles: true,
            cancelable: true,
            clipboardData: clipboardData
          });
          
          const sel = window.getSelection();
          const range = document.createRange();
          range.selectNodeContents(inputElement);
          sel.removeAllRanges();
          sel.addRange(range);
          
          inputElement.dispatchEvent(pasteEvent);
          
          // Fallback: execCommand
          setTimeout(() => {
            if (!inputElement.textContent || inputElement.textContent.trim() === '') {
              document.execCommand('insertText', false, text);
            }
            
            inputElement.dispatchEvent(new Event('input', { bubbles: true }));
          }, 100);
          
        }, 100);
      }, 300);
    }
  }, 200);
  
  setTimeout(() => clearInterval(waitForInput), 20000);
}

// Функция для вставки текста в Grok (улучшенная версия)
function insertTextToGrok(text) {
  const waitForInput = setInterval(() => {
    let inputElement = null;
    
    // Расширенный поиск элементов ввода
    const selectors = [
      'textarea[placeholder*="Ask"]',
      'textarea[placeholder*="Type"]',
      'div[contenteditable="true"][role="textbox"]',
      'div[contenteditable="true"]',
      'textarea',
      'div[data-testid*="input"]',
      'div[class*="input"]',
      'div[class*="composer"]',
      'div[class*="prompt"]',
      '[aria-label*="message"]',
      '[aria-label*="input"]',
      '[aria-label*="prompt"]',
      'input[type="text"]'
    ];
    
    for (const selector of selectors) {
      inputElement = document.querySelector(selector);
      if (inputElement) break;
    }
    
    if (inputElement) {
      clearInterval(waitForInput);
      
      // Прокрутка к элементу
      inputElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Небольшая задержка перед вставкой
      setTimeout(() => {
        inputElement.focus();
        
        // Метод 1: Для textarea и input
        if (inputElement.tagName === 'TEXTAREA' || inputElement.tagName === 'INPUT') {
          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
            window.HTMLTextAreaElement.prototype, 
            'value'
          )?.set || Object.getOwnPropertyDescriptor(
            window.HTMLInputElement.prototype, 
            'value'
          )?.set;
          
          if (nativeInputValueSetter) {
            nativeInputValueSetter.call(inputElement, text);
          } else {
            inputElement.value = text;
          }
          
          // Триггер всех возможных событий
          ['input', 'change', 'keydown', 'keyup'].forEach(eventType => {
            const event = new Event(eventType, { bubbles: true, cancelable: true });
            inputElement.dispatchEvent(event);
          });
        } 
        // Метод 2: Для contentEditable элементов
        else if (inputElement.contentEditable === 'true') {
          // Очистка содержимого
          inputElement.innerHTML = '';
          
          // Вставка через execCommand (старый, но надёжный метод)
          inputElement.focus();
          document.execCommand('insertText', false, text);
          
          // Альтернативный метод через Clipboard API
          if (!inputElement.textContent.includes(text)) {
            inputElement.textContent = text;
          }
          
          // Триггер событий
          ['input', 'change', 'keydown', 'keyup'].forEach(eventType => {
            const event = new Event(eventType, { bubbles: true, cancelable: true });
            inputElement.dispatchEvent(event);
          });
          
          // Установка курсора в конец
          const range = document.createRange();
          const sel = window.getSelection();
          range.selectNodeContents(inputElement);
          range.collapse(false);
          sel.removeAllRanges();
          sel.addRange(range);
        }
        
        // Дополнительный триггер для React-приложений
        const reactEvent = new InputEvent('input', { 
          bubbles: true, 
          cancelable: true,
          inputType: 'insertText',
          data: text
        });
        inputElement.dispatchEvent(reactEvent);
        
      }, 300);
    }
  }, 200);
  
  // Увеличенный таймаут ожидания
  setTimeout(() => clearInterval(waitForInput), 20000);
}

// Функция для вставки текста в Z.ai
function insertTextToZai(text) {
  const waitForInput = setInterval(() => {
    const textarea = document.querySelector('#chat-input') || document.querySelector('textarea');
    
    if (textarea) {
      clearInterval(waitForInput);
      textarea.focus();
      textarea.value = text;
      
      const inputEvent = new Event('input', { bubbles: true });
      textarea.dispatchEvent(inputEvent);
      
      const changeEvent = new Event('change', { bubbles: true });
      textarea.dispatchEvent(changeEvent);
      
      textarea.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, 100);
  
  setTimeout(() => clearInterval(waitForInput), 10000);
}

// Функция для вставки текста в DeepSeek (универсальная)
function insertTextToDeepSeek(text) {
  const waitForInput = setInterval(() => {
    let inputElement = null;
    
    inputElement = document.querySelector('textarea');
    if (!inputElement) {
      inputElement = document.querySelector('div[contenteditable="true"]');
    }
    if (!inputElement) {
      inputElement = document.querySelector('input[type="text"]');
    }
    if (!inputElement) {
      inputElement = document.querySelector('textarea[placeholder*="Ask"]') ||
                     document.querySelector('textarea[placeholder*="Type"]') ||
                     document.querySelector('textarea[placeholder*="Enter"]');
    }
    if (!inputElement) {
      inputElement = document.querySelector('[aria-label*="input"]') ||
                     document.querySelector('[aria-label*="prompt"]') ||
                     document.querySelector('[aria-label*="message"]');
    }
    
    if (inputElement) {
      clearInterval(waitForInput);
      inputElement.focus();
      
      if (inputElement.tagName === 'TEXTAREA' || inputElement.tagName === 'INPUT') {
        inputElement.value = text;
        
        const inputEvent = new Event('input', { bubbles: true });
        inputElement.dispatchEvent(inputEvent);
        
        const changeEvent = new Event('change', { bubbles: true });
        inputElement.dispatchEvent(changeEvent);
      } else if (inputElement.contentEditable === 'true') {
        const paragraph = inputElement.querySelector('p');
        if (paragraph) {
          paragraph.textContent = text;
        } else {
          inputElement.textContent = text;
        }
        
        const inputEvent = new Event('input', { bubbles: true });
        inputElement.dispatchEvent(inputEvent);
        
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(inputElement);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
      }
      
      inputElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, 200);
  
  setTimeout(() => clearInterval(waitForInput), 15000);
}


// Функция для вставки текста в Kimi AI
function insertTextToKimi(text) {
  const waitForInput = setInterval(() => {
    let inputElement = null;
    
    // Kimi использует div[contenteditable="true"] с классом chat-input-editor
    inputElement = document.querySelector('div[contenteditable="true"]');
    if (!inputElement) {
      inputElement = document.querySelector('.chat-input-editor');
    }
    if (!inputElement) {
      // Пробуем найти textarea как запасной вариант
      inputElement = document.querySelector('textarea');
    }
    if (!inputElement) {
      inputElement = document.querySelector('input[type="text"]');
    }
    
    if (inputElement) {
      clearInterval(waitForInput);
      inputElement.focus();
      
      if (inputElement.tagName === 'TEXTAREA' || inputElement.tagName === 'INPUT') {
        inputElement.value = text;
        
        const inputEvent = new Event('input', { bubbles: true });
        inputElement.dispatchEvent(inputEvent);
        
        const changeEvent = new Event('change', { bubbles: true });
        inputElement.dispatchEvent(changeEvent);
      } else if (inputElement.contentEditable === 'true') {
        // Для Kimi используем execCommand - это единственный способ, который работает
        document.execCommand('insertText', false, text);
        
        const inputEvent = new Event('input', { bubbles: true });
        inputElement.dispatchEvent(inputEvent);
      }
      
      inputElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, 200);
  
  setTimeout(() => clearInterval(waitForInput), 15000);
}


// Функция для вставки текста в ChatGPT
function insertTextToChatGPT(text) {
  const waitForInput = setInterval(() => {
    let inputElement = null;
    
    // ChatGPT использует contenteditable div
    inputElement = document.querySelector('div[contenteditable="true"]');
    if (!inputElement) {
      // Пробуем найти по id (ChatGPT может использовать prompt-textarea)
      inputElement = document.querySelector('#prompt-textarea');
    }
    if (!inputElement) {
      // Пробуем найти textarea
      inputElement = document.querySelector('textarea');
    }
    if (!inputElement) {
      // Ищем по data-id
      inputElement = document.querySelector('[data-id*="root"]');
    }
    
    if (inputElement) {
      clearInterval(waitForInput);
      inputElement.focus();
      
      if (inputElement.tagName === 'TEXTAREA' || inputElement.tagName === 'INPUT') {
        inputElement.value = text;
        
        const inputEvent = new Event('input', { bubbles: true });
        inputElement.dispatchEvent(inputEvent);
        
        const changeEvent = new Event('change', { bubbles: true });
        inputElement.dispatchEvent(changeEvent);
      } else if (inputElement.contentEditable === 'true') {
        // Для ChatGPT используем execCommand (как для Kimi)
        document.execCommand('insertText', false, text);
        
        const inputEvent = new Event('input', { bubbles: true });
        inputElement.dispatchEvent(inputEvent);
      }
      
      inputElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, 200);
  
  setTimeout(() => clearInterval(waitForInput), 15000);
}

// Функция для вставки текста в Google Gemini
function insertTextToGemini(text) {
  const waitForInput = setInterval(() => {
    let inputElement = null;
    
    // Google Gemini использует contenteditable div
    inputElement = document.querySelector('div[contenteditable="true"]');
    if (!inputElement) {
      // Пробуем найти по aria-label
      inputElement = document.querySelector('div[aria-label*="prompt"]');
    }
    if (!inputElement) {
      inputElement = document.querySelector('div[aria-label*="Enter a prompt"]');
    }
    if (!inputElement) {
      // Пробуем найти textarea
      inputElement = document.querySelector('textarea');
    }
    if (!inputElement) {
      // Ищем по классам
      inputElement = document.querySelector('[class*="input"]');
    }
    
    if (inputElement) {
      clearInterval(waitForInput);
      inputElement.focus();
      
      if (inputElement.tagName === 'TEXTAREA' || inputElement.tagName === 'INPUT') {
        inputElement.value = text;
        
        const inputEvent = new Event('input', { bubbles: true });
        inputElement.dispatchEvent(inputEvent);
        
        const changeEvent = new Event('change', { bubbles: true });
        inputElement.dispatchEvent(changeEvent);
      } else if (inputElement.contentEditable === 'true') {
        // Для Gemini используем execCommand (как для Kimi и ChatGPT)
        document.execCommand('insertText', false, text);
        
        const inputEvent = new Event('input', { bubbles: true });
        inputElement.dispatchEvent(inputEvent);
      }
      
      inputElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, 200);
  
  setTimeout(() => clearInterval(waitForInput), 15000);
}
