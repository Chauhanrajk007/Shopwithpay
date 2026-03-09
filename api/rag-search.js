import { MongoClient } from "mongodb"

export default async function handler(req,res){

try{

/* ---------- Parse request ---------- */

let body = req.body

if(typeof body === "string"){
body = JSON.parse(body)
}

const query = body?.query

if(!query){
return res.status(400).json({error:"Query missing"})
}


/* ---------- STEP 1 : Gemini query understanding ---------- */

const parseResponse = await fetch(
`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({
contents:[
{
parts:[
{
text:`Extract shopping filters from this query.

Return ONLY JSON.

Query: "${query}"

Example output:
{
"product":"gaming mouse",
"max_price":2000
}`
}
]
}
]
})
}
)

const parseData = await parseResponse.json()

let parsedText =
parseData.candidates?.[0]?.content?.parts?.[0]?.text || "{}"

parsedText = parsedText.replace(/```json|```/g,"").trim()

let parsed = {}

try{
parsed = JSON.parse(parsedText)
}catch{
parsed = { product: query }
}

const productQuery = parsed.product || query
const maxPrice = parsed.max_price || null


/* ---------- STEP 2 : Create embedding ---------- */

const embedResponse = await fetch(
`https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${process.env.GEMINI_API_KEY}`,
{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({
content:{
parts:[
{ text: productQuery }
]
}
})
}
)

const embedData = await embedResponse.json()

if(!embedData.embedding){
return res.status(500).json({
error:"Embedding failed",
embedData
})
}

const queryVector = embedData.embedding.values


/* ---------- STEP 3 : Connect MongoDB ---------- */

const client = new MongoClient(process.env.MONGODB_URI)

await client.connect()

const db = client.db("ragDB")


/* ---------- STEP 4 : Vector search ---------- */

const results = await db.collection("products").aggregate([
{
$vectorSearch:{
index:"product_vector",
path:"embedding",
queryVector:queryVector,
numCandidates:50,
limit:20
}
}
]).toArray()


/* ---------- STEP 5 : Hybrid filtering ---------- */

let filtered = results

/* keyword filter */

filtered = filtered.filter(p =>

(p.name + " " + p.description + " " + p.category)
.toLowerCase()
.includes(productQuery.toLowerCase())

)

/* price filter */

if(maxPrice){
filtered = filtered.filter(p => p.price <= maxPrice)
}


/* ---------- STEP 6 : Handle no results ---------- */

if(filtered.length === 0){

return res.json({
message:`No results found for "${productQuery}"`,
products:[]
})

}


/* ---------- STEP 7 : Return results ---------- */

res.json({
message:`Results for "${productQuery}"`,
products:filtered
})

}catch(err){

console.error(err)

res.status(500).json({error:err.message})

}

}