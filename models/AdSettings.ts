import mongoose, { Schema, models, model } from "mongoose";

const AdSettingsSchema = new Schema(
  {
    activeType: { type: String, enum: ["google", "private", "none"], default: "none" },
    googleAdClient: { type: String, default: "" },
    googleAdSlot: { type: String, default: "" },
    privateAdImageUrl: { type: String, default: "" },
    privateAdLinkUrl: { type: String, default: "" },
    privateAdSponsorName: { type: String, default: "" },
  },
  { timestamps: true }
);

export default models.AdSettings || model("AdSettings", AdSettingsSchema);