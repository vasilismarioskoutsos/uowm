import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  SafeAreaView
} from 'react-native';
import { useRoute } from '@react-navigation/native';

const EditMovieDetails = () => {
  const route = useRoute();
  const { movieId } = route.params || {};

  const [movieData, setMovieData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`http://localhost:8000/get_movie_by_id.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ movie_id: movieId }),
    })
      .then(res => res.json())
      .then(json => {
        if (json.success) {
          setMovieData(json.movie);
        } else {
          //Alert.alert('Σφάλμα', json.message || 'Δεν βρέθηκε η ταινία');
        }
        setLoading(false);
      })
      .catch(() => {
        //Alert.alert('Σφάλμα', 'Αποτυχία φόρτωσης δεδομένων');
        setLoading(false);
      });
  }, [movieId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('http://localhost:8000/update_movie.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: movieId,
          ...movieData,
        }),
      });

      const result = await response.json();

      if (result.success) {
        Alert.alert('Επιτυχία', 'Οι αλλαγές αποθηκεύτηκαν');
      } else {
        //Alert.alert('Σφάλμα', result.message || 'Αποτυχία αποθήκευσης');
      }
    } catch {
      //Alert.alert('Σφάλμα', 'Αποτυχία σύνδεσης');
    }
    setSaving(false);
  };

  const handleChange = (key, value) => {
    setMovieData(prev => ({ ...prev, [key]: value }));
  };

  if (loading || !movieData) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Επεξεργασία Ταινίας #{movieId}</Text>

      <Text style={styles.label}>Τίτλος</Text>
      <TextInput
        style={styles.input}
        value={movieData.title}
        onChangeText={(text) => handleChange('title', text)}
      />

      <Text style={styles.label}>Ηθοποιοί</Text>
      <TextInput
        style={styles.input}
        value={movieData.actors}
        onChangeText={(text) => handleChange('actors', text)}
      />

      <Text style={styles.label}>Σκηνοθέτης</Text>
      <TextInput
        style={styles.input}
        value={movieData.director}
        onChangeText={(text) => handleChange('director', text)}
      />

      <Text style={styles.label}>Ημερομηνία Κυκλοφορίας</Text>
      <TextInput
        style={styles.input}
        value={movieData.release_date}
        onChangeText={(text) => handleChange('release_date', text)}
      />

      <Text style={styles.label}>Περίληψη</Text>
      <TextInput
        style={[styles.input, { height: 100 }]}
        multiline
        value={movieData.summary}
        onChangeText={(text) => handleChange('summary', text)}
      />

      <Text style={styles.label}>Διάρκεια (λεπτά)</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={movieData.duration !== null && movieData.duration !== undefined ? String(movieData.duration) : ''}
        onChangeText={(text) => handleChange('duration', text)}
      />

      <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
        <Text style={styles.saveButtonText}>{saving ? 'Αποθήκευση...' : 'Αποθήκευση'}</Text>
      </TouchableOpacity>
    </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
  paddingTop: 40,
  paddingHorizontal: 24,
  paddingBottom: 60,
  backgroundColor: '#fff',
},

  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
    marginTop: 10,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 12,
    marginBottom: 8,
  },
  saveButton: {
    backgroundColor: '#007bff',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default EditMovieDetails;