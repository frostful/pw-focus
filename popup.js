const extensionApi = globalThis.browser ?? globalThis.chrome;

const DEFAULTS = {
  enabled: true,
  alwaysExpanded: true,
  contentWidth: "focused",
  panelStyle: "glass",
  panelRadius: 18,
  accentColor: "#8b7cf6",
  panelOpacity: 92
};

const OUTPUTS = {
  panelRadius: ["panelRadiusOutput", "px"],
  panelOpacity: ["panelOpacityOutput", "%"]
};

const status = document.getElementById("status");
const editLayout = document.getElementById("editLayout");
let draggedOrderItem = null;

function setStatus(message, isError = false) {
  status.textContent = message;
  status.classList.toggle("error", isError);
  window.setTimeout(() => {
    if (status.textContent === message) status.textContent = "";
  }, 2600);
}

function errorMessage(error, fallback = "Something went wrong.") {
  return error?.message || String(error || fallback);
}

function safely(promise, fallback) {
  return promise.catch((error) => {
    setStatus(errorMessage(error, fallback), true);
    return null;
  });
}

function boundedNumber(value, fallback, minimum, maximum) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(maximum, Math.max(minimum, number)) : fallback;
}

function normalizeSettings(value = {}) {
  return {
    enabled: typeof value.enabled === "boolean" ? value.enabled : DEFAULTS.enabled,
    alwaysExpanded: typeof value.alwaysExpanded === "boolean" ? value.alwaysExpanded : DEFAULTS.alwaysExpanded,
    contentWidth: value.contentWidth === "wide" ? "wide" : "focused",
    panelStyle: value.panelStyle === "flat" ? "flat" : "glass",
    panelRadius: boundedNumber(value.panelRadius, DEFAULTS.panelRadius, 0, 32),
    accentColor: /^#[0-9a-f]{6}$/i.test(value.accentColor || "") ? value.accentColor : DEFAULTS.accentColor,
    panelOpacity: boundedNumber(value.panelOpacity, DEFAULTS.panelOpacity, 50, 100)
  };
}

window.addEventListener("unhandledrejection", (event) => {
  event.preventDefault();
  setStatus(errorMessage(event.reason, "The extension could not finish that action."), true);
});

function on(id, event, handler) {
  const element = document.getElementById(id);
  if (element) element.addEventListener(event, handler);
}

async function activePwTab() {
  const [tab] = await extensionApi.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || !tab.url?.startsWith("https://www.pw.live/study-v2/")) return null;
  return tab;
}

async function sendToPw(message) {
  const tab = await activePwTab();
  if (!tab) throw new Error("Open the PW study page first.");
  try {
    return await extensionApi.tabs.sendMessage(tab.id, message);
  } catch {
    throw new Error("Reload the PW page once, then try again.");
  }
}

function renderOrderList(listId, scope, items) {
  const list = document.getElementById(listId);
  list.replaceChildren();
  for (const item of items || []) {
    const row = document.createElement("li");
    row.className = "order-item";
    row.draggable = true;
    row.dataset.key = item.key;
    row.textContent = item.label;
    row.addEventListener("dragstart", () => {
      draggedOrderItem = row;
      row.classList.add("dragging");
    });
    row.addEventListener("dragover", (event) => {
      if (!draggedOrderItem || draggedOrderItem.parentElement !== list) return;
      event.preventDefault();
      const rect = row.getBoundingClientRect();
      list.insertBefore(draggedOrderItem, event.clientY < rect.top + rect.height / 2 ? row : row.nextSibling);
    });
    row.addEventListener("drop", async (event) => {
      event.preventDefault();
      const order = [...list.children].map((node) => node.dataset.key);
      try {
        await sendToPw({ type: "PWF_SET_ORDER", scope, order });
        setStatus("Order saved.");
      } catch (error) {
        setStatus(error.message, true);
      }
    });
    row.addEventListener("dragend", () => {
      row.classList.remove("dragging");
      draggedOrderItem = null;
    });
    list.append(row);
  }
}

function renderLayout(response) {
  renderOrderList("sectionsOrder", "sections", response?.layout?.sections);
  renderOrderList("batchOrder", "batch", response?.layout?.batch);
}

