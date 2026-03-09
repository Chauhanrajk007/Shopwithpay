import { MongoClient } from "mongodb"
import { GoogleGenerativeAI } from "@google/generative-ai"

export default async function handler(req,res){

try{

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

const model = genAI.getGenerativeModel({
model:"embedding-001"
})

const client = new MongoClient(process.env.MONGODB_URI)

await client.connect()

const db = client.db("ragDB")

const products = await db.collection("products").find({}).toArray()

for(const p of products){

const text = (p.name || "") + " " + (p.description || "")

const result = await model.embedContent({
content:{
parts:[{text}]
}
})

const embedding = result.embedding.values

await db.collection("products").updateOne(
{ _id:p._id },
{ $set:{embedding} }
)

}

res.json({message:"Embeddings generated successfully"})

}catch(err){

console.error(err)

res.status(500).json({error:err.message})

}

}
