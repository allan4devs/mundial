import Image from "next/image";
import BuiltInText from "./layout-editor/BuiltInText";
import EditableSignCanvas from "./layout-editor/EditableSignCanvas";
import MovableGroup from "./layout-editor/MovableGroup";
import QrCode from "./QrCode";
import SocialMark from "./SocialMark";
import { ARROWS, BUSINESS, GLASS_BASE, SOCIALS, TEXT_SHADOW } from "./constants";
import { AmenityRow, GroundShadow, LeafShape, SignPosts } from "./SignChrome";
import type { Panel } from "./types";

/**
 * Portal principal. Se lee a baja velocidad, por eso admite contacto y QR,
 * pero conserva una mitad completa para mostrar el destino sin obstáculos.
 *
 * Diseñado para leerse igual de bien en pantalla, impreso, de noche, bajo
 * lluvia y a distancia: un solo elemento de acción enorme (flecha + CTA),
 * alto contraste, cero relleno decorativo que compita con la información
 * crítica. Lo que se ve aquí es lo que se lee en la calle, no una pieza
 * publicitaria aparte.
 */
export default function EntranceSignPanel({ panel, eager }: { panel: Panel; eager?: boolean }) {
  const Arrow = ARROWS[panel.arrow ?? "right"];
  const primarySocials = SOCIALS.slice(0, 2);

  return (
    <div data-sign-artwork className="relative flex flex-1 flex-col items-center pb-8 sm:pb-11 xl:pb-14 print:pb-0">
      <div className="w-full drop-shadow-[0_34px_40px_rgba(0,0,0,0.55)] print:w-auto print:max-w-full print:drop-shadow-none">
        <EditableSignCanvas
          panelId={panel.layoutId}
          revision={1}
          label={{ es: panel.title, en: panel.titleEn }}
          data-sign-artboard
          data-panel-size={panel.size}
          className="relative isolate w-full overflow-hidden rounded-[30px] border-[8px] border-white bg-[#2E2A25] p-2 lg:aspect-[3/2] xl:rounded-[38px] xl:border-[10px] xl:p-2.5 print:aspect-[3/2] print:rounded-none print:border-[6px] print:p-0"
        >
          <div className="grid min-h-[760px] overflow-hidden rounded-[20px] bg-[#2E2A25] lg:h-full lg:min-h-0 lg:grid-cols-[minmax(360px,0.84fr)_minmax(0,1.16fr)] xl:grid-cols-[minmax(500px,0.9fr)_minmax(0,1.1fr)] print:h-full print:min-h-0 print:rounded-none print:grid-cols-[minmax(340px,0.8fr)_minmax(0,1.2fr)]">
            <div className="relative order-2 flex min-w-0 flex-col bg-[#2E2A25] p-6 text-white sm:p-8 lg:order-1 lg:p-9 xl:p-11 print:p-6">
              <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-[0.14]">
                <LeafShape veins className="absolute -right-10 -top-10 h-56 w-48 rotate-[22deg] text-[#00C4B0]" />
                <LeafShape veins className="absolute -bottom-16 -left-10 h-64 w-52 rotate-[-18deg] text-white" />
                <LeafShape veins className="absolute bottom-16 right-2 h-32 w-28 rotate-[8deg] text-[#00C4B0]" />
              </div>

              {/* Un solo logo, sin flecha compitiendo al lado: la marca es lo primero que se lee. */}
              <MovableGroup
                groupId="primary-logo"
                label={{ es: "Logo principal", en: "Main logo" }}
                className="relative z-10 flex w-fit max-w-full self-start items-center gap-3"
              >
                {panel.brands.map((brand) => (
                  <div key={brand} className="bg-white p-1.5 shadow-xl shadow-black/30">
                    <Image
                      src={brand === "lva" ? "/logo2.jpg" : "/logo1.jpg"}
                      alt={
                        brand === "lva"
                          ? "La Vieja Adventures, logo oscuro"
                          : "La Vieja Adventures, logo turquesa"
                      }
                      width={100}
                      height={100}
                      className="h-[4.4rem] w-[4.4rem] object-contain sm:h-[5.5rem] sm:w-[5.5rem] print:h-[3.85rem] print:w-[3.85rem]"
                      priority={eager}
                    />
                  </div>
                ))}
              </MovableGroup>

              <div className="relative my-auto py-8 xl:py-7 print:py-4">
                <div className="relative z-10">
                  {panel.kicker ? (
                    <BuiltInText
                      groupId="copy-kicker"
                      label={{ es: "Encabezado", en: "Eyebrow" }}
                      text={panel.kicker}
                      defaultFontFamily="sans"
                      className="text-xs uppercase tracking-[0.22em] text-[#7DE7DC] sm:text-sm xl:text-lg print:text-[10px]"
                      movableClassName="w-fit max-w-full"
                    />
                  ) : null}
                  <BuiltInText
                    groupId="copy-title"
                    label={{ es: "Título", en: "Title" }}
                    text={panel.title}
                    defaultFontFamily="sans"
                    className="pr-2 text-[clamp(2.1rem,3.6vw,4rem)] uppercase leading-[0.9] tracking-[-0.045em] text-white xl:pr-4 print:pr-0 print:text-[2.2rem]"
                    movableClassName="mt-3 w-fit max-w-full print:mt-2"
                  />
                  <BuiltInText
                    groupId="copy-title-en"
                    label={{ es: "Título en inglés", en: "English title" }}
                    text={panel.titleEn}
                    defaultFontFamily="sans"
                    className="text-sm uppercase tracking-[0.12em] text-[#A8F0E8] sm:text-lg xl:text-xl print:text-xs"
                    movableClassName="mt-4 w-fit max-w-full print:mt-3"
                  />
                  {panel.subtitle ? (
                    <BuiltInText
                      groupId="copy-subtitle"
                      label={{ es: "Subtítulo", en: "Subtitle" }}
                      text={panel.subtitle}
                      defaultFontFamily="sans"
                      className="border-l-4 border-[#00C4B0] pl-3 text-base uppercase tracking-[0.1em] text-white/90 sm:text-xl xl:pl-5 print:text-sm"
                      movableClassName="mt-5 w-fit max-w-full xl:mt-6 print:mt-3"
                    />
                  ) : null}
                  <MovableGroup
                    groupId="copy-amenities"
                    label={{ es: "Comodidades", en: "Amenities" }}
                    className="mt-4 w-fit max-w-full xl:mt-5"
                  >
                    <AmenityRow />
                  </MovableGroup>
                </div>

                {/* Flecha + ENTRADA fundidos en un solo elemento enorme: la única acción del rótulo. */}
                <MovableGroup
                  groupId="direction"
                  label={{ es: "Flecha y entrada", en: "Arrow and entrance" }}
                  className="relative z-10 mt-8 flex items-center gap-4 bg-[#F5C518] px-5 py-4 text-[#2E2A25] shadow-[inset_0_2px_0_rgba(255,255,255,0.45)] xl:mt-10 xl:gap-6 xl:px-7 xl:py-5 print:mt-4 print:gap-3 print:px-4 print:py-3"
                >
                  <Arrow
                    className="h-14 w-14 shrink-0 sm:h-16 sm:w-16 xl:h-20 xl:w-20 print:h-10 print:w-10"
                    strokeWidth={3.4}
                    aria-hidden
                  />
                  <div className="min-w-0">
                    <p className="text-2xl font-black uppercase leading-none sm:text-3xl xl:text-4xl print:text-xl">
                      {panel.cta.es}
                    </p>
                    <p className="mt-1 text-xs font-bold italic leading-tight text-[#2E2A25]/75 sm:text-sm xl:text-base print:text-[10px]">
                      {panel.cta.en}
                    </p>
                  </div>
                </MovableGroup>
              </div>

              {/* Franja de contacto reducida al mínimo: dominio, WhatsApp y QR, grandes y nada más. */}
              <div className="relative flex items-center justify-between gap-5 border-t border-white/20 pt-5 xl:gap-8 xl:pt-6 print:gap-4 print:pt-4">
                <div className="relative z-10 min-w-0">
                  <MovableGroup
                    groupId="contact-web"
                    label={{ es: "Sitio web", en: "Website" }}
                    className="w-fit max-w-full"
                  >
                    <p className="break-words text-lg font-black uppercase tracking-[-0.03em] text-white sm:whitespace-nowrap sm:text-2xl xl:text-3xl print:whitespace-nowrap print:text-lg">
                      {BUSINESS.web.replace(/^www\./, "")}
                    </p>
                  </MovableGroup>
                  <MovableGroup
                    groupId="contact-whatsapp"
                    label={{ es: "WhatsApp", en: "WhatsApp" }}
                    className="mt-1.5 w-fit max-w-full"
                  >
                    <p className="text-lg font-bold text-[#A8F0E8] sm:text-2xl xl:text-2xl print:text-base">
                      WhatsApp {BUSINESS.whatsapp}
                    </p>
                  </MovableGroup>
                </div>
                <MovableGroup
                  groupId="qr"
                  label={{ es: "Código QR", en: "QR code" }}
                  className="relative z-10 flex shrink-0 items-center justify-center bg-white p-2.5 shadow-xl shadow-black/35 xl:p-3"
                >
                  <QrCode className="h-[5.75rem] w-[5.75rem] sm:h-[6.75rem] sm:w-[6.75rem] xl:h-[7.75rem] xl:w-[7.75rem] print:h-[5.1rem] print:w-[5.1rem]" />
                </MovableGroup>
              </div>
            </div>

            <div className="relative order-1 min-h-[390px] bg-zinc-800 lg:order-2 lg:min-h-full">
              <Image
                src={panel.photos[0]}
                alt="Visitante explorando el Cañón del Río La Vieja"
                fill
                sizes="(max-width: 1024px) 94vw, (max-width: 1920px) 58vw, 1050px"
                priority={eager}
                className="object-cover saturate-[1.04]"
                style={{ objectPosition: "50% 48%" }}
              />

              {/* Marca secundaria, claramente más chica que el logo principal: solo confirma la marca, no compite. */}
              <MovableGroup
                groupId="photo-logo"
                label={{ es: "Logo sobre la foto", en: "Logo over photo" }}
                className={`absolute right-5 top-5 z-10 p-1.5 xl:right-7 xl:top-7 print:hidden ${GLASS_BASE} bg-[rgba(24,24,27,0.42)]`}
              >
                <Image
                  src="/logo1.jpg"
                  alt="La Vieja Adventures, logo turquesa"
                  width={56}
                  height={56}
                  className="h-8 w-8 rounded-md object-contain sm:h-9 sm:w-9"
                />
              </MovableGroup>

              <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/70 to-transparent sm:h-32 print:hidden" />

              {/* Solo ubicación + un par de redes: el contacto real vive una sola vez, en el panel café. */}
              <MovableGroup
                groupId="photo-caption"
                label={{ es: "Ubicación y red social", en: "Location and social media" }}
                className={`absolute inset-x-5 bottom-5 z-10 flex items-center justify-between gap-3 px-4 py-2.5 sm:inset-x-6 sm:bottom-6 xl:inset-x-8 xl:bottom-8 print:hidden ${GLASS_BASE} bg-[rgba(24,24,27,0.42)]`}
              >
                <p
                  className={`border-l-4 border-[#00C4B0] pl-2.5 text-xs font-black uppercase tracking-[0.16em] text-white sm:text-sm ${TEXT_SHADOW}`}
                >
                  Cañón del Río La Vieja · San Carlos
                </p>
                <div className="flex shrink-0 items-center gap-2.5">
                  {primarySocials.map((social) => (
                    <SocialMark
                      key={social.label}
                      path={social.path}
                      className={`h-4 w-4 text-white/90 sm:h-[18px] sm:w-[18px] ${TEXT_SHADOW}`}
                    />
                  ))}
                </div>
              </MovableGroup>
            </div>
          </div>
        </EditableSignCanvas>

        <SignPosts color="#2E2A25" className="scale-125 sm:scale-150 xl:scale-[1.8] print:hidden" />
      </div>
      <GroundShadow className="mt-2 h-3 w-40 sm:w-56 xl:w-72 print:hidden" />
    </div>
  );
}
