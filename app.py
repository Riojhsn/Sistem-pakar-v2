from flask import Flask, jsonify, render_template, request
import json

app = Flask(__name__)

# Baca file JSON sebagai basis pengetahuan
with open('data/basis_pengetahuan.json', 'r', encoding='utf-8') as f:
    knowledge_base = json.load(f)

# Kumpulkan semua gejala unik
all_symptoms = sorted(set(g for penyakit in knowledge_base for g in penyakit['gejala']))

# Fungsi forward chaining
def forward_chaining(input_symptoms):
    hasil_diagnosa = []
    for penyakit in knowledge_base:
        nama = penyakit['nama']
        gejala_penyakit = penyakit['gejala']
        cocok = [g for g in input_symptoms if g in gejala_penyakit]

        if cocok:
            persen = round((len(cocok) / len(gejala_penyakit)) * 100)
            hasil_diagnosa.append({
                'penyakit': nama,
                'keyakinan': persen,
                'gejala_cocok': cocok
            })
    hasil_diagnosa.sort(key=lambda x: x['keyakinan'], reverse=True)
    return hasil_diagnosa

@app.route('/')
def index():
    return render_template('index.html', semua_gejala=all_symptoms)

@app.route('/hasil', methods=['POST'])
def hasil():
    gejala_terpilih = request.form.getlist('gejala')
    hasil = forward_chaining(gejala_terpilih)
    return render_template('hasil.html', hasil=hasil, gejala=gejala_terpilih)

@app.route('/gejala')
def get_gejala():
    return jsonify(all_symptoms)

@app.route("/chatbot/data")
def chatbot_data():
    return jsonify(knowledge_base)


@app.route('/chatbot-diagnosa', methods=['POST'])
def chatbot_diagnosa():
    data = request.get_json()
    gejala_terpilih = data.get("gejala", [])
    hasil = forward_chaining(gejala_terpilih)
    return jsonify(hasil)


if __name__ == '__main__':
    app.run(debug=True)
