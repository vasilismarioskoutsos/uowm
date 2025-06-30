import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import StarRating from 'react-native-star-rating-widget';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ArxikhXrhsthScreen = ({ navigation }) => {
  const [movies, setMovies] = useState([]);
  const [filteredMovies, setFilteredMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [ratingsData, setRatingsData] = useState({});
  const [userId, setUserId] = useState(null);

  // load user id
  useEffect(() => {
    (async () => {
      try {
        const id = await AsyncStorage.getItem('user_id');
        if (id) setUserId(parseInt(id));
      } catch {}
    })();
  }, []);

  // fetch categories
  const fetchCategories = () => {
    fetch('http://localhost:8000/get_categories.php')
      .then(res => res.json())
      .then(json => {
        if (json.success) {
          setCategories(json.categories);
        }
      })
      .catch(() => {});
  };

  // fetch movies list
  const viewList = () => {
    setLoading(true);
    fetch('http://localhost:8000/get_movies.php')
      .then(res => res.json())
      .then(json => {
        if (json.success) {
          setMovies(json.movies);
          setFilteredMovies(json.movies);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  // fetch user ratings
  const fetchUserRatings = async id => {
    try {
      const res = await fetch(
        `http://localhost:8000/get_user_ratings.php?user_id=${id}`
      );
      const json = await res.json();
      if (json.success && json.ratings) {
        setRatingsData(prev => {
          const updated = { ...prev };
          Object.entries(json.ratings).forEach(([mid, rating]) => {
            updated[parseInt(mid)] = {
              ...(updated[parseInt(mid)] || {}),
              user: rating,
            };
          });
          return updated;
        });
      }
    } catch {}
  };

  // filter by category
  const filterByCategory = genreId => {
    setSelectedCategory(genreId);
    setSearchTerm('');
    setLoading(true);
    const url =
      genreId === 'all'
        ? 'http://localhost:8000/get_movies.php'
        : `http://localhost:8000/get_movies_by_genre.php?genre_id=${genreId}`;
    fetch(url)
      .then(res => res.json())
      .then(json => {
        setFilteredMovies(json.success ? json.movies : []);
        setLoading(false);
      })
      .catch(() => {
        setFilteredMovies([]);
        setLoading(false);
      });
  };

  // submit rating
  const submitRating = async (movieId, rating) => {
    if (!userId) return;
    try {
      const res = await fetch('http://localhost:8000/submit_rating.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          movie_id: movieId,
          rating,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setRatingsData(prev => ({
          ...prev,
          [movieId]: {
            average: json.average_rating,
            user: rating,
          },
        }));
      }
    } catch {}
  };

  // search
  const search = text => {
    setSearchTerm(text);
    const filtered = movies.filter(m =>
      m.title.toLowerCase().includes(text.toLowerCase())
    );
    setFilteredMovies(filtered);
  };

  // Effects on focus
  useFocusEffect(
    useCallback(() => {
      fetchCategories();
      selectedCategory === 'all' ? viewList() : filterByCategory(selectedCategory);
      userId && fetchUserRatings(userId);
    }, [selectedCategory, userId])
  );

  // header setup
  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => navigation.openDrawer()}
          style={styles.menuButton}
        >
          <Ionicons name="menu" size={24} color="black" />
        </TouchableOpacity>
      ),
      headerRight: () => (
        <TouchableOpacity
          style={styles.recButton}
          onPress={() =>
            navigation.getParent()?.navigate('Συστάσεις Ταινιών')
          }
        >
          <Text style={styles.recButtonText}>Σύσταση Ταινιών</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.categoryContainer}>
        <Text style={styles.categoryLabel}>Κατηγορία:</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
        >
          <TouchableOpacity
            style={[
              styles.categoryButton,
              selectedCategory === 'all' && styles.selectedCategory,
            ]}
            onPress={() => filterByCategory('all')}
          >
            <Text>Όλες</Text>
          </TouchableOpacity>
          {categories.map(cat => (
            <TouchableOpacity
              key={cat.genre_id}
              style={[
                styles.categoryButton,
                selectedCategory === cat.genre_id &&
                  styles.selectedCategory,
              ]}
              onPress={() => filterByCategory(cat.genre_id)}
            >
              <Text>{cat.genre_name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Αναζήτηση..."
          value={searchTerm}
          onChangeText={search}
        />
        <Ionicons name="search" size={20} color="#888" />
      </View>

      <ScrollView contentContainerStyle={styles.listContainer}>
        {filteredMovies.length === 0 ? (
          <Text style={styles.noResults}>
            Δεν βρέθηκαν ταινίες.
          </Text>
        ) : (
          filteredMovies.map(movie => (
            <View key={movie.id} style={styles.movieItem}>
              <Text style={styles.movieTitle}>
                {movie.title}
              </Text>
              <Text style={styles.yourRating}>Η δική σου:</Text>
              <StarRating
                rating={ratingsData[movie.id]?.user || 0}
                onChange={r => submitRating(movie.id, r)}
                starSize={26}
                enableHalfStar
              />
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate('Λεπτομέρειες ταινίας', {
                    movieId: movie.id,
                  })
                }
              >
                <Text style={styles.detailsLink}>
                  Προβολή λεπτομερειών
                </Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // header buttons
  menuButton: {
    marginLeft: 15,
  },
  recButton: {
    marginRight: 15,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#2a9d8f',
    borderRadius: 8,
  },
  recButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },

  categoryContainer: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  categoryLabel: {
    fontWeight: 'bold',
    marginBottom: 6,
  },
  categoryButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#ddd',
    borderRadius: 20,
    marginRight: 8,
  },
  selectedCategory: {
    backgroundColor: '#aaa',
  },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: '#000',
  },

  listContainer: {
    padding: 24,
    paddingBottom: 80,
  },
  noResults: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 32,
  },

  movieItem: {
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#eee',
    borderRadius: 8,
  },
  movieTitle: {
    fontSize: 18,
  },
  yourRating: {
    marginTop: 6,
  },
  detailsLink: {
    marginTop: 8,
    fontSize: 14,
    color: '#007bff',
    textDecorationLine: 'underline',
  },
});

export default ArxikhXrhsthScreen;