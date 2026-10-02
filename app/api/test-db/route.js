import clientPromise from "../../../lib/mongodb";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("examdb");
    await db.command({ ping: 1 });
    return Response.json({ message: "Successfully connected to MongoDB!" });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}