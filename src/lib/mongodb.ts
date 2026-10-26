import dns from "node:dns";
import { MongoClient, type Db } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB ?? "todo_app";
const hasPasswordPlaceholder = uri?.includes("<db_password>") ?? false;

declare global {
  var mongoClientPromise: Promise<MongoClient> | undefined;
}

if (uri?.startsWith("mongodb+srv://")) dns.promises.setServers(["1.1.1.1", "8.8.8.8"]);

const clientPromise = global.mongoClientPromise ?? (!hasPasswordPlaceholder && uri ? new MongoClient(uri).connect() : undefined);

if (process.env.NODE_ENV !== "production") {
  global.mongoClientPromise = clientPromise;
}

export async function getDatabase(): Promise<Db> {
  if (hasPasswordPlaceholder) throw new Error("Replace <db_password> in MONGODB_URI with the password for your MongoDB Atlas database user");
  if (!clientPromise) throw new Error("Missing MONGODB_URI environment variable");
  return (await clientPromise).db(dbName);
}