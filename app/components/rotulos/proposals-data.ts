import type { Proposal, Rule } from "./types";

/** Los seis formatos que se le pueden proponer al cliente, en orden de peso. */
export const PROPOSALS: Proposal[] = [
  {
    id: "P-A",
    variant: "turistico",
    name: {
      es: "Café turístico con pictograma",
      en: "Brown tourist sign with pictogram",
    },
    reference: {
      es: "MUTCD (EE.UU.), TSRGD (Reino Unido), Unterrichtungstafel (Alemania), SECTUR (México)",
      en: "MUTCD (US), TSRGD (UK), Unterrichtungstafel (Germany), SECTUR (Mexico)",
    },
    slots: "R-02 a R-07",
    why: {
      es: "El café es el color que el mundo entero reserva para atractivo turístico y recreativo. El conductor lo decodifica antes de leer una sola letra: sabe que ahí hay algo que visitar, no un negocio cualquiera. Pictograma + destino + distancia: tres unidades, ni una más.",
      en: "Brown is the color the whole world reserves for tourist and recreational attractions. Drivers decode it before reading a single letter. Pictogram, destination, distance: three units, no more.",
    },
    specs: [
      {
        es: "Pictograma silueta, nunca foto: a 60 km/h una foto es una mancha.",
        en: "Silhouette pictogram, never a photo: at 60 km/h a photo is just a smudge.",
      },
      {
        es: "Máximo 3 renglones. El nombre del cañón manda, la marca va chiquita abajo.",
        en: "Three lines max. The canyon name leads, the brand sits small underneath.",
      },
      {
        es: "Letra de 18–20 cm para leerse cómodo a 70–80 m.",
        en: "18–20 cm cap height to read comfortably at 70–80 m.",
      },
    ],
    recommended: true,
  },
  {
    id: "P-B",
    variant: "mopt",
    name: {
      es: "Formato vial modular con franja de distancia",
      en: "Modular road-style sign with distance strip",
    },
    reference: {
      es: "Referencia inspirada en señalización vial modular, con un bloque de marca separado",
      en: "Reference inspired by modular road signage, with a separate brand block",
    },
    slots: "R-02 · R-03",
    why: {
      es: "Toma de la foto la franja azul con flecha y distancia, el bloque amarillo de marca y el panel verde de destino. Su lenguaje vial puede resultar familiar, pero esta propuesta visual no representa aprobación institucional ni sustituye especificaciones o permisos aplicables.",
      en: "It takes the blue arrow-and-distance strip, yellow brand block and green destination panel from the photo. Its road-sign language may feel familiar, but this visual proposal does not represent institutional approval or replace applicable specifications or permits.",
    },
    specs: [
      {
        es: "Tres módulos separados por 2–3 cm: la división es lo que lo hace legible.",
        en: "Three modules split by 2–3 cm: the division is what makes it readable.",
      },
      {
        es: "Verde destino + azul distancia + amarillo marca. Nada de degradados ni sombras.",
        en: "Green destination, blue distance, yellow brand. No gradients, no shadows.",
      },
      {
        es: "Valide ubicación, diseño y permiso aplicable con MOPT o la municipalidad antes de producir.",
        en: "Validate location, design and applicable permits with MOPT or the municipality before production.",
      },
    ],
    recommended: false,
  },
  {
    id: "P-C",
    variant: "flecha",
    name: {
      es: "Flecha direccional mínima",
      en: "Minimal directional trailblazer",
    },
    reference: {
      es: "Trailblazer del MUTCD, fingerboard de Nueva Zelanda y Australia",
      en: "MUTCD trailblazer, New Zealand and Australia fingerboards",
    },
    slots: "R-04 a R-07 (aproximaciones de 2 km y 1 km)",
    why: {
      es: "Para los anticipos lejanos donde solo hay que sembrar el rumbo. Nombre, distancia y flecha: el conductor registra que el destino existe, cuánto falta y cuál es el sentido final.",
      en: "For distant approach signs that only need to establish the route. Name, distance and arrow: drivers register that the destination exists, how far remains and the final direction.",
    },
    specs: [
      {
        es: "Media lámina alcanza: es la mitad de precio y el doble de legible.",
        en: "A half panel is enough: half the price, twice the legibility.",
      },
      {
        es: "La flecha ocupa un tercio del rótulo, no es un adorno.",
        en: "The arrow takes a third of the sign, it is not decoration.",
      },
      {
        es: "Sin teléfono ni redes: a esa distancia nadie los anota.",
        en: "No phone, no socials: nobody writes them down from that far out.",
      },
    ],
    recommended: true,
  },
  {
    id: "P-D",
    variant: "servicios",
    name: {
      es: "Azul de servicios con placas de marca",
      en: "Blue service sign with logo panels",
    },
    reference: {
      es: "Specific Service (LOGO) signs del MUTCD, paneles azules de servicios en Europa",
      en: "MUTCD Specific Service (LOGO) signs, blue service panels across Europe",
    },
    slots: "Fase interna opcional · fuera de R-01 a R-07",
    why: {
      es: "El azul es el código universal de servicios al conductor: comida, combustible, hospedaje. Para el restaurante y mirador dice más que cualquier frase, porque el que tiene hambre lo busca sin leer. Cada servicio va en su placa blanca con pictograma.",
      en: "Blue is the universal code for driver services: food, fuel, lodging. For the restaurant and lookout it says more than any sentence, because a hungry driver scans for it without reading. Each service gets its own white tile with a pictogram.",
    },
    specs: [
      {
        es: "Placas blancas independientes: se cambian sin rehacer el rótulo entero.",
        en: "Independent white tiles: swap one without remaking the whole sign.",
      },
      {
        es: "Pictogramas viales conocidos (cubiertos, mirador), no íconos de moda.",
        en: "Familiar road pictograms (cutlery, lookout), not trendy icons.",
      },
      {
        es: "Máximo cuatro placas por rótulo.",
        en: "Four tiles per sign, maximum.",
      },
    ],
    recommended: true,
  },
  {
    id: "P-E",
    variant: "portal",
    name: {
      es: "Portal de entrada con foto y QR",
      en: "Gateway sign with photo and QR",
    },
    reference: {
      es: "Gateway signs de parques nacionales (NPS de EE.UU., DOC de Nueva Zelanda)",
      en: "National park gateway signs (US NPS, New Zealand DOC)",
    },
    slots: "R-01 (entrada)",
    why: {
      es: "Aquí sí van la foto, el QR, los teléfonos y las redes: es el único punto donde el carro va lento o parqueado y la gente tiene tiempo de mirar. Todo lo que quitamos de los rótulos de ruta se concentra en este, que es el que remata la venta.",
      en: "This is where the photo, QR, phones and socials belong: the only spot where the car is slow or parked and people have time to look. Everything stripped from the highway signs concentrates here, the one that closes the sale.",
    },
    specs: [
      {
        es: "Es el rótulo que ya está diseñado arriba, con las dos marcas.",
        en: "This is the sign already designed above, carrying both brands.",
      },
      {
        es: "El QR solo tiene sentido con el carro detenido. En ruta es papel botado.",
        en: "The QR only makes sense with the car stopped. On the highway it is wasted print.",
      },
      {
        es: "Buen momento para iluminarlo: es el que se busca de noche.",
        en: "Worth lighting: this is the one people hunt for after dark.",
      },
    ],
    recommended: true,
  },
  {
    id: "P-F",
    variant: "blades",
    name: {
      es: "Paletas de madera para adentro",
      en: "Wooden blade signs for inside",
    },
    reference: {
      es: "Fingerpost británico y señalética de senderos (parques nacionales, Camino de Santiago)",
      en: "British fingerpost and trail signage (national parks, Camino de Santiago)",
    },
    slots: "Fase interna opcional · fuera de R-01 a R-07",
    why: {
      es: "Adentro de la finca el problema ya no es velocidad, es orientación. Una paleta por destino, apiladas en un poste: parqueo, recepción, restaurante, sendero. Madera y crema pegan con el entorno y se leen a pie, que es como se recorre.",
      en: "Inside the property the problem is no longer speed, it is orientation. One blade per destination stacked on a post: parking, reception, restaurant, trail. Wood and cream fit the setting and read on foot, which is how people move there.",
    },
    specs: [
      {
        es: "Se agregan paletas después sin tocar el poste.",
        en: "Add blades later without touching the post.",
      },
      {
        es: "Bilingüe en la misma paleta: español grande, inglés debajo.",
        en: "Bilingual on the same blade: Spanish large, English underneath.",
      },
      {
        es: "Sale más barato que una lámina metálica grande.",
        en: "Cheaper than one large metal panel.",
      },
    ],
    recommended: true,
  },
  {
    id: "P-G",
    variant: "elegante",
    name: {
      es: "Placa elegante minimalista",
      en: "Minimalist elegant plaque",
    },
    reference: {
      es: "Placas de fachada de restaurantes y hoteles boutique (p. ej. Silvestre, San José); señalética de fincas y lodges de autor",
      en: "Facade plaques of boutique restaurants and hotels (e.g. Silvestre, San José); estate and boutique-lodge signage",
    },
    slots: "R-01 (entrada) · versión sobria para fachada, recepción o muro",
    why: {
      es: "Una segunda lectura del portal de entrada para cuando el entorno pide discreción: fondo de madera oscura casi plano, marca centrada, tipografía serif con mucho espaciado y una sola textura de hoja o cañón al 6 % que se intuye y no se mira. Sirve donde un rótulo a todo color se sentiría fuera de lugar.",
      en: "A second take on the gateway sign for settings that call for restraint: near-flat dark-wood background, centered mark, wide-tracked serif type and a single leaf-or-canyon texture at 6% that is felt, not seen. For places where a full-color sign would feel out of place.",
    },
    specs: [
      {
        es: "Dos tonos: madera oscura y champán bronce. Sin amarillo ni turquesa.",
        en: "Two tones: dark wood and champagne bronze. No yellow, no turquoise.",
      },
      {
        es: "Textura de hoja o cañón al 5–7 % de opacidad, siempre por debajo del texto.",
        en: "Leaf or canyon texture at 5–7% opacity, always beneath the text.",
      },
      {
        es: "Placa vertical de 40–50 cm en latón, acrílico oscuro o MDF laminado mate.",
        en: "Vertical plaque 40–50 cm in brass, dark acrylic or matte-laminated MDF.",
      },
    ],
    recommended: false,
  },
];

