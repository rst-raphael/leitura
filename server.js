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
Vocabulário adequado à idade, educativo e divertido.
`

try {
  const completion = await openai.chat.completions.create({
    model:"gpt-4o-mini",
    messages:[{role:"user",content:prompt}]
  })

  res.json({
    text:completion.choices[0].message.content
  })
} catch (error) {
  console.error("OpenAI Error:", error)
  res.status(500).json({ error: "Erro ao gerar texto" })
}

})


app.post("/evaluate-reading", async (req,res)=>{

const {expected,spoken} = req.body

const prompt = `
Aja como um professor de leitura paciente e incentivador para uma criança.
Texto esperado: "${expected}"
O que a criança falou: "${spoken}"

Avalie a leitura comparando os dois textos.
Seja positivo! Se houver muitos erros, foque em um ponto de melhoria.
Retorne um feedback curto (máximo 2 frases) diretamente para a criança.
Exemplo: "Muito bem! Você leu quase tudo certinho, só precisamos praticar um pouco mais a palavra 'casa'."
`

try {
  const completion = await openai.chat.completions.create({
    model:"gpt-4o-mini",
    messages:[{role:"user",content:prompt}]
  })

  res.json({
    analysis:completion.choices[0].message.content
  })
} catch (error) {
  console.error("OpenAI Error:", error)
  res.status(500).json({ error: "Erro ao avaliar leitura" })
}

})


app.listen(3000,()=>{
console.log("Servidor rodando em http://localhost:3000")
})