import { MongoClient } from "mongodb"

export default async function handler(req,res){

try{

const client = new MongoClient(process.env.MONGODB_URI)
await client.connect()

const db = client.db("ragDB")

const products = await db.collection("products").find({}).toArray()

for(const p of products){

const text = (p.name || "") + " " + (p.description || "")

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
parts:[{text:text}]
}
})
}
)

const data = await response.json()

/* DEBUG */
console.log("Gemini response:", data)

if(!data.embedding){
throw new Error("Embedding not returned: " + JSON.stringify(data))
}

const embedding = data.embedding.values

await db.collection("products").updateOne(
{_id:p._id},
{$set:{embedding}}
)

}

res.json({message:"Embeddings generated successfully"})

}catch(err){

console.error(err)

res.status(500).json({error:err.message})

}

}
