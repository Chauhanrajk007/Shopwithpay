import React,{useState} from "https://esm.sh/react"

export default function VoiceSearch(){

const [query,setQuery] = useState("")

function startVoice(){

const recognition = new webkitSpeechRecognition()

recognition.onresult = e => {

const text = e.results[0][0].transcript

setQuery(text)

}

recognition.start()

}

return(

<div className="flex gap-2 mb-6">

<input
className="flex-1 p-3 border rounded"
value={query}
onChange={e=>setQuery(e.target.value)}
placeholder="Search product..."
/>

<button
onClick={startVoice}
className="bg-blue-500 text-white px-4 rounded"
>
🎤
</button>

</div>

)

}
