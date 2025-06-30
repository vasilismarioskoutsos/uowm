import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const ArxikhAdmin = ({ navigation }) => {
  const [movies, setMovies] = useState([]);
  const [filteredMovies, setFilteredMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [averageRatings, setAverageRatings] = useState({});

  const fetchCategories = () => {
  fetch('http://localhost:8000/get_categories.php')
    .then(res => res.json())
    .then(json => {
      if (json.success) {
        setCategories(json.categories);
      }
    })
    .catch(err => console.error(err));
};

  const view_list = () => {
  setLoading(true);
  fetch('http://localhost:8000/get_movies.php')
    .then(res => res.json())
    .then(json => {
      if (json.success) {
        setMovies(json.movies);
        setFilteredMovies(json.movies);
      } 
      else {
        alert(json.message);
      }
      setLoading(false);
    })
    .catch(err => {
      console.error(err);
      setLoading(false);
    });
};

  const filterByCategory = (genreId) => {
    setSelectedCategory(genreId);
    setSearchTerm('');
    setLoading(true);

    const url = genreId === 'all'
      ? 'http://localhost:8000/get_movies.php'
      : `http://localhost:8000/get_movies_by_genre.php?genre_id=${genreId}`;

    fetch(url)
      .then(res => res.json())
      .then(json => {
        if (json.success) {
          setFilteredMovies(json.movies);
        } else {
          setFilteredMovies([]);
        }
        setLoading(false);
      })
      .catch(err => {
        //console.error(err);
        setFilteredMovies([]);
        setLoading(false);
      });
  };

  const search = (text) => {
    setSearchTerm(text);
    const baseList = selectedCategory === 'all' ? movies : filteredMovies;
    const filtered = baseList.filter(movie =>
      movie.title.toLowerCase().includes(text.toLowerCase())
    );
    setFilteredMovies(filtered);
  };

  const removeMovie = (id) => {
  console.log('Ζητήθηκε διαγραφή ταινίας με ID:', id);

  const confirm = confirmDelete();

  if (!confirm) {
    console.log('Η διαγραφή ακυρώθηκε');
    return;
  }

  fetch('http://localhost:8000/delete_movie.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  })
    .then(res => res.json())
    .then(json => {
      console.log('Απάντηση server:', json);
      if (json.success) {
        const updated = movies.filter(movie => movie.id !== id);
        setMovies(updated);
        setFilteredMovies(updated.filter(movie =>
          movie.title.toLowerCase().includes(searchTerm.toLowerCase())
        ));
        alert('Η ταινία διαγράφηκε επιτυχώς');
      } else {
        console.warn('Η διαγραφή απέτυχε:', json.message);
        alert(json.message || 'Η διαγραφή απέτυχε');
      }
    })
    .catch(error => {
      console.error('Σφάλμα κατά το fetch:', error);
      alert('Υπήρξε πρόβλημα κατά τη διαγραφή');
    });
};


const confirmDelete = () => {
  return window.confirm('Είσαι σίγουρος ότι θέλεις να διαγράψεις αυτή την ταινία;');
};

  useFocusEffect(useCallback(() => {
    fetchCategories();
    if (selectedCategory === 'all') {
      view_list();
    } else {
      filterByCategory(selectedCategory);
    }
  }, [selectedCategory]));

  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity onPress={() => navigation.openDrawer()} style={{ marginLeft: 15 }}>
          <Ionicons name="menu" size={24} color="black" />
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
    <View style={{ flex: 1, backgroundColor: '#f9f9f9' }}>
      <View style={{ marginHorizontal: 16, marginTop: 16 }}>
        <Text style={{ marginBottom: 6, fontWeight: 'bold' }}>Κατηγορία:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[styles.categoryButton, selectedCategory === 'all' && styles.selectedCategory]}
            onPress={() => filterByCategory('all')}
          >
            <Text>Όλες οι κατηγορίες</Text>
          </TouchableOpacity>
          {categories.map(cat => (
            <TouchableOpacity
              key={cat.genre_id}
              style={[styles.categoryButton, selectedCategory === cat.genre_id && styles.selectedCategory]}
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
          placeholder="Αναζήτηση ταινίας..."
          value={searchTerm}
          onChangeText={search}
        />
        <Ionicons name="search" size={20} color="#888" style={{ marginLeft: 8 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        {filteredMovies.length === 0 ? (
          <Text style={styles.noResultsText}>Δεν βρέθηκαν ταινίες.</Text>
        ) : (
          filteredMovies.map(movie => (
            <View key={movie.id} style={styles.movieItem}>
              <Text style={styles.text}>{movie.title}</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('Επεξεργασία λεπτομερειών ταινίας', { movieId: movie.id })}
              >
                <Text style={styles.detailsText}>Επεξεργασία λεπτομερειών ταινίας</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteButton} onPress={() => removeMovie(movie.id)}>
                <Text style={styles.deleteButtonText}>Διαγραφή</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 24,
    paddingBottom: 80,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  movieItem: {
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#eee',
    borderRadius: 8,
  },
  text: {
    fontSize: 18,
  },
  detailsText: {
    marginTop: 8,
    fontSize: 14,
    color: '#007bff',
    textDecorationLine: 'underline',
  },
  noResultsText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 32,
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
  deleteButton: {
    marginTop: 10,
    backgroundColor: '#e74c3c',
    padding: 10,
    borderRadius: 8,
  },
  deleteButtonText: {
    color: '#fff',
    textAlign: 'center',
  },
});

export default ArxikhAdmin;