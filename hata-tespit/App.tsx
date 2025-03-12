import React, { useState } from "react";
import { 
  View, Button, Image, StyleSheet, ActivityIndicator, Alert, Text 
} from "react-native";
import * as ImagePicker from "react-native-image-picker";
import axios from "axios";

export default function IndexScreen() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 📌 Resim seçme fonksiyonu (Galeri veya Kamera)
  const pickImage = () => {
    ImagePicker.launchImageLibrary(
      { mediaType: "photo", includeBase64: false },
      (response) => {
        if (response.didCancel) {
          console.log("Kullanıcı işlemi iptal etti");
        } else if (response.errorMessage) {
          console.log("Hata:", response.errorMessage);
          Alert.alert("Hata", response.errorMessage);
        } else {
          let uri = response.assets?.[0]?.uri || "";
          setSelectedImage(uri);
          setProcessedImage(null);
          setErrorMessage(null);
        }
      }
    );
  };

  // 📌 YOLO Modelini Kullanarak Resmi Analiz Et
  const analyzeImage = async () => {
    if (!selectedImage) {
      Alert.alert("Lütfen bir resim seçin");
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    console.log("Resim analizi başlatıldı...");

    let formData = new FormData();
    formData.append("file", {
      uri: selectedImage,
      name: "image.jpg",
      type: "image/jpeg",
    } as any);

    try {
      const response = await axios.post("http://127.0.0.1:5000/detect", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        responseType: "blob",
      });

      console.log("Yanıt alındı!", response);

      // 📌 Resmi URL olarak ayarla
      let imageUrl = URL.createObjectURL(response.data);
      setProcessedImage(imageUrl);
    } catch (error: any) {
      console.error("Hata:", error);
      setErrorMessage("Analiz sırasında hata oluştu: " + error.message);
      Alert.alert("Hata", "Analiz sırasında bir hata meydana geldi.");
    }

    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📷 Hata Tespit Sistemi</Text>

      <Button title="Resim Seç" onPress={pickImage} />

      {selectedImage && (
        <>
          <Text>Seçilen Resim:</Text>
          <Image source={{ uri: selectedImage }} style={styles.image} />
        </>
      )}

      <Button title="Analiz Et" onPress={analyzeImage} />

      {loading && <ActivityIndicator size="large" color="#0000ff" />}

      {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}

      {processedImage && (
        <>
          <Text>Analiz Edilmiş Resim:</Text>
          <Image source={{ uri: processedImage }} style={styles.image} />
        </>
      )}
    </View>
  );
}

// 📌 Stiller
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
  },
  image: {
    width: 300,
    height: 300,
    marginVertical: 10,
    borderRadius: 10,
  },
  errorText: {
    color: "red",
    marginTop: 10,
    fontWeight: "bold",
  },
});

