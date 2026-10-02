"use client";

import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import Button from "@/components/Button";
import ImageUpload from "@/components/ImageUpload";
import { AD_SLOTS } from "@/lib/adSlots";

export default function AdminAdsPage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6 sm:px-6">
      <div className="mb-4 flex justify-end">
        <Button type="button" variant="secondary" onClick={() => signOut()} className="!w-auto">
          Log Out
        </Button>
      </div>

      <h1 className="mb-2 text-lg font-bold text-foreground sm:text-xl">Ad Settings</h1>
      <p className="mb-6 text-sm text-gray-600">
        Each page below has its own independent ad — set a different Google ad, a different
        private sponsor, or nothing at all, per page.
      </p>

      <div className="space-y-6">
        {AD_SLOTS.map((slot) => (
          <AdSlotEditor key={slot.key} slotKey={slot.key} label={slot.label} />
        ))}
      </div>
    </div>
  );
}

function AdSlotEditor({ slotKey, label }: { slotKey: string; label: string }) {
  const [activeType, setActiveType] = useState<"google" | "private" | "none">("none");
  const [googleAdClient, setGoogleAdClient] = useState("");
  const [googleAdSlot, setGoogleAdSlot] = useState("");
  const [privateAdImageUrl, setPrivateAdImageUrl] = useState("");
  const [privateAdLinkUrl, setPrivateAdLinkUrl] = useState("");
  const [privateAdSponsorName, setPrivateAdSponsorName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/admin/ads")
      .then((res) => res.json())
      .then((all: any[]) => {
        const mine = all.find((s) => s.slotKey === slotKey);
        if (mine) {
          setActiveType(mine.activeType || "none");
          setGoogleAdClient(mine.googleAdClient || "");
          setGoogleAdSlot(mine.googleAdSlot || "");
          setPrivateAdImageUrl(mine.privateAdImageUrl || "");
          setPrivateAdLinkUrl(mine.privateAdLinkUrl || "");
          setPrivateAdSponsorName(mine.privateAdSponsorName || "");
        }
        setLoading(false);
      });
  }, [slotKey]);

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    const res = await fetch("/api/admin/ads", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slotKey,
        activeType,
        googleAdClient,
        googleAdSlot,
        privateAdImageUrl,
        privateAdLinkUrl,
        privateAdSponsorName,
      }),
    });
    setSaving(false);
    setMessage(res.ok ? "✅ Saved!" : "❌ Something went wrong.");
  };

  const inputClass =
    "w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/30";
  const labelClass = "mb-1 block text-xs font-medium text-foreground";

  return (
    <div className="rounded-md border border-gray-200 p-4">
      <h2 className="mb-4 font-semibold text-navy">{label}</h2>

      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : (
        <>
          <div className="mb-4">
            <label className={labelClass}>Which ad is live here?</label>
            <select
              value={activeType}
              onChange={(e) => setActiveType(e.target.value as "google" | "private" | "none")}
              className={inputClass}
            >
              <option value="none">None (show nothing)</option>
              <option value="google">Google AdSense</option>
              <option value="private">Private Sponsor Ad</option>
            </select>
          </div>

          <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Google Ad Client ID</label>
              <input type="text" value={googleAdClient} onChange={(e) => setGoogleAdClient(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Google Ad Slot ID</label>
              <input type="text" value={googleAdSlot} onChange={(e) => setGoogleAdSlot(e.target.value)} className={inputClass} />
            </div>
          </div>

          <div className="mb-4">
            <ImageUpload value={privateAdImageUrl} onChange={setPrivateAdImageUrl} />
          </div>
          <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Private Ad Link URL</label>
              <input type="text" value={privateAdLinkUrl} onChange={(e) => setPrivateAdLinkUrl(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Sponsor Name</label>
              <input type="text" value={privateAdSponsorName} onChange={(e) => setPrivateAdSponsorName(e.target.value)} className={inputClass} />
            </div>
          </div>

          <Button type="button" onClick={handleSave} disabled={saving} className="!w-auto !px-4 !py-2 text-sm">
            {saving ? "Saving..." : "Save"}
          </Button>
          {message && <p className="mt-2 text-sm">{message}</p>}
        </>
      )}
    </div>
  );
}