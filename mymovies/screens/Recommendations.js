import React, { Component } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const PHP_RECOMMEND_URL = "http://localhost:8000/get_recommendations.php";

class RecommendationScreen extends Component {
  state = {
    recs: [],
    loading: true,
  };

  componentDidMount() {
    const { navigation } = this.props;
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ marginLeft: 15 }}
        >
          <Ionicons name="chevron-back" size={24} color="black" />
        </TouchableOpacity>
      ),
    });

    this.loadRecommendations();
  }

  loadRecommendations = async () => {
    this.setState({ loading: true });
    try {
      const userId = await AsyncStorage.getItem('user_id');
      if (!userId) throw new Error('No user logged in');

      const url = `${PHP_RECOMMEND_URL}?user=${encodeURIComponent(userId)}&k=20`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const data = await res.json();

      if (!Array.isArray(data.recommendations)) {
        throw new Error('Invalid response format');
      }

      this.setState({ recs: data.recommendations, loading: false });
    } catch (err) {
      this.setState({ loading: false });
      const msg = err.message || 'Σφάλμα κατά τη φόρτωση';
      if (Platform.OS === 'web') alert('Σφάλμα: ' + msg);
      else Alert.alert('Σφάλμα', msg);
    }
  };

  render() {
    const { recs, loading } = this.state;
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Προτάσεις Ταινιών</Text>

        {loading ? (
          <ActivityIndicator size="large" />
        ) : (
          <ScrollView contentContainerStyle={styles.list}>
            {recs.length === 0 ? (
              <Text style={styles.emptyText}>Δεν βρέθηκαν προτάσεις.</Text>
            ) : (
              recs.map((rec) => (
                <View key={rec.id} style={styles.item}>
                  <Text style={styles.itemText}>{rec.title}</Text>
                </View>
              ))
            )}
          </ScrollView>
        )}
      </View>
    );
  }
}

function RecommendationScreenWrapper() {
  const navigation = useNavigation();
  return <RecommendationScreen navigation={navigation} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#f9f9f9',
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
    textAlign: 'center',
  },
  list: {
    width: '100%',
    paddingVertical: 8,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 20,
  },
  item: {
    backgroundColor: '#fff',
    padding: 14,
    marginBottom: 10,
    borderRadius: 8,
    borderColor: '#ddd',
    borderWidth: 1,
  },
  itemText: {
    fontSize: 16,
    color: '#333',
  },
});

export default RecommendationScreenWrapper;