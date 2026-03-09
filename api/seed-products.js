import { MongoClient } from "mongodb"

export default async function handler(req,res){

try{

const products = [

{
name:"Logitech G102 Gaming Mouse",
description:"RGB wired gaming mouse with high precision sensor for PC gaming",
category:"gaming accessories",
brand:"Logitech",
price:1200,
rating:4.6,
reviews:12450
},
{
name:"Sony WH-CH520 Wireless Headphones",
description:"Bluetooth headphones with deep bass and long battery life",
category:"audio",
brand:"Sony",
price:4500,
rating:4.5,
reviews:8900
},
{
name:"Mechanical RGB Gaming Keyboard",
description:"Mechanical keyboard with blue switches and RGB lighting",
category:"gaming accessories",
brand:"Redragon",
price:3200,
rating:4.4,
reviews:5200
},
{
name:"Samsung 27 inch 4K Monitor",
description:"Ultra HD monitor ideal for coding and design",
category:"monitors",
brand:"Samsung",
price:24000,
rating:4.7,
reviews:3600
},
{
name:"Noise Cancelling Earbuds",
description:"Wireless earbuds with active noise cancellation",
category:"audio",
brand:"Boat",
price:3500,
rating:4.3,
reviews:10800
},
{
name:"Ergonomic Office Chair",
description:"Comfortable office chair with lumbar support",
category:"office furniture",
brand:"GreenSoul",
price:8500,
rating:4.5,
reviews:2800
},
{
name:"USB-C Multiport Hub",
description:"7 in 1 USB-C hub with HDMI and USB ports",
category:"computer accessories",
brand:"Anker",
price:1500,
rating:4.4,
reviews:6500
},
{
name:"Portable SSD 1TB",
description:"High speed external SSD for backups and gaming",
category:"storage",
brand:"SanDisk",
price:9000,
rating:4.7,
reviews:5400
},
{
name:"Laptop Cooling Pad",
description:"Cooling stand with high speed fans for gaming laptops",
category:"laptop accessories",
brand:"Cosmic Byte",
price:1800,
rating:4.3,
reviews:2100
},
{
name:"HD Webcam 1080p",
description:"Full HD webcam for meetings and streaming",
category:"streaming gear",
brand:"Logitech",
price:2500,
rating:4.6,
reviews:7900
},
{
name:"Bluetooth Portable Speaker",
description:"Water resistant speaker with powerful bass",
category:"audio",
brand:"JBL",
price:2800,
rating:4.5,
reviews:9600
},
{
name:"Apple Magic Trackpad",
description:"Wireless trackpad designed for productivity",
category:"computer accessories",
brand:"Apple",
price:10000,
rating:4.6,
reviews:1800
},
{
name:"Samsung T7 Portable SSD",
description:"Ultra fast portable SSD for professionals",
category:"storage",
brand:"Samsung",
price:10500,
rating:4.8,
reviews:4200
},
{
name:"Graphic Drawing Tablet",
description:"Digital tablet for artists and designers",
category:"creative tools",
brand:"Wacom",
price:5200,
rating:4.7,
reviews:3300
},
{
name:"Gaming Headset with Mic",
description:"Surround sound gaming headset with microphone",
category:"gaming accessories",
brand:"HyperX",
price:3000,
rating:4.5,
reviews:4700
},
{
name:"Adjustable Laptop Stand",
description:"Aluminum stand for better laptop ergonomics",
category:"laptop accessories",
brand:"Portronics",
price:1400,
rating:4.4,
reviews:6200
},
{
name:"Wireless Charging Pad",
description:"Fast wireless charger for smartphones",
category:"mobile accessories",
brand:"Spigen",
price:1200,
rating:4.3,
reviews:5100
},
{
name:"Smart Fitness Watch",
description:"Smartwatch with heart rate and sleep tracking",
category:"wearables",
brand:"Amazfit",
price:5500,
rating:4.4,
reviews:6800
},
{
name:"Fitness Tracker Band",
description:"Affordable fitness band with activity tracking",
category:"wearables",
brand:"Noise",
price:1800,
rating:4.2,
reviews:9400
},
{
name:"USB Streaming Microphone",
description:"Professional microphone for podcasts and streaming",
category:"streaming gear",
brand:"Fifine",
price:4200,
rating:4.5,
reviews:3600
},
{
name:"LED Desk Lamp",
description:"Eye care desk lamp for studying and office work",
category:"office accessories",
brand:"Philips",
price:1600,
rating:4.4,
reviews:4100
},
{
name:"VR Gaming Headset",
description:"Virtual reality headset for immersive gaming",
category:"gaming hardware",
brand:"Meta",
price:15000,
rating:4.6,
reviews:2900
},
{
name:"WiFi 6 Router",
description:"High speed router for gaming and streaming",
category:"networking",
brand:"TP-Link",
price:6500,
rating:4.5,
reviews:5700
},
{
name:"External Hard Drive 2TB",
description:"Portable hard drive for storage and backups",
category:"storage",
brand:"Seagate",
price:7200,
rating:4.6,
reviews:7200
},
{
name:"Studio Monitoring Headphones",
description:"Professional headphones for music production",
category:"audio",
brand:"Audio Technica",
price:8200,
rating:4.7,
reviews:2400
}

]

const client = new MongoClient(process.env.MONGODB_URI)

await client.connect()

const db = client.db("ragDB")

for(const p of products){

const text = p.name + " " + p.description

const response = await fetch(
`https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${process.env.GEMINI_API_KEY}`,
{
method: "POST",
headers: {
"Content-Type": "application/json"
},
body: JSON.stringify({
content:{
parts:[
{ text: text }
]
}
})
}
)

const data = await response.json()

console.log("Gemini response:", data)

if(!data.embedding || !data.embedding.values){
throw new Error("Embedding API failed → " + JSON.stringify(data))
}

const embedding = data.embedding.values

const data = await response.json()

console.log("Gemini response:",data)

if (!data.embedding|| !ata.embeding.values){ 
throw new Error("Embedding API failes "+JSON.stringify(data))}

const embedding = data.embedding.values

await db.collection("products").insertOne({
...p,
embedding
})

}

res.json({message:"25 products inserted with embeddings"})

}catch(err){

console.error(err)
res.status(500).json({error:err.message})

}

}
