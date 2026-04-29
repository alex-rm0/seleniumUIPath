import { WebDriver } from "selenium-webdriver";
import { ExtractedElement } from "./types";

export type ExtractMode = "interactive" | "detailed";

export async function extractElements(
  driver: WebDriver,
  mode: ExtractMode = "interactive"
): Promise<ExtractedElement[]> {
  const diag = await driver.executeScript<{ total: number; inputs: number; buttons: number } | null>(
    "return { total: document.querySelectorAll('*').length, inputs: document.querySelectorAll('input').length, buttons: document.querySelectorAll('button').length };"
  );

  if (!diag) {
    console.warn("  [warn] diagnostic returned null - skipping");
    return [];
  }

  console.log(`  [debug] DOM: ${diag.total} total, ${diag.inputs} inputs, ${diag.buttons} buttons`);

  const selector =
    mode === "detailed"
      ? "body *"
      : "input, button, select, textarea, a[href], [role='button'], [role='link'], [role='tab'], [role='menuitem'], [role='option'], [role='checkbox'], [role='radio'], [role='switch'], [role='combobox'], [role='row']";

  const raw = await driver.executeScript<string | null>(
    `
      var results = [];
      var seen = {};
      var sel = arguments[0];
      var mode = arguments[1];
      var nodes;
      try { nodes = document.querySelectorAll(sel); } catch(e) { return '[]'; }

      function normalizeText(value) {
        if (!value) return null;
        var normalized = String(value).replace(/\\s+/g, " ").trim();
        return normalized ? normalized.substring(0, 240) : null;
      }

      function isVisible(el) {
        if (!el || !el.getBoundingClientRect) return false;
        var style = window.getComputedStyle(el);
        var rect = el.getBoundingClientRect();
        return style.visibility !== "hidden" &&
          style.display !== "none" &&
          rect.width > 0 &&
          rect.height > 0;
      }

      function getNearestSection(el) {
        var current = el;
        while (current) {
          if (current.querySelector) {
            var heading = current.querySelector("h1, h2, h3, h4, h5, h6, legend, [role='heading'], .MuiAlertTitle-root, .tabLabelText");
            var headingText = normalizeText(heading && heading.textContent);
            if (headingText) return headingText;
          }
          current = current.parentElement;
        }
        return null;
      }

      function getParentText(el) {
        var parent = el.parentElement;
        var depth = 0;
        while (parent && depth < 3) {
          var text = normalizeText(parent.textContent);
          if (text && text !== normalizeText(el.textContent)) return text;
          parent = parent.parentElement;
          depth++;
        }
        return null;
      }

      function buildAbsoluteXPath(el) {
        var parts = [];
        var node = el;
        while (node && node.nodeType === 1) {
          var idx = 1;
          var sib = node.previousElementSibling;
          while (sib) {
            if (sib.nodeName === node.nodeName) idx++;
            sib = sib.previousElementSibling;
          }
          parts.unshift(node.nodeName.toLowerCase() + "[" + idx + "]");
          node = node.parentElement;
        }
        return "/" + parts.join("/");
      }

      for (var i = 0; i < nodes.length; i++) {
        try {
          var el = nodes[i];
          if (!isVisible(el)) continue;

          var tag = el.tagName.toLowerCase();
          var id = el.getAttribute("id");
          var type = el.getAttribute("type");
          var role = el.getAttribute("role");
          var ariaLabel = el.getAttribute("aria-label");
          var placeholder = el.getAttribute("placeholder");
          var testId = el.getAttribute("data-testid") || el.getAttribute("data-cy");
          var name = el.getAttribute("name");
          var describedBy = el.getAttribute("aria-describedby");
          var href = el.getAttribute("href");
          var title = el.getAttribute("title");
          var dataSection = el.getAttribute("data-pc-section");
          var dataName = el.getAttribute("data-pc-name");
          var isDynId = id && /^:[a-zA-Z0-9]+:$/.test(id);

          var text = normalizeText(el.textContent);
          var value = null;
          try {
            if (el.value !== undefined && el.value !== "") value = String(el.value).substring(0, 120);
          } catch(e) {}

          var labelText = null;
          try {
            if (id) {
              var explicit = document.querySelector('label[for="' + id + '"]');
              labelText = normalizeText(explicit && explicit.textContent);
            }
            if (!labelText) {
              var labelledBy = el.getAttribute("aria-labelledby");
              if (labelledBy) {
                var labelledEl = document.getElementById(labelledBy);
                labelText = normalizeText(labelledEl && labelledEl.textContent);
              }
            }
            if (!labelText) {
              var parent = el.parentElement;
              var depth = 0;
              while (parent && depth < 5) {
                if (parent.tagName === "LABEL") {
                  labelText = normalizeText(parent.textContent);
                  break;
                }
                var localLabel = parent.querySelector("label, legend, .MuiInputLabel-root, .MuiFormLabel-root");
                labelText = normalizeText(localLabel && localLabel.textContent);
                if (labelText) break;
                parent = parent.parentElement;
                depth++;
              }
            }
          } catch(e) {}

          var childIconClass = null;
          var childIconTestId = null;
          try {
            var icon = el.querySelector("i[class*='pi-'], svg[data-testid]");
            if (icon) {
              childIconClass = icon.getAttribute("class");
              childIconTestId = icon.getAttribute("data-testid");
            }
          } catch(e) {}

          var stableClasses = [];
          var allClasses = [];
          try {
            if (el.classList) {
              for (var c = 0; c < el.classList.length; c++) {
                var cn = el.classList[c];
                allClasses.push(cn);
                if (
                  cn.indexOf("css-") !== 0 &&
                  cn.indexOf("MuiBox") !== 0 &&
                  cn.indexOf("MuiGrid") !== 0
                ) {
                  stableClasses.push(cn);
                }
              }
            }
          } catch(e) {}

          var rect = el.getBoundingClientRect();
          var css = tag;
          if (id && !isDynId) css = '[id="' + id + '"]';
          else if (testId) css = '[data-testid="' + testId + '"]';
          else if (name) css = tag + '[name="' + name + '"]';
          else if (ariaLabel) css = tag + '[aria-label="' + ariaLabel + '"]';
          else if (placeholder) css = tag + '[placeholder="' + placeholder + '"]';
          else if (type) css = tag + '[type="' + type + '"]';
          else if (stableClasses.length > 0) css = tag + "." + stableClasses.slice(0, 4).join(".");
          else if (role) css = tag + '[role="' + role + '"]';

          var xpath = "";
          if (id && !isDynId) xpath = '//*[@id="' + id + '"]';
          else if (testId) xpath = '//*[@data-testid="' + testId + '"]';
          else if (name) xpath = '//' + tag + '[@name="' + name + '"]';
          else if (ariaLabel) xpath = '//' + tag + '[@aria-label="' + ariaLabel + '"]';
          else if (labelText && (tag === "input" || tag === "textarea" || tag === "select")) {
            xpath = '//' + tag + '[ancestor::*[.//*[normalize-space()="' + labelText.replace(/"/g, "'") + '"]]]';
          } else if (text && tag !== "input" && tag !== "textarea") {
            xpath = '//' + tag + '[normalize-space()="' + text.replace(/"/g, "'") + '"]';
          } else {
            xpath = buildAbsoluteXPath(el);
          }

          var attrs = {};
          var attrNames = [
            "id",
            "name",
            "type",
            "role",
            "title",
            "placeholder",
            "aria-label",
            "aria-describedby",
            "aria-labelledby",
            "aria-controls",
            "aria-selected",
            "aria-expanded",
            "aria-checked",
            "data-testid",
            "data-cy",
            "data-pc-name",
            "data-pc-section",
            "href"
          ];
          for (var a = 0; a < attrNames.length; a++) {
            attrs[attrNames[a]] = el.getAttribute(attrNames[a]);
          }

          var nearestSection = getNearestSection(el);
          var parentText = getParentText(el);
          var visible = true;
          var interactable =
            tag === "input" ||
            tag === "button" ||
            tag === "select" ||
            tag === "textarea" ||
            !!href ||
            !!role ||
            !!type ||
            !!ariaLabel;

          var identityScore = 0;
          if (labelText) identityScore++;
          if (ariaLabel) identityScore++;
          if (placeholder) identityScore++;
          if (testId) identityScore++;
          if (name) identityScore++;
          if (text) identityScore++;
          if (value) identityScore++;
          if (href) identityScore++;
          if (childIconClass || childIconTestId) identityScore++;
          if (stableClasses.length > 0) identityScore++;
          if (dataSection || dataName) identityScore++;

          if (mode !== "detailed" && identityScore === 0) continue;
          if (mode === "detailed" && identityScore === 0 && !nearestSection && !parentText) continue;

          var dedupeKey = [
            tag,
            id || "",
            name || "",
            ariaLabel || "",
            placeholder || "",
            testId || "",
            text || "",
            value || "",
            Math.round(rect.x),
            Math.round(rect.y)
          ].join("|");
          if (seen[dedupeKey]) continue;
          seen[dedupeKey] = 1;

          results.push({
            tag: tag,
            type: type || null,
            role: role || null,
            id: id && !isDynId ? id : null,
            name: name || null,
            lbl: labelText || null,
            ph: placeholder || null,
            al: ariaLabel || null,
            adb: describedBy || null,
            tid: testId || null,
            text: text || null,
            val: value || null,
            href: href || null,
            iconClass: childIconClass || null,
            iconTestId: childIconTestId || null,
            cls: allClasses,
            css: css,
            xp: xpath,
            visible: visible,
            interactable: interactable,
            nearestSection: nearestSection || null,
            parentText: parentText || null,
            attrs: attrs,
            rect: {
              x: Math.round(rect.x),
              y: Math.round(rect.y),
              width: Math.round(rect.width),
              height: Math.round(rect.height)
            },
            w: el.offsetWidth || 0,
            h: el.offsetHeight || 0
          });
        } catch(e) {}
      }

      return JSON.stringify(results);
    `,
    selector,
    mode
  );

  if (!raw) {
    console.warn("  [warn] extraction script returned null");
    return [];
  }

  let parsed: RawElement[];
  try {
    parsed = JSON.parse(raw) as RawElement[];
  } catch {
    console.warn("  [warn] failed to parse extraction result");
    return [];
  }

  if (!Array.isArray(parsed)) return [];

  return parsed
    .filter((el) => {
      if (el.w <= 0 || el.h <= 0) return false;
      if (mode === "interactive") {
        const hasIconIdentity = el.iconClass || el.iconTestId;
        const hasIdentity =
          el.lbl ||
          el.al ||
          el.ph ||
          el.tid ||
          el.id ||
          hasIconIdentity ||
          (el.text && el.text.trim().length > 0) ||
          el.href ||
          (el.type && el.type !== "button" && el.type !== "submit");
        return Boolean(hasIdentity);
      }
      return true;
    })
    .map((el) => ({
      tag: el.tag,
      type: el.type,
      role: el.role,
      id: el.id,
      name: el.name,
      label: el.lbl,
      placeholder: el.ph,
      ariaLabel: el.al,
      ariaDescribedBy: el.adb,
      testId: el.tid,
      text: el.text,
      value: el.val,
      href: el.href,
      iconClass: el.iconClass,
      iconTestId: el.iconTestId,
      classes: el.cls,
      cssSelector: el.css,
      xpath: el.xp,
      interactable: el.interactable,
      visible: el.visible,
      nearestSection: el.nearestSection,
      parentText: el.parentText,
      attributes: el.attrs,
      rect: el.rect,
    }));
}

interface RawElement {
  tag: string;
  type: string | null;
  role: string | null;
  id: string | null;
  name: string | null;
  lbl: string | null;
  ph: string | null;
  al: string | null;
  adb: string | null;
  tid: string | null;
  text: string | null;
  val: string | null;
  href: string | null;
  iconClass: string | null;
  iconTestId: string | null;
  cls: string[];
  css: string;
  xp: string;
  visible: boolean;
  interactable: boolean;
  nearestSection: string | null;
  parentText: string | null;
  attrs: Record<string, string | null>;
  rect: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  w: number;
  h: number;
}
