import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Modal, TextInput } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useAuth } from '../context/AuthContext';
import { entryService } from '../services/api';
import BarcodeScanner from './BarcodeScanner';

const UserForm: React.FC = () => {
  const [distributor, setDistributor] = useState('');
  const [inOut, setInOut] = useState('');
  const [location, setLocation] = useState('');
  const [barcodes, setBarcodes] = useState<string[]>([]);
  const [showScanner, setShowScanner] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user, logout } = useAuth();

  const distributors = ['Blinkit', 'Instamart', 'Zepto', 'BigBasket'];
  const inOutOptions = ['In', 'Out'];

  const handleSubmit = async () => {
    if (!distributor || !inOut || !location.trim() || barcodes.length === 0) {
      Alert.alert('Error', 'Please fill all fields and scan at least one barcode');
      return;
    }

    setLoading(true);
    try {
      await entryService.createEntry({
        distributor,
        inOut,
        location: location.trim(),
        barcodes,
      });

      Alert.alert('Success', 'Entry created successfully!', [
        {
          text: 'OK',
          onPress: () => {
            // Reset form
            setDistributor('');
            setInOut('');
            setLocation('');
            setBarcodes([]);
          },
        },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to create entry');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', onPress: logout },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Distribution Entry</Text>
        <Text style={styles.welcome}>Welcome, {user?.name}!</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.form}>
        <View style={styles.field}>
          <Text style={styles.label}>Distributor *</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={distributor}
              onValueChange={setDistributor}
              style={styles.picker}
            >
              <Picker.Item label="Select Distributor" value="" />
              {distributors.map((dist) => (
                <Picker.Item key={dist} label={dist} value={dist} />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>In/Out *</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={inOut}
              onValueChange={setInOut}
              style={styles.picker}
            >
              <Picker.Item label="Select In/Out" value="" />
              {inOutOptions.map((option) => (
                <Picker.Item key={option} label={option} value={option} />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Location *</Text>
          <TextInput
            style={styles.textArea}
            value={location}
            onChangeText={setLocation}
            placeholder="Enter location details..."
            multiline={true}
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Barcodes ({barcodes.length}) *</Text>
          <TouchableOpacity
            style={styles.scanButton}
            onPress={() => setShowScanner(true)}
          >
            <Text style={styles.scanButtonText}>
              {barcodes.length > 0 ? 'Edit Barcodes' : 'Scan Barcodes'}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>
            {loading ? 'Submitting...' : 'Submit Entry'}
          </Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={showScanner}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <BarcodeScanner
          existingBarcodes={barcodes}
          onScanned={(scannedBarcodes) => {
            setBarcodes(scannedBarcodes);
            setShowScanner(false);
          }}
          onClose={() => setShowScanner(false)}
        />
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  header: {
    backgroundColor: 'white',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  welcome: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 8,
  },
  logoutButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#ef4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  logoutText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  form: {
    padding: 16,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 8,
  },
  pickerContainer: {
    backgroundColor: 'white',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  picker: {
    height: 50,
  },
  scanButton: {
    backgroundColor: '#16a34a',
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  scanButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  cancelButtonText: {
    color: '#374151',
    fontWeight: '500',
  },
  textArea: {
    backgroundColor: 'white',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 80,
  },
  submitButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 16,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 16,
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default UserForm;
