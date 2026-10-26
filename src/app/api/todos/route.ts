import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getCurrentUserId } from "@/lib/auth";
import { getDatabase } from "@/lib/mongodb";

async function authenticatedUserId() {
  const userId = await getCurrentUserId();
  return userId && ObjectId.isValid(userId) ? new ObjectId(userId) : null;
}

export async function GET() {
  const userId = await authenticatedUserId();
  if (!userId) return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  const todos = await (await getDatabase()).collection("todos").find({ userId }).sort({ completed: 1, createdAt: -1 }).toArray();
  return NextResponse.json({ todos: todos.map((todo) => ({ ...todo, _id: todo._id.toString() })) });
}

export async function POST(request: Request) {
  const userId = await authenticatedUserId();
  if (!userId) return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  const { title } = await request.json();
  const normalizedTitle = String(title ?? "").trim();
  if (!normalizedTitle) return NextResponse.json({ error: "A todo needs a title." }, { status: 400 });

  const todo = { userId, title: normalizedTitle, completed: false, createdAt: new Date() };
  const result = await (await getDatabase()).collection("todos").insertOne(todo);
  return NextResponse.json({ todo: { ...todo, _id: result.insertedId.toString() } }, { status: 201 });
}