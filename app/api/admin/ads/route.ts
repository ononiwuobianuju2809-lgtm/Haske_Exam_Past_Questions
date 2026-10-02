import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import mongoose from "mongoose";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import AdSlotSettings from "@/models/AdSlotSettings";
import { AD_SLOTS } from "@/lib/adSlots";

async function connectDB() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI as string);
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== "admin") {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }
  await connectDB();

  const existing = await AdSlotSettings.find();
  const existingKeys = new Set(existing.map((s) => s.slotKey));
  const missing = AD_SLOTS.filter((s) => !existingKeys.has(s.key));
  if (missing.length) {
    await AdSlotSettings.insertMany(missing.map((s) => ({ slotKey: s.key })));
  }

  const all = await AdSlotSettings.find();
  return NextResponse.json(all);
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== "admin") {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }
  await connectDB();
  const body = await req.json();

  if (!body.slotKey) {
    return NextResponse.json({ error: "Missing slotKey." }, { status: 400 });
  }

  const updated = await AdSlotSettings.findOneAndUpdate({ slotKey: body.slotKey }, body, {
    upsert: true,
    new: true,
  });

  return NextResponse.json(updated);
}