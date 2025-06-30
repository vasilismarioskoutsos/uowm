import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

const RegisterScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleRegister = async () => {
  if (!username || !password || !confirmPassword) {
    alert('Συμπληρώστε όλα τα πεδία');
    return;
  }

  if (password !== confirmPassword) {
    alert('Οι κωδικοί δεν ταιριάζουν');
    return;
  }

  try {
    const res = await fetch('http://localhost:8000/register.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username,
        password,
        role: 'user',
      }),
    });

    const text = await res.text();
    const data = JSON.parse(text);

    if (data.success) {
      alert('Ο λογαριασμός δημιουργήθηκε');
      navigation.navigate('Σύνδεση');
    } else {
      alert(data.message || 'Η εγγραφή απέτυχε');
    }
  } catch (error) {
    alert('Κάτι πήγε στραβά');
  }
};

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Εγγραφή</Text>

      <Text style={styles.label}>Όνομα χρήστη</Text>
      <TextInput
        style={styles.input}
        value={username}
        onChangeText={setUsername}
        placeholder="Όνομα χρήστη"
        placeholderTextColor="#888"
      />

      <Text style={styles.label}>Κωδικός</Text>
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        placeholder="Κωδικός"
        placeholderTextColor="#888"
        secureTextEntry
      />

      <Text style={styles.label}>Επιβεβαίωση Κωδικού</Text>
      <TextInput
        style={styles.input}
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        placeholder="Επιβεβαίωση Κωδικού"
        placeholderTextColor="#888"
        secureTextEntry
      />

      <TouchableOpacity style={styles.button} onPress={handleRegister}>
        <Text style={styles.buttonText}>Εγγραφή</Text>
      </TouchableOpacity>

      <Text style={styles.loginText}>
        Έχετε ήδη λογαριασμό;{' '}
        <Text style={styles.link} onPress={() => navigation.navigate('Σύνδεση')}>
          Σύνδεση
        </Text>
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
  width: '90%',
  maxWidth: 500,
  alignSelf: 'center',
  marginTop: 50,
  padding: 32,
  backgroundColor: '#f9f9f9',
  borderRadius: 12,
  shadowColor: '#000',
  shadowOpacity: 0.1,
  shadowOffset: { width: 0, height: 2 },
  shadowRadius: 6,
},

  title: {
    fontSize: 26,
    marginBottom: 24,
    textAlign: 'center',
    color: '#333',
    fontWeight: 'bold',
  },
  label: {
    marginBottom: 6,
    fontWeight: 'bold',
    color: '#444',
  },
  input: {
    width: '100%',
    padding: 12,
    marginBottom: 16,
    borderRadius: 8,
    borderColor: '#ccc',
    borderWidth: 1,
    fontSize: 16,
    color: '#000',
  },
  button: {
    backgroundColor: '#2a9d8f',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loginText: {
    marginTop: 16,
    textAlign: 'center',
    fontSize: 14,
    color: '#555',
  },
  link: {
    color: '#2a9d8f',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
});

export default RegisterScreen;