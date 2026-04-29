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
  iconClass?: string | null;
  iconTestId?: string | null;
  classes: string[];
  cssSelector: string;
  xpath: string;
  interactable: boolean;
  visible?: boolean;
  nearestSection?: string | null;
  parentText?: string | null;
  attributes?: Record<string, string | null>;
  rect?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface CrawledPage {
  key: string;
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
