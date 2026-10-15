// ERA Админка — программа для Windows. Внутри — та же онлайн-админка сайта (eradent.vercel.app/admin),
// поэтому данные общие с сайтом, телефоном и браузером. Вход хранится в профиле программы
// (cookie на 60 дней, продлевается при каждом заходе) — пароль вводится один раз.
const { app, BrowserWindow, Menu, session, shell } = require("electron");
const fs = require("node:fs");
const path = require("node:path");

const ADMIN_URL = process.env.ERA_ADMIN_URL || "https://eradent.vercel.app/admin";
const SITE_ORIGIN = new URL(ADMIN_URL).origin;
const BOUNDS_FILE = () => path.join(app.getPath("userData"), "window.json");

let win = null;

function loadBounds() {
  try {
    return JSON.parse(fs.readFileSync(BOUNDS_FILE(), "utf8"));
  } catch {
    return { width: 1280, height: 860 };
  }
}

function saveBounds() {
  if (!win || win.isDestroyed()) return;
  try {
    fs.writeFileSync(BOUNDS_FILE(), JSON.stringify({ ...win.getNormalBounds(), maximized: win.isMaximized() }));
  } catch {}
}

/** Ссылки за пределы админки (сайт, WhatsApp, tel:, mailto:) — в браузере / системных программах. */
function isInternal(url) {
  try {
    const u = new URL(url);
    return u.origin === SITE_ORIGIN && u.pathname.startsWith("/admin");
  } catch {
    return false;
  }
}

function openExternal(url) {
  if (/^(https?|tel|mailto|whatsapp):/i.test(url)) shell.openExternal(url);
}

function flushCookies() {
  session.defaultSession.cookies.flushStore().catch(() => {});
}

function showOffline() {
  win.loadFile(path.join(__dirname, "offline.html"), { query: { url: ADMIN_URL } });
}

function createWindow() {
  const bounds = loadBounds();
  win = new BrowserWindow({
    ...bounds,
    minWidth: 960,
    minHeight: 640,
    title: "ERA — Админка",
    icon: path.join(__dirname, "build", "icon.png"),
    backgroundColor: "#f6f8fb",
    autoHideMenuBar: true,
    show: false,
    webPreferences: { contextIsolation: true, sandbox: true, nodeIntegration: false, spellcheck: true },
  });
  if (bounds.maximized) win.maximize();
  win.once("ready-to-show", () => win.show());

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (isInternal(url)) win.loadURL(url);
    else openExternal(url);
    return { action: "deny" };
  });
  win.webContents.on("will-navigate", (event, url) => {
    if (url.startsWith("file:") || isInternal(url)) return;
    event.preventDefault();
    openExternal(url);
  });
  // Нет интернета / сайт недоступен — показываем экран с повтором (он сам вернётся, когда сеть появится).
  win.webContents.on("did-fail-load", (_e, code, _desc, url, isMainFrame) => {
    if (isMainFrame && code !== -3 && !url.startsWith("file:")) showOffline();
  });

  // Вход хранится в cookie. Chromium пишет cookie на диск с задержкой — при выключении ПК или «снятии задачи»
  // свежий вход мог бы потеряться. Сохраняем сразу после каждого перехода в админке.
  win.webContents.on("did-navigate", flushCookies);
  win.webContents.on("did-navigate-in-page", flushCookies);

  for (const ev of ["resize", "move", "close"]) win.on(ev, saveBounds);
  win.on("closed", () => (win = null));
  win.loadURL(ADMIN_URL);
}

// Скрытое меню (Alt): обновить, масштаб, полноэкранный режим. Горячие клавиши работают и без него.
Menu.setApplicationMenu(
  Menu.buildFromTemplate([
    {
      label: "Вид",
      submenu: [
        { label: "Обновить", accelerator: "CmdOrCtrl+R", click: () => win?.webContents.reload() },
        { label: "Обновить (F5)", accelerator: "F5", visible: false, click: () => win?.webContents.reload() },
        { label: "Открыть админку", accelerator: "CmdOrCtrl+Shift+H", click: () => win?.loadURL(ADMIN_URL) },
        { type: "separator" },
        { role: "zoomIn", label: "Крупнее" },
        { role: "zoomOut", label: "Мельче" },
        { role: "resetZoom", label: "Обычный размер" },
        { type: "separator" },
        { role: "togglefullscreen", label: "Во весь экран" },
      ],
    },
    { label: "Правка", submenu: [{ role: "undo" }, { role: "redo" }, { type: "separator" }, { role: "cut" }, { role: "copy" }, { role: "paste" }, { role: "selectAll" }] },
  ]),
);

// Одна копия программы: повторный запуск разворачивает уже открытое окно.
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (!win) return;
    if (win.isMinimized()) win.restore();
    win.focus();
  });
  app.whenReady().then(createWindow);
  app.on("before-quit", flushCookies);
  app.on("window-all-closed", () => app.quit());
}
