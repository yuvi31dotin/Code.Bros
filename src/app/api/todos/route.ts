import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";

const workspaceId = "default";

export async function GET() {
  const todos = await (await getDatabase()).collection("todos").find({ workspaceId }).sort({ completed: 1, createdAt: -1 }).toArray();
  return NextResponse.json({ todos: todos.map((todo) => ({ ...todo, _id: todo._id.toString() })) });
}

export async function POST(request: Request) {
  const { title } = await request.json();
  const normalizedTitle = String(title ?? "").trim();
  if (!normalizedTitle) return NextResponse.json({ error: "A todo needs a title." }, { status: 400 });

  const todo = { workspaceId, title: normalizedTitle, completed: false, createdAt: new Date() };
  const result = await (await getDatabase()).collection("todos").insertOne(todo);
  return NextResponse.json({ todo: { ...todo, _id: result.insertedId.toString() } }, { status: 201 });
}