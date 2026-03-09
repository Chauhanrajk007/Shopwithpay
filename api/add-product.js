import { MongoClient } from "mongodb"

export default async function handler(req,res){

try{

const {name,description,price} = req.body

const text = (name || "") + " " + (description || "")

const response = await fetch(
`https://generativelanguage.googleapis.com/v1/models/text-embedding-004:embedContent?key=${process.env.GEMINI_API_KEY}`,
{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({
model:"models/text-embedding-004",
content:{
parts:[{text}]
}
})
}
)

const data = await response.json()

if(!data.embedding){
throw new Error("Embedding failed")
}

const embedding = data.embedding.values

const client = new MongoClient(process.env.MONGODB_URI)

await client.connect()

const db = client.db("ragDB")

await db.collection("products").insertOne({
name,
description,
price,
embedding
})

res.json({message:"Product added with embedding"})

}catch(err){

console.error(err)

res.status(500).json({error:err.message})

}

}
