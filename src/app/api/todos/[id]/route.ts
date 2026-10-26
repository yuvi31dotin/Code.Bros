import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getCurrentUserId } from "@/lib/auth";
import { getDatabase } from "@/lib/mongodb";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getCurrentUserId();
  const { id } = await params;
  if (!userId || !ObjectId.isValid(userId) || !ObjectId.isValid(id)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const { completed, title } = await request.json();
  const update: { completed?: boolean; title?: string } = {};
  if (typeof completed === "boolean") update.completed = completed;
  if (typeof title === "string" && title.trim()) update.title = title.trim();
  const result = await (await getDatabase()).collection("todos").updateOne({ _id: new ObjectId(id), userId: new ObjectId(userId) }, { $set: update });
  if (!result.matchedCount) return NextResponse.json({ error: "Todo not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getCurrentUserId();
  const { id } = await params;
  if (!userId || !ObjectId.isValid(userId) || !ObjectId.isValid(id)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  await (await getDatabase()).collection("todos").deleteOne({ _id: new ObjectId(id), userId: new ObjectId(userId) });
  return NextResponse.json({ ok: true });
}