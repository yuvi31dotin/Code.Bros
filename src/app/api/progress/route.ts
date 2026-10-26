import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";

const workspaceId = "default";

function dateKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function shiftDate(date: Date, amount: number) {
  const shifted = new Date(date);
  shifted.setUTCDate(shifted.getUTCDate() + amount);
  return shifted;
}

export async function GET() {
  const today = new Date();
  const completedDays = await (await getDatabase()).collection("daily_progress").find({ workspaceId }).sort({ date: -1 }).toArray();
  const completedKeys = new Set(completedDays.map((day) => day.date));
  const recent = Array.from({ length: 7 }, (_, index) => {
    const date = shiftDate(today, index - 6);
    const key = dateKey(date);
    return { date: key, label: date.toLocaleDateString("en", { weekday: "short", timeZone: "UTC" }).slice(0, 2), completed: completedKeys.has(key) };
  });

  let currentStreak = 0;
  for (let offset = 0; completedKeys.has(dateKey(shiftDate(today, -offset))); offset += 1) currentStreak += 1;
  let longestStreak = 0;
  let runningStreak = 0;
  for (const day of completedDays.sort((a, b) => a.date.localeCompare(b.date))) {
    const previous = dateKey(shiftDate(new Date(`${day.date}T00:00:00Z`), -1));
    runningStreak = completedKeys.has(previous) ? runningStreak + 1 : 1;
    longestStreak = Math.max(longestStreak, runningStreak);
  }

  return NextResponse.json({ today: completedKeys.has(dateKey(today)), currentStreak, longestStreak, recent });
}

export async function POST() {
  const date = dateKey();
  await (await getDatabase()).collection("daily_progress").updateOne({ workspaceId, date }, { $set: { workspaceId, date, completedAt: new Date() } }, { upsert: true });
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  await (await getDatabase()).collection("daily_progress").deleteOne({ workspaceId, date: dateKey() });
  return NextResponse.json({ ok: true });
}