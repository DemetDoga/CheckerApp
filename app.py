from flask import Flask, request, jsonify
import os
from ultralytics import YOLO
from werkzeug.utils import secure_filename
from flask_cors import CORS
import yaml

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# 📌 **DATA.YAML'dan HATA SINIFLARINI OKU**
DATA_YAML_PATH = "data.yaml"  # Eğer dosyanın konumu farklıysa, güncelle
with open(DATA_YAML_PATH, "r") as f:
    data_yaml = yaml.safe_load(f)
CLASS_NAMES = data_yaml["names"]  # Hata isimlerini al

# 📌 **YOLOv8 Modelini Yükle**
MODEL_PATH = "runs/detect/train/weights/best.pt"
if not os.path.exists(MODEL_PATH):
    raise FileNotFoundError(f"❌ Model dosyası bulunamadı: {MODEL_PATH}")

model = YOLO(MODEL_PATH)

@app.route('/detect', methods=['POST'])
def detect():
    try:
        if "file" not in request.files:
            return jsonify({"error": "❌ Dosya yüklenmedi, 'file' anahtarı eksik!"}), 400

        file = request.files["file"]

        if file.filename == "":
            return jsonify({"error": "❌ Seçili dosya yok!"}), 400

        filename = secure_filename(file.filename)
        file_path = os.path.join(UPLOAD_FOLDER, filename)
        file.save(file_path)

        print(f"✅ Dosya başarıyla yüklendi: {file_path}")

        # 📌 **YOLO Modeliyle görüntüyü analiz et**
        results = model.predict(file_path)

        detections = []
        for r in results:
            for box in r.boxes:
                class_index = int(box.cls[0].item())  # Hata sınıfı index
                class_name = CLASS_NAMES[class_index]  # 📌 **Gerçek hata ismini al**

                detections.append({
                    "class": class_name,  # 📌 **Artık sayısal index yerine hata ismi**
                    "confidence": round(float(box.conf[0].item()) * 100, 2),  # 📌 Yüzdelik format
                    "bbox": [round(float(x), 2) for x in box.xyxy[0].tolist()]  # 📌 Koordinatları yuvarla
                })

        return jsonify({
            "message": "✅ Analiz tamamlandı!",
            "filename": filename,
            "detections": detections
        }), 200

    except Exception as e:
        print(f"❌ Sunucu hatası: {e}")
        return jsonify({"error": f"❌ Sunucu hatası: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(debug=True)