/** Las cifras duras de señalización que sostienen las propuestas. */
export const RULES: Rule[] = [
  {
    value: "2,5 cm ≈ 10 m",
    text: {
      es: "Regla de altura de letra del FHWA: cada 2,5 cm de altura da unos 10 m de lectura. Para que se lea a 80 m hay que ir en 20 cm.",
      en: "FHWA letter height rule: every 2.5 cm of cap height buys about 10 m of legibility. To read at 80 m you need 20 cm.",
    },
  },
  {
    value: "3 unidades",
    text: {
      es: "Máximo tres unidades de información por rótulo (destino, flecha, distancia). La cuarta ya no se lee, estorba.",
      en: "Three information units per sign, max (destination, arrow, distance). The fourth one is not read, it gets in the way.",
    },
  },
  {
    value: "6 segundos",
    text: {
      es: "A 60 km/h el conductor cubre 100 m en 6 segundos y solo un tercio lo dedica al rótulo. Todo tiene que caber en esos 2 segundos.",
      en: "At 60 km/h a driver covers 100 m in 6 seconds and spends only a third of that on the sign. Everything has to fit in those 2 seconds.",
    },
  },
  {
    value: "Tipo IV",
    text: {
      es: "Lámina retrorreflectiva ASTM D4956 tipo IV o superior. Sin retrorreflectivo el rótulo desaparece de noche, que es cuando más se busca.",
      en: "ASTM D4956 Type IV retroreflective sheeting or better. Without it the sign vanishes at night, exactly when people look hardest.",
    },
  },
];
