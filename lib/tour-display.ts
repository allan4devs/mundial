function unsplash(id: string) {
  return `https://images.unsplash.com/photo-${id}?q=82&w=1600&auto=format&fit=crop`;
}

const CIUDAD_ESMERALDA_GALLERY = [
  "/image/IMG_4671.jpg",
  "/image/IMG_6812.jpg",
  "/image/IMG_4257.jpg",
  "/image/IMG_6810.jpg",
];

export const TOUR_GALLERY_BY_SLUG: Record<string, string[]> = {
  "aventuras-cataratas": [
    "/image/IMG_6812.jpg",
    "/image/IMG_4376.jpg",
    "/image/IMG_4523.jpg",
    "/image/IMG_4210.jpg",
    "/image/IMG_2443.jpg",
    "/image/IMG_4389.jpg",
  ],
  "pozas-cristalinas": [
    "/image/IMG_4257.jpg",
    "/image/IMG_4572.JPG",
    "/image/IMG_3506.jpg",
    "/image/IMG_4200.jpg",
    "/image/IMG_4946.JPG",
    "/image/IMG_5686.jpg",
  ],
  "cascadas-secretas-rio-la-vieja": [
    "/image/IMG_4376.jpg",
    "/image/IMG_4389.jpg",
    "/image/IMG_4523.jpg",
    "/image/IMG_4210.jpg",
    "/image/IMG_2443.jpg",
    "/image/IMG_6812.jpg",
  ],
  "cuadra-tours-aventura": [
    unsplash("1675428604186-a165487f857c"),
    unsplash("1653859465778-58b3e964cadc"),
    unsplash("1496521061024-90e1c1221555"),
    unsplash("1515007507252-fc11563a273e"),
    unsplash("1781714098388-cca9b228d5cc"),
    unsplash("1533246696441-571a1d6d1281"),
  ],
  "tour-gastronomico-local": [
    unsplash("1743630458593-286a8ae99625"),
    unsplash("1721314678207-8b7bd43e677b"),
    unsplash("1621295239171-6f95272fdf45"),
    unsplash("1715828202780-915fd3571413"),
    unsplash("1659482633371-c51d3a02bc81"),
    unsplash("1630527910939-275499aa3650"),
  ],
  "lluvia-en-la-naturaleza": [
    unsplash("1630574232726-fc3ea90637b8"),
    unsplash("1500354960738-4c480ed785bc"),
    unsplash("1604956080929-0aaf39237d5c"),
    "/image/IMG_11447.jpg",
    "/image/IMG_503888.jpg",
    "/image/IMG_5592.jpg",
  ],
  "avistamiento-aves": [
    unsplash("1550853024-fae8cd4be47f"),
    unsplash("1550994439-a879aabe0386"),
    unsplash("1682788820676-2d68c93d3346"),
    unsplash("1516467508483-a7213fe4af05"),
    unsplash("1444464666168-49d633b86797"),
    unsplash("1604584494301-cdf0b1e2e8b1"),
  ],
  "avistamiento-aves-norteno": [
    unsplash("1550853024-fae8cd4be47f"),
    unsplash("1550994439-a879aabe0386"),
    unsplash("1682788820676-2d68c93d3346"),
    unsplash("1516467508483-a7213fe4af05"),
    unsplash("1444464666168-49d633b86797"),
    unsplash("1604584494301-cdf0b1e2e8b1"),
  ],
  "tour-nocturno-la-vieja": [
    unsplash("1769122993287-5e75d186b100"),
    unsplash("1605157085246-86c83ffcadd2"),
    unsplash("1631006860710-3f270ead6c51"),
    unsplash("1584468247714-715aea60d3e0"),
    unsplash("1592148923625-ca39edb0ccbb"),
    unsplash("1630574232726-fc3ea90637b8"),
  ],
  "caminata-volcanes-dormidos": [
    unsplash("1664532869454-53ac5942d959"),
    unsplash("1705351978871-2b3316c25e6d"),
    unsplash("1639417443882-8d710bccf8b2"),
    unsplash("1532885399978-d1721c804f3e"),
    unsplash("1769052346677-8ead8d92e64d"),
    unsplash("1580259679654-9276b39fd2d5"),
  ],
  "rapel-canon-del-rio": [
    unsplash("1704386596483-ea345dfa9034"),
    unsplash("1600198718659-01e18c32e13c"),
    unsplash("1621693113354-8b32a9e0ba39"),
    "/image/IMG_6028.jpg",
    "/image/IMG_4952.jpg",
    "/image/IMG_5686.jpg",
  ],
};

export const TOUR_IMAGE_BY_SLUG: Record<string, string> = {
  // Ciudad Esmeralda stays exactly as it was.
  "tour-ciudad-esmeralda": "/image/IMG_4671.jpg",
  "ciudad-esmeralda": "/image/IMG_4671.jpg",
  ...Object.fromEntries(
    Object.entries(TOUR_GALLERY_BY_SLUG).map(([slug, gallery]) => [slug, gallery[0]]),
  ),
};

export const TOUR_GALLERY_FALLBACK = CIUDAD_ESMERALDA_GALLERY;

export function getTourImage(slug?: string | null) {
  return (slug && TOUR_IMAGE_BY_SLUG[slug]) || "/image/IMG_6810.jpg";
}

export function getTourGallery(slug?: string | null) {
  if (slug && TOUR_GALLERY_BY_SLUG[slug]) return TOUR_GALLERY_BY_SLUG[slug];

  const hero = getTourImage(slug);
  return [hero, ...TOUR_GALLERY_FALLBACK.filter((image) => image !== hero)].slice(0, 4);
}
