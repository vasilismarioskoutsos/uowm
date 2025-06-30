import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

const WatchlistScreen = () => {
  const [userId, setUserId] = useState(null);
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchWatchlist = async () => {
    const id = await AsyncStorage.getItem('user_id');
    if (!id) return;

    setUserId(id);
    setLoading(true);

    fetch('http://localhost:8000/get_watchlist_movies.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: id }),
    })
      .then(res => res.json())
      .then(json => {
        if (json.success) {
          setMovies(json.movies);
        } 
        else {
          alert('Δεν βρέθηκαν ταινίες');
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Σφάλμα:', err);
        alert('Πρόβλημα με τον server');
        setLoading(false);
      });
  };

  useFocusEffect(
    useCallback(() => {
      fetchWatchlist();
    }, [])
  );

  const removeMovie = (movieId) => {
    const movie_id_str = movieId?.toString?.();
    if (!movie_id_str || !userId) {
      alert('Σφάλμα: Δεν υπάρχει έγκυρο movie_id ή userId');
      return;
    }

    fetch('http://localhost:8000/remove_from_watchlist.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        movie_id: movie_id_str,
      }),
    })
      .then(res => res.json())
      .then(json => {
        if (json.success) {
          setMovies(prev =>
            prev.filter(
              m =>
                (m.movie_id?.toString?.() ?? m.movieId?.toString?.()) !==
                movie_id_str
            )
          );
          alert('Η ταινία αφαιρέθηκε από τη Watchlist');
        } else {
          alert('Αποτυχία: ' + (json.message || 'Η αφαίρεση απέτυχε'));
        }
      })
      .catch(err => {
        console.error('Σφάλμα σύνδεσης:', err);
        alert('Σφάλμα σύνδεσης με τον διακομιστή');
      });
  };

  const renderItem = ({ item }) => {
    const title = item.title || 'Χωρίς τίτλο';
    const id = item.movie_id ?? item.movieId;

    return (
      <View style={styles.movieCard}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{title}</Text>
        </View>
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => removeMovie(id)}
        >
          <Text style={styles.removeText}>Αφαίρεση</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Text style={styles.pageTitle}>Η Watchlist μου</Text>
      {loading ? (
        <ActivityIndicator size="large" />
      ) : (
        <FlatList
          data={movies}
          keyExtractor={(item, index) =>
            (item.movie_id ?? item.movieId)?.toString() || index.toString()
          }
          renderItem={renderItem}
          ListEmptyComponent={
            <Text style={{ textAlign: 'center', marginTop: 20 }}>
              Δεν υπάρχουν ταινίες στη watchlist.
            </Text>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  movieCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 14,
    marginBottom: 10,
    backgroundColor: '#f2f2f2',
    borderRadius: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  removeButton: {
    backgroundColor: '#cc0000',
    paddingHorizontal: 12,
    justifyContent: 'center',
    borderRadius: 6,
  },
  removeText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default WatchlistScreen;