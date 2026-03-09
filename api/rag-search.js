import { MongoClient } from "mongodb"

export default async function handler(req,res){

try{

const body = req.body || {}
const query = body.query

if(!query){
return res.status(400).json({error:"Query missing"})
}

/* create embedding */

const response = await fetch(
`https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${process.env.GEMINI_API_KEY}`,
{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({
content:{
parts:[{text:query}]
}
})
}
)

const embedData = await response.json()

const queryVector = embedData.embedding.values

const client = new MongoClient(process.env.MONGODB_URI)

await client.connect()

const db = client.db("ragDB")

/* vector search */

let results = await db.collection("products").aggregate([
{
$vectorSearch:{
index:"product_vector",
path:"embedding",
queryVector:queryVector,
numCandidates:100,
limit:5
}
}
]).toArray()

/* fallback keyword search */

if(results.length === 0){

results = await db.collection("products").find({
$or:[
{ name:{ $regex: query, $options:"i" }},
{ description:{ $regex: query, $options:"i" }}
]
}).limit(5).toArray()

}

res.json(results)

}catch(err){

console.error(err)

res.status(500).json({error:err.message})

}

}
