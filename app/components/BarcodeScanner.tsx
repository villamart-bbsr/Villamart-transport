import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert } from 'react-native';
import { Camera, CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';

interface BarcodeScannerProps {
  onScanned: (barcodes: string[]) => void;
  onClose: () => void;
  existingBarcodes?: string[];
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ 
  onScanned, 
  onClose, 
  existingBarcodes = [] 
}) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);
  const [barcodes, setBarcodes] = useState<string[]>(existingBarcodes);
  const [manualBarcode, setManualBarcode] = useState('');

  useEffect(() => {
    if (permission?.granted) {
      setScanning(true);
    }
  }, [permission]);

  const requestCameraPermission = async () => {
    const result = await requestPermission();
    if (result.granted) {
      setScanning(true);
    } else {
      Alert.alert('Camera Permission', 'Camera permission is required to scan barcodes');
    }
  };

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (data && !barcodes.includes(data)) {
      setBarcodes(prev => [...prev, data]);
      setManualBarcode(data);
      setScanning(false);
    }
  };

  const handleManualSubmit = () => {
    const trimmedBarcode = manualBarcode.trim();
    if (trimmedBarcode && !barcodes.includes(trimmedBarcode)) {
      setBarcodes(prev => [...prev, trimmedBarcode]);
      setManualBarcode('');
    }
  };

  const removeBarcode = (indexToRemove: number) => {
    setBarcodes(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleDone = () => {
    onScanned(barcodes);
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Camera permission is required to scan barcodes</Text>
        <TouchableOpacity style={styles.button} onPress={requestCameraPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Scan Barcode</Text>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="close" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      <View style={styles.cameraContainer}>
        {scanning ? (
          <CameraView
            style={styles.camera}
            onBarcodeScanned={handleBarcodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ['qr', 'code128', 'ean13', 'ean8', 'code39', 'upc_a', 'upc_e', 'codabar'],
            }}
          />
        ) : (
          <View style={styles.cameraPlaceholder}>
            <TouchableOpacity 
              style={styles.startButton}
              onPress={() => setScanning(true)}
            >
              <Text style={styles.startButtonText}>Start Camera</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <Text style={styles.instruction}>Position the barcode within the frame</Text>

      {barcodes.length > 0 && (
        <View style={styles.barcodesContainer}>
          <Text style={styles.barcodesTitle}>
            Scanned Barcodes ({barcodes.length}):
          </Text>
          <ScrollView style={styles.barcodesList}>
            {barcodes.map((barcode, index) => (
              <View key={index} style={styles.barcodeItem}>
                <Text style={styles.barcodeText}>{barcode}</Text>
                <TouchableOpacity onPress={() => removeBarcode(index)}>
                  <Ionicons name="close-circle" size={20} color="#ef4444" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      <View style={styles.manualContainer}>
        <Text style={styles.manualTitle}>Add barcode manually:</Text>
        <View style={styles.manualInputContainer}>
          <TextInput
            style={styles.manualInput}
            value={manualBarcode}
            onChangeText={setManualBarcode}
            placeholder="Enter barcode number"
            onSubmitEditing={handleManualSubmit}
          />
          <TouchableOpacity
            style={[
              styles.addButton,
              (!manualBarcode.trim() || barcodes.includes(manualBarcode.trim())) && styles.addButtonDisabled
            ]}
            onPress={handleManualSubmit}
            disabled={!manualBarcode.trim() || barcodes.includes(manualBarcode.trim())}
          >
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.doneButton, barcodes.length === 0 && styles.doneButtonDisabled]}
          onPress={handleDone}
          disabled={barcodes.length === 0}
        >
          <Text style={styles.doneButtonText}>Done ({barcodes.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  cameraContainer: {
    height: 300,
    backgroundColor: '#1f2937',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 8,
  },
  camera: {
    flex: 1,
  },
  cameraPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  startButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  instruction: {
    textAlign: 'center',
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  barcodesContainer: {
    marginBottom: 16,
  },
  barcodesTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 8,
  },
  barcodesList: {
    maxHeight: 128,
  },
  barcodeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 6,
    marginBottom: 4,
  },
  barcodeText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'monospace',
    color: '#1f2937',
  },
  manualContainer: {
    marginBottom: 16,
  },
  manualTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 8,
  },
  manualInputContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  manualInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
  addButton: {
    backgroundColor: '#16a34a',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    justifyContent: 'center',
  },
  addButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  addButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  doneButton: {
    flex: 1,
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  doneButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  doneButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#d1d5db',
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#374151',
    fontWeight: '500',
  },
  message: {
    textAlign: 'center',
    fontSize: 16,
    color: '#1f2937',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: '500',
  },
});

export default BarcodeScanner;
