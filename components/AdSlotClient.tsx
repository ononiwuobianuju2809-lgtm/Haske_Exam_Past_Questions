"use client";

import { useEffect, useState } from "react";
import Script from "next/script";

export default function AdSlotClient({ slotKey }: { slotKey: string }) {
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/ads?slot=${slotKey}`)
      .then((res) => res.json())
      .then(setSettings)
      .catch(() => setSettings(null));
  }, [slotKey]);

  if (!settings || settings.activeType === "none") return null;

  if (settings.activeType === "private" && settings.privateAdImageUrl) {
    return (
      <div className="my-6 flex justify-center">
        <a href={settings.privateAdLinkUrl || "#"} target="_blank" rel="noopener noreferrer sponsored">
          <img
            src={settings.privateAdImageUrl}
            alt={settings.privateAdSponsorName || "Sponsored"}
            className="max-w-full rounded-md"
          />
        </a>
      </div>
    );
  }

  if (settings.activeType === "google" && settings.googleAdClient && settings.googleAdSlot) {
    return (
      <div className="my-6 flex justify-center">
        <Script
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${settings.googleAdClient}`}
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
        <ins
          className="adsbygoogle"
          style={{ display: "block" }}
          data-ad-client={settings.googleAdClient}
          data-ad-slot={settings.googleAdSlot}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
        <Script id={`adsbygoogle-init-client-${slotKey}`} strategy="afterInteractive">
          {`(adsbygoogle = window.adsbygoogle || []).push({});`}
        </Script>
      </div>
    );
  }

  return null;
}