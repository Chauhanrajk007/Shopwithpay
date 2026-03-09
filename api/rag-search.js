import { MongoClient } from "mongodb"

export default async function handler(req,res){

try{

/* -------- READ QUERY -------- */

let body = req.body

if(typeof body === "string"){
body = JSON.parse(body)
}

const query = body?.query

if(!query){
return res.status(400).json({error:"Query missing"})
}


/* -------- STEP 1 : CREATE EMBEDDING -------- */

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


/* -------- STEP 2 : CONNECT DATABASE -------- */

const client = new MongoClient(process.env.MONGODB_URI)

await client.connect()

const db = client.db("ragDB")


/* -------- STEP 3 : VECTOR SEARCH -------- */

let candidates = await db.collection("products").aggregate([
{
$vectorSearch:{
index:"product_vector",
path:"embedding",
queryVector:queryVector,
numCandidates:200,
limit:20
}
}
]).toArray()

if(candidates.length === 0){

return res.json({
message:`No products found near "${query}"`,
products:[]
})

}


/* -------- STEP 4 : GEMINI RELEVANCE FILTER -------- */

const geminiResponse = await fetch(
`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
{
method:"POST",
headers:{ "Content-Type":"application/json" },
body:JSON.stringify({
contents:[{
parts:[{
text:`

User search query:
"${query}"

Below is a list of products with name, description and price.

Select ONLY the products that match the user's request.

Example:
If user asks "gaming mouse under 2000",
remove keyboards, monitors, expensive items etc.

Products:
${JSON.stringify(candidates)}

Return ONLY a JSON array of matching products.

`
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

console.log("Gemini parse failed — fallback to vector results")

finalProducts = candidates.slice(0,5)

}


/* -------- RETURN -------- */

if(finalProducts.length === 0){

return res.json({
message:`No results found for "${query}"`,
products:[]
})

}

res.json({
query,
products:finalProducts
})

}catch(err){

console.error(err)

res.status(500).json({error:err.message})

}

}