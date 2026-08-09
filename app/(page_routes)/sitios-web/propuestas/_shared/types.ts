// Shared config contract for data-driven proposal sites.
// Everything here is JSON-serializable so a server component can build the
// config and hand it to the client <ProposalSite> across the RSC boundary
// (icons are referenced by string name, resolved in the template).

export type Accent = {
  /** main brand color */
  base: string;
  /** text color that sits on top of `base` */
  ink: string;
  /** soft tinted background for light sections */
  soft: string;
  /** dark section background */
  deep: string;
  /** page background */
  page: string;
  /** page body text */
  pageInk: string;
};

export type Offering = {
  icon: string;
  title: string;
  text: string;
  badge?: string;
};

export type GalleryItem = {
  src: string;
  alt: string;
  label?: string;
  wide?: boolean;
};

export type Proof = { value: string; label: string };
export type ScheduleRow = { day: string; hours: string };
export type Testimonial = { name: string; text: string };

export type BusinessConfig = {
  slug: string;
  brandIcon: string;
  brandLogo?: string;
  name: string;
  shortName: string;
  category: string;
  tagline: string;
  city: string;
  address: string;
  phone?: string;
  phoneDisplay?: string;
  whatsapp?: string;
  facebook?: string;
  instagram?: string;
  email?: string;
  mapsQuery: string;
  accent: Accent;
  heroImage?: string;
  intro: string;
  offeringsTitle: string;
  offeringsLead: string;
  offerings: Offering[];
  valueTitle: string;
  valueLead: string;
  sellingPoints: string[];
  proof: Proof[];
  gallery?: GalleryItem[];
  galleryTitle?: string;
  galleryLead?: string;
  testimonials?: Testimonial[];
  schedule?: ScheduleRow[];
  locationTitle: string;
  ctaTitle: string;
  ctaText: string;
};
