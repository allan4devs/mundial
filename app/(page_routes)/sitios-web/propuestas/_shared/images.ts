// Reference imagery (Unsplash). These photo IDs are the ones already used by
// the existing proposals in this repo, so they are known-good. They act as
// placeholders until each business provides real photos.

const u = (id: string, w = 1200) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=85`;

export const BREAD = {
  hero: u("1509440159596-0249088772ff", 2200),
  gallery: [
    { src: u("1517433670267-08bbd4be890f"), alt: "Vitrina de panes artesanales", wide: true },
    { src: u("1555507036-ab1f4038808a"), alt: "Croissants dorados recién horneados" },
    { src: u("1608198093002-ad4e005484ec"), alt: "Pan artesanal sobre la mesa" },
    { src: u("1486427944299-d1955d23e34d"), alt: "Repostería dulce para compartir" },
    { src: u("1568254183919-78a4f43a2877"), alt: "Queque decorado para celebración" },
    { src: u("1556910633-5099dc3971e8"), alt: "Panadero preparando la masa" },
  ],
};

export const LALALAND = {
  hero: u("1495474472287-4d71bcdd2085", 2200),
  gallery: [
    {
      src: u("1509042239860-f550ce710b93"),
      alt: "Taza de cafe de especialidad servida en mesa",
      label: "Cafe de especialidad",
      wide: true,
    },
    {
      src: u("1511920170033-f8396924c348"),
      alt: "Interior acogedor de cafeteria",
      label: "Ambiente para quedarse",
    },
    {
      src: u("1442512595331-e89e73853f31"),
      alt: "Barista preparando cafe espresso",
      label: "Barismo",
    },
    {
      src: u("1486427944299-d1955d23e34d"),
      alt: "Reposteria dulce para acompanar el cafe",
      label: "Postres",
    },
    {
      src: u("1511192336575-5a79af67a629"),
      alt: "Musico de jazz tocando saxofon en vivo",
      label: "Jazz",
    },
    {
      src: u("1517248135467-4c7edcad34c4"),
      alt: "Mesa de restaurante con luz calida",
      label: "Cena y encuentros",
    },
  ],
};

export const FOOD = {
  hero: u("1748659118761-44a30b82478c", 2200),
  gallery: [
    { src: u("1562707774-553917f561df"), alt: "Plato fresco con vegetales", wide: true },
    { src: u("1608176439783-556c7f59f263"), alt: "Coctel con salsa roja" },
    { src: u("1748659118802-a23f097d5398"), alt: "Especial de la casa" },
    { src: u("1761314036709-f6f68a3d7cf1"), alt: "Plato mixto tropical" },
    { src: u("1553826230-8c808a97ff42"), alt: "Ingredientes frescos" },
    { src: u("1595531507616-1f5347ee003b"), alt: "Preparación colorida" },
  ],
};

export const PIZZA = {
  hero: u("1513104890138-7c749659a591", 2200),
  gallery: [
    { src: u("1565299624946-b28f40a0ae38"), alt: "Pizza de pepperoni recién horneada", wide: true },
    { src: u("1604382354936-07c5d9983bd3"), alt: "Pizza margarita con albahaca fresca" },
    { src: u("1594007654729-407eedc4be65"), alt: "Porción de pizza con queso derretido" },
    { src: u("1571407970349-bc81e7e96d47"), alt: "Pizza artesanal servida en la mesa" },
    { src: u("1513104890138-7c749659a591"), alt: "Pizza vista desde arriba" },
    { src: u("1590947132387-155cc02f3212"), alt: "Pizza recién salida del horno" },
  ],
};

export const COFFEE = {
  hero: u("1486427944299-d1955d23e34d", 2200),
  gallery: [
    { src: u("1509440159596-0249088772ff"), alt: "Café y repostería", wide: true },
    { src: u("1555507036-ab1f4038808a"), alt: "Pastelería fresca" },
    { src: u("1517433670267-08bbd4be890f"), alt: "Vitrina de la cafetería" },
    { src: u("1568254183919-78a4f43a2877"), alt: "Postre para acompañar el café" },
  ],
};
