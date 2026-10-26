import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getCurrentUserId } from "@/lib/auth";
import { getDatabase } from "@/lib/mongodb";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId || !ObjectId.isValid(userId)) return NextResponse.json({ user: null }, { status: 401 });

  const user = await (await getDatabase()).collection("users").findOne({ _id: new ObjectId(userId) });
  if (!user) return NextResponse.json({ user: null }, { status: 401 });
  return NextResponse.json({ user: { name: user.name, email: user.email } });
}