import { MongoClient } from "mongodb"

export default async function handler(req,res){

try{

/* -------------------------
Parse request
------------------------- */

let body = req.body

if(typeof body === "string"){
body = JSON.parse(body)
}

const query = body?.query

if(!query){
return res.status(400).json({error:"Query missing"})
}


/* -------------------------
STEP 1
Extract price from query
------------------------- */

let maxPrice = null

const priceMatch = query.match(/(\d+)/)

if(priceMatch){
maxPrice = parseInt(priceMatch[1])
}


/* -------------------------
STEP 2
Create embedding
------------------------- */

const embedResponse = await fetch(
`https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${process.env.GEMINI_API_KEY}`,
{
method:"POST",
headers:{ "Content-Type":"application/json" },
body:JSON.stringify({
content:{
parts:[{ text: query }]
}
})
}
)

const embedData = await embedResponse.json()

if(!embedData.embedding){
return res.status(500).json({error:"Embedding failed"})
}

const queryVector = embedData.embedding.values


/* -------------------------
STEP 3
Connect MongoDB
------------------------- */

const client = new MongoClient(process.env.MONGODB_URI)

await client.connect()

const db = client.db("ragDB")


/* -------------------------
STEP 4
Vector search
------------------------- */

let candidates = await db.collection("products").aggregate([
{
$vectorSearch:{
index:"product_vector",
path:"embedding",
queryVector:queryVector,
numCandidates:300,
limit:30
}
}
]).toArray()


/* -------------------------
STEP 5
Price filtering
------------------------- */

if(maxPrice){
candidates = candidates.filter(p => p.price <= maxPrice)
}


/* -------------------------
STEP 6
LLM reranking
------------------------- */

const geminiResponse = await fetch(
`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
{
method:"POST",
headers:{ "Content-Type":"application/json" },
body:JSON.stringify({
contents:[{
parts:[{
text:`
User query:
"${query}"

Rank these products by relevance.

Products:
${JSON.stringify(candidates)}

Return JSON array of the best 5 products only.
`
}]
}]
})
}
)

const geminiData = await geminiResponse.json()

let rankedText =
geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "[]"

rankedText = rankedText.replace(/```json|```/g,"").trim()

let finalProducts = []

try{
finalProducts = JSON.parse(rankedText)
}catch{
finalProducts = candidates.slice(0,5)
}


/* -------------------------
STEP 7
Return results
------------------------- */

if(finalProducts.length === 0){
return res.json({
message:`No results found for "${query}"`,
products:[]
})
}

res.json({
message:`Results for "${query}"`,
products:finalProducts
})

}catch(err){

console.error(err)

res.status(500).json({error:err.message})

}

}