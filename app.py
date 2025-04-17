from flask import Flask, request, jsonify
import os
from ultralytics import YOLO
from werkzeug.utils import secure_filename
from flask_cors import CORS
import yaml
import cv2  # Görüntü işleme için eklendi

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

DATA_YAML_PATH = "data.yaml"  
with open(DATA_YAML_PATH, "r") as f:
    data_yaml = yaml.safe_load(f)
CLASS_NAMES = data_yaml["names"]  

MODEL_PATH = "runs/detect/train2/weights/best.pt"
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

        # Görüntünün orijinal boyutlarını al
        img = cv2.imread(file_path)
        h, w, _ = img.shape  # Yükseklik ve genişliği al

        results = model.predict(file_path)

        detections = []
        for r in results:
            for box in r.boxes:
                class_index = int(box.cls[0].item())  
                class_name = CLASS_NAMES[class_index]  

                # Farklı bbox formatlarını test etmek için yazdır
                xyxy_bbox = [round(float(x), 2) for x in box.xyxy[0].tolist()]
                xywh_bbox = [round(float(x), 2) for x in box.xywh[0].tolist()]
                xyxyn_bbox = box.xyxyn[0].tolist()  # Normalize bbox

                # Normalize bbox'u orijinal boyutlara çevir
                denormalized_bbox = [
                    round(xyxyn_bbox[0] * w, 2),  # x_min
                    round(xyxyn_bbox[1] * h, 2),  # y_min
                    round(xyxyn_bbox[2] * w, 2),  # x_max
                    round(xyxyn_bbox[3] * h, 2)   # y_max
                ]

                print(f"Class: {class_name}, XYXY: {xyxy_bbox}, XYWH: {xywh_bbox}, XYXY Normalized: {xyxyn_bbox}, Denormalized: {denormalized_bbox}")

                detections.append({
                    "class": class_name,
                    "confidence": round(float(box.conf[0].item()), 2),
                    "bbox": denormalized_bbox  # Normalize edilmiş koordinatları gerçek boyuta çevirdik
                })

        return jsonify({
    "message": "✅ Analiz tamamlandı!",
    "filename": filename,
    "detections": detections,
    "image_size": {"width": w, "height": h}
}), 200


    except Exception as e:
        print(f"❌ Sunucu hatası: {e}")
        return jsonify({"error": f"❌ Sunucu hatası: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(debug=True)
