# 🛠️ VisionAI - Endüstriyel Hata Tespiti Projesi

Bu proje, **YOLOv8 tabanlı derin öğrenme modeli** kullanarak, endüstriyel üretim hatalarının otomatik olarak tespit edilmesini sağlar. Web tabanlı bir arayüz üzerinden kullanıcılar görüntü yükleyebilir ve yüklenen görsellerdeki olası hatalar model tarafından tespit edilerek görselleştirilir.

---

## 🎯 Proje Amacı
- İnsan kaynaklı hata payını azaltmak
- Kalite kontrol süreçlerini hızlandırmak
- Web arayüzü ile kullanıcı dostu analiz ortamı sağlamak

---

## 🔍 Özellikler
- 📤 Görsel yükleme (web üzerinden)
- 🧠 YOLOv8 ile gerçek zamanlı analiz
- 🖼️ Görsel üzerinde kutu içi hata gösterimi
- 📋 Sağ üst köşede tespit listesi (popup kart)
- 🌐 Responsive ve profesyonel UI

---

## ⚙️ Kullanılan Teknolojiler

### Backend:
- Python
- Flask
- YOLOv8 (Ultralytics)
- OpenCV, NumPy, YAML

### Frontend:
- React Native Web (Expo)
- JavaScript / TypeScript
- Axios, Image Picker

### Destek Araçlar:
- Roboflow (veri hazırlama)
- Git & GitHub (versiyon kontrol)

---

## 🚀 Kurulum

### 1. Depoyu klonlayın:
```bash
git clone https://github.com/kullaniciadi/hata-tespiti.git
cd hata-tespiti
```

### 2. Frontend Başlatma:
```bash
cd hata-tespiti
npm install
npm start
```


### 3. Backend Başlatma:
```bash
pip install -r requirements.txt
python app.py
```
Flask API: http://127.0.0.1:5000

---

## 🧪 Nasıl Çalışır?
1. Web arayüzü üzerinden görsel yüklenir
2. "Analiz Et" butonuna basılır
3. Görseldeki hatalar kutularla işaretlenir
4. Sağ üst köşede hata listesi kutusunda detaylar gösterilir

---

## 🗂️ Proje Yapısı
```
.
├── app/                 # React Native Web uygulaması
│   └── App.tsx         # Ana bileşen
├── backend/            # Flask sunucu
│   └── app.py          # YOLO model API
├── runs/               # YOLO eğitim sonuçları
│   └── best.pt         # Eğitilmiş model ağırlığı
├── data.yaml           # YOLO sınıf etiketleri
└── README.md           # Proje açıklaması
```

---

## 📈 Model Performansı
- Toplam Görsel: 681
- Sınıf Sayısı: 19
- mAP@50: 0.186
- Precision: 0.497
- Recall: 0.183
- Eğitim Süresi: 8.81 saat (CPU)

---

## 📌 Gelecek Geliştirmeler
- GPU ile eğitim sürecinin hızlandırılması
- Mobil cihaz desteği (React Native Mobile)
- Genişletilmiş veri seti ile yeniden eğitim
- Hata sonrası öneri sistemleri (OpenCV ile işaretleme)