for (const [key, fallback] of Object.entries(DEFAULTS)) {
  const input = document.getElementById(key);
  if (!input) continue;
  const event = input.matches("input[type='range']") ? "input" : "change";
  input.addEventListener(event, () => {
    const value = input.type === "checkbox"
      ? input.checked
      : input.type === "range"
        ? Number(input.value)
        : input.value;
    if (OUTPUTS[key]) {
      const [outputId, suffix] = OUTPUTS[key];
      document.getElementById(outputId).value = `${value}${suffix}`;
    }
    if (key === "enabled") editLayout.disabled = !value;
    void safely(extensionApi.storage.sync.set({ [key]: value ?? fallback }), "Could not save that setting.");
  });
}

on("editLayout", "click", async () => {
  try {
    const response = await sendToPw({ type: "PWF_TOGGLE_EDIT" });
    editLayout.textContent = response?.layoutEditing ? "Finish editing" : "Edit layout";
    editLayout.classList.toggle("editing", Boolean(response?.layoutEditing));
    setStatus(response?.layoutEditing ? "Drag the visible handles on PW." : "Layout saved.");
  } catch (error) {
    setStatus(error.message || "Could not start the layout editor.", true);
  }
});

on("picker", "click", async () => {
  try {
    const response = await sendToPw({ type: "PWF_START_PICKER" });
    if (!response?.ok) throw new Error("Turn on Focus mode before hiding elements.");
    window.close();
  } catch (error) {
    setStatus(error.message || "Could not start the picker.", true);
  }
});

on("reset", "click", async () => {
  try {
    await extensionApi.storage.sync.set({ hiddenSelectors: [], hiddenRules: [] });
    await sendToPw({ type: "PWF_RESET_HIDDEN" });
    setStatus("Manually hidden items restored.");
  } catch (error) {
    setStatus(error.message || "Could not restore hidden items.", true);
  }
});

on("resetOrder", "click", async () => {
  try {
    await extensionApi.storage.sync.set({ sectionOrder: [], batchOrder: [] });
    await sendToPw({ type: "PWF_RESET_ORDER" });
    setStatus("Dashboard order reset.");
  } catch (error) {
    setStatus(error.message || "Could not reset the order.", true);
  }
});

on("emergency", "click", async () => {
  try {
    await extensionApi.storage.sync.set({
      enabled: false,
      hiddenSelectors: [],
      hiddenRules: [],
      sectionOrder: [],
      batchOrder: []
    });
    document.getElementById("enabled").checked = false;
    editLayout.disabled = true;
    setStatus("Cleanup disabled. The full PW page is restored.");
  } catch (error) {
    setStatus(errorMessage(error, "Could not disable cleanup."), true);
  }
});

function renderSettings(normalized) {
  for (const [key, value] of Object.entries(normalized)) {
    const input = document.getElementById(key);
    if (!input) continue;
    if (input.type === "checkbox") input.checked = Boolean(value);
    else input.value = String(value);
  }
  for (const [key, [outputId, suffix]] of Object.entries(OUTPUTS)) {
    document.getElementById(outputId).value = `${normalized[key]}${suffix}`;
  }
  editLayout.disabled = !normalized.enabled;
}

async function initializeSettings() {
  try {
    const stored = await extensionApi.storage.sync.get(DEFAULTS);
    const normalized = normalizeSettings(stored);
    renderSettings(normalized);
  } catch (error) {
    renderSettings(DEFAULTS);
    setStatus(errorMessage(error, "Could not load saved settings."), true);
  }
}

void initializeSettings();

void sendToPw({ type: "PWF_GET_STATE" })
  .then((response) => {
    editLayout.textContent = response?.layoutEditing ? "Finish editing" : "Edit layout";
    editLayout.classList.toggle("editing", Boolean(response?.layoutEditing));
    editLayout.disabled = !response?.enabled;
    renderLayout(response);
  })
  .catch(() => {
    editLayout.disabled = true;
    editLayout.title = "Open the PW study page to edit its layout.";
    renderLayout(null);
  });
