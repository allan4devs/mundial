import type { CSSProperties } from "react";
import Image from "next/image";
import { ARROWS, BUSINESS, PHOTO_FOCUS, PICTOGRAMS } from "./constants";
import BuiltInText from "./layout-editor/BuiltInText";
import EditableSignCanvas from "./layout-editor/EditableSignCanvas";
import MovableGroup from "./layout-editor/MovableGroup";
import QrCode from "./QrCode";
import { diagonalBand, diagonalEdge } from "./helpers";
import { PANEL_SIZE_SPECS } from "./measurements";
import { AmenityRow, GroundShadow, LeafShape, LeafSprig, SignPosts, WaveSeam } from "./SignChrome";
import type { Panel, RotuloKind } from "./types";

type SignPanelProps = {
  panel: Panel;
  kind: Exclude<RotuloKind, "entrada">;
  large?: boolean;
  /** Solo la primera lámina de la página: evita el aviso de LCP. */
  eager?: boolean;
};

const SIGN_THEME: Record<
  Exclude<RotuloKind, "entrada">,
  { background: string; accent: string; eyebrow: string }
> = {
  anticipo: { background: "#5C3B1E", accent: "#F5C518", eyebrow: "Destino turístico" },
  destino: { background: "#0B4EA2", accent: "#F5C518", eyebrow: "Servicios" },
  indicador: { background: "#2E2A25", accent: "#00C4B0", eyebrow: "Orientación interna" },
  distancia: { background: "#2E2A25", accent: "#00C4B0", eyebrow: "La Vieja Adventures" },
};

/**
 * Lámina de carretera con dos zonas claras: la fotografía conserva todo el
 * protagonismo y la información crítica descansa sobre un fondo sólido.
 * El mensaje promocional completo vive en la ficha, no encima de la imagen.
 *
 * La lámina se monta sobre dos postes y proyecta su propia sombra recortada
 * a la silueta redondeada -no la caja rectangular del componente-, y lleva
 * un acento de hoja discreto junto al pictograma y la flecha. La flecha en
 * sí se mantiene limpia a propósito: a 60 km/h no hay tiempo para decorarla.
 */
