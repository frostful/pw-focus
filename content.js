(() => {
  "use strict";

  const extensionApi = globalThis.browser ?? globalThis.chrome;

  const DEFAULTS = {
    enabled: true,
    contentWidth: "focused",
    alwaysExpanded: true,
    panelStyle: "glass",
    panelRadius: 18,
    accentColor: "#8b7cf6",
    panelOpacity: 92,
    hiddenSelectors: [],
    hiddenRules: [],
    sectionOrder: [],
    batchOrder: []
  };

  const SECTION_PATTERNS = new Map([
    ["batch-offerings", /^(batch\s+offerings?|your\s+batches)$/i],
    ["study-zone", /^(my\s+study\s+zone|study\s+zone)$/i],
    ["upcoming-events", /^upcoming\s+events?(?:\s*\(\d+\))?$/i]
  ]);

  const BATCH_ITEM_PATTERNS = new Map([
    ["all-classes", /^all\s+classes$/i],
    ["all-tests", /^all\s+tests?$/i],
    ["my-doubts", /^my\s+doubts?$/i],
    ["digital-books", /^digital\s+books?$/i],
    ["community", /^communit(y|ies)$/i],
    ["pi", /^pi$/i],
    ["preparation-meter", /^preparation\s+meter$/i],
    ["test-pass", /^test\s+pass$/i],
    ["khazana", /^khazana$/i],
    ["pitara", /^pitara$/i],
    ["infinite-practice", /^infinite\s+practice$/i],
    ["topper-mentorship", /^topper\s+mentorship/i],
    ["one-to-one-mentorship", /^1\s*:\s*1\s+mentorship$/i]
  ]);

  const PANEL_HEADING_PATTERNS = [
    /^(batch\s+offerings?|your\s+batches)$/i,
    /^upcoming\s+events?(?:\s*\(\d+\))?$/i,
    /^(my\s+study\s+zone|study\s+zone)$/i,
    /^trending\s+among\s+(?:your|ur)\s+pe(?:e|a)rs$/i
  ];

  const root = document.documentElement;
  let settings = { ...DEFAULTS };
  let pickerActive = false;
  let hoveredElement = null;
  let scanQueued = false;
  let lastScanAt = 0;
  let draggedItem = null;
  let layoutEditing = false;
  const expandedControls = new WeakSet();

  function normalizeText(value) {
    return (value || "").trim().replace(/\s+/g, " ");
  }

  function boundedNumber(value, fallback, minimum, maximum) {
    const number = Number(value);
    return Number.isFinite(number) ? Math.min(maximum, Math.max(minimum, number)) : fallback;
  }

  function uniqueStrings(value, limit = 100, maximumLength = 200) {
    if (!Array.isArray(value)) return [];
    return [...new Set(value.filter((item) => typeof item === "string" && item.length <= maximumLength))].slice(0, limit);
  }

  function normalizeSettings(value = {}) {
    const hiddenRules = Array.isArray(value.hiddenRules)
      ? value.hiddenRules
          .filter(
            (rule) =>
              rule &&
              typeof rule.text === "string" &&
              normalizeText(rule.text)
          )
          .map((rule) => ({ text: normalizeText(rule.text).slice(0, 120) }))
          .slice(0, 40)
      : [];
    return {
      enabled: typeof value.enabled === "boolean" ? value.enabled : DEFAULTS.enabled,
      contentWidth: value.contentWidth === "wide" ? "wide" : "focused",
      alwaysExpanded: typeof value.alwaysExpanded === "boolean" ? value.alwaysExpanded : DEFAULTS.alwaysExpanded,
      panelStyle: value.panelStyle === "flat" ? "flat" : "glass",
      panelRadius: boundedNumber(value.panelRadius, DEFAULTS.panelRadius, 0, 32),
      accentColor: /^#[0-9a-f]{6}$/i.test(value.accentColor || "") ? value.accentColor : DEFAULTS.accentColor,
      panelOpacity: boundedNumber(value.panelOpacity, DEFAULTS.panelOpacity, 50, 100),
      hiddenSelectors: uniqueStrings(value.hiddenSelectors, 20, 300),
      hiddenRules,
      sectionOrder: uniqueStrings(value.sectionOrder, 40, 100),
      batchOrder: uniqueStrings(value.batchOrder, 40, 100)
    };
  }

  async function persistSettings(update) {
    try {
      await extensionApi.storage.sync.set(update);
      return true;
    } catch {
      showToast("PW Focus could not save that change.");
      return false;
    }
  }

  function keyFromText(prefix, value) {
    const slug = normalizeText(value)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 56);
    return `${prefix}-${slug || "item"}`;
  }

  function showToast(message) {
    document.getElementById("pwf-toast")?.remove();
    const toast = document.createElement("div");
    toast.id = "pwf-toast";
    toast.textContent = message;
    document.body.append(toast);
    window.setTimeout(() => toast.remove(), 2400);
  }

  function nearestBlock(element) {
    return element.closest("aside, section, article, [role='banner'], [role='complementary'], li, div");
  }

  function isSafeToHide(element) {
    if (!element || element === document.body || element === document.documentElement) return false;
    if (element.matches("main, header, nav, [role='main'], [role='navigation'], #root, #__next")) return false;
    if (element.contains(document.querySelector("main"))) return false;
    const rect = element.getBoundingClientRect();
    if (rect.width > window.innerWidth * 0.72 && rect.height > window.innerHeight * 0.62) return false;
    const protectedHeadings = [...element.querySelectorAll("h1,h2,h3,h4,[role='heading']")]
      .filter((node) => [...SECTION_PATTERNS.values()].some((pattern) => pattern.test(normalizeText(node.textContent))));
    if (protectedHeadings.length > 1) return false;
    return rect.width > 0 && rect.height > 0;
  }

  function applyCustomRules() {
    for (const selector of settings.hiddenSelectors) {
      try {
        document.querySelectorAll(selector).forEach((node) => {
          if (isSafeToHide(node)) node.dataset.pwfHidden = "true";
        });
      } catch {}
    }
    for (const rule of settings.hiddenRules) {
      if (!rule?.text) continue;
      const target = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6,p,span,a,button,div")]
        .filter((node) => normalizeText(node.textContent) === rule.text)
        .sort((a, b) => a.children.length - b.children.length)[0];
      const block = target ? blockForText(target, false) : null;
      if (block && isSafeToHide(block)) block.dataset.pwfHidden = "true";
    }
  }

  function blockForText(node, preferLarge) {
    const semantic = node.closest("section,article,li,a,[role='listitem'],[role='complementary']");
    if (semantic && semantic !== document.body && !semantic.matches("main,[role='main']")) return semantic;
    let current = nearestBlock(node);
    let fallback = current;
    for (let depth = 0; current && depth < 6; depth += 1, current = current.parentElement) {
      if (current.matches("main,[role='main'],body")) break;
      const rect = current.getBoundingClientRect();
      if (preferLarge && rect.width > window.innerWidth * 0.45 && rect.height >= 90 && rect.height <= 900) {
        fallback = current;
      }
      if (!preferLarge && rect.width < window.innerWidth * 0.55 && rect.height < 500) return current;
    }
    return fallback;
  }

  function findExactText(pattern, scope = document, headingsOnly = false) {
    const selector = headingsOnly
      ? "h1,h2,h3,h4,h5,h6,[role='heading']"
      : "a,button,h1,h2,h3,h4,h5,h6,p,span,div";
    return [...scope.querySelectorAll(selector)]
      .filter((node) => pattern.test(normalizeText(node.textContent)))
      .sort((a, b) => a.children.length - b.children.length)[0] || null;
  }

  function ensureAlwaysExpanded() {
    document.querySelectorAll("a,button,[role='button'],span,div").forEach((node) => {
      const text = normalizeText(node.textContent);
      if (!/^show\s+(more|less)$/i.test(text) || node.children.length > 1) return;
      const control = node.closest("a,button,[role='button']") || node;
      control.dataset.pwfExpander = "true";
      if (/^show\s+more$/i.test(text) && !expandedControls.has(control)) {
        expandedControls.add(control);
        window.setTimeout(() => control.click(), 0);
      }
    });
  }

  function decoratePanels() {
    document.querySelectorAll("[data-pwf-panel]").forEach((node) => delete node.dataset.pwfPanel);
    document.querySelectorAll("[data-pwf-content-root]").forEach((node) => delete node.dataset.pwfContentRoot);
    const headings = [...document.querySelectorAll("h1,h2,h3,h4,[role='heading']")]
      .filter((node) => PANEL_HEADING_PATTERNS.some((pattern) => pattern.test(normalizeText(node.textContent))));
    if (!headings.length) return;
    if (headings.length === 1) {
      const panel = blockForText(headings[0], true);
      if (panel && panel !== document.body) {
        panel.dataset.pwfPanel = "true";
        if (panel.parentElement) panel.parentElement.dataset.pwfContentRoot = "true";
      }
      return;
    }
    const container = lowestCommonAncestor(headings);
    if (!container || container.matches("body,html")) return;
    container.dataset.pwfContentRoot = "true";
    for (const heading of headings) {
      const panel = directChildUnder(heading, container);
      if (panel && panel !== container) panel.dataset.pwfPanel = "true";
    }
  }

  function lowestCommonAncestor(nodes) {
    if (!nodes.length) return null;
    let candidate = nodes[0];
    while (candidate && !nodes.every((node) => candidate.contains(node))) candidate = candidate.parentElement;
    return candidate;
  }

  function directChildUnder(node, ancestor) {
    let child = node;
    while (child?.parentElement && child.parentElement !== ancestor) child = child.parentElement;
    return child?.parentElement === ancestor ? child : null;
  }

  function earliestNode(nodes) {
    return nodes.reduce((earliest, node) => {
      if (!earliest) return node;
      return node.compareDocumentPosition(earliest) & Node.DOCUMENT_POSITION_FOLLOWING ? node : earliest;
    }, null);
  }

  function orderedNodes(nodes, savedOrder) {
    const positions = new Map(savedOrder.map((key, index) => [key, index]));
    return [...nodes].sort((a, b) => {
      const aIndex = positions.has(a.dataset.pwfSortKey) ? positions.get(a.dataset.pwfSortKey) : 999;
      const bIndex = positions.has(b.dataset.pwfSortKey) ? positions.get(b.dataset.pwfSortKey) : 999;
      return aIndex - bIndex;
    });
  }

  function applySavedOrder(container, items, savedOrder) {
    if (!savedOrder.length || items.length < 2) return;
    const desired = orderedNodes(items, savedOrder);
    const current = [...container.children].filter((node) => items.includes(node));
    if (current.every((node, index) => node === desired[index])) return;
    const anchor = earliestNode(items);
    container.insertBefore(desired[0], anchor);
    for (let index = 1; index < desired.length; index += 1) desired[index - 1].after(desired[index]);
  }

  function addDragHandle(item, scope) {
    item.classList.add("pwf-sortable");
    item.dataset.pwfSortScopeItem = scope;
    const existing = [...item.children].find((child) => child.matches?.(`.pwf-drag-handle[data-pwf-scope="${scope}"]`));
    if (existing) return;
    const handle = document.createElement("span");
    handle.className = "pwf-drag-handle";
    handle.dataset.pwfScope = scope;
    handle.draggable = true;
    handle.tabIndex = 0;
    handle.setAttribute("role", "button");
    handle.setAttribute("aria-label", scope === "sections" ? "Move dashboard section" : "Move Batch Offerings item");
    handle.title = "Drag to reorder · Alt + ↑/↓ also works";
    handle.textContent = "⠿";
    item.append(handle);
  }

  function prepareSortable(container, keyedItems, scope, savedOrder) {
    if (!container || keyedItems.length < 2) return;
    container.dataset.pwfSortScope = scope;
    for (const [key, item] of keyedItems) {
      item.dataset.pwfSortKey = key;
      item.dataset.pwfSortScopeItem = scope;
      if (layoutEditing) addDragHandle(item, scope);
    }
    applySavedOrder(container, keyedItems.map(([, item]) => item), savedOrder);
  }

  function prepareDashboardSections() {
    const found = [];
    for (const [key, pattern] of SECTION_PATTERNS) {
      const heading = findExactText(pattern, document, true);
      if (heading) found.push([key, heading]);
    }
    if (found.length < 2) return;
    const container = lowestCommonAncestor(found.map(([, heading]) => heading));
    if (!container || container === document.body || container === document.documentElement) return;
    const keyedItems = found
      .map(([key, heading]) => [key, directChildUnder(heading, container)])
      .filter(([, item], index, list) => item && list.findIndex(([, other]) => other === item) === index);
    const knownItems = new Set(keyedItems.map(([, item]) => item));
    for (const child of container.children) {
      if (!(child instanceof HTMLElement) || knownItems.has(child)) continue;
      const heading = child.querySelector("h1,h2,h3,h4,h5,h6,[role='heading']");
      const headingText = normalizeText(heading?.textContent);
      if (!headingText || headingText.length > 80) continue;
      keyedItems.push([keyFromText("section", headingText), child]);
    }
    prepareSortable(container, keyedItems, "sections", settings.sectionOrder);
  }

  function prepareBatchItems() {
    const batchHeading = findExactText(SECTION_PATTERNS.get("batch-offerings"), document, true);
    if (!batchHeading) return;
    const section = batchHeading.closest("section,article,[data-pwf-sort-key='batch-offerings']") || batchHeading.parentElement?.parentElement;
    if (!section) return;
    const labels = [];
    for (const [key, pattern] of BATCH_ITEM_PATTERNS) {
      const label = findExactText(pattern, section);
      if (label) labels.push([key, label]);
    }
    if (labels.length < 2) return;
    const container = lowestCommonAncestor(labels.map(([, label]) => label));
    if (!container) return;
    const keyedItems = labels
      .map(([key, label]) => [key, directChildUnder(label, container)])
      .filter(([, item], index, list) => item && list.findIndex(([, other]) => other === item) === index);
    const knownItems = new Set(keyedItems.map(([, item]) => item));
    const prototypes = [...knownItems];
    for (const child of container.children) {
      if (!(child instanceof HTMLElement) || knownItems.has(child) || child.contains(batchHeading)) continue;
      const text = normalizeText(child.textContent);
      if (!text || text.length > 140) continue;
      const sharesCardShape = prototypes.some((prototype) => {
        const sharedClass = [...prototype.classList].some((name) => child.classList.contains(name));
        const semanticPair = prototype.matches("a,button,li") && child.tagName === prototype.tagName;
        return sharedClass || semanticPair;
      });
      if (sharesCardShape) keyedItems.push([keyFromText("batch", text), child]);
    }
    prepareSortable(container, keyedItems, "batch", settings.batchOrder);
  }

  function removeSortingUI() {
    document.querySelectorAll(".pwf-drag-handle").forEach((node) => node.remove());
    document.querySelectorAll("[data-pwf-sort-key]").forEach((node) => {
      node.classList.remove("pwf-sortable");
      delete node.dataset.pwfSortKey;
      delete node.dataset.pwfSortScopeItem;
    });
    document.querySelectorAll("[data-pwf-sort-scope]").forEach((node) => delete node.dataset.pwfSortScope);
  }

  function scan() {
    scanQueued = false;
    if (draggedItem) return;
    if (!settings.enabled) return;
    document.querySelectorAll("[data-pwf-hidden='true']").forEach((node) => delete node.dataset.pwfHidden);
    if (settings.alwaysExpanded) ensureAlwaysExpanded();
    applyCustomRules();
    decoratePanels();
    prepareDashboardSections();
    prepareBatchItems();
    lastScanAt = performance.now();
  }

  function queueScan() {
    if (scanQueued) return;
    scanQueued = true;
    const elapsed = performance.now() - lastScanAt;
    const delay = Math.max(0, 320 - elapsed);
    window.setTimeout(() => {
      if ("requestIdleCallback" in window) {
        window.requestIdleCallback(scan, { timeout: 450 });
      } else {
        window.requestAnimationFrame(scan);
      }
    }, delay);
  }

  function applySettings() {
    if (!settings.enabled) layoutEditing = false;
    root.classList.toggle("pwf-enabled", settings.enabled);
    root.classList.toggle("pwf-layout-editing", settings.enabled && layoutEditing);
    root.dataset.pwfContentWidth = settings.contentWidth === "wide" ? "wide" : "focused";
    root.dataset.pwfPanelStyle = settings.panelStyle === "flat" ? "flat" : "glass";
    root.style.setProperty("--pwf-panel-radius", `${settings.panelRadius}px`);
    root.style.setProperty("--pwf-accent", settings.accentColor);
    root.style.setProperty("--pwf-panel-opacity", `${settings.panelOpacity}%`);
    root.classList.toggle("pwf-always-expanded", settings.enabled && settings.alwaysExpanded);

    if (!settings.enabled) {
      document.querySelectorAll("[data-pwf-hidden='true']").forEach((node) => delete node.dataset.pwfHidden);
      removeSortingUI();
      return;
    }
    if (!layoutEditing) removeSortingUI();
    queueScan();
  }

  function stableSelector(element) {
    if (element.id && !/\d{4,}/.test(element.id)) return `#${CSS.escape(element.id)}`;
    const testId = element.getAttribute("data-testid");
    if (testId) return `[data-testid="${CSS.escape(testId)}"]`;
    const parts = [];
    let node = element;
    while (node && node !== document.body && parts.length < 4) {
      let part = node.tagName.toLowerCase();
      const usefulClasses = [...node.classList]
        .filter((name) => !name.startsWith("pwf-") && name.length < 48 && !/[0-9a-f]{7,}/i.test(name))
        .slice(0, 2);
      if (usefulClasses.length) part += usefulClasses.map((name) => `.${CSS.escape(name)}`).join("");
      const siblings = node.parentElement
        ? [...node.parentElement.children].filter((child) => child.tagName === node.tagName)
        : [];
      if (siblings.length > 1) part += `:nth-of-type(${siblings.indexOf(node) + 1})`;
      parts.unshift(part);
      node = node.parentElement;
    }
    return parts.join(" > ");
  }

  async function hidePickedElement(element) {
    const block = nearestBlock(element);
    if (!isSafeToHide(block)) {
      showToast("That area is too important to hide safely.");
      return;
    }
    const selector = stableSelector(block);
    const labelNode = element.closest("h1,h2,h3,h4,h5,h6,a,button,p,span")
      || block.querySelector("h1,h2,h3,h4,h5,h6,a,button,p,span");
    const text = normalizeText(labelNode?.textContent).slice(0, 120);
    settings.hiddenSelectors = uniqueStrings([...settings.hiddenSelectors, selector], 20, 300);
    if (text) {
      settings.hiddenRules = [
        ...settings.hiddenRules.filter((rule) => rule?.text !== text),
        { text }
      ].slice(-40);
    }
    const saved = await persistSettings({
      hiddenSelectors: settings.hiddenSelectors,
      hiddenRules: settings.hiddenRules
    });
    if (!saved) return;
    block.dataset.pwfHidden = "true";
    showToast("Hidden by default. Use Reset in the extension menu to restore it.");
  }

  function stopPicker() {
    pickerActive = false;
    root.classList.remove("pwf-picking");
    hoveredElement?.classList.remove("pwf-picker-hover");
    hoveredElement = null;
  }

  function startPicker() {
    if (!settings.enabled) {
      showToast("Turn on Focus mode before hiding elements.");
      return false;
    }
    pickerActive = true;
    root.classList.add("pwf-picking");
    showToast("Click a distraction to hide it by default. Press Esc to cancel.");
    return true;
  }

  function sortableItems(container) {
    return [...container.children].filter((node) => node instanceof HTMLElement && node.dataset.pwfSortKey);
  }

  function saveOrder(container) {
    const scope = container.dataset.pwfSortScope;
    const order = sortableItems(container).map((node) => node.dataset.pwfSortKey);
    const key = scope === "sections" ? "sectionOrder" : "batchOrder";
    settings[key] = order;
    void persistSettings({ [key]: order });
  }

  function readableKey(key) {
    return key
      .replace(/^(section|batch)-/, "")
      .replace(/-/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  function getDetectedLayout() {
    const scopes = {};
    for (const scope of ["sections", "batch"]) {
      const container = document.querySelector(`[data-pwf-sort-scope="${scope}"]`);
      scopes[scope] = container
        ? sortableItems(container).map((node) => {
            const heading = scope === "sections"
              ? node.querySelector("h1,h2,h3,h4,[role='heading']")
              : null;
            return {
              key: node.dataset.pwfSortKey,
              label: normalizeText(heading?.textContent) || readableKey(node.dataset.pwfSortKey)
            };
          })
        : [];
    }
    return scopes;
  }

  document.addEventListener("mousemove", (event) => {
    if (!pickerActive) return;
    hoveredElement?.classList.remove("pwf-picker-hover");
    hoveredElement = event.target instanceof Element ? event.target : null;
    hoveredElement?.classList.add("pwf-picker-hover");
  }, true);

  document.addEventListener("click", (event) => {
    const handle = event.target instanceof Element ? event.target.closest(".pwf-drag-handle") : null;
    if (handle) {
      event.preventDefault();
      event.stopPropagation();
    }
    if (!pickerActive) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const target = event.target instanceof Element ? event.target : null;
    stopPicker();
    if (target) void hidePickedElement(target);
  }, true);

  document.addEventListener("dragstart", (event) => {
    const handle = event.target instanceof Element ? event.target.closest(".pwf-drag-handle") : null;
    if (!handle || !layoutEditing) return;
    const scope = handle.dataset.pwfScope;
    draggedItem = handle.closest(`[data-pwf-sort-scope-item="${scope}"]`);
    if (!draggedItem) return;
    draggedItem.classList.add("pwf-dragging");
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", draggedItem.dataset.pwfSortKey || "");
    }
  }, true);

  document.addEventListener("dragover", (event) => {
    if (!draggedItem) return;
    const container = draggedItem.parentElement;
    const target = event.target instanceof Element ? event.target.closest("[data-pwf-sort-key]") : null;
    if (!target || target === draggedItem || target.parentElement !== container) return;
    event.preventDefault();
    const rect = target.getBoundingClientRect();
    const sameGridRow = Math.abs(event.clientY - (rect.top + rect.height / 2)) < rect.height * 0.45;
    const before = container.dataset.pwfSortScope === "sections" || !sameGridRow
      ? event.clientY < rect.top + rect.height / 2
      : event.clientX < rect.left + rect.width / 2;
    container.insertBefore(draggedItem, before ? target : target.nextSibling);
  }, true);

  document.addEventListener("drop", (event) => {
    if (!draggedItem) return;
    event.preventDefault();
    saveOrder(draggedItem.parentElement);
  }, true);

  document.addEventListener("dragend", () => {
    draggedItem?.classList.remove("pwf-dragging");
    draggedItem = null;
    queueScan();
  }, true);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && pickerActive) stopPicker();
    if (event.altKey && event.shiftKey && event.key.toLowerCase() === "x") {
      event.preventDefault();
      pickerActive ? stopPicker() : startPicker();
      return;
    }
    const handle = event.target instanceof Element ? event.target.closest(".pwf-drag-handle") : null;
    if (!handle || !event.altKey || !["ArrowUp", "ArrowDown"].includes(event.key)) return;
    event.preventDefault();
    const item = handle.closest("[data-pwf-sort-key]");
    const container = item?.parentElement;
    if (!item || !container) return;
    const sibling = event.key === "ArrowUp" ? item.previousElementSibling : item.nextElementSibling;
    if (!sibling?.dataset.pwfSortKey) return;
    if (event.key === "ArrowUp") container.insertBefore(item, sibling);
    else container.insertBefore(sibling, item);
    saveOrder(container);
    handle.focus();
  }, true);

  extensionApi.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type === "PWF_GET_STATE") {
      if (settings.enabled) {
        decoratePanels();
        prepareDashboardSections();
        prepareBatchItems();
      } else {
        removeSortingUI();
      }
      sendResponse({
        ok: true,
        enabled: settings.enabled,
        layoutEditing,
        layout: getDetectedLayout()
      });
    }
    if (message?.type === "PWF_SET_ORDER") {
      const key = message.scope === "sections" ? "sectionOrder" : "batchOrder";
      const order = uniqueStrings(message.order, 40, 100);
      if (!Array.isArray(message.order) || order.length !== message.order.length) {
        sendResponse({ ok: false });
      } else {
        settings[key] = order;
        void persistSettings({ [key]: order });
        queueScan();
        sendResponse({ ok: true });
      }
    }
    if (message?.type === "PWF_TOGGLE_EDIT") {
      if (!settings.enabled) {
        sendResponse({ ok: false, layoutEditing: false });
        return;
      }
      layoutEditing = !layoutEditing;
      root.classList.toggle("pwf-layout-editing", layoutEditing);
      if (layoutEditing) {
        queueScan();
        showToast("Layout editor on. Drag the handles, then finish from the extension.");
      } else {
        removeSortingUI();
        showToast("Layout saved. Editing controls are hidden.");
      }
      sendResponse({ ok: true, layoutEditing });
    }
    if (message?.type === "PWF_START_PICKER") {
      sendResponse({ ok: startPicker() });
    }
    if (message?.type === "PWF_RESET_HIDDEN") {
      settings.hiddenSelectors = [];
      settings.hiddenRules = [];
      document.querySelectorAll("[data-pwf-hidden='true']").forEach((node) => delete node.dataset.pwfHidden);
      void persistSettings({ hiddenSelectors: [], hiddenRules: [] });
      queueScan();
      sendResponse({ ok: true });
    }
    if (message?.type === "PWF_RESET_ORDER") {
      settings.sectionOrder = [];
      settings.batchOrder = [];
      void persistSettings({ sectionOrder: [], batchOrder: [] });
      sendResponse({ ok: true });
      window.setTimeout(() => window.location.reload(), 80);
    }
  });

  extensionApi.storage.onChanged.addListener((changes, area) => {
    if (area !== "sync") return;
    const nextSettings = { ...settings };
    for (const [key, change] of Object.entries(changes)) {
      if (key in DEFAULTS) nextSettings[key] = change.newValue ?? DEFAULTS[key];
    }
    settings = normalizeSettings(nextSettings);
    applySettings();
  });

  async function initialize() {
    try {
      const stored = await extensionApi.storage.sync.get(DEFAULTS);
      settings = normalizeSettings({ ...DEFAULTS, ...stored });
    } catch {
      settings = normalizeSettings(DEFAULTS);
    }
    applySettings();
    const observer = new MutationObserver((records) => {
      if (!settings.enabled) return;
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (!(node instanceof Element)) continue;
          if (node.matches("#pwf-toast, .pwf-drag-handle") || node.closest("#pwf-toast")) continue;
          queueScan();
          return;
        }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  void initialize();
})();
