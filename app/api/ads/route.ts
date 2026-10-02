import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import AdSlotSettings from "@/models/AdSlotSettings";

async function connectDB() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI as string);
  }
}

export async function GET(req: NextRequest) {
  await connectDB();
  const slotKey = req.nextUrl.searchParams.get("slot");
  if (!slotKey) return NextResponse.json({ activeType: "none" });

  const settings = await AdSlotSettings.findOne({ slotKey }).lean();
  return NextResponse.json(settings || { activeType: "none" });
}