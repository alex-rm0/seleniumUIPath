import { WebDriver } from "selenium-webdriver";
import { ExtractedElement } from "./types";

const INTERACTIVE_SELECTORS = [
  "input",
  "button",
  "select",
  "textarea",
  "a[href]",
  "[role='button']",
  "[role='link']",
  "[role='tab']",
  "[role='menuitem']",
  "[role='option']",
  "[role='checkbox']",
  "[role='radio']",
  "[role='switch']",
  "[role='combobox']",
  "[role='textbox']",
  "[role='searchbox']",
  "[role='spinbutton']",
  "[role='slider']",
  "[role='menu']",
  "[role='row']",
].join(", ");

export async function extractElements(driver: WebDriver): Promise<ExtractedElement[]> {
  // Diagnostic: verify basic script execution and element presence
  const diagnostics = await driver.executeScript<{ total: number; inputs: number; buttons: number } | null>(
    "return { total: document.querySelectorAll('*').length, inputs: document.querySelectorAll('input').length, buttons: document.querySelectorAll('button').length };"
  );

  if (!diagnostics) {
    console.warn("  [warn] diagnostic script returned null — skipping page");
    return [];
  }

  console.log(`  [debug] DOM elements: ${diagnostics.total} total, ${diagnostics.inputs} inputs, ${diagnostics.buttons} buttons`);

  if (diagnostics.inputs === 0 && diagnostics.buttons === 0) {
    console.warn("  [warn] no inputs or buttons found on page — possible timing issue");
    return [];
  }

  // Main extraction — returns primitives only (strings, numbers, null) for safe serialization
  const raw = await driver.executeScript<string | null>(extractElementsScript, INTERACTIVE_SELECTORS);

  if (!raw) {
    console.warn("  [warn] extraction script returned null");
    return [];
  }

  let parsed: RawElement[];
  try {
    parsed = JSON.parse(raw) as RawElement[];
  } catch (e) {
    console.warn("  [warn] failed to parse extraction result:", e);
    return [];
  }

  if (!Array.isArray(parsed)) return [];

  return parsed
    .filter((el) => el.w > 0 && el.h > 0)
    .map((el) => ({
      tag: el.tag,
      type: el.type,
      role: el.role,
      id: el.id,
      name: el.name,
      placeholder: el.ph,
      ariaLabel: el.al,
      ariaDescribedBy: el.adb,
      testId: el.tid,
      text: el.text,
      value: el.val,
      href: el.href,
      classes: el.cls,
      cssSelector: el.css,
      xpath: el.xp,
      interactable: true,
    }));
}

interface RawElement {
  tag: string;
  type: string | null;
  role: string | null;
  id: string | null;
  name: string | null;
  ph: string | null;
  al: string | null;
  adb: string | null;
  tid: string | null;
  text: string | null;
  val: string | null;
  href: string | null;
  cls: string[];
  css: string;
  xp: string;
  w: number;
  h: number;
}

// The script is serialized to JSON and returned as a string to avoid
// Selenium serialization quirks with complex nested objects.
const extractElementsScript = `
(function(sel) {
  try {
    function xp(el) {
      try {
        var id = el.getAttribute('id');
        if (id) return '//*[@id="' + id + '"]';
        var parts = [], node = el;
        while (node && node.nodeType === 1) {
          var idx = 0, sib = node.previousSibling;
          while (sib) { if (sib.nodeType === 1 && sib.nodeName === node.nodeName) idx++; sib = sib.previousSibling; }
          var t = node.nodeName.toLowerCase();
          parts.unshift(idx > 0 ? t + '[' + (idx + 1) + ']' : t);
          node = node.parentNode;
        }
        return '/' + parts.join('/');
      } catch(e) { return ''; }
    }

    function css(el) {
      try {
        var tag = el.tagName.toLowerCase();
        var id = el.getAttribute('id');
        if (id) return '[id="' + id + '"]';
        var tid = el.getAttribute('data-testid');
        if (tid) return '[data-testid="' + tid + '"]';
        var cy = el.getAttribute('data-cy');
        if (cy) return '[data-cy="' + cy + '"]';
        var al = el.getAttribute('aria-label');
        if (al) return tag + '[aria-label="' + al + '"]';
        var tp = el.getAttribute('type');
        if (tp) return tag + '[type="' + tp + '"]';
        var role = el.getAttribute('role');
        if (role) return tag + '[role="' + role + '"]';
        return tag;
      } catch(e) { return 'unknown'; }
    }

    function trunc(s, max) {
      if (s === null || s === undefined) return null;
      s = String(s).trim();
      if (!s) return null;
      return s.length > max ? s.substring(0, max) + '...' : s;
    }

    function cls(el) {
      var r = [];
      if (el.classList) for (var i = 0; i < el.classList.length; i++) r.push(el.classList[i]);
      return r;
    }

    var nodes = document.querySelectorAll(sel);
    var seen = {};
    var results = [];

    for (var i = 0; i < nodes.length; i++) {
      try {
        var el = nodes[i];
        var key = el.tagName + (el.getAttribute('id') || '') + (el.getAttribute('aria-label') || '') + i;
        if (seen[key]) continue;
        seen[key] = 1;

        var val = null;
        try { val = (el.value !== undefined) ? trunc(String(el.value), 80) : null; } catch(e) {}

        results.push({
          tag: el.tagName.toLowerCase(),
          type: el.getAttribute('type'),
          role: el.getAttribute('role'),
          id: el.getAttribute('id') || null,
          name: el.getAttribute('name') || null,
          ph: el.getAttribute('placeholder') || null,
          al: el.getAttribute('aria-label') || null,
          adb: el.getAttribute('aria-describedby') || null,
          tid: el.getAttribute('data-testid') || el.getAttribute('data-cy') || null,
          text: trunc(el.innerText || el.textContent, 120),
          val: val,
          href: el.getAttribute('href') || null,
          cls: cls(el),
          css: css(el),
          xp: xp(el),
          w: el.offsetWidth || 0,
          h: el.offsetHeight || 0
        });
      } catch(e) {}
    }

    return JSON.stringify(results);
  } catch(e) {
    return JSON.stringify([]);
  }
})(arguments[0]);
`;
