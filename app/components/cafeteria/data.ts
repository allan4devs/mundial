import ColdDrinksArtwork from "./ColdDrinksArtwork";
import FoodArtwork from "./FoodArtwork";
import HotDrinksArtwork from "./HotDrinksArtwork";
import LegalArtwork from "./LegalArtwork";
import MenuArtwork from "./MenuArtwork";
import PurposeArtwork from "./PurposeArtwork";
import SinpeArtwork from "./SinpeArtwork";
import { SINPE_PHONE } from "./constants";
import type { SignDefinition } from "./types";

/** Los siete rótulos de la propuesta, en el orden en que se recorre el local. */
export const SIGNS: SignDefinition[] = [
  {
    id: "menu",
    code: "C-01",
    title: { es: "Menú general", en: "Main menu" },
    description: {
      es: "La pieza de entrada: presenta las tres familias con su precio desde y dirige a los rótulos específicos.",
      en: "The entry piece: shows the three product families with a starting price and points to the detailed signs.",
    },
    placement: {
      es: "Entrada o pared principal de la cafetería.",
      en: "Entrance or main wall of the coffee shop.",
    },
    pending: [
      {
        es: "Reemplazar los precios de ejemplo por los reales.",
        en: "Replace the sample prices with the real ones.",
      },
      {
        es: "Definir medida física y ubicación exacta.",
        en: "Define physical size and exact placement.",
      },
      {
        es: "Fotografía de producto: la foto del cañón es un relleno.",
        en: "Product photography: the canyon shot is a placeholder.",
      },
    ],
    Artwork: MenuArtwork,
  },
  {
    id: "calientes",
    code: "C-02",
    title: { es: "Café, chocolate y agua dulce", en: "Coffee, chocolate and cane drink" },
    description: {
      es: "Pizarra de barra con dos columnas de precio, 8 y 12 onzas, que es como se pide el café en Costa Rica.",
      en: "Counter board with two price columns, 8 and 12 oz, the way coffee is ordered in Costa Rica.",
    },
    placement: {
      es: "Sobre la estación de bebidas calientes.",
      en: "Above the hot drinks station.",
    },
    pending: [
      {
        es: "Confirmar precios reales por tamaño.",
        en: "Confirm the real price for each size.",
      },
      {
        es: "Verificar que los tamaños sean 8 y 12 oz.",
        en: "Verify the cup sizes are 8 and 12 oz.",
      },
      {
        es: "Decidir si se ofrece leche deslactosada o vegetal.",
        en: "Decide whether lactose-free or plant milk is offered.",
      },
    ],
    Artwork: HotDrinksArtwork,
  },
  {
    id: "frias",
    code: "C-03",
    title: { es: "Gaseosas, Powerade y Monster", en: "Sodas, Powerade and Monster" },
    description: {
      es: "Dos columnas de renglones con presentación y precio; nombra las marcas sin reconstruir ni alterar sus logotipos.",
      en: "Two columns of items with size and price; brands are named without reproducing or altering their logos.",
    },
    placement: {
      es: "Cerca de la refrigeradora o punto de entrega.",
      en: "Near the cooler or pickup point.",
    },
    pending: [
      {
        es: "Confirmar precios y presentaciones que de verdad se venden.",
        en: "Confirm the prices and sizes actually stocked.",
      },
      {
        es: "Definir los sabores de fresco natural del día.",
        en: "Define the daily fresh fruit drink flavors.",
      },
    ],
    Artwork: ColdDrinksArtwork,
  },
  {
    id: "comidas",
    code: "C-04",
    title: {
      es: "Empanadas, sándwiches y tortillas",
      en: "Empanadas, sandwiches and tortillas",
    },
    description: {
      es: "Lista con alérgenos declarados renglón por renglón, que es lo que espera el visitante extranjero.",
      en: "A list with allergens declared line by line, which is what foreign visitors expect.",
    },
    placement: {
      es: "Mostrador de alimentos o pared contigua.",
      en: "Food counter or adjacent wall.",
    },
    pending: [
      {
        es: "Confirmar precios, rellenos y horario del gallo pinto.",
        en: "Confirm prices, fillings and gallo pinto hours.",
      },
      {
        es: "Validar la lista de alérgenos con quien cocina.",
        en: "Validate the allergen list with the kitchen.",
      },
      {
        es: "Fotografía de producto real para reemplazar el icono.",
        en: "Real product photography to replace the icon.",
      },
    ],
    Artwork: FoodArtwork,
  },
  {
    id: "sinpe",
    code: "C-05",
    title: { es: "Formas de pago", en: "Payment methods" },
    description: {
      es: `Usa el número ${SINPE_PHONE}, ya configurado para SINPE en el checkout. Agrega efectivo y tarjeta porque el visitante extranjero no tiene SINPE.`,
      en: `Uses ${SINPE_PHONE}, already set up for SINPE at checkout. Cash and card are added because foreign visitors have no SINPE.`,
    },
    placement: {
      es: "Junto a la caja, a distancia cómoda para leer y escanear.",
      en: "Next to the register, close enough to read and scan.",
    },
    pending: [
      {
        es: "Nombre exacto del titular de la cuenta SINPE.",
        en: "Exact name of the SINPE account holder.",
      },
      {
        es: "Generar y probar el QR después de confirmar los datos.",
        en: "Generate and test the QR once the details are confirmed.",
      },
      {
        es: "Confirmar si de verdad se acepta tarjeta y en qué moneda.",
        en: "Confirm whether card is actually accepted, and in which currency.",
      },
    ],
    Artwork: SinpeArtwork,
  },
  {
    id: "proposito",
    code: "C-06",
    title: { es: "Misión y visión", en: "Mission and vision" },
    description: {
      es: "Pieza institucional con dos textos breves propuestos, en español e inglés; todavía no son declaraciones oficiales.",
      en: "Institutional piece with two proposed short texts in Spanish and English; not yet official statements.",
    },
    placement: {
      es: "Pared de permanencia o zona de mesas.",
      en: "Seating area or a wall people linger by.",
    },
    pending: [
      {
        es: "Aprobar o reemplazar la misión propuesta.",
        en: "Approve or replace the proposed mission.",
      },
      {
        es: "Aprobar o reemplazar la visión propuesta.",
        en: "Approve or replace the proposed vision.",
      },
      {
        es: "Revisar la traducción al inglés con alguien nativo.",
        en: "Have a native speaker review the English translation.",
      },
    ],
    Artwork: PurposeArtwork,
  },
  {
    id: "legal",
    code: "C-07",
    title: { es: "Avisos legales", en: "Legal notices" },
    description: {
      es: "Reúne en una lámina los avisos que un servicio de alimentación al público mantiene a la vista en Costa Rica, en vez de seis papeles pegados con cinta.",
      en: "Gathers into one panel the notices a public food service keeps on display in Costa Rica, instead of six taped-up sheets.",
    },
    placement: {
      es: "Zona de caja, a la vista del cliente antes de pagar.",
      en: "Register area, visible to the customer before paying.",
    },
    pending: [
      {
        es: "Número del Permiso Sanitario de Funcionamiento.",
        en: "Health Operating Permit number.",
      },
      {
        es: "Validar la redacción de cada aviso con el Ministerio de Salud.",
        en: "Validate each notice wording with the Ministry of Health.",
      },
      {
        es: "Confirmar que 1322 siga siendo la línea de denuncias de tabaco.",
        en: "Confirm 1322 is still the tobacco complaints line.",
      },
      {
        es: "Decidir si se cobra el 10% de servicio (Código de Trabajo, art. 168).",
        en: "Decide whether the 10% service charge applies (Labor Code, art. 168).",
      },
    ],
    Artwork: LegalArtwork,
  },
];
