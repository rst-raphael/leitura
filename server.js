import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import OpenAI from "openai"

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())
app.use(express.static("public"))

const openai = new OpenAI({
apiKey: process.env.OPENAI_API_KEY
})


app.post("/generate-text", async (req,res)=>{

const {age} = req.body

const prompt = `
Crie um pequeno texto de leitura para uma criança de ${age} anos.
Máximo 4 frases.
Vocabulário adequado à idade.
`

const completion = await openai.chat.completions.create({
model:"gpt-4.1-mini",
messages:[{role:"user",content:prompt}]
})

res.json({
text:completion.choices[0].message.content
})

})


app.post("/evaluate-reading", async (req,res)=>{

const {expected,spoken} = req.body

const prompt = `
Texto esperado:
${expected}

Texto falado:
${spoken}

Avalie a leitura.

Retorne:
accuracy (0-100)
fluency (0-10)
pronunciation (0-10)
feedback curto para criança
`

const completion = await openai.chat.completions.create({
model:"gpt-4.1-mini",
messages:[{role:"user",content:prompt}]
})

res.json({
analysis:completion.choices[0].message.content
})

})


app.listen(3000,()=>{
console.log("Servidor rodando em http://localhost:3000")
})