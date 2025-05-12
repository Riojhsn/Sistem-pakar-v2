// chatbot.js
let allDiseases = [];
let remainingDiseases = [];
let askedSymptoms = new Set();
let confirmedSymptoms = [];

async function startSmartChat() {
  const res = await fetch("/chatbot/data");
  allDiseases = await res.json();
  remainingDiseases = [...allDiseases];
  askedSymptoms = new Set();
  confirmedSymptoms = [];
  conversation = [];
  askRelevantSymptom();
}

function askRelevantSymptom() {
  const symptomCount = {};
  remainingDiseases.forEach(disease => {
    disease.gejala.forEach(g => {
      if (!askedSymptoms.has(g)) {
        symptomCount[g] = (symptomCount[g] || 0) + 1;
      }
    });
  });

  const nextSymptom = Object.entries(symptomCount)
    .sort((a, b) => b[1] - a[1])
    .map(entry => entry[0])[0];

  if (!nextSymptom) {
    sendToDiagnoseSmart();
    return;
  }

  askedSymptoms.add(nextSymptom);
  conversation.push({ type: "bot", text: `Apakah Anda mengalami: ${nextSymptom}? (ya/tidak)` });
  renderChat();
}

function handleUserInput(text) {
  if (!text.trim()) return;
  conversation.push({ type: "user", text });

  const lastBot = conversation.filter(c => c.type === "bot").slice(-1)[0];
  const gejalaName = lastBot?.text?.match(/: (.+)\?/)[1];

  if (!gejalaName) return;

  if (text.toLowerCase() === "ya") {
    confirmedSymptoms.push(gejalaName);
  } else {
    // eliminasi semua penyakit yang mengandung gejala ini
    remainingDiseases = remainingDiseases.filter(p => !p.gejala.includes(gejalaName));
  }

  askRelevantSymptom();
}

function sendToDiagnoseSmart() {
  fetch("/chatbot-diagnosa", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ gejala: confirmedSymptoms })
  })
  .then(res => res.json())
  .then(data => {
    if (data.length > 0) {
      conversation.push({ type: "bot", text: `Kemungkinan penyakit Anda:` });
      data.forEach(d => {
        conversation.push({ type: "bot", text: `${d.penyakit} (${d.keyakinan}%)` });
      });
    } else {
      conversation.push({ type: "bot", text: "Tidak ditemukan penyakit yang cocok." });
    }
    renderChat();
  });
}

function renderChat() {
  const box = document.getElementById("chatbox");
  box.innerHTML = "";
  conversation.forEach(c => {
    const el = document.createElement("div");
    el.className = c.type;
    el.innerText = c.text;
    box.appendChild(el);
  });
  box.scrollTop = box.scrollHeight;
}