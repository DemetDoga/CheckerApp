import React, { useState } from "react";
import {
  View,
  Text,
  Platform,
  Alert,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  Image,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";
import { Ionicons } from "@expo/vector-icons";
import { ImageBackground } from "react-native";

export default function App() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [detections, setDetections] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [imageNaturalSize, setImageNaturalSize] = useState({ width: 1, height: 1 });
  const [displayedImageSize, setDisplayedImageSize] = useState({ width: 1, height: 1 });

  const pickImage = async () => {
    if (Platform.OS === "web") {
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
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled) {
        const uri = result.assets[0].uri;
        setSelectedImage(uri);
        Image.getSize(uri, (width, height) => {
          setImageNaturalSize({ width, height });
        });
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

      if (response.data && response.data.detections) {
        setDetections(response.data.detections);
        if (Platform.OS === "web") {
          setImageNaturalSize(response.data.image_size);
        }
        Alert.alert("Başarılı", "Resim analizi tamamlandı!");
      } else {
        Alert.alert("Hata", "Tespitler alınamadı.");
      }
    } catch (error: any) {
      console.error("Hata:", error.response?.data || error.message);
      Alert.alert("Hata", error.response?.data?.error || "Bir hata oluştu.");
    }

    setLoading(false);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Görüntü Analiz Uygulaması</Text>
        <Text style={styles.headerSubtitle}>Kalite Kontrol ve Hata Tespit Sistemi</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Resim Yükleme</Text>

        <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
          <Ionicons name="cloud-upload" size={24} color="#fff" />
          <Text style={styles.uploadButtonText}>Resim Seç</Text>
        </TouchableOpacity>

        {selectedImage && (
          <View style={styles.imageContainer}>
            <ImageBackground
              source={{ uri: selectedImage }}
              style={styles.imageBackground}
              resizeMode="contain"
              onLayout={(event) => {
                const { width, height } = event.nativeEvent.layout;
                setDisplayedImageSize({ width, height });
              }}
            >
              {detections.map((det, index) => {
                const imageRatio = imageNaturalSize.width / imageNaturalSize.height;
                const displayRatio = displayedImageSize.width / displayedImageSize.height;

                let offsetX = 0, offsetY = 0, scale = 1;

                if (imageRatio > displayRatio) {
                  scale = displayedImageSize.width / imageNaturalSize.width;
                  const realHeight = imageNaturalSize.height * scale;
                  offsetY = (displayedImageSize.height - realHeight) / 2;
                } else {
                  scale = displayedImageSize.height / imageNaturalSize.height;
                  const realWidth = imageNaturalSize.width * scale;
                  offsetX = (displayedImageSize.width - realWidth) / 2;
                }

                return (
                  <View
                    key={index}
                    style={[styles.boundingBox,
                      {
                        top: det.bbox[1] * scale + offsetY,
                        left: det.bbox[0] * scale + offsetX,
                        width: (det.bbox[2] - det.bbox[0]) * scale,
                        height: (det.bbox[3] - det.bbox[1]) * scale,
                      },
                    ]}
                  >
                    <View style={styles.labelContainer}>
                      <Text style={styles.detectionText}>
                        {det.class} %{det.confidence.toFixed(2)}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </ImageBackground>
          </View>
        )}

        <TouchableOpacity
          style={[styles.analyzeButton, (!selectedImage || loading) && styles.disabledButton]}
          onPress={analyzeImage}
          disabled={!selectedImage || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="analytics" size={20} color="#fff" />
              <Text style={styles.analyzeButtonText}>Analiz Et</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {detections.length > 0 && (
        <View style={styles.resultsCard}>
          <Text style={styles.resultsTitle}>Analiz Sonuçları</Text>
          <Text style={styles.resultsSubtitle}>Tespit Edilen Hatalar</Text>

          <View style={styles.resultsContainer}>
            {detections.map((det, index) => (
              <View key={index} style={styles.detectionItem}>
                <View style={styles.detectionHeader}>
                  <Ionicons name="warning" size={18} color="#e74c3c" />
                  <Text style={styles.detectionTitle}>{det.class}</Text>
                  <Text style={styles.detectionConfidence}>%{(det.confidence * 100).toFixed(1)}</Text>
                </View>
                <Text style={styles.detectionCoords}>Koordinatlar: {det.bbox.join(", ")}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2023 Kurumsal Yazılım Çözümleri</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#f5f7fa",
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  header: {
    marginBottom: 30,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#7f8c8d",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 15,
  },
  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3498db",
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  uploadButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 10,
  },
  imageContainer: {
    borderWidth: 1,
    borderColor: "#ecf0f1",
    borderRadius: 8,
    marginBottom: 15,
    overflow: "hidden",
  },
  imageBackground: {
    width: "100%",
    height: 300,
  },
  boundingBox: {
    position: "absolute",
    borderColor: "#e74c3c",
    borderWidth: 2,
    padding: 2,
    borderRadius: 4,
    backgroundColor: "rgba(231, 76, 60, 0.2)",
    minWidth: 50,
  },
  labelContainer: {
    position: "absolute",
    top: -18,
    left: 0,
    backgroundColor: "#e74c3c",
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  detectionText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 12,
  },
  analyzeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2ecc71",
    paddingVertical: 12,
    borderRadius: 8,
  },
  disabledButton: {
    backgroundColor: "#95a5a6",
  },
  analyzeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 10,
  },
  resultsCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 5,
  },
  resultsSubtitle: {
    fontSize: 14,
    color: "#7f8c8d",
    marginBottom: 15,
  },
  resultsContainer: {
    marginTop: 10,
  },
  detectionItem: {
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  detectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  detectionTitle: {
    fontSize: 15,
    fontWeight: "500",
    color: "#2c3e50",
    marginLeft: 8,
    flex: 1,
  },
  detectionConfidence: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#e74c3c",
  },
  detectionCoords: {
    fontSize: 12,
    color: "#7f8c8d",
  },
  footer: {
    marginTop: 20,
    alignItems: "center",
  },
  footerText: {
    fontSize: 12,
    color: "#bdc3c7",
  },
});