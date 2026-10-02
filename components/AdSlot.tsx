import mongoose from "mongoose";
import Script from "next/script";
import AdSlotSettings from "@/models/AdSlotSettings";

async function connectDB() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI as string);
  }
}

export default async function AdSlot({ slotKey }: { slotKey: string }) {
  await connectDB();
  const settings = await AdSlotSettings.findOne({ slotKey }).lean<any>();

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
        <Script id={`adsbygoogle-init-${slotKey}`} strategy="afterInteractive">
          {`(adsbygoogle = window.adsbygoogle || []).push({});`}
        </Script>
      </div>
    );
  }

  return null;
}