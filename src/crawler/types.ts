export interface ExtractedElement {
  tag: string;
  type: string | null;
  role: string | null;
  id: string | null;
  name: string | null;
  label: string | null;
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
  interactable: boolean;
}

export interface CrawledPage {
  name: string;
  url: string;
  extractedAt: string;
  elements: ExtractedElement[];
}

export interface ElementMap {
  generatedAt: string;
  baseUrl: string;
  pages: CrawledPage[];
}