export default function SignPanel({ panel, kind, large, eager }: SignPanelProps) {
  const Arrow = ARROWS[panel.arrow ?? "right"];
  const Picto = PICTOGRAMS[panel.pictogram];
  const theme = SIGN_THEME[kind];
  const logo = panel.brands[0] === "lva-turquoise" ? "/logo1.jpg" : "/logo2.jpg";
  const hasPhotos = panel.photos.length > 0;
  const brandForward = panel.brandForward === true;
  const showAmenities = kind === "destino" || kind === "indicador";
  /** QR solo donde la gente ya está detenida o caminando: parqueo y orientación interna, no en carretera. */
  const showQr = kind === "destino" || kind === "indicador";
  /** Sin foto, el ícono/título/flecha son todo el diseño: deben llenar la lámina, no flotar en el centro. */
  const boosted = large || !hasPhotos;
  const aspectClass =
    brandForward
      ? hasPhotos
        ? "aspect-[4/5] min-h-[820px] lg:aspect-[2/1] lg:min-h-0 print:aspect-[2/1] print:min-h-0"
        : "aspect-[4/5] min-h-[480px] lg:aspect-[2/1] lg:min-h-0 print:aspect-[2/1] print:min-h-0"
      : panel.size === "grande"
      ? "aspect-[4/5] min-h-[480px] min-[520px]:aspect-[4/3] lg:aspect-[3/2] lg:min-h-0 print:aspect-[3/2] print:min-h-0"
      : panel.size === "mediano"
        ? "aspect-[4/5] min-h-[480px] sm:aspect-[4/3] 2xl:aspect-[2/1] 2xl:min-h-0 print:aspect-[2/1] print:min-h-0"
        : "aspect-[4/5] min-h-[480px] sm:aspect-[4/3] xl:aspect-square xl:min-h-0 print:aspect-square print:min-h-0";
  /**
   * Una lámina "pequeño" no debe ocupar el mismo ancho en pantalla que una
   * "grande": el ancho también es parte de la medida de trabajo.
   */
  const widthScale = PANEL_SIZE_SPECS[panel.size].widthM / PANEL_SIZE_SPECS.grande.widthM;

  return (
    <div data-sign-artwork className="relative flex min-w-0 flex-1 flex-col items-center pb-7 sm:pb-9 xl:pb-12 print:pb-0">
      <div
        className="w-full drop-shadow-[0_26px_30px_rgba(0,0,0,0.5)] sm:max-w-[var(--panel-max-w)] print:w-auto print:max-w-full print:drop-shadow-none"
        style={{ "--panel-max-w": `${Math.round(widthScale * 100)}%` } as CSSProperties}
      >
        <EditableSignCanvas
          panelId={panel.layoutId}
          revision={1}
          label={{ es: panel.title, en: panel.titleEn }}
          data-sign-artboard
          data-panel-size={panel.size}
          className={`relative isolate flex w-full flex-col overflow-hidden rounded-[26px] border-[7px] border-white bg-[#2E2A25] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.06)] [container-type:inline-size] xl:rounded-[34px] xl:border-[10px] print:rounded-none ${aspectClass}`}
        >
          {hasPhotos ? (
            <div className="relative min-h-0 flex-[1.1] bg-zinc-800">
              {panel.photos.length > 2 ? (
                <div className="relative h-full w-full bg-white">
                  {panel.photos.map((photo, index) => (
                    <div
                      key={photo}
                      className="absolute inset-0"
                      style={{ clipPath: diagonalBand(index, panel.photos.length) }}
                    >
                      <Image
                        src={photo}
                        alt=""
                        fill
                        sizes={large ? "(max-width: 1280px) 94vw, 1500px" : "(max-width: 1280px) 94vw, 760px"}
                        priority={eager && index === 0}
                        className="object-cover saturate-[1.04]"
                        style={{ objectPosition: PHOTO_FOCUS[index % PHOTO_FOCUS.length] }}
                      />
                    </div>
                  ))}
                  {panel.photos.slice(0, -1).map((photo, index) => (
                    <div
                      key={`edge-${photo}`}
                      className="pointer-events-none absolute inset-0 bg-white/85 blur-md"
                      style={{ clipPath: diagonalEdge(index, panel.photos.length) }}
                    />
                  ))}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <MovableGroup
                      groupId="photo-logo"
                      label={{ es: "Logo sobre las fotos", en: "Logo over photos" }}
                      className="relative z-10 rounded-2xl border-2 border-white bg-white/95 p-3 shadow-[0_20px_45px_-18px_rgba(0,0,0,0.55)] sm:p-4"
                    >
                      <Image
                        src={logo}
                        alt="La Vieja Adventures"
                        width={large ? 120 : 96}
                        height={large ? 120 : 96}
                        className="h-auto w-20 object-contain sm:w-24 lg:w-28 xl:w-32"
                      />
                    </MovableGroup>
                  </div>
                </div>
              ) : (
                <div
                  className={`grid h-full gap-1 bg-white ${
                    panel.photos.length > 1
                      ? "grid-cols-[minmax(0,1.7fr)_minmax(90px,0.7fr)]"
                      : "grid-cols-1"
                  }`}
                >
                  {panel.photos.slice(0, 2).map((photo, index) => (
                    <div key={photo} className="relative min-h-0 overflow-hidden bg-zinc-800">
                      <Image
                        src={photo}
                        alt=""
                        fill
                        sizes={
                          large
                            ? index === 0
                              ? "(max-width: 1280px) 94vw, 1500px"
                              : "(max-width: 1280px) 34vw, 520px"
                            : "(max-width: 1280px) 46vw, 760px"
                        }
                        priority={eager && index === 0}
                        className="object-cover saturate-[1.04]"
                        style={{ objectPosition: index === 0 ? "center 48%" : "center 42%" }}
                      />
                    </div>
                  ))}
                </div>
              )}

              {panel.kicker ? (
                <MovableGroup
                  groupId="kicker"
                  label={{ es: "Encabezado", en: "Eyebrow" }}
                  className="absolute left-3 top-3 z-10 max-w-[70%] border-l-4 bg-[#2E2A25]/92 px-3 py-2 text-[10px] font-black uppercase tracking-[0.17em] text-white shadow-xl backdrop-blur-sm sm:text-xs xl:left-6 xl:top-6 xl:px-5 xl:py-3 xl:text-sm"
                  style={{ borderColor: theme.accent }}
                >
                  {panel.kicker}
                </MovableGroup>
              ) : null}

              <WaveSeam
                fill={theme.background}
                className="pointer-events-none absolute inset-x-0 -bottom-px h-7 w-full sm:h-9 xl:h-10"
              />
            </div>
          ) : null}

          <div
            className={`relative flex min-h-0 flex-1 flex-col px-4 py-3 text-white sm:px-5 sm:py-4 xl:px-8 xl:py-5 2xl:px-10 2xl:py-7 ${
              hasPhotos ? "" : "justify-center"
            }`}
            style={{ backgroundColor: theme.background }}
          >
            <div
              className="absolute inset-x-0 top-0 h-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]"
              style={{ backgroundColor: theme.accent }}
            />
            <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-[0.08]">
              <LeafShape className="absolute -right-4 -top-5 h-24 w-20 rotate-[16deg] text-white xl:h-48 xl:w-40" />
              <LeafShape className="absolute -bottom-8 left-4 h-20 w-16 rotate-[-22deg] text-white xl:h-36 xl:w-28" />
            </div>

            {kind === "distancia" ? (
              <MovableGroup
                groupId="brand-badge"
                label={{ es: "Logo", en: "Logo" }}
                className="absolute right-3 top-3 z-10 shrink-0 rounded-md bg-white p-1 shadow-lg sm:right-4 sm:top-4 xl:right-6 xl:top-6"
              >
                <Image
                  src={logo}
                  alt="La Vieja Adventures"
                  width={large ? 42 : 34}
                  height={large ? 42 : 34}
                  className="h-auto w-7 object-contain sm:w-8 xl:w-10"
                />
              </MovableGroup>
            ) : null}

            {!hasPhotos && panel.kicker ? (
              <BuiltInText
                groupId="kicker"
                label={{ es: "Encabezado", en: "Eyebrow" }}
                text={panel.kicker}
                defaultFontFamily="sans"
                className="text-xs uppercase tracking-[0.22em] text-white/75 xl:text-base 2xl:text-lg"
                movableClassName="relative z-10 mb-4 w-fit max-w-full self-start xl:mb-5 2xl:mb-7"
              />
            ) : null}

            {brandForward ? (
              <div className="relative grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_auto] grid-rows-[auto_1fr] items-center gap-x-5 gap-y-5 lg:grid-cols-[0.8fr_1.55fr_0.72fr] lg:grid-rows-1 lg:gap-x-6 xl:grid-cols-[0.78fr_1.6fr_0.72fr] xl:gap-x-10 2xl:gap-x-14 print:grid-cols-[0.8fr_1.55fr_0.72fr] print:grid-rows-1 print:gap-x-6">
                <MovableGroup
                  groupId="primary-logo"
                  label={{ es: "Logo principal", en: "Main logo" }}
                  className="relative z-10 col-start-1 row-start-1 flex w-28 max-w-full items-center justify-center justify-self-start border-2 border-white/35 bg-[#2E2A25] p-2 shadow-[0_18px_38px_-18px_rgba(0,0,0,0.85)] lg:w-full lg:max-w-[190px] lg:justify-self-center xl:max-w-[240px] xl:border-4 xl:p-3 2xl:max-w-[280px] print:w-full print:max-w-[190px] print:justify-self-center"
                >
                  <Image
                    src={logo}
                    alt="Logo oficial de La Vieja Adventures"
                    width={280}
                    height={280}
                    className="h-auto w-full object-contain"
                  />
                </MovableGroup>

                <div className="relative z-10 col-span-2 row-start-2 min-w-0 self-center [container-type:inline-size] lg:col-span-1 lg:col-start-2 lg:row-start-1 print:col-span-1 print:col-start-2 print:row-start-1">
                  <BuiltInText
                    groupId="copy-eyebrow"
                    label={{ es: "Categoría", en: "Category label" }}
                    text={theme.eyebrow}
                    defaultFontFamily="sans"
                    className="text-xs uppercase tracking-[0.2em] text-white/75 sm:text-sm xl:text-base 2xl:text-lg"
                    movableClassName="w-fit max-w-full"
                  />
                  <BuiltInText
                    groupId="copy-title"
                    label={{ es: "Título", en: "Title" }}
                    text={panel.title}
                    defaultFontFamily="sans"
                    className="break-words text-[clamp(2.2rem,5.2cqw,6.5rem)] uppercase leading-[0.84] tracking-[-0.045em] text-white"
                    movableClassName="mt-1 w-fit max-w-full"
                  />
                  <BuiltInText
                    groupId="copy-title-en"
                    label={{ es: "Título en inglés", en: "English title" }}
                    text={panel.titleEn}
                    defaultFontFamily="sans"
                    className="text-[clamp(0.72rem,1.35cqw,1.45rem)] uppercase leading-tight tracking-[0.08em] text-white/75"
                    movableClassName="mt-2 w-fit max-w-full"
                  />
                  {panel.subtitle ? (
                    <BuiltInText
                      groupId="copy-subtitle"
                      label={{ es: "Subtítulo", en: "Subtitle" }}
                      text={panel.subtitle}
                      defaultFontFamily="sans"
                      className="border-t-2 border-white/30 pt-3 text-[clamp(0.74rem,1.3cqw,1.4rem)] uppercase leading-tight tracking-[0.07em] text-white xl:pt-5"
                      movableClassName="mt-3 w-fit max-w-full xl:mt-5"
                    />
                  ) : null}
                  {showAmenities ? (
                    <MovableGroup
                      groupId="copy-amenities"
                      label={{ es: "Comodidades", en: "Amenities" }}
                      className="mt-3 w-fit max-w-full xl:mt-4"
                    >
                      <AmenityRow />
                    </MovableGroup>
                  ) : null}
                </div>

                <MovableGroup
                  groupId="direction"
                  label={{ es: "Flecha y entrada", en: "Arrow and entrance" }}
                  className="relative z-10 col-start-2 row-start-1 flex shrink-0 flex-col items-center justify-center self-stretch lg:col-start-3 lg:border-l-2 lg:border-white/30 lg:pl-5 xl:pl-8 2xl:pl-10 print:col-start-3 print:border-l-2 print:border-white/30 print:pl-5"
                >
                  <LeafSprig className="pointer-events-none absolute -top-2 right-0 h-10 w-14 text-white/45 sm:h-12 sm:w-16 xl:h-16 xl:w-20" />
                  <Arrow
                    className="h-24 w-24 sm:h-28 sm:w-28 xl:h-40 xl:w-40 2xl:h-48 2xl:w-48"
                    strokeWidth={3.8}
                    aria-hidden
                  />
                  <span
                    className="mt-1 text-lg font-black uppercase leading-none tracking-[0.08em] sm:text-xl xl:mt-2 xl:text-3xl 2xl:text-4xl"
                    style={{ color: theme.accent }}
                  >
                    {panel.cta.es}
                  </span>
                </MovableGroup>
              </div>
            ) : (
              <div className="relative flex min-h-0 flex-1 items-center gap-3 sm:gap-4 xl:gap-6 2xl:gap-8">
                {kind !== "distancia" ? (
                  <MovableGroup
                    groupId="pictogram"
                    label={{ es: "Pictograma", en: "Pictogram" }}
                    className={`relative z-10 flex shrink-0 items-center justify-center border-2 border-white/75 ${
                      boosted
                        ? "h-16 w-16 sm:h-20 sm:w-20 xl:h-24 xl:w-24 2xl:h-28 2xl:w-28"
                        : "h-14 w-14 sm:h-16 sm:w-16 xl:h-20 xl:w-20 2xl:h-24 2xl:w-24"
                    }`}
                  >
                    <Picto
                      className={
                        boosted
                          ? "h-11 w-11 sm:h-14 sm:w-14 xl:h-16 xl:w-16 2xl:h-20 2xl:w-20"
                          : "h-10 w-10 sm:h-11 sm:w-11 xl:h-14 xl:w-14 2xl:h-16 2xl:w-16"
                      }
                      strokeWidth={2.25}
                      aria-hidden
                    />
                  </MovableGroup>
                ) : null}

                <div className="relative z-10 min-w-0 flex-1">
                  <BuiltInText
                    groupId="copy-eyebrow"
                    label={{ es: "Categoría", en: "Category label" }}
                    text={theme.eyebrow}
                    defaultFontFamily="sans"
                    className="text-[9px] uppercase tracking-[0.18em] text-white/70 sm:text-[10px] xl:text-xs 2xl:text-sm"
                    movableClassName="w-fit max-w-full"
                  />
                  <BuiltInText
                    groupId="copy-title"
                    label={{ es: "Título", en: "Title" }}
                    text={panel.title}
                    defaultFontFamily="sans"
                    className={`uppercase leading-[0.9] tracking-[-0.035em] text-white ${
                      hasPhotos
                        ? large
                          ? "text-[clamp(1.8rem,4.1cqw,4.75rem)]"
                          : "text-[clamp(1.45rem,3cqw,3.1rem)]"
                        : large
                          ? "text-[clamp(2.3rem,5.4cqw,6rem)]"
                          : "text-[clamp(1.9rem,4.4cqw,4.6rem)]"
                    }`}
                    movableClassName="mt-1 w-fit max-w-full"
                  />
                  <BuiltInText
                    groupId="copy-title-en"
                    label={{ es: "Título en inglés", en: "English title" }}
                    text={panel.titleEn}
                    defaultFontFamily="sans"
                    className={`uppercase leading-tight tracking-[0.06em] text-white/75 ${
                      boosted
                        ? "text-[clamp(0.7rem,1.2cqw,1.2rem)]"
                        : "text-[10px] sm:text-xs xl:text-sm 2xl:text-base"
                    }`}
                    movableClassName="mt-1.5 w-fit max-w-full"
                  />
                  {panel.subtitle ? (
                    <BuiltInText
                      groupId="copy-subtitle"
                      label={{ es: "Subtítulo", en: "Subtitle" }}
                      text={panel.subtitle}
                      defaultFontFamily="sans"
                      className="border-t border-white/25 pt-2 text-[10px] uppercase leading-tight tracking-[0.08em] text-white/90 sm:text-xs xl:pt-3 xl:text-base 2xl:pt-4 2xl:text-lg"
                      movableClassName="mt-2 w-fit max-w-full xl:mt-3"
                    />
                  ) : null}
                  {showAmenities ? (
                    <MovableGroup
                      groupId="copy-amenities"
                      label={{ es: "Comodidades", en: "Amenities" }}
                      className="mt-2 w-fit max-w-full xl:mt-3"
                    >
                      <AmenityRow />
                    </MovableGroup>
                  ) : null}
                </div>

                <MovableGroup
                  groupId="direction"
                  label={{ es: "Flecha y distancia", en: "Arrow and distance" }}
                  className="relative z-10 flex shrink-0 flex-col items-center justify-center self-stretch border-l border-white/25 pl-3 sm:pl-4 xl:pl-6 2xl:pl-8"
                >
                  <LeafSprig
                    className={`pointer-events-none absolute text-white/50 ${
                      boosted
                        ? "-top-3 right-1 h-9 w-12 sm:h-11 sm:w-14 xl:h-14 xl:w-16 2xl:h-16 2xl:w-20"
                        : "-top-2 right-0 h-8 w-10 xl:h-12 xl:w-14 2xl:h-14 2xl:w-16"
                    }`}
                  />
                  <Arrow
                    className={
                      boosted
                        ? "h-16 w-16 sm:h-24 sm:w-24 xl:h-28 xl:w-28 2xl:h-32 2xl:w-32"
                        : "h-14 w-14 sm:h-16 sm:w-16 xl:h-20 xl:w-20 2xl:h-24 2xl:w-24"
                    }
                    strokeWidth={3.4}
                    aria-hidden
                  />
                  {panel.distance ? (
                    <span
                      className={`mt-1 font-black leading-none ${
                        boosted
                          ? "text-2xl sm:text-4xl xl:text-4xl 2xl:text-5xl"
                          : "text-xl sm:text-2xl xl:text-2xl 2xl:text-3xl"
                      }`}
                      style={{ color: theme.accent }}
                    >
                      {panel.distance}
                    </span>
                  ) : null}
                </MovableGroup>
              </div>
            )}

            {kind !== "distancia" ? (
              <div
                className={`relative mt-2 flex items-center gap-3 border-t border-white/20 pt-2 xl:mt-3 xl:pt-3 2xl:mt-5 2xl:pt-4 ${
                  brandForward && !showQr ? "justify-center" : "justify-between"
                }`}
              >
                <div
                  className={`relative z-10 min-w-0 uppercase leading-tight text-white/75 ${
                    brandForward
                      ? "text-xs sm:text-sm xl:text-lg 2xl:text-xl"
                      : "text-[9px] sm:text-[10px] xl:text-xs 2xl:text-sm"
                  }`}
                >
                  <BuiltInText
                    groupId="footer-site"
                    label={{ es: "Sitio web", en: "Website" }}
                    text={BUSINESS.web.replace(/^www\./, "")}
                    defaultFontFamily="sans"
                    className={`truncate ${brandForward ? "tracking-[0.18em]" : "tracking-[0.14em]"}`}
                    movableClassName="w-fit max-w-full"
                  />
                  <BuiltInText
                    groupId="footer-whatsapp"
                    label={{ es: "WhatsApp", en: "WhatsApp" }}
                    text={`WhatsApp ${BUSINESS.whatsapp}`}
                    defaultFontFamily="sans"
                    className="truncate normal-case tracking-normal text-white/60"
                    movableClassName="mt-0.5 w-fit max-w-full"
                  />
                </div>
                {!brandForward || showQr ? (
                  <div className="relative z-10 flex shrink-0 items-center gap-2">
                    {!brandForward ? (
                      <MovableGroup
                        groupId="footer-logo"
                        label={{ es: "Logo del pie", en: "Footer logo" }}
                        className="relative z-10 shrink-0 bg-white p-1"
                      >
                        <Image
                          src={logo}
                          alt="La Vieja Adventures"
                          width={large ? 42 : 34}
                          height={large ? 42 : 34}
                          className="h-auto w-8 object-contain sm:w-10 xl:w-12 2xl:w-14"
                        />
                      </MovableGroup>
                    ) : null}
                    {showQr ? (
                      <MovableGroup
                        groupId="footer-qr"
                        label={{ es: "Código QR de WhatsApp", en: "WhatsApp QR code" }}
                        className="relative z-10 shrink-0 bg-white p-1"
                      >
                        <QrCode className="h-8 w-8 sm:h-9 sm:w-9 xl:h-11 xl:w-11 2xl:h-12 2xl:w-12" />
                      </MovableGroup>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </EditableSignCanvas>

        <SignPosts color={theme.background} className="print:hidden" />
      </div>
      <GroundShadow className="mt-1 h-2 w-24 sm:w-32 xl:w-44 print:hidden" />
    </div>
  );
}
