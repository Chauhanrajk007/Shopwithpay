import { MongoClient } from "mongodb"
import { GoogleGenerativeAI } from "@google/generative-ai"

export default async function handler(req,res){

const {query} = req.body

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

const model = genAI.getGenerativeModel({ model:"text-embedding-004" })

const embed = await model.embedContent(query)

const queryVector = embed.embedding.values

const client = new MongoClient(process.env.MONGODB_URI)

await client.connect()

const db = client.db("ragDB")

const results = await db.collection("documents").aggregate([

{
$vectorSearch:{
index:"product_vector",
path:"embedding",
queryVector,
numCandidates:100,
limit:5
}
}

]).toArray()

res.json(results)

}
