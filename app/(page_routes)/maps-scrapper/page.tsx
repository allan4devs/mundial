import type { Metadata } from "next";
import MapsScrapperClient from "./MapsScrapperClient";

export const metadata: Metadata = {
  title: "Maps Scrapper | Leads sin website",
  description:
    "Explora negocios cercanos, detecta quienes no tienen sitio web y evalua websites desactualizados.",
};

export default function MapsScrapperPage() {
  const mapsBrowserKey =
    process.env.NEXT_PUBLIC_MAPS_JS_KEY?.trim() ??
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY?.trim() ??
    "";
  const mapsMapId =
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID?.trim() ??
    process.env.NEXT_PUBLIC_MAPS_MAP_ID?.trim() ??
    "DEMO_MAP_ID";

  return (
    <MapsScrapperClient
      mapsBrowserKey={mapsBrowserKey}
      mapsMapId={mapsMapId}
    />
  );
}
