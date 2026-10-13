"use client";

import Script from "next/script";

const RAW_GOOGLE_ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID?.trim();
const GOOGLE_ADS_ID =
  RAW_GOOGLE_ADS_ID && RAW_GOOGLE_ADS_ID.startsWith("AW-")
    ? RAW_GOOGLE_ADS_ID
    : RAW_GOOGLE_ADS_ID
      ? `AW-${RAW_GOOGLE_ADS_ID}`
      : "";

export default function GoogleAdsScript() {
  if (!GOOGLE_ADS_ID) return null;

  return (
    <>
      <Script
        id="google-ads-loader"
        async
        src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ADS_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-ads-gtag" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GOOGLE_ADS_ID}');`}
      </Script>
    </>
  );
}
