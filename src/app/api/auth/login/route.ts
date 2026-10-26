import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDatabase } from "@/lib/mongodb";
import { createSession } from "@/lib/auth";

export async function POST(request: Request) {
  const { email, password } = await request.json();
  const normalizedEmail = String(email ?? "").trim().toLowerCase();
  const db = await getDatabase();
  const user = await db.collection("users").findOne({ email: normalizedEmail });

  if (!user || typeof user.passwordHash !== "string" || !(await bcrypt.compare(String(password ?? ""), user.passwordHash))) {
    return NextResponse.json({ error: "Email or password is incorrect." }, { status: 401 });
  }

  await createSession(user._id.toString());
  return NextResponse.json({ user: { name: user.name, email: user.email } });
}