// Configuração da API OpenAI (Atenção: No GitHub Pages sua chave ficará visível no código)
let OPENAI_API_KEY = localStorage.getItem("openai_api_key") || "";

let user = JSON.parse(localStorage.getItem("leitura_user"));

function saveApiKey() {
  const key = document.getElementById("api-key-input").value;
  if (key.startsWith("sk-")) {
    localStorage.setItem("openai_api_key", key);
    OPENAI_API_KEY = key;
    checkInitialState();
  } else {
    alert("Por favor, insira uma chave válida da OpenAI (começando com sk-).");
  }
}

function checkInitialState() {
  // Esconder tudo primeiro
  document.getElementById("api-config").classList.add("hidden");
  document.getElementById("setup").classList.add("hidden");
  document.getElementById("dashboard").classList.add("hidden");
  document.getElementById("lesson").classList.add("hidden");

  if (!OPENAI_API_KEY) {
    document.getElementById("api-config").classList.remove("hidden");
  } else if (!user) {
    document.getElementById("setup").classList.remove("hidden");
  } else {
    loadDashboard();
  }
}

function startApp() {
  const name = document.getElementById("name").value;
  const age = document.getElementById("age").value;

  if (!name || !age) {
    alert("Por favor, preencha seu nome e idade.");
    return;
  }

  user = {
    name,
    age,
    points: 0,
    streak: 0,
    lastDay: null
  };

  saveUser();
  loadDashboard();
}

function saveUser() {
  localStorage.setItem("leitura_user", JSON.stringify(user));
}

function resetUser() {
  if (confirm("Tem certeza que deseja trocar de usuário? Seus dados serão perdidos.")) {
    localStorage.removeItem("leitura_user");
    user = null;
    checkInitialState();
  }
}

function loadDashboard() {
  if (!user) return;

  updateStreak();

  document.getElementById("setup").classList.add("hidden");
  document.getElementById("lesson").classList.add("hidden");
  document.getElementById("dashboard").classList.remove("hidden");

  document.getElementById("welcome").innerText = "Olá, " + user.name + "! 👋";
  document.getElementById("points-val").innerText = user.points;
  document.getElementById("streak-val").innerText = user.streak;
}

function updateStreak() {
  const today = new Date().toDateString();
  const lastDay = user.lastDay;

  if (lastDay === today) return;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toDateString();

  if (lastDay !== yesterdayStr && lastDay) {
    user.streak = 0;
    saveUser();
  }
}

function incrementStreak() {
  const today = new Date().toDateString();
  if (user.lastDay !== today) {
    user.streak += 1;
    user.lastDay = today;
    saveUser();
  }
}

async function callOpenAI(prompt) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }]
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error.message || "Erro na API da OpenAI");
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function startLesson() {
  document.getElementById("dashboard").classList.add("hidden");
  document.getElementById("lesson").classList.remove("hidden");
  document.getElementById("loader").classList.remove("hidden");
  document.getElementById("lesson-content").classList.add("hidden");
  document.getElementById("result-feedback").classList.add("hidden");
  document.getElementById("record-btn").classList.remove("hidden");
  document.getElementById("next-btn").classList.add("hidden");

  const prompt = `Crie um pequeno texto de leitura para uma criança de ${user.age} anos. Máximo 4 frases. Vocabulário adequado à idade, educativo e divertido.`;

  try {
    const text = await callOpenAI(prompt);
    document.getElementById("text-display").innerText = text;
  } catch (err) {
    alert("Erro: " + err.message);
    back();
  } finally {
    document.getElementById("loader").classList.add("hidden");
    document.getElementById("lesson-content").classList.remove("hidden");
  }
}

function record() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    alert("Seu navegador não suporta reconhecimento de voz. Tente usar o Chrome.");
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = "pt-BR";
  
  const recordBtn = document.getElementById("record-btn");
  recordBtn.innerText = "🎧 Escutando...";
  recordBtn.classList.add("outline");
  recordBtn.disabled = true;

  recognition.start();

  recognition.onresult = async function(event) {
    const spoken = event.results[0][0].transcript;
    const expected = document.getElementById("text-display").innerText;

    recordBtn.innerText = "⏳ Analisando...";

    const prompt = `Aja como um professor de leitura paciente e incentivador para uma criança. Texto esperado: "${expected}". O que a criança falou: "${spoken}". Avalie a leitura comparando os dois textos. Seja positivo! Se houver muitos erros, foque em um ponto de melhoria. Retorne um feedback curto (máximo 2 frases) diretamente para a criança.`;

    try {
      const analysis = await callOpenAI(prompt);
      showFeedback(analysis);
      
      user.points += 10;
      incrementStreak();
      
      recordBtn.classList.add("hidden");
      document.getElementById("next-btn").classList.remove("hidden");
    } catch (err) {
      alert("Erro ao avaliar: " + err.message);
      recordBtn.innerText = "🎤 Tentar Novamente";
      recordBtn.disabled = false;
    }
  };

  recognition.onerror = function() {
    alert("Não conseguimos ouvir você. Tente novamente!");
    recordBtn.innerText = "🎤 Começar a Ler";
    recordBtn.classList.remove("outline");
    recordBtn.disabled = false;
  };
}

function showFeedback(analysis) {
  const feedbackDiv = document.getElementById("result-feedback");
  feedbackDiv.classList.remove("hidden");
  feedbackDiv.innerText = analysis;
  
  const positiveWords = ["parabéns", "muito bem", "excelente", "ótimo", "incrivel", "parabens", "otimo"];
  const lowerAnalysis = analysis.toLowerCase();
  const isPositive = positiveWords.some(word => lowerAnalysis.includes(word));
  
  feedbackDiv.className = isPositive ? "feedback-good" : "feedback-neutral";
}

function back() {
  loadDashboard();
}

// Inicializar o app
checkInitialState();
