import React,{useState} from "https://esm.sh/react"

const products=[

{ id:1, name:"Gaming Mouse", price:1200 },
{ id:2, name:"Mechanical Keyboard", price:2500 },
{ id:3, name:"Wireless Headphones", price:1800 },
{ id:4, name:"Laptop Stand", price:900 }

]

export default function ProductList(){

const [items,setItems]=useState(products)

return(

<div className="grid grid-cols-2 gap-4">

{items.map(p=>(

<div
key={p.id}
className="bg-white shadow p-4 rounded"
>

<h2 className="font-semibold">{p.name}</h2>

<p className="text-gray-500">₹{p.price}</p>

<button
className="mt-2 bg-green-500 text-white px-3 py-1 rounded"
onClick={()=>buy(p.price)}
>

Buy

</button>

</div>

))}

</div>

)

}

async function buy(price){

const res = await fetch("/api/create-order",{

method:"POST",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({amount:price})

})

const data = await res.json()

const options={

key:data.key,

amount:data.order.amount,

currency:"INR",

order_id:data.order.id,

handler:function(){

alert("Payment Successful")

}

}

const rzp=new Razorpay(options)

rzp.open()

}
