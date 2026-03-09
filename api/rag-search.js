import { MongoClient } from "mongodb"

export default async function handler(req,res){

try{

let body = req.body

if(typeof body === "string"){
body = JSON.parse(body)
}

const query = body?.query

if(!query){
return res.status(400).json({error:"Query missing"})
}


/* STEP 1 — Gemini query understanding */

const intentResponse = await fetch(
`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
{
method:"POST",
headers:{ "Content-Type":"application/json" },
body:JSON.stringify({
contents:[{
parts:[{
text:`
You are an AI search query parser.

Extract structured product search intent.

User query:
"${query}"

Return ONLY JSON:

{
"product":"string",
"max_price":number or null
}
`
}]
}]
})
}
)

const intentData = await intentResponse.json()

let intentText =
intentData.candidates?.[0]?.content?.parts?.[0]?.text || "{}"

intentText = intentText.replace(/```json|```/g,"").trim()

let intent = {}

try{
intent = JSON.parse(intentText)
}catch{
intent = {product:query,max_price:null}
}

const searchPhrase = intent.product || query
const maxPrice = intent.max_price || null


/* STEP 2 — Create embedding */

const embedResponse = await fetch(
`https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${process.env.GEMINI_API_KEY}`,
{
method:"POST",
headers:{ "Content-Type":"application/json" },
body:JSON.stringify({
content:{
parts:[{text:searchPhrase}]
}
})
}
)

const embedData = await embedResponse.json()

if(!embedData.embedding){
return res.status(500).json({error:"Embedding failed"})
}

const queryVector = embedData.embedding.values


/* STEP 3 — MongoDB connection */

const client = new MongoClient(process.env.MONGODB_URI)

await client.connect()

const db = client.db("ragDB")


/* STEP 4 — Vector search */

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


/* STEP 5 — Price filtering */

if(maxPrice){
candidates = candidates.filter(p => p.price <= maxPrice)
}


/* STEP 6 — Gemini reranking (SAFE) */

let finalProducts = candidates.slice(0,5)

try{

const rankResponse = await fetch(
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

Rank the following products by relevance.

Return ONLY a JSON array of the best 5 products.

Products:
${JSON.stringify(candidates)}
`
}]
}]
})
}
)

const rankData = await rankResponse.json()

let text =
rankData.candidates?.[0]?.content?.parts?.[0]?.text || ""

text = text.replace(/```json|```/g,"").trim()

const parsed = JSON.parse(text)

if(Array.isArray(parsed) && parsed.length > 0){
finalProducts = parsed
}

}catch(e){

console.log("Gemini ranking failed — using vector results")

}

/* STEP 7 — return */

res.json({
query,
parsed_intent:intent,
products:finalProducts
})

}catch(err){

console.error(err)

res.status(500).json({error:err.message})

}

}