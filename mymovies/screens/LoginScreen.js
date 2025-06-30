import React, { Component } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

class LoginScreen extends Component {
  constructor(props) {
    super(props);
    this.state = {
      username: '',
      password: ''
    };
  }

  handleLogin = async () => {
    const { username, password } = this.state;

    if (!username || !password) {
      const message = 'Συμπληρώστε όλα τα πεδία';
      return Platform.OS === 'web'
        ? alert('Συμπλήρωση: ' + message)
        : Alert.alert('Συμπλήρωση', message);
    }

    try {
      const res = await fetch('http://localhost:8000/login.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const text = await res.text();
      console.log('login.php raw response →', text);

      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error('json.parse failed:', e);
        return Platform.OS === 'web'
          ? alert(`Invalid JSON response:\n${text}`)
          : Alert.alert('Σφάλμα JSON', text);
      }

      if (data.status === 'success' && data.user) {
        const { id, username: user, role } = data.user;

        // store
        await AsyncStorage.setItem('user_id', id.toString());
        await AsyncStorage.setItem('username', user);
        await AsyncStorage.setItem('role', role);

        this.props.navigation.reset({
          index: 0,
          routes: [{ name: 'Main' }],
        });

      } 
      
      else {
        const msg = data.message || 'Unknown error';
        return Platform.OS === 'web'
          ? alert('Αποτυχία σύνδεσης: ' + msg)
          : Alert.alert('Αποτυχία σύνδεσης', msg);
      }

    } catch (error) {
      console.error('login error:', error);
      const errMsg = 'Κάτι πήγε στραβά';
      return Platform.OS === 'web'
        ? alert('Σφάλμα: ' + errMsg)
        : Alert.alert('Σφάλμα', errMsg);
    }
  };

  render() {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={80}
      >
        <ScrollView contentContainerStyle={styles.outerContainer}>
          <View style={styles.innerContainer}>
            <Text style={styles.title}>Σύνδεση Χρήστη</Text>

            <TextInput
              style={styles.input}
              placeholder="Όνομα χρήστη"
              placeholderTextColor="#aaa"
              onChangeText={(text) => this.setState({ username: text })}
              value={this.state.username}
              autoCapitalize="none"
            />

            <TextInput
              style={styles.input}
              placeholder="Κωδικός"
              placeholderTextColor="#aaa"
              secureTextEntry
              onChangeText={(text) => this.setState({ password: text })}
              value={this.state.password}
            />

            <TouchableOpacity style={styles.button} onPress={this.handleLogin}>
              <Text style={styles.buttonText}>Σύνδεση</Text>
            </TouchableOpacity>

            <View style={{ marginTop: 30, alignItems: 'center' }}>
              <Text>Δεν έχετε λογαριασμό;</Text>
              <TouchableOpacity onPress={() => this.props.navigation.navigate('Εγγραφή')}>
                <Text style={{ color: '#2a9d8f', marginTop: 6, fontWeight: '600' }}>
                  Κάντε εγγραφή
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }
}

const styles = StyleSheet.create({
  outerContainer: {
    flexGrow: 1,
    backgroundColor: '#f9f9f9',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  innerContainer: {
    width: '90%',
    maxWidth: 400,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
    color: '#333',
  },
  input: {
    backgroundColor: '#fff',
    padding: 14,
    marginBottom: 16,
    borderRadius: 10,
    borderColor: '#ddd',
    borderWidth: 1,
    fontSize: 16,
    color: '#333',
    elevation: 1,
  },
  button: {
    backgroundColor: '#2a9d8f',
    paddingVertical: 14,
    borderRadius: 10,
    elevation: 2,
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
  },
});

function LoginScreenWrapper() {
  const navigation = useNavigation();
  return <LoginScreen navigation={navigation} />;
}

export default LoginScreenWrapper;