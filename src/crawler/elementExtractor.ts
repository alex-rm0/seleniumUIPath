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

interface RawElement {
  tag: string;
  type: string | null;
  role: string | null;
  id: string | null;
  name: string | null;
  placeholder: string | null;
  ariaLabel: string | null;
  ariaDescribedBy: string | null;
  testId: string | null;
  text: string | null;
  value: string | null;
  href: string | null;
  classes: string[];
  cssSelector: string;
  xpath: string;
  offsetWidth: number;
  offsetHeight: number;
}

export async function extractElements(driver: WebDriver): Promise<ExtractedElement[]> {
  const rawElements = await driver.executeScript<RawElement[] | null>(
    extractElementsScript,
    INTERACTIVE_SELECTORS
  );

  if (!rawElements || !Array.isArray(rawElements)) return [];

  return rawElements
    .filter((el) => el.offsetWidth > 0 && el.offsetHeight > 0)
    .map((el) => ({
      tag: el.tag,
      type: el.type,
      role: el.role,
      id: el.id,
      name: el.name,
      placeholder: el.placeholder,
      ariaLabel: el.ariaLabel,
      ariaDescribedBy: el.ariaDescribedBy,
      testId: el.testId,
      text: el.text,
      value: el.value,
      href: el.href,
      classes: el.classes,
      cssSelector: el.cssSelector,
      xpath: el.xpath,
      interactable: true,
    }));
}

// NOTE: this string is executed verbatim in the browser via Selenium executeScript.
// Avoid complex regex literals and multi-level backslash escaping inside template literals.
// All regex here use simple patterns safe inside a JS string.
const extractElementsScript = `
(function(selectors) {
  try {

    function getXPath(el) {
      try {
        var id = el.getAttribute ? el.getAttribute('id') : null;
        if (id) return '//*[@id="' + id + '"]';
        var parts = [];
        var node = el;
        while (node && node.nodeType === 1) {
          var index = 0;
          var sib = node.previousSibling;
          while (sib) {
            if (sib.nodeType === 1 && sib.nodeName === node.nodeName) { index++; }
            sib = sib.previousSibling;
          }
          var tag = node.nodeName.toLowerCase();
          parts.unshift(index > 0 ? tag + '[' + (index + 1) + ']' : tag);
          node = node.parentNode;
        }
        return '/' + parts.join('/');
      } catch (e) { return ''; }
    }

    function getCssSelector(el) {
      try {
        var tag = el.tagName.toLowerCase();
        var id = el.getAttribute('id');
        if (id) return '[id="' + id + '"]';

        var testId = el.getAttribute('data-testid');
        if (testId) return '[data-testid="' + testId + '"]';

        var ariaLabel = el.getAttribute('aria-label');
        if (ariaLabel) return tag + '[aria-label="' + ariaLabel + '"]';

        var type = el.getAttribute('type');
        if (type) return tag + '[type="' + type + '"]';

        var role = el.getAttribute('role');
        if (role) return tag + '[role="' + role + '"]';

        var classes = [];
        if (el.classList) {
          for (var ci = 0; ci < el.classList.length && classes.length < 3; ci++) {
            var cls = el.classList[ci];
            if (cls.indexOf('css-') !== 0 && cls.indexOf('MuiBox') !== 0 && cls.indexOf('MuiGrid') !== 0) {
              classes.push(cls);
            }
          }
        }
        if (classes.length > 0) return tag + '.' + classes.join('.');

        return tag;
      } catch (e) {
        return el.tagName ? el.tagName.toLowerCase() : 'unknown';
      }
    }

    function truncate(str, max) {
      if (str === null || str === undefined) return null;
      str = String(str).trim();
      if (!str) return null;
      return str.length > max ? str.substring(0, max) + '...' : str;
    }

    function getClasses(el) {
      var result = [];
      if (el.classList) {
        for (var i = 0; i < el.classList.length; i++) result.push(el.classList[i]);
      }
      return result;
    }

    var seen = new Set();
    var results = [];
    var nodes;

    try {
      nodes = document.querySelectorAll(selectors);
    } catch (e) {
      return [];
    }

    for (var i = 0; i < nodes.length; i++) {
      try {
        var el = nodes[i];
        var rect = el.getBoundingClientRect();
        var key = el.tagName + '|' + (el.getAttribute('id') || '') + '|' + (el.getAttribute('aria-label') || '') + '|' + Math.round(rect.top) + '|' + Math.round(rect.left);
        if (seen.has(key)) { continue; }
        seen.add(key);

        var elValue = null;
        try {
          if (typeof el.value !== 'undefined' && el.value !== null) {
            elValue = truncate(String(el.value), 80);
          }
        } catch (ve) {}

        results.push({
          tag: el.tagName.toLowerCase(),
          type: el.getAttribute('type'),
          role: el.getAttribute('role'),
          id: el.getAttribute('id') || null,
          name: el.getAttribute('name') || null,
          placeholder: el.getAttribute('placeholder') || null,
          ariaLabel: el.getAttribute('aria-label') || null,
          ariaDescribedBy: el.getAttribute('aria-describedby') || null,
          testId: el.getAttribute('data-testid') || null,
          text: truncate(el.innerText || el.textContent, 120),
          value: elValue,
          href: el.getAttribute('href') || null,
          classes: getClasses(el),
          cssSelector: getCssSelector(el),
          xpath: getXPath(el),
          offsetWidth: el.offsetWidth || 0,
          offsetHeight: el.offsetHeight || 0
        });
      } catch (e) {}
    }

    return results;

  } catch (e) {
    return [];
  }
})(arguments[0]);
`;
