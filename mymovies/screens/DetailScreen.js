import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const DetailScreen = ({ route, navigation }) => {
  const { movieId } = route.params;
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState(null);
  const [userId, setUserId] = useState(null);
  const [watchlistMovieIds, setWatchlistMovieIds] = useState([]);
  const [loadingWatchlist, setLoadingWatchlist] = useState(true);
  const [userDataLoaded, setUserDataLoaded] = useState(false);

  // back button
  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginLeft: 15 }}>
          <Ionicons name="chevron-back" size={24} color="black" />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  // load user data
  useEffect(() => {
    (async () => {
      const storedRole = await AsyncStorage.getItem('role');
      const storedUserId = await AsyncStorage.getItem('user_id');
      setRole(storedRole);
      setUserId(storedUserId);
      setUserDataLoaded(true);
    })();
  }, []);

  // fetch movie details
  useEffect(() => {
    fetch('http://localhost:8000/get_movie_details.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ movie_id: movieId }),
    })
      .then(r => r.json())
      .then(json => {
        if (json.success) setDetails(json.movie);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [movieId]);

  // fetch watchlist status
  useEffect(() => {
    if (!userId) return;
    setLoadingWatchlist(true);
    fetch('http://localhost:8000/get_watchlist.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, movie_id: movieId }),
    })
      .then(r => r.json())
      .then(json => {
        setWatchlistMovieIds(json.success && json.exists ? [movieId] : []);
        setLoadingWatchlist(false);
      })
      .catch(() => {
        setWatchlistMovieIds([]);
        setLoadingWatchlist(false);
      });
  }, [userId, movieId]);

  const addToWatchlist = () => {
    if (!userId) return;
    fetch('http://localhost:8000/add_to_watchlist.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, movie_id: movieId }),
    })
      .then(r => r.json())
      .then(json => {
        if (json.success) setWatchlistMovieIds([movieId]);
      })
      .catch(() => {});
  };

  const removeFromWatchlist = () => {
    if (!userId) return;
    fetch('http://localhost:8000/remove_from_watchlist.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, movie_id: movieId }),
    })
      .then(r => r.json())
      .then(json => {
        if (json.success) setWatchlistMovieIds([]);
      })
      .catch(() => {});
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" />;
  if (!details)
    return (
      <View style={styles.centered}>
        <Text>Δεν βρέθηκαν λεπτομέρειες</Text>
      </View>
    );

  const isInWatchlist = watchlistMovieIds.includes(movieId);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>{details.title}</Text>

        <Text style={styles.label}>Σκηνοθέτης:</Text>
        <Text style={styles.text}>{details.director}</Text>

        <Text style={styles.label}>Ηθοποιοί:</Text>
        <Text style={styles.text}>{details.actors}</Text>

        <Text style={styles.label}>Ημερομηνία κυκλοφορίας:</Text>
        <Text style={styles.text}>{details.release_date}</Text>

        <Text style={styles.label}>Διάρκεια:</Text>
        <Text style={styles.text}>{details.duration} λεπτά</Text>

        <Text style={styles.label}>Περίληψη:</Text>
        <Text style={styles.description}>{details.summary}</Text>

        {!loadingWatchlist && userDataLoaded && role === 'user' && (
          <TouchableOpacity
            style={[
              styles.watchlistButton,
              { backgroundColor: isInWatchlist ? 'red' : 'green' },
            ]}
            onPress={isInWatchlist ? removeFromWatchlist : addToWatchlist}
          >
            <Text style={styles.watchlistButtonText}>
              {isInWatchlist ? 'Αφαίρεση από Watchlist' : 'Προσθήκη στη Watchlist'}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: '#fff' 
  },
  container: { 
    padding: 16, 
    paddingBottom: 40 
  },
  centered: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  title: { fontSize: 24, 
    fontWeight: 'bold', 
    marginBottom: 16 
  },
  label: { 
    fontWeight: 'bold', 
    marginTop: 12 
  },
  text: { 
    fontSize: 16 
  },
  description: { 
    marginTop: 8, 
    fontSize: 16 
  },
  watchlistButton: { 
    marginTop: 24, 
    paddingVertical: 12, 
    paddingHorizontal: 20, 
    borderRadius: 8, 
    alignItems: 'center' 
  },
  watchlistButtonText: { 
    color: '#fff', 
    fontSize: 16 
  },

});

export default DetailScreen;