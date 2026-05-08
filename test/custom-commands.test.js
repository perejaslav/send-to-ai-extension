import test from "node:test";
import assert from "node:assert/strict";

import {
  buildCustomCommandPrompt,
  getContextMenuContextsForCommand,
  getCustomCommandSourceContext,
  normalizeCustomCommands,
  renderCustomCommandTemplate,
  slugifyCommandId
} from "../custom-commands.js";

test("slugifyCommandId creates stable safe ids", () => {
  assert.equal(slugifyCommandId("My Command!"), "my-command");
  assert.equal(slugifyCommandId("  Команда тест  "), "команда-тест");
  assert.equal(slugifyCommandId("***"), "custom-command");
});

test("normalizeCustomCommands filters invalid commands and repairs fields", () => {
  const commands = normalizeCustomCommands([
    null,
    { title: "No template", serviceId: "sendToChatGPT" },
    { title: "No service", template: "Hello" },
    { title: "Unknown service", serviceId: "missing", template: "Hello" },
    {
      id: "My Command",
      title: "My Command",
      description: "  Test command  ",
      enabled: true,
      serviceId: "sendToChatGPT",
      contextType: "missing",
      template: "  Hello {selection}  ",
      profileIds: ["marketing", "missing", "marketing"],
      order: "20"
    },
    {
      id: "My Command",
      title: "My Command copy",
      enabled: false,
      serviceId: "sendToQwen",
      contextType: "link",
      template: "Open {url}",
      order: 10
    }
  ], ["sendToChatGPT", "sendToQwen"]);

  assert.equal(commands.length, 2);
  assert.equal(commands[0].id, "my-command");
  assert.equal(commands[0].title, "My Command copy");
  assert.equal(commands[0].enabled, false);
  assert.equal(commands[0].contextType, "link");
  assert.deepEqual(commands[0].profileIds, []);
  assert.equal(commands[1].id, "my-command-2");
  assert.equal(commands[1].description, "Test command");
  assert.equal(commands[1].contextType, "selection");
  assert.equal(commands[1].template, "Hello {selection}");
  assert.deepEqual(commands[1].profileIds, ["marketing"]);
});

test("renderCustomCommandTemplate replaces known variables and keeps unknown variables", () => {
  const result = renderCustomCommandTemplate(
    "Text: {selection}\nURL: {url}\nTitle: {title}\nDate: {date}\nUnknown: {missing}",
    {
      selection: "Selected text",
      url: "https://example.com",
      title: "Example",
      date: "2026-05-08"
    }
  );

  assert.equal(result, "Text: Selected text\nURL: https://example.com\nTitle: Example\nDate: 2026-05-08\nUnknown: {missing}");
});

test("buildCustomCommandPrompt returns trimmed prompt or null", () => {
  assert.equal(buildCustomCommandPrompt({ template: "  Hello {selection}  " }, { selection: "world" }), "Hello world");
  assert.equal(buildCustomCommandPrompt({ template: "   " }, {}), null);
  assert.equal(buildCustomCommandPrompt(null, {}), null);
});

test("getContextMenuContextsForCommand maps custom command context types", () => {
  assert.deepEqual(getContextMenuContextsForCommand({ contextType: "selection" }), ["selection"]);
  assert.deepEqual(getContextMenuContextsForCommand({ contextType: "page" }), ["page"]);
  assert.deepEqual(getContextMenuContextsForCommand({ contextType: "page_text" }), ["page"]);
  assert.deepEqual(getContextMenuContextsForCommand({ contextType: "link" }), ["link"]);
  assert.deepEqual(getContextMenuContextsForCommand({ contextType: "youtube" }), ["link"]);
});

test("getCustomCommandSourceContext builds context for selection and link commands", () => {
  const selectionContext = getCustomCommandSourceContext(
    { contextType: "selection" },
    { selectionText: "Selected", pageUrl: "https://page.example" },
    { title: "Page", url: "https://tab.example" },
    { service: "ChatGPT" }
  );

  assert.deepEqual(selectionContext, {
    selection: "Selected",
    url: "https://page.example",
    title: "Page",
    youtubeUrl: "",
    pageText: "",
    date: undefined,
    service: "ChatGPT"
  });

  const linkContext = getCustomCommandSourceContext(
    { contextType: "link" },
    { linkUrl: "https://link.example", pageUrl: "https://page.example" },
    { title: "Page" }
  );

  assert.equal(linkContext.url, "https://link.example");
});
