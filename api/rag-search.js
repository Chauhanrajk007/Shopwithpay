import { MongoClient } from "mongodb"

export default async function handler(req,res){

try{

const {query} = req.body || {}

/* create embedding for query */

const response = await fetch(
`https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${process.env.GEMINI_API_KEY}`,
{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({
content:{
parts:[
{ text: query }
]
}
})
}
)

const data = await response.json()

if(!data.embedding || !data.embedding.values){

throw new Error(
"Embedding API failed → " + JSON.stringify(data)
)

}

const queryVector = data.embedding.values

/* connect MongoDB */

const client = new MongoClient(process.env.MONGODB_URI)

await client.connect()

const db = client.db("ragDB")

/* vector search */

const results = await db.collection("products").aggregate([
{
$vectorSearch:{
index:"product_vector",
path:"embedding",
queryVector:queryVector,
numCandidates:20,
limit:5
}
}
]).toArray()

res.json(results)

}catch(err){

console.error(err)

res.status(500).json({error:err.message})

}

}
