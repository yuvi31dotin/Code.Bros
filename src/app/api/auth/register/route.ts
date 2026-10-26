import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDatabase } from "@/lib/mongodb";
import { createSession } from "@/lib/auth";

export async function POST(request: Request) {
  const { name, email, password } = await request.json();
  const normalizedEmail = String(email ?? "").trim().toLowerCase();
  const normalizedName = String(name ?? "").trim();

  if (!normalizedName || !normalizedEmail || String(password ?? "").length < 8) {
    return NextResponse.json({ error: "Enter a name, email, and password of at least 8 characters." }, { status: 400 });
  }

  const db = await getDatabase();
  const users = db.collection("users");
  const existingUser = await users.findOne({ email: normalizedEmail });
  if (existingUser) return NextResponse.json({ error: "An account with that email already exists." }, { status: 409 });

  const result = await users.insertOne({
    name: normalizedName,
    email: normalizedEmail,
    passwordHash: await bcrypt.hash(String(password), 12),
    createdAt: new Date(),
  });

  await createSession(result.insertedId.toString());
  return NextResponse.json({ user: { name: normalizedName, email: normalizedEmail } }, { status: 201 });
}