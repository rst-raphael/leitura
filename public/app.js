let user = JSON.parse(localStorage.getItem("user"))

function startApp(){

const name = document.getElementById("name").value
const age = document.getElementById("age").value

user={
name,
age,
points:0,
streak:1,
lastDay:new Date().toDateString()
}

localStorage.setItem("user",JSON.stringify(user))

loadDashboard()

}


function loadDashboard(){

document.getElementById("setup").classList.add("hidden")
document.getElementById("lesson").classList.add("hidden")
document.getElementById("dashboard").classList.remove("hidden")

document.getElementById("welcome").innerText="Olá "+user.name
document.getElementById("points").innerText=user.points
document.getElementById("streak").innerText=user.streak

}


async function startLesson(){

document.getElementById("dashboard").classList.add("hidden")
document.getElementById("lesson").classList.remove("hidden")

const res = await fetch("/generate-text",{
method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify({age:user.age})
})

const data = await res.json()

document.getElementById("text").innerText=data.text

}


function record(){

const SpeechRecognition =
window.SpeechRecognition || window.webkitSpeechRecognition

let recognition = new SpeechRecognition()

recognition.lang="pt-BR"

recognition.start()

recognition.onresult = async function(event){

let spoken = event.results[0][0].transcript

let expected = document.getElementById("text").innerText

const res = await fetch("/evaluate-reading",{
method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify({expected,spoken})
})

const data = await res.json()

document.getElementById("result").innerText=data.analysis

user.points+=10
localStorage.setItem("user",JSON.stringify(user))

}

}


function back(){
loadDashboard()
}

if(user){
loadDashboard()
}