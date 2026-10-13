import type { Lang } from "@/lib/LanguageContext";

export const principalContent = {
  es: {
    header: {
      exploreGroup: "Explorar",
      forecast: "Pronóstico",
      dashboard: "Dashboard",
      logout: "Cerrar sesión",
      userMenuAria: "Menú de usuario",
      toggleMenuAria: "Abrir o cerrar menú",
    },
    hero: {
      errorLoadingImages: "No se pudieron cargar las fotos",
      loadingImages: "Cargando fotos...",
      previousImageAria: "Foto anterior",
      nextImageAria: "Foto siguiente",
      goToSlideAria: "Ir a la foto {slide}",
      scrollToToursAria: "Ir a los tours",
      scrollToMainAria: "Ir al contenido principal",
      locationBadge: "San Carlos · Costa Rica",
      title: "El cañón te está esperando. ¿Entramos?",
      subtitle: "Tours con guías de la zona · Grupos chicos · Desde $30",
      socialProof: "4.9 · +500 personas que ya se metieron al río · Guías locales",
      trustItems: [
        "Cancelás gratis hasta 48 h antes",
        "Pago seguro",
        "Confirmación al toque",
      ] as readonly string[],
    },
    tours: {
      eyebrow: "¿Qué te late más?",
      title: "Nuestras experiencias",
      subtitle:
        "Del cañón con agua hasta la caminata tranquila en el bosque: acá hay para el que quiere adrenalina y para el que quiere aire fresco sin apuros.",
    },
    conversion: {
      title: "Preguntas frecuentes",
      subtitle: "Lo que conviene saber antes de reservar su tour.",
      faqs: [
        {
          question: "¿Puedo cambiar la fecha después de reservar?",
          answer:
            "Sí. Avísenos con al menos 48 horas de antelación y le ayudamos a reprogramar según la disponibilidad, sin cargos adicionales.",
        },
        {
          question: "¿Qué tour conviene si soy principiante?",
          answer:
            "Si prefiere algo más tranquilo, **Cascadas Secretas**, **Lluvia en la Naturaleza** o el **Tour Gastronómico** son un buen comienzo: intensidad baja o media, sin experiencia previa. Ciudad Esmeralda exige mejor condición física.",
        },
        {
          question: "¿Qué pasa si llueve el día del tour?",
          answer:
            "Con lluvia ligera casi siempre salimos: en la zona es parte del paisaje. Si el tiempo empeora de verdad (tormenta eléctrica o río crecido), le escribimos con antelación para cambiar la fecha o pasar a otra actividad segura. La seguridad es lo primero.",
        },
        {
          question: "¿Qué debo llevar al tour?",
          answer:
            "En general: ropa cómoda, calzado que se pueda mojar, traje de baño, toalla, repelente, bloqueador y una muda seca. Al confirmar le enviamos la lista exacta según el tour.",
        },
        {
          question: "¿Hay edad mínima?",
          answer:
            "La mayoría de los tours admiten desde los 10–12 años acompañados de un adulto. Los más exigentes (rápel y cuadraciclos) piden 14 y 16 años respectivamente. Si tiene dudas con niños o adultos mayores, escríbanos y le orientamos con claridad.",
        },
        {
          question: "¿El transporte está incluido?",
          answer:
            "No está incluido en el precio del tour. Si necesita traslado desde el hotel, lo coordinamos aparte con un costo adicional.",
        },
        {
          question: "¿Cómo funciona la cancelación?",
          answer:
            "La cancelación es gratuita hasta 48 horas antes. Con menos de 48 horas no hay reembolso. Si el clima o el río impiden la salida, le reprogramamos u ofrecemos una alternativa segura.",
        },
      ],
    },
    booking: {
      loading: "Preparando tu reserva...",
      eyebrow: "Nueva reserva",
      title: "Tu próximo tour arranca acá",
      description:
        "Elegí fecha, dejá tus datos y si te trabás en algo, usá el botón de AI o escribinos por WhatsApp.",
      steps: {
        date: "Paso 1 · Fecha",
        details: "Paso 2 · Detalles",
      },
    },
    errors: {
      criticalFallback: "Ocurrió un problema al cargar la página. Actualícela o escríbanos por WhatsApp.",
    },
  },
  en: {
    header: {
      exploreGroup: "Explore",
      forecast: "Forecast",
      dashboard: "Dashboard",
      logout: "Log Out",
      userMenuAria: "User menu",
      toggleMenuAria: "Toggle menu",
    },
    hero: {
      errorLoadingImages: "Couldn't load the photos",
      loadingImages: "Loading photos...",
      previousImageAria: "Previous image",
      nextImageAria: "Next image",
      goToSlideAria: "Go to slide {slide}",
      scrollToToursAria: "Scroll to tours",
      scrollToMainAria: "Scroll to main content",
      locationBadge: "San Carlos · Costa Rica",
      title: "The canyon is waiting. Ready to go in?",
      subtitle: "Local guides · Small groups · From $30",
      socialProof: "4.9 · 500+ people who already got wet · Local guides",
      trustItems: [
        "Free cancel up to 48h",
        "Secure payment",
        "Quick confirmation",
      ] as readonly string[],
    },
    tours: {
      eyebrow: "What sounds good?",
      title: "Our experiences",
      subtitle:
        "From a full canyon day to a calm forest walk — something for the adrenaline crowd and for those who just want fresh air without the rush.",
    },
    conversion: {
      title: "Frequently asked questions",
      subtitle: "What's worth knowing before you book your tour.",
      faqs: [
        {
          question: "Can I change my date after booking?",
          answer:
            "Yes. Give us at least 48 hours' notice and we'll help you rebook based on availability, at no extra charge.",
        },
        {
          question: "Which tour is best for beginners?",
          answer:
            "If you want something gentler, **Secret Waterfalls**, **Rain in Nature**, or the **Food Tour** are solid starts: lower or medium intensity, no prior experience needed. Ciudad Esmeralda calls for better fitness.",
        },
        {
          question: "What if it rains on the day of the tour?",
          answer:
            "Light rain is normal here and we usually still head out. If a real storm hits or the river rises, we'll message you ahead of time with a new date or a safer option. Safety comes first, always.",
        },
        {
          question: "What should I bring to the tour?",
          answer:
            "In general: comfortable clothes, footwear that can get wet, swimsuit, towel, repellent, sunscreen, and a dry change. We'll send the exact list for your tour when you confirm.",
        },
        {
          question: "Is there a minimum age?",
          answer:
            "Most tours welcome ages 10–12 and up with an adult. The more demanding ones (canyon rappel, ATVs) require 14 and 16. Not sure about children or older guests? Message us and we'll advise you clearly.",
        },
        {
          question: "Is transport included?",
          answer:
            "It's not included in the tour price. If you need a hotel transfer, we can arrange it separately for an additional fee.",
        },
        {
          question: "How does cancellation work?",
          answer:
            "Free cancellation up to 48 hours before. Inside 48 hours, there's no refund. If weather or the river make the outing unsafe, we rebook you or offer a safer alternative.",
        },
      ],
    },
    booking: {
      loading: "Getting your booking ready...",
      eyebrow: "New booking",
      title: "Your next tour starts here",
      description:
        "Pick a date, add your details, and if you get stuck, use the AI button or WhatsApp us.",
      steps: {
        date: "Step 1 · Date",
        details: "Step 2 · Details",
      },
    },
    errors: {
      criticalFallback: "Something went wrong loading the page. Refresh it or message us on WhatsApp.",
    },
  },
} as const satisfies Record<Lang, object>;

export type PrincipalContent = (typeof principalContent)[Lang];
