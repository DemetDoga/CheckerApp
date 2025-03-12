import React, { useState } from "react";
import { View, Button, Image, Text, Platform, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";

export default function App() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [detections, setDetections] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // 📌 Kullanıcının resim seçmesini sağlayan fonksiyon
  const pickImage = async () => {
    if (Platform.OS === "web") {
      // 💻 Web için dosya yükleme
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.onchange = (event: any) => {
        const file = event.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = () => setSelectedImage(reader.result as string);
          reader.readAsDataURL(file);
        }
      };
      input.click();
    } else {
      // 📱 Mobil için galeri açma
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled) {
        setSelectedImage(result.assets[0].uri);
      }
    }
  };

  const analyzeImage = async () => {
    if (!selectedImage) {
        Alert.alert("Hata", "Lütfen bir resim seçin!");
        return;
    }

    setLoading(true);
    setDetections([]);

    let formData = new FormData();

    if (Platform.OS === "web") {
        const response = await fetch(selectedImage);
        const blob = await response.blob();
        formData.append("file", new File([blob], "image.jpg", { type: "image/jpeg" }));
    } else {
        formData.append("file", {
            uri: selectedImage,
            name: "image.jpg",
            type: "image/jpeg",
        } as any);
    }

    try {
        const response = await axios.post("http://127.0.0.1:5000/detect", formData, {
            headers: {
                "Content-Type": "multipart/form-data",
                Accept: "application/json",
            },
        });

        console.log("✅ API Yanıtı:", response.data); // 🔥 API'den gelen yanıtı konsola yaz

        setDetections(response.data.detections);

        Alert.alert("Başarılı", "Resim analizi tamamlandı!");
    } catch (error: any) {
        console.error("❌ Hata:", error.response?.data || error.message);
        Alert.alert("Hata", error.response?.data?.error || "Bir hata oluştu.");
    }

    setLoading(false);
};


  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 20 }}>
      <Button title="Resim Seç" onPress={pickImage} />
      
      {selectedImage && (
        <Image source={{ uri: selectedImage }} style={{ width: 200, height: 200, margin: 10 }} />
      )}

      <Button title="Analiz Et" onPress={analyzeImage} disabled={!selectedImage || loading} />

      {/* Sonuçları ekranda göster */}
      {detections.length > 0 && (
        <View style={{ marginTop: 20, padding: 10, backgroundColor: "#f0f0f0", borderRadius: 5 }}>
          <Text style={{ fontSize: 16, fontWeight: "bold" }}>Tespit Edilen Hatalar:</Text>
          {detections.map((det, index) => (
            <Text key={index} style={{ marginTop: 5 }}>
              🛑 Hata: {det.class} | Güven: {(det.confidence * 100).toFixed(2)}% | 
              Koordinatlar: {det.bbox.join(", ")}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}
