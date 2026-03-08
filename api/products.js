import { MongoClient } from "mongodb"

const client = new MongoClient(process.env.MONGODB_URI)

export default async function handler(req,res){

await client.connect()

const db = client.db("agenticwallet")

const products = await db.collection("products").find({}).toArray()

res.status(200).json(products)

}
