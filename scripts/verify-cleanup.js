import { readFile } from "node:fs/promises";
import vm from "node:vm";

const code = await readFile("background.bundle.js", "utf8");

const listener = { addListener() {} };
const ctx = {
  console,
  chrome: {
    runtime: { onInstalled: listener, onStartup: listener, onMessage: listener },
    storage: {
      onChanged: listener,
      sync: { get: (keys, cb) => cb({}) },
      local: { get: (keys, cb) => cb({}), set: (v, cb) => cb && cb(), remove: (k, cb) => cb && cb() }
    },
    contextMenus: { create: () => "id", onClicked: listener, removeAll: (cb) => cb && cb() },
    tabs: { query: (q, cb) => cb([]), update: (t, p, cb) => cb({}), onUpdated: listener, onActivated: listener },
    windows: { update() {}, create() {} },
    scripting: { executeScript() {} }
  }
};

vm.createContext(ctx);

const probe = `
globalThis.__t = {
  ids: Object.keys(SERVICES_BY_ID),
  order: DEFAULT_SETTINGS.serviceOrder,
  defaultId: DEFAULT_SETTINGS.defaultServiceId,
  specialIds: Object.keys(SPECIAL_ACTIONS_BY_ID),
  menus: buildMenuDescriptors(DEFAULT_SETTINGS).map((m) => m.title || m.id),
  kimi: SERVICES_BY_ID.sendToKimi
};
`;

try {
  vm.runInContext(code + probe, ctx, { filename: "background.bundle.js" });
} catch (error) {
  console.log("SMOKE FAILED:", error.message);
  process.exit(1);
}

const t = ctx.__t;
const hasBanned = (list) => list.some((item) => /ernie|stepfun/i.test(item));

console.log("SMOKE OK");
console.log("service count:", t.ids.length);
console.log("banned in SERVICES_BY_ID:", hasBanned(t.ids));
console.log("banned in serviceOrder:", hasBanned(t.order));
console.log("banned in specialActions:", hasBanned(t.specialIds));
console.log("banned in menu titles:", hasBanned(t.menus));
console.log("kimi domain:", t.kimi && t.kimi.urlPattern);
console.log("defaultServiceId:", t.defaultId);
console.log("menus:", JSON.stringify(t.menus));
