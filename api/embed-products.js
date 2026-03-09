import { MongoClient } from "mongodb"

export default async function handler(req,res){

const { GoogleGenerativeAI } = await import("@google/generative-ai")

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

const model = genAI.getGenerativeModel({ model: "text-embedding-004" })

const client = new MongoClient(process.env.MONGODB_URI)

await client.connect()

const db = client.db("ragDB")

const products = await db.collection("products").find({}).toArray()

for(const p of products){

const text = p.name + " " + p.description

const result = await model.embedContent(text)

const embedding = result.embedding.values

await db.collection("products").updateOne(

{ _id:p._id },

{ $set:{ embedding } }

)

}

res.json({message:"Embeddings generated"})

}
