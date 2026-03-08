import { MongoClient } from "mongodb"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

let client

async function getDB(){

if(!client){

client = new MongoClient(process.env.MONGODB_URI)

await client.connect()

}

return client.db("ragDB")

}

export default async function handler(req,res){

const db = await getDB()

const action = req.query.action

/* SIGNUP */

if(action === "signup"){

const {name,email,password} = req.body

const hash = await bcrypt.hash(password,10)

await db.collection("users").insertOne({

name,
email,
password:hash

})

return res.json({message:"user created"})

}

  
if(action === "login"){

const {email,password} = req.body

const user = await db.collection("users").findOne({email})

if(!user){

return res.status(400).json({error:"user not found"})

}

const valid = await bcrypt.compare(password,user.password)

if(!valid){

return res.status(400).json({error:"wrong password"})

}

const token = jwt.sign(

{userId:user._id},

process.env.JWT_SECRET

)

return res.json({token})

}

/* ADD CART */

if(action === "addCart"){

const token = req.headers.authorization

const decoded = jwt.verify(token,process.env.JWT_SECRET)

const {productId} = req.body

await db.collection("cart").insertOne({

userId:decoded.userId,
productId

})

return res.json({message:"added to cart"})

}

/* GET CART */

if(action === "getCart"){

const token = req.headers.authorization

const decoded = jwt.verify(token,process.env.JWT_SECRET)

const cart = await db.collection("cart").find({

userId:decoded.userId

}).toArray()

return res.json(cart)

}

/* PRODUCTS */

if(action === "products"){

const products = await db.collection("documents").find({}).toArray()

return res.json(products)

}

}
