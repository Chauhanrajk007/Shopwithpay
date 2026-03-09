import { MongoClient } from "mongodb"

export default async function handler(req, res) {

try {

let body = req.body

if (typeof body === "string") {
body = JSON.parse(body)
}

const query = body?.query

if (!query) {
return res.status(400).json({ error: "Query missing" })
}

/* STEP 1 — EMBEDDING */

const embedRes = await fetch(
`https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${process.env.GEMINI_API_KEY}`,
{
method: "POST",
headers: { "Content-Type": "application/json" },
body: JSON.stringify({
content: {
parts: [{ text: query }]
}
})
}
)

const embedData = await embedRes.json()

if (!embedData.embedding) {
return res.status(500).json({ error: "Embedding failed" })
}

const queryVector = embedData.embedding.values


/* STEP 2 — CONNECT DATABASE */

const client = new MongoClient(process.env.MONGODB_URI)

await client.connect()

const db = client.db("ragDB")


/* STEP 3 — VECTOR SEARCH */

const candidates = await db.collection("products").aggregate([
{
$vectorSearch: {
index: "product_vector",
path: "embedding",
queryVector: queryVector,
numCandidates: 200,
limit: 15
}
}
]).toArray()

if (candidates.length === 0) {
return res.json({
query,
products: []
})
}


/* STEP 4 — GEMINI FILTERING */

const llmRes = await fetch(
`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
{
method: "POST",
headers: { "Content-Type": "application/json" },
body: JSON.stringify({
contents: [{
parts: [{
text: `
User query: "${query}"

Below is a list of products.

Select ONLY products relevant to the query.

Products:
${JSON.stringify(candidates)}

Return ONLY JSON array of relevant products.
`
}]
}]
})
}
)

const llmData = await llmRes.json()

let text =
llmData.candidates?.[0]?.content?.parts?.[0]?.text || "[]"

text = text.replace(/```json|```/g, "").trim()

let finalProducts = []

try {
finalProducts = JSON.parse(text)
} catch {
finalProducts = candidates.slice(0, 5)
}


/* FALLBACK */

if (!Array.isArray(finalProducts) || finalProducts.length === 0) {
finalProducts = candidates.slice(0, 5)
}


/* RETURN */

res.json({
query,
products: finalProducts
})

} catch (err) {

console.error(err)

res.status(500).json({ error: err.message })

}

}