export interface ScrapedOption {
  text: string;
  value: string;
  selected: boolean;
  disabled: boolean;
}

export interface ScrapedField {
  tag: string;
  label: string | null;
  name: string | null;
  id: string | null;
  type: string;
  placeholder: string | null;
  required: boolean;
  value: string | null;
  options?: ScrapedOption[];
  autocomplete: string | null;
  disabled: boolean;
  readOnly: boolean;
  multiple: boolean;
  accept: string | null;
  checked?: boolean;
}

export interface ScrapedForm {
  index: number;
  id: string | null;
  name: string | null;
  action: string | null;
  method: string;
  enctype: string | null;
  fields: ScrapedField[];
}

export interface ScrapedJobPosting {
  title: string;
  company: string | null;
  location: string | null;
  employmentType: string | null;
  datePosted: string | null;
  validThrough: string | null;
  description: string;
  url: string | null;
  salary: string | null;
}

export interface ScrapedLink {
  text: string;
  url: string;
}

export interface ScrapeResult {
  url: string;
  title: string;
  description: string | null;
  formCount: number;
  forms: ScrapedForm[];
  looseFields: ScrapedField[];
  pageText: string;
  jobPostings: ScrapedJobPosting[];
  links: ScrapedLink[];
  warnings: string[];
  scannedAt: string;
}

export interface ScrapeErrorResponse {
  error: string;
  code: string;
}
