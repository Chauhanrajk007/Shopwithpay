const products = [

{ id:1, name:"Gaming Mouse", price:10, img:"https://picsum.photos/200?1" },
{ id:2, name:"Mechanical Keyboard", price:20, img:"https://picsum.photos/200?2" },
{ id:3, name:"Wireless Headphones", price:15, img:"https://picsum.photos/200?3" },
{ id:4, name:"Smart Watch", price:30, img:"https://picsum.photos/200?4" },
{ id:5, name:"Laptop Stand", price:12, img:"https://picsum.photos/200?5" },
{ id:6, name:"Phone Holder", price:8, img:"https://picsum.photos/200?6" },
{ id:7, name:"USB Hub", price:9, img:"https://picsum.photos/200?7" },
{ id:8, name:"Gaming Chair", price:40, img:"https://picsum.photos/200?8" },
{ id:9, name:"Webcam", price:18, img:"https://picsum.photos/200?9" },
{ id:10, name:"LED Monitor", price:50, img:"https://picsum.photos/200?10" }

];

const container = document.getElementById("products");

products.forEach(p => {

container.innerHTML += `

<div class="bg-white p-4 rounded-xl shadow">

<img src="${p.img}" class="rounded mb-3">

<h2 class="font-semibold">${p.name}</h2>

<p class="text-gray-600">₹${p.price}</p>

<button onclick="pay(${p.price})"
class="mt-3 bg-black text-white px-4 py-2 rounded">
Buy Now
</button>

</div>

`;

});
