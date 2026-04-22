import { WebDriver } from "selenium-webdriver";
import { ExtractedElement } from "./types";

export async function extractElements(driver: WebDriver): Promise<ExtractedElement[]> {
  const diag = await driver.executeScript<{ total: number; inputs: number; buttons: number } | null>(
    "return { total: document.querySelectorAll('*').length, inputs: document.querySelectorAll('input').length, buttons: document.querySelectorAll('button').length };"
  );

  if (!diag) {
    console.warn("  [warn] diagnostic returned null — skipping");
    return [];
  }

  console.log(`  [debug] DOM: ${diag.total} total, ${diag.inputs} inputs, ${diag.buttons} buttons`);

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

        var tag  = el.tagName.toLowerCase();
        var id   = el.getAttribute('id');
        var type = el.getAttribute('type');
        var role = el.getAttribute('role');
        var al   = el.getAttribute('aria-label');
        var ph   = el.getAttribute('placeholder');
        var tid  = el.getAttribute('data-testid') || el.getAttribute('data-cy');
        var name = el.getAttribute('name');
        var adb  = el.getAttribute('aria-describedby');
        var href = el.getAttribute('href');
        var childIconClass = null;
        var childIconTestId = null;
        try {
          var icon = el.querySelector('i[class*="pi-"], svg[data-testid]');
          if (icon) {
            childIconClass = icon.getAttribute('class');
            childIconTestId = icon.getAttribute('data-testid');
          }
        } catch(e) {}

        // Detect React-generated dynamic IDs (e.g. ":r0:", ":r1:")
        var isDynId = id && /^:[a-zA-Z0-9]+:$/.test(id);

        // Resolve associated label text
        var labelText = null;
        try {
          if (id) {
            var lel = document.querySelector('label[for="' + id + '"]');
            if (lel) labelText = lel.textContent.trim().substring(0, 100);
          }
          if (!labelText) {
            var alby = el.getAttribute('aria-labelledby');
            if (alby) {
              var lref = document.getElementById(alby);
              if (lref) labelText = lref.textContent.trim().substring(0, 100);
            }
          }
          if (!labelText) {
            var ancestor = el.parentNode;
            var depth = 0;
            while (ancestor && depth < 4) {
              if (ancestor.tagName === 'LABEL') {
                labelText = ancestor.textContent.trim().substring(0, 100);
                break;
              }
              ancestor = ancestor.parentNode;
              depth++;
            }
          }
        } catch(e) {}

        var text = null;
        try { text = el.textContent ? el.textContent.trim().substring(0, 100) : null; } catch(e) {}
        if (text === '') text = null;

        var val = null;
        try { if (el.value !== undefined && el.value !== '') val = String(el.value).substring(0, 80); } catch(e) {}

        var stableCls = [];
        try {
          if (el.classList) {
            for (var c = 0; c < el.classList.length; c++) {
              var cn = el.classList[c];
              if (cn.indexOf('css-') !== 0 && cn.indexOf('MuiBox') !== 0 && cn.indexOf('MuiGrid') !== 0 && cn.indexOf('Mui') !== 0) {
                stableCls.push(cn);
              }
            }
          }
        } catch(e) {}

        var css = tag;
        if (id && !isDynId)  css = '[id="' + id + '"]';
        else if (tid)        css = '[data-testid="' + tid + '"]';
        else if (al)         css = tag + '[aria-label="' + al + '"]';
        else if (ph)         css = tag + '[placeholder="' + ph + '"]';
        else if (type && type !== 'button' && type !== 'submit')
                             css = tag + '[type="' + type + '"]';
        else if (childIconTestId)
                             css = tag + ' [data-testid="' + childIconTestId + '"]';
        else if (childIconClass && childIconClass.indexOf('pi-') >= 0) {
          var iconClasses = childIconClass.split(/\\s+/).filter(function(c) { return c && c.indexOf('pi-') >= 0; });
          css = tag + ' i.' + iconClasses.join('.');
        }
        else if (stableCls.length > 0)
                             css = tag + '.' + stableCls.slice(0, 3).join('.');
        else if (role)       css = tag + '[role="' + role + '"]';

        var xpth = '';
        try {
          if (id && !isDynId) {
            xpth = '//*[@id="' + id + '"]';
          } else if (al) {
            xpth = '//' + tag + '[@aria-label="' + al + '"]';
          } else if (childIconTestId) {
            xpth = '//' + tag + '[.//*[@data-testid="' + childIconTestId + '"]]';
          } else if (childIconClass && childIconClass.indexOf('pi-') >= 0) {
            var piClass = childIconClass.split(/\\s+/).filter(function(c) { return c.indexOf('pi-') >= 0; })[0];
            xpth = '//' + tag + '[.//i[contains(@class,"' + piClass + '")]]';
          } else if (text && tag !== 'input' && tag !== 'select' && tag !== 'textarea') {
            xpth = '//' + tag + '[normalize-space()="' + text.replace(/"/g, "'") + '"]';
          } else {
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
        try { if (el.classList) for (var ci = 0; ci < el.classList.length; ci++) cls.push(el.classList[ci]); } catch(e) {}

        results.push({
          tag: tag, type: type || null, role: role || null,
          id: (id && !isDynId) ? id : null, name: name || null,
          lbl: labelText || null, ph: ph || null, al: al || null,
          adb: adb || null, tid: tid || null, text: text || null,
          val: val || null, href: href || null,
          iconClass: childIconClass || null, iconTestId: childIconTestId || null,
          cls: cls, css: css, xp: xpth,
          w: el.offsetWidth || 0, h: el.offsetHeight || 0
        });
      } catch(e) {}
    }

    return JSON.stringify(results);
  `);

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
      const hasIconIdentity = el.iconClass || el.iconTestId;
      const hasIdentity = el.lbl || el.al || el.ph || el.tid || el.id || hasIconIdentity ||
        (el.text && el.text.trim().length > 0) || el.href ||
        (el.type && el.type !== "button" && el.type !== "submit");
      return hasIdentity;
    })
    .map((el) => ({
      tag: el.tag, type: el.type, role: el.role, id: el.id, name: el.name,
      label: el.lbl, placeholder: el.ph, ariaLabel: el.al, ariaDescribedBy: el.adb,
      testId: el.tid, text: el.text, value: el.val, href: el.href,
      iconClass: el.iconClass, iconTestId: el.iconTestId,
      classes: el.cls, cssSelector: el.css, xpath: el.xp, interactable: true,
    }));
}

interface RawElement {
  tag: string; type: string | null; role: string | null; id: string | null;
  name: string | null; lbl: string | null; ph: string | null; al: string | null;
  adb: string | null; tid: string | null; text: string | null; val: string | null;
  href: string | null; iconClass: string | null; iconTestId: string | null;
  cls: string[]; css: string; xp: string; w: number; h: number;
}
