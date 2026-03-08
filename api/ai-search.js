import { MongoClient } from "mongodb"

export default async function handler(req,res){

const {query} = req.body

const client = new MongoClient(process.env.MONGODB_URI)

await client.connect()

const db = client.db("ragDB")

const products = await db.collection("documents").find({}).toArray()

const filtered = products.filter(p =>

(p.name + " " + p.description)
.toLowerCase()
.includes(query.toLowerCase())

)

res.json(filtered)

}
