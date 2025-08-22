import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { useAuth } from '../context/AuthContext';
import UserLogin from '../components/UserLogin';
import UserForm from '../components/UserForm';

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (user?.type === 'user') {
    return <UserForm />;
  }

  return <UserLogin />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
