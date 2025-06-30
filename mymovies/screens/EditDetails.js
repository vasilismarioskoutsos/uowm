import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

const EditDetails = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { userId } = route.params;

  const [newPassword, setNewPassword] = useState('');

  const handleSave = async () => {
    if (!newPassword.trim()) {
      Alert.alert('Σφάλμα', 'Ο κωδικός δεν μπορεί να είναι κενός');
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/update_password.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          new_password: newPassword,
        }),
      });

      const result = await response.json();

      if (result.success) {
        Alert.alert('Επιτυχία', 'Ο κωδικός ενημερώθηκε με επιτυχία');
        setNewPassword('');
      } else {
        Alert.alert('Σφάλμα', result.message || 'Αποτυχία ενημέρωσης');
      }
    } 
    catch (error) {
      Alert.alert('Σφάλμα', 'Αποτυχία σύνδεσης με τον διακομιστή');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Ενημέρωση Κωδικού</Text>

        <TextInput
          placeholder="Νέος κωδικός"
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
          style={styles.input}
        />

        <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
          <Text style={styles.saveButtonText}>Αποθήκευση</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Πίσω</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f3f5',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    elevation: 5,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 20,
    color: '#333',
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  saveButton: {
    backgroundColor: '#007bff',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginBottom: 12,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },

  backButton: {
    backgroundColor: '#6c757d',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },

  backButtonText: {
    color: '#fff',
    fontSize: 15,
  },
});

export default EditDetails;