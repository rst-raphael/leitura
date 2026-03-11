// Configuração da API do Google Gemini (IA Gratuita)
let GEMINI_API_KEY = localStorage.getItem("gemini_api_key") || "";
let user = JSON.parse(localStorage.getItem("leitura_user"));

function saveApiKey() {
  const key = document.getElementById("api-key-input").value;
  if (key) {
    localStorage.setItem("gemini_api_key", key);
    GEMINI_API_KEY = key;
    checkInitialState();
  } else {
    alert("Por favor, insira uma chave válida do Gemini.");
  }
}

function changeApiKey() {
  const newKey = prompt("Insira sua nova Gemini API Key:");
  if (newKey) {
    localStorage.setItem("gemini_api_key", newKey);
    location.reload();
  }
}

function checkInitialState() {
  document.getElementById("api-config").classList.add("hidden");
  document.getElementById("setup").classList.add("hidden");
  document.getElementById("dashboard").classList.add("hidden");
  document.getElementById("lesson").classList.add("hidden");

  if (!GEMINI_API_KEY) {
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
  if (!name || !age) return alert("Preencha seu nome e idade.");
  user = { name, age, points: 0, streak: 0, lastDay: null };
  saveUser();
  loadDashboard();
}

function saveUser() {
  localStorage.setItem("leitura_user", JSON.stringify(user));
}

function resetUser() {
  if (confirm("Trocar de usuário? Seus pontos serão zerados.")) {
    localStorage.removeItem("leitura_user");
    user = null;
    checkInitialState();
  }
}

function loadDashboard() {
  if (!user) return;
  updateStreak();
  document.getElementById("setup").classList.add("hidden");
  document.getElementById("dashboard").classList.remove("hidden");
  document.getElementById("welcome").innerText = "Olá, " + user.name + "! 👋";
  document.getElementById("points-val").innerText = user.points;
  document.getElementById("streak-val").innerText = user.streak;
}

function updateStreak() {
  const today = new Date().toDateString();
  const lastDay = user.lastDay;
  if (lastDay !== today && lastDay) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (lastDay !== yesterday.toDateString()) {
      user.streak = 0;
      saveUser();
    }
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

// Chamada para a API do Google Gemini
async function callGemini(prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
  
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error.message || "Erro no Gemini. Verifique sua chave.");
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

async function startLesson() {
  document.getElementById("dashboard").classList.add("hidden");
  document.getElementById("lesson").classList.remove("hidden");
  document.getElementById("loader").classList.remove("hidden");
  document.getElementById("lesson-content").classList.add("hidden");
  document.getElementById("result-feedback").classList.add("hidden");
  document.getElementById("record-btn").classList.remove("hidden");
  document.getElementById("next-btn").classList.add("hidden");

  const prompt = `Crie uma frase curta de leitura para uma criança de ${user.age} anos. A frase deve ser divertida e educativa. Retorne APENAS a frase, sem nada antes ou depois.`;

  try {
    const text = await callGemini(prompt);
    document.getElementById("text-display").innerText = text;
  } catch (err) {
    alert(err.message);
    back();
  } finally {
    document.getElementById("loader").classList.add("hidden");
    document.getElementById("lesson-content").classList.remove("hidden");
  }
}

function record() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) return alert("Seu navegador não suporta voz.");

  const recognition = new SpeechRecognition();
  recognition.lang = "pt-BR";
  const recordBtn = document.getElementById("record-btn");
  recordBtn.innerText = "🎧 Escutando...";
  recordBtn.disabled = true;
  recognition.start();

  recognition.onresult = async function(event) {
    const spoken = event.results[0][0].transcript;
    const expected = document.getElementById("text-display").innerText;
    recordBtn.innerText = "⏳ IA Analisando...";

    const prompt = `Aja como um professor de leitura carinhoso para uma criança. Texto esperado: "${expected}". Texto falado pela criança: "${spoken}". Avalie de forma positiva. Se houver erro, aponte um de forma amigável. Retorne um feedback curto de no máximo 2 frases diretamente para a criança.`;

    try {
      const feedback = await callGemini(prompt);
      showFeedback(feedback);
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

  recognition.onerror = () => {
    alert("Não ouvi você. Tente novamente.");
    recordBtn.innerText = "🎤 Começar a Ler";
    recordBtn.disabled = false;
  };
}

function showFeedback(text) {
  const feedbackDiv = document.getElementById("result-feedback");
  feedbackDiv.classList.remove("hidden");
  feedbackDiv.innerText = text;
  
  const positiveWords = ["parabéns", "muito bem", "excelente", "ótimo", "bom"];
  const isPositive = positiveWords.some(w => text.toLowerCase().includes(w));
  feedbackDiv.className = isPositive ? "feedback-good" : "feedback-neutral";
}

function back() { loadDashboard(); }

checkInitialState();
