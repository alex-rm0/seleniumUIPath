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
  const rawElements = await driver.executeScript<RawElement[]>(
    extractElementsScript,
    INTERACTIVE_SELECTORS
  );

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

const extractElementsScript = `
(function(selectors) {
  function getXPath(el) {
    if (el.id) return '//*[@id="' + el.id + '"]';
    var parts = [];
    while (el && el.nodeType === Node.ELEMENT_NODE) {
      var index = 0;
      var sibling = el.previousSibling;
      while (sibling) {
        if (sibling.nodeType === Node.ELEMENT_NODE && sibling.nodeName === el.nodeName) index++;
        sibling = sibling.previousSibling;
      }
      var tag = el.nodeName.toLowerCase();
      parts.unshift(index > 0 ? tag + '[' + (index + 1) + ']' : tag);
      el = el.parentNode;
    }
    return '/' + parts.join('/');
  }

  function getCssSelector(el) {
    var id = el.getAttribute('id');
    if (id) return '#' + CSS.escape(id);

    var testId = el.getAttribute('data-testid');
    if (testId) return '[data-testid="' + testId + '"]';

    var ariaLabel = el.getAttribute('aria-label');
    if (ariaLabel) return el.tagName.toLowerCase() + '[aria-label="' + ariaLabel + '"]';

    var type = el.getAttribute('type');
    var tag = el.tagName.toLowerCase();
    if (type) return tag + '[type="' + type + '"]';

    var role = el.getAttribute('role');
    if (role) return tag + '[role="' + role + '"]';

    var classes = Array.from(el.classList)
      .filter(function(c) { return !/^(css-|MuiBox|MuiGrid|makeStyles)/.test(c); })
      .slice(0, 3);
    if (classes.length > 0) return tag + '.' + classes.join('.');

    return tag;
  }

  function truncate(str, max) {
    if (!str) return null;
    str = str.trim().replace(/\\s+/g, ' ');
    return str.length > max ? str.substring(0, max) + '...' : str;
  }

  var seen = new Set();
  var results = [];
  var nodes = document.querySelectorAll(selectors);

  nodes.forEach(function(el) {
    try {
      var rect = el.getBoundingClientRect();
      var key = el.tagName + '|' + (el.getAttribute('id') || '') + '|' + (el.getAttribute('aria-label') || '') + '|' + Math.round(rect.top) + '|' + Math.round(rect.left);
      if (seen.has(key)) return;
      seen.add(key);

      var classes = Array.from(el.classList);

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
        value: el.value !== undefined ? truncate(el.value, 80) : null,
        href: el.getAttribute('href') || null,
        classes: classes,
        cssSelector: getCssSelector(el),
        xpath: getXPath(el),
        offsetWidth: el.offsetWidth,
        offsetHeight: el.offsetHeight,
      });
    } catch(e) {}
  });

  return results;
})(arguments[0]);
`;
