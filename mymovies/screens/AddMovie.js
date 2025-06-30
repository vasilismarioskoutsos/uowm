import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';

const AddMovie = () => {
  const [title, setTitle] = useState('');
  const [actors, setActors] = useState('');
  const [director, setDirector] = useState('');
  const [releaseDate, setReleaseDate] = useState('');
  const [summary, setSummary] = useState('');
  const [duration, setDuration] = useState('');
  const [genreId, setGenreId] = useState('');
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(false);

  // load genres while focusing
  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      const fetchGenres = async () => {
        try {
          const response = await fetch('http://localhost:8000/get_categories.php');
          const json = await response.json();
          if (isActive && json.success) {
            setGenres(json.categories || []);
          }
        } catch (e) {
          window.alert('Αποτυχία φόρτωσης κατηγοριών');
        }
      };
      fetchGenres();
      return () => {
        isActive = false;
      };
    }, [])
  );

  const handleSubmit = useCallback(async () => {
    if (
      !title.trim() ||
      !actors.trim() ||
      !director.trim() ||
      !releaseDate.trim() ||
      !summary.trim() ||
      !duration.trim() ||
      !genreId
    ) {
      window.alert('Παρακαλώ συμπληρώστε όλα τα πεδία και επιλέξτε κατηγορία');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:8000/add_movie.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          actors,
          director,
          release_date: releaseDate,
          summary,
          duration,
          genre_id: genreId,
        }),
      });

      const result = await response.json();

      if (result.success) {
        window.alert('Η ταινία προστέθηκε επιτυχώς');
        setTitle('');
        setActors('');
        setDirector('');
        setReleaseDate('');
        setSummary('');
        setDuration('');
        setGenreId('');
      } else {
        window.alert(result.message || 'Πρόβλημα κατά την προσθήκη της ταινίας');
      }
    } catch (error) {
      window.alert('Σφάλμα σύνδεσης με τον διακομιστή');
    } finally {
      setLoading(false);
    }
  }, [title, actors, director, releaseDate, summary, duration, genreId]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.innerWrapper}>
        <Text style={styles.label}>Τίτλος</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Τίτλος"
        />

        <Text style={styles.label}>Ηθοποιοί</Text>
        <TextInput
          style={styles.input}
          value={actors}
          onChangeText={setActors}
          placeholder="Ηθοποιοί"
        />

        <Text style={styles.label}>Σκηνοθέτης</Text>
        <TextInput
          style={styles.input}
          value={director}
          onChangeText={setDirector}
          placeholder="Σκηνοθέτης"
        />

        <Text style={styles.label}>Ημερομηνία Κυκλοφορίας</Text>
        <TextInput
          style={styles.input}
          value={releaseDate}
          onChangeText={setReleaseDate}
          placeholder="YYYY-MM-DD"
        />

        <Text style={styles.label}>Περίληψη</Text>
        <TextInput
          style={[styles.input, { height: 100 }]}
          value={summary}
          onChangeText={setSummary}
          placeholder="Περίληψη"
          multiline
        />

        <Text style={styles.label}>Διάρκεια (λεπτά)</Text>
        <TextInput
          style={styles.input}
          value={duration}
          onChangeText={setDuration}
          placeholder="Διάρκεια"
          keyboardType="numeric"
        />

        <Text style={styles.label}>Επιλογή Κατηγορίας</Text>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={genreId}
            onValueChange={(itemValue) => setGenreId(itemValue)}
            prompt="Επιλέξτε Κατηγορία"
          >
            <Picker.Item label="-- Επιλέξτε κατηγορία --" value="" />
            {genres.map((g) => (
              <Picker.Item
                key={g.genre_id || g.id}
                label={g.genre_name || g.name}
                value={g.genre_id || g.id}
              />
            ))}
          </Picker>
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Προσθήκη Ταινίας</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f5f7fa',
    paddingBottom: 80,
  },
  innerWrapper: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
    color: '#333',
  },
  input: {
    backgroundColor: '#fff',
    borderColor: '#888',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  pickerWrapper: {
    backgroundColor: '#fff',
    borderColor: '#888',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#007bff',
    borderRadius: 8,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  buttonDisabled: {
    backgroundColor: '#9bbcff',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default AddMovie;