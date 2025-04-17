import React, { useState } from "react";
import { View, Image, Text, Platform, Alert, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView } from "react-native";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";
import { Ionicons } from '@expo/vector-icons';

export default function App() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [detections, setDetections] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [imageNaturalSize, setImageNaturalSize] = useState({ width: 0, height: 0 });
  const [metrics, setMetrics] = useState({ input: 0, output: 0, serialNumber: "" });

  const pickImage = async () => {
    setDetections([]);
    setMetrics({ input: 0, output: 0, serialNumber: "" });
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
        allowsEditing: false,
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
    setMetrics({ input: 0, output: 0, serialNumber: "" });

    let formData = new FormData();

    try {
      if (Platform.OS === "web") {
        const response = await fetch(selectedImage);
        const blob = await response.blob();
        formData.append("file", new File([blob], "image.jpg", { type: "image/jpeg" }));
      } else {
        const filename = selectedImage.split('/').pop() || "image.jpg";
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpg';

        formData.append("file", {
          uri: selectedImage,
          name: filename,
          type,
        } as any);
      }

      const response = await axios.post("http://127.0.0.1:5000/detect", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const normalizedDetections = response.data.detections.map((det: any) => ({
        ...det,
        bbox: det.bbox.map((val: number) => parseFloat(val.toFixed(4)))
      }));

      setDetections(normalizedDetections);

      if (response.data.metrics) {
        setMetrics({
          input: response.data.metrics.input || 0,
          output: response.data.metrics.output || 0,
          serialNumber: response.data.metrics.serialNumber || ""
        });
      }
    } catch (error: any) {
      console.error("Hata:", error);
      Alert.alert("Hata", error.response?.data?.error || error.message || "Analiz sırasında hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const handleImageLoad = (event: any) => {
    const { width, height } = event.nativeEvent.source;
    setImageNaturalSize({ width, height });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Borunlu Analiz Uygulaması</Text>
        <Text style={styles.headerSubtitle}>Kalite Kontrol ve Hata Tespit Sistemi</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Resim Yükleme</Text>

        <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
          <Ionicons name="cloud-upload" size={24} color="#fff" />
          <Text style={styles.uploadButtonText}>Resim Seç</Text>
        </TouchableOpacity>

        {selectedImage && (
          <View style={styles.imageOuterContainer}>
            <ScrollView horizontal contentContainerStyle={styles.imageScrollContainer}>
              <View style={styles.imageContainer}>
                <Image
                  source={{ uri: selectedImage }}
                  style={{
                    width: imageNaturalSize.width,
                    height: imageNaturalSize.height,
                    resizeMode: 'contain',
                  }}
                  onLoad={handleImageLoad}
                />
              </View>
            </ScrollView>
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

        {detections.length > 0 && (
          <View style={styles.resultsCard}>
            <Text style={styles.resultsTitle}>Tespit Edilen Hatalar</Text>
            <View style={styles.resultsContainer}>
              {detections.map((det, index) => (
                <View key={index} style={styles.detectionItem}>
                  <View style={styles.detectionHeader}>
                    <Ionicons name="alert-circle" size={20} color="#e74c3c" />
                    <Text style={styles.detectionTitle}>{det.class}</Text>
                    <Text style={styles.detectionConfidence}>%{det.confidence.toFixed(1)}</Text>
                  </View>
                  <Text style={styles.detectionCoords}>
  Koordinatlar: [{det.bbox.map((v: number) => v.toFixed(2)).join(", ")}]
</Text>



                </View>
              ))}
            </View>
          </View>
        )}
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
  imageOuterContainer: {
    maxHeight: 500,
    borderWidth: 1,
    borderColor: "#ecf0f1",
    borderRadius: 8,
    marginBottom: 15,
    overflow: 'scroll',
  },
  imageScrollContainer: {
    flexGrow: 1,
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    resizeMode: 'contain',
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
    marginTop: 20,
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
    marginTop: 2,
  },
});
