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

/* ---------- STEP 1 : QUERY UNDERSTANDING ---------- */

const intentResponse = await fetch(
`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
{
method:"POST",
headers:{ "Content-Type":"application/json" },
body:JSON.stringify({
contents:[{
parts:[{
text:`
Extract the product the user wants.

User query:
"${query}"

Return JSON:

{
"product":"main product",
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

const productSearch = intent.product || query
const maxPrice = intent.max_price || null


/* ---------- STEP 2 : CREATE EMBEDDING ---------- */

const embedResponse = await fetch(
`https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${process.env.GEMINI_API_KEY}`,
{
method:"POST",
headers:{ "Content-Type":"application/json" },
body:JSON.stringify({
content:{
parts:[{text:productSearch}]
}
})
}
)

const embedData = await embedResponse.json()

if(!embedData.embedding){
return res.status(500).json({error:"Embedding failed"})
}

const queryVector = embedData.embedding.values


/* ---------- STEP 3 : DATABASE ---------- */

const client = new MongoClient(process.env.MONGODB_URI)

await client.connect()

const db = client.db("ragDB")


/* ---------- STEP 4 : VECTOR SEARCH ---------- */

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

const originalCandidates = [...candidates]


/* ---------- STEP 5 : TOKEN FILTER ---------- */

const tokens = productSearch
.toLowerCase()
.split(" ")
.filter(w => w.length > 2)

if(tokens.length > 0){

candidates = candidates.filter(p => {

const text = (p.name + " " + p.description).toLowerCase()

return tokens.some(t => text.includes(t))

})

}


/* ---------- FALLBACK IF FILTER REMOVES EVERYTHING ---------- */

if(candidates.length === 0){
candidates = originalCandidates
}


/* ---------- STEP 6 : PRICE FILTER ---------- */

if(maxPrice){
candidates = candidates.filter(p => p.price <= maxPrice)
}


/* ---------- STEP 7 : GEMINI RERANK ---------- */

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

Choose the 5 most relevant products.

Products:
${JSON.stringify(candidates)}

Return JSON array.
`
}]
}]
})
}
)

const rankData = await rankResponse.json()

let text =
rankData.candidates?.[0]?.content?.parts?.[0]?.text || "[]"

text = text.replace(/```json|```/g,"").trim()

const parsed = JSON.parse(text)

if(Array.isArray(parsed) && parsed.length > 0){
finalProducts = parsed
}

}catch(e){

console.log("Ranking failed, using vector results")

}


/* ---------- RETURN ---------- */

if(finalProducts.length === 0){

return res.json({
message:`No results found for "${query}"`,
products:[]
})

}

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