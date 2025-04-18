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
    setDetections([]);
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
        setImageNaturalSize(response.data.image_size);
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
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>VisionAI Analyzer</Text>
        <Text style={styles.headerSubtitle}>Görüntü Analiz Platformu</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Upload Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="image" size={24} color="#4d316c" />
            <Text style={styles.cardTitle}>Resim Yükle</Text>
          </View>

          <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
            <View style={styles.uploadIconContainer}>
              <Ionicons name="cloud-upload" size={32} color="#4d316c" />
            </View>
            <Text style={styles.uploadButtonText}>Resim Seçin</Text>
            <Text style={styles.uploadButtonHint}>JPG veya PNG formatında</Text>
          </TouchableOpacity>
        </View>

        {/* Results Card */}
        {selectedImage && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="analytics" size={24} color="#4d316c" />
              <Text style={styles.cardTitle}>Analiz Sonuçları</Text>
            </View>

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
                {/* Popup sonuç kutusu */}
                {detections.length > 0 && (
                  <View style={styles.popupBox}>
                    <Text style={styles.popupHeader}>Tespit Edilen Hatalar</Text>
                    <ScrollView style={{ maxHeight: 120 }}>
                      {detections.map((d, i) => (
                        <Text key={i} style={styles.popupListItem}>
                          • {d.class} (%{(d.confidence * 100).toFixed(1)})
                        </Text>
                      ))}
                    </ScrollView>
                  </View>
                )}

                {/* Bounding Boxlar */}
                {detections.map((det, index) => {
                  const imageRatio = imageNaturalSize.width / imageNaturalSize.height;
                  const displayRatio = displayedImageSize.width / displayedImageSize.height;

                  let offsetX = 0,
                    offsetY = 0,
                    scale = 1;

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
                      style={[
                        styles.boundingBox,
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
                          {det.class} %{(det.confidence * 100).toFixed(2)}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </ImageBackground>
            </View>

            <TouchableOpacity
              style={[styles.analyzeButton, loading && styles.analyzeButtonDisabled]}
              onPress={analyzeImage}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#f0e9de" size="small" />
              ) : (
                <>
                  <Ionicons name="search" size={20} color="#f0e9de" />
                  <Text style={styles.analyzeButtonText}>Analiz Et</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2025 VisionAI Teknolojileri</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0e9de",
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 80,
  },
  header: {
    backgroundColor: "#4d316c",
    padding: 24,
    paddingBottom: 16,
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#f0e9de",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#a9baab",
  },
  card: {
    backgroundColor: "#f0e9de",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#869b8b",
    shadowColor: "#705a89",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#869b8b",
    paddingBottom: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#4d316c",
    marginLeft: 10,
  },
  uploadButton: {
    backgroundColor: "#f0e9de",
    borderRadius: 12,
    padding: 30,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#705a89",
    borderStyle: "dashed",
  },
  uploadIconContainer: {
    backgroundColor: "#e6e0f1",
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#a9baab",
  },
  uploadButtonText: {
    color: "#4d316c",
    fontSize: 16,
    fontWeight: "500",
    marginTop: 8,
  },
  uploadButtonHint: {
    color: "#705a89",
    fontSize: 12,
    marginTop: 4,
  },
  imageContainer: {
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 16,
    backgroundColor: "#f0e9de",
    borderWidth: 1,
    borderColor: "#a9baab",
  },
  imageBackground: {
    width: "100%",
    height: 300,
  },
  boundingBox: {
    position: "absolute",
    borderColor: "#4d316c",
    borderWidth: 2,
    borderRadius: 6,
    backgroundColor: "rgba(77, 49, 108, 0.2)",
  },
  labelContainer: {
    position: "absolute",
    top: -22,
    left: 0,
    backgroundColor: "#4d316c",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#a9baab",
  },
  detectionText: {
    color: "#f0e9de",
    fontWeight: "bold",
    fontSize: 12,
  },
  analyzeButton: {
    backgroundColor: "#705a89",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
  },
  analyzeButtonDisabled: {
    backgroundColor: "#a9baab",
  },
  analyzeButtonText: {
    color: "#f0e9de",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 10,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#4d316c",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#a9baab",
    alignItems: "center",
  },
  footerText: {
    color: "#a9baab",
    fontSize: 12,
  },
  popupBox: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "#4d316c",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    zIndex: 99,
    minWidth: 220,
    maxHeight: 160,
    borderWidth: 1,
    borderColor: "#a9baab",
  },
  popupHeader: {
    color: "#f0e9de",
    fontWeight: "bold",
    fontSize: 14,
    marginBottom: 6,
    textAlign: "center",
  },
  popupListItem: {
    color: "#f0e9de",
    fontSize: 12,
    marginVertical: 2,
  },
});
