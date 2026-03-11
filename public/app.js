let user = JSON.parse(localStorage.getItem("leitura_user"))

function startApp() {
  const name = document.getElementById("name").value
  const age = document.getElementById("age").value

  if (!name || !age) {
    alert("Por favor, preencha seu nome e idade.")
    return
  }

  user = {
    name,
    age,
    points: 0,
    streak: 0,
    lastDay: null
  }

  saveUser()
  loadDashboard()
}

function saveUser() {
  localStorage.setItem("leitura_user", JSON.stringify(user))
}

function resetUser() {
  if (confirm("Tem certeza que deseja trocar de usuário? Seus dados serão perdidos.")) {
    localStorage.removeItem("leitura_user")
    location.reload()
  }
}

function loadDashboard() {
  if (!user) return

  // Check streak
  updateStreak()

  document.getElementById("setup").classList.add("hidden")
  document.getElementById("lesson").classList.add("hidden")
  document.getElementById("dashboard").classList.remove("hidden")

  document.getElementById("welcome").innerText = "Olá, " + user.name + "! 👋"
  document.getElementById("points-val").innerText = user.points
  document.getElementById("streak-val").innerText = user.streak
}

function updateStreak() {
  const today = new Date().toDateString()
  const lastDay = user.lastDay

  if (lastDay === today) {
    // Already did today, streak is fine
    return
  }

  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toDateString()

  if (lastDay === yesterdayStr) {
    // Continued streak, but didn't finish today's task yet
    // This will be updated when a lesson is finished
  } else if (lastDay) {
    // Streak broken
    user.streak = 0
    saveUser()
  }
}

function incrementStreak() {
  const today = new Date().toDateString()
  if (user.lastDay !== today) {
    user.streak += 1
    user.lastDay = today
    saveUser()
  }
}

async function startLesson() {
  document.getElementById("dashboard").classList.add("hidden")
  document.getElementById("lesson").classList.remove("hidden")
  document.getElementById("loader").classList.remove("hidden")
  document.getElementById("lesson-content").classList.add("hidden")
  document.getElementById("result-feedback").classList.add("hidden")
  document.getElementById("record-btn").classList.remove("hidden")
  document.getElementById("next-btn").classList.add("hidden")

  try {
    const res = await fetch("/generate-text", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ age: user.age })
    })

    const data = await res.json()
    document.getElementById("text-display").innerText = data.text
  } catch (err) {
    document.getElementById("text-display").innerText = "Ops! Erro ao carregar o texto. Tente novamente."
  } finally {
    document.getElementById("loader").classList.add("hidden")
    document.getElementById("lesson-content").classList.remove("hidden")
  }
}

function record() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

  if (!SpeechRecognition) {
    alert("Seu navegador não suporta reconhecimento de voz. Tente usar o Chrome.")
    return
  }

  const recognition = new SpeechRecognition()
  recognition.lang = "pt-BR"
  
  const recordBtn = document.getElementById("record-btn")
  recordBtn.innerText = "🎧 Escutando..."
  recordBtn.classList.add("outline")
  recordBtn.disabled = true

  recognition.start()

  recognition.onresult = async function(event) {
    const spoken = event.results[0][0].transcript
    const expected = document.getElementById("text-display").innerText

    recordBtn.innerText = "⏳ Analisando..."

    try {
      const res = await fetch("/evaluate-reading", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expected, spoken })
      })

      const data = await res.json()
      showFeedback(data.analysis)
      
      // Points and Streak logic
      user.points += 10
      incrementStreak()
      
      recordBtn.classList.add("hidden")
      document.getElementById("next-btn").classList.remove("hidden")
    } catch (err) {
      alert("Erro ao avaliar a leitura.")
      recordBtn.innerText = "🎤 Tentar Novamente"
      recordBtn.disabled = false
    }
  }

  recognition.onerror = function() {
    alert("Não conseguimos ouvir você. Tente novamente!")
    recordBtn.innerText = "🎤 Começar a Ler"
    recordBtn.classList.remove("outline")
    recordBtn.disabled = false
  }
}

function showFeedback(analysis) {
  const feedbackDiv = document.getElementById("result-feedback")
  feedbackDiv.classList.remove("hidden")
  feedbackDiv.innerText = analysis
  
  // Heuristic for feedback color based on positive keywords
  const positiveWords = ["parabéns", "muito bem", "excelente", "ótimo", "incrivel", "parabens", "otimo"]
  const lowerAnalysis = analysis.toLowerCase()
  
  const isPositive = positiveWords.some(word => lowerAnalysis.includes(word))
  
  if (isPositive) {
    feedbackDiv.className = "feedback-good"
  } else {
    feedbackDiv.className = "feedback-neutral"
  }
}

function back() {
  loadDashboard()
}

// Check if user exists on load
if (user) {
  loadDashboard()
}
