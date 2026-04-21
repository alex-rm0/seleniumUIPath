import { WebDriver } from "selenium-webdriver";
import { ExtractedElement } from "./types";

export async function extractElements(driver: WebDriver): Promise<ExtractedElement[]> {
  // Diagnostic: verify element presence
  const diag = await driver.executeScript<{ total: number; inputs: number; buttons: number } | null>(
    "return { total: document.querySelectorAll('*').length, inputs: document.querySelectorAll('input').length, buttons: document.querySelectorAll('button').length };"
  );

  if (!diag) {
    console.warn("  [warn] diagnostic returned null — skipping");
    return [];
  }

  console.log(`  [debug] DOM: ${diag.total} total, ${diag.inputs} inputs, ${diag.buttons} buttons`);

  // Extraction — selectors hardcoded in script, JSON string returned for safe transfer
  const raw = await driver.executeScript<string | null>(`
    var results = [];
    var seen = {};
    var sel = "input, button, select, textarea, a[href], [role='button'], [role='link'], [role='tab'], [role='menuitem'], [role='option'], [role='checkbox'], [role='radio'], [role='switch'], [role='combobox'], [role='row']";
    var nodes;
    try { nodes = document.querySelectorAll(sel); } catch(e) { return '[]'; }

    for (var i = 0; i < nodes.length; i++) {
      try {
        var el = nodes[i];
        var key = el.tagName + i;
        if (seen[key]) continue;
        seen[key] = 1;

        var tag = el.tagName.toLowerCase();

        var id   = el.getAttribute('id');
        var type = el.getAttribute('type');
        var role = el.getAttribute('role');
        var al   = el.getAttribute('aria-label');
        var ph   = el.getAttribute('placeholder');
        var tid  = el.getAttribute('data-testid') || el.getAttribute('data-cy');
        var name = el.getAttribute('name');
        var adb  = el.getAttribute('aria-describedby');
        var href = el.getAttribute('href');

        var text = null;
        try { text = el.textContent ? el.textContent.trim().substring(0, 100) : null; } catch(e) {}

        var val = null;
        try { if (el.value !== undefined) val = String(el.value).substring(0, 80); } catch(e) {}

        var css = tag;
        if (id)   css = '[id="' + id + '"]';
        else if (tid)  css = '[data-testid="' + tid + '"]';
        else if (al)   css = tag + '[aria-label="' + al + '"]';
        else if (type) css = tag + '[type="' + type + '"]';
        else if (role) css = tag + '[role="' + role + '"]';

        var xpth = '';
        try {
          if (id) { xpth = '//*[@id="' + id + '"]'; }
          else {
            var parts = [], node = el;
            while (node && node.nodeType === 1) {
              var idx = 0, sib = node.previousSibling;
              while (sib) { if (sib.nodeType === 1 && sib.nodeName === node.nodeName) idx++; sib = sib.previousSibling; }
              var t = node.nodeName.toLowerCase();
              parts.unshift(idx > 0 ? t + '[' + (idx+1) + ']' : t);
              node = node.parentNode;
            }
            xpth = '/' + parts.join('/');
          }
        } catch(e) {}

        var cls = [];
        try { if (el.classList) for (var c = 0; c < el.classList.length; c++) cls.push(el.classList[c]); } catch(e) {}

        results.push({
          tag: tag,
          type: type,
          role: role,
          id: id || null,
          name: name || null,
          ph: ph || null,
          al: al || null,
          adb: adb || null,
          tid: tid || null,
          text: text || null,
          val: val,
          href: href || null,
          cls: cls,
          css: css,
          xp: xpth,
          w: el.offsetWidth || 0,
          h: el.offsetHeight || 0
        });
      } catch(e) {}
    }

    return JSON.stringify(results);
  `);

  if (!raw) {
    console.warn("  [warn] extraction script returned null — check browser console for errors");
    return [];
  }

  let parsed: RawElement[];
  try {
    parsed = JSON.parse(raw) as RawElement[];
  } catch (e) {
    console.warn("  [warn] failed to parse extraction result");
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
