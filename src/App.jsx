import React from "https://esm.sh/react"
import VoiceSearch from "./VoiceSearch.jsx"
import ProductList from "./ProductList.jsx"

export default function App(){

return(

<div className="max-w-5xl mx-auto p-6">

<h1 className="text-3xl font-bold mb-6">
Agentic Wallet Store
</h1>

<VoiceSearch/>

<ProductList/>

</div>

)

}
