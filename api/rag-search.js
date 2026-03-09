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


/* STEP 1 — Create embedding */

const embedResponse = await fetch(
`https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${process.env.GEMINI_API_KEY}`,
{
method:"POST",
headers:{ "Content-Type":"application/json" },
body:JSON.stringify({
content:{ parts:[{ text: query }] }
})
}
)

const embedData = await embedResponse.json()

const queryVector = embedData.embedding.values


/* STEP 2 — Vector retrieval */

const client = new MongoClient(process.env.MONGODB_URI)

await client.connect()

const db = client.db("ragDB")

const candidates = await db.collection("products").aggregate([
{
$vectorSearch:{
index:"product_vector",
path:"embedding",
queryVector:queryVector,
numCandidates:100,
limit:15
}
}
]).toArray()


/* STEP 3 — Ask Gemini to filter results */

const geminiResponse = await fetch(
`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
{
method:"POST",
headers:{ "Content-Type":"application/json" },
body:JSON.stringify({
contents:[{
parts:[{
text:`User search query: "${query}"

Products:
${JSON.stringify(candidates)}

Return ONLY the relevant products that match the user request.

Example:
If query = gaming mouse under 2000
Remove items above 2000 or unrelated categories.

Return JSON array of products only.`
}]
}]
})
}
)

const geminiData = await geminiResponse.json()

let text =
geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "[]"

text = text.replace(/```json|```/g,"").trim()

let finalProducts = []

try{
finalProducts = JSON.parse(text)
}catch{
finalProducts = candidates.slice(0,5)
}


/* STEP 4 — Return results */

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