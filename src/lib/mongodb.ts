import { MongoClient, type Db } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB ?? "todo_app";

declare global {
  var mongoClientPromise: Promise<MongoClient> | undefined;
}

const clientPromise = global.mongoClientPromise ?? (uri ? new MongoClient(uri).connect() : undefined);

if (process.env.NODE_ENV !== "production") {
  global.mongoClientPromise = clientPromise;
}

export async function getDatabase(): Promise<Db> {
  if (!clientPromise) throw new Error("Missing MONGODB_URI environment variable");
  return (await clientPromise).db(dbName);
}