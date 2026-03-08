import { MongoClient } from "mongodb";

let client;

export default async function handler(req, res) {

try {

if (!client) {
client = new MongoClient(process.env.MONGODB_URI);
await client.connect();
}

const db = client.db("agenticwallet");

const products = await db.collection("products").find({}).toArray();

res.status(200).json(products);

} catch (error) {

console.error("MongoDB error:", error);

res.status(500).json({ error: "Database connection failed" });

}

}
