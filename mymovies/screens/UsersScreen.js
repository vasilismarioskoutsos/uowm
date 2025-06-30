import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

const UsersScreen = () => {
  const navigation = useNavigation();

  const [employees, setEmployees] = useState([]);
  const [users, setUsers] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/get_users.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      const result = await response.json();

      if (result.success) {
        const allUsers = result.users;
        const upalliloi = allUsers.filter(user => user.role === 'upallilos');
        const kanonikoi = allUsers.filter(user => user.role === 'user');
        setEmployees(upalliloi);
        setUsers(kanonikoi);
        setFilteredEmployees(upalliloi);
        setFilteredUsers(kanonikoi);
      } else {
        setEmployees([]);
        setUsers([]);
        setFilteredEmployees([]);
        setFilteredUsers([]);
        window.alert(result.message || 'Αποτυχία φόρτωσης χρηστών');
      }
    } catch (error) {
      window.alert('Σφάλμα σύνδεσης με τον διακομιστή');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchUsers();
    }, [fetchUsers])
  );

  const handleAction = (userId, action) => {
    if (action === 'edit') {
      navigation.navigate('Επεξεργασία χρήστη', { userId });
      return;
    }

    const confirm = window.confirm('Είσαι σίγουρος για διαγραφή;');
    if (!confirm) return;

    fetch(`http://localhost:8000/user_action.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, action }),
    })
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          window.alert('Ο χρήστης διαγράφηκε επιτυχώς');
          fetchUsers();
        } else {
          window.alert(result.message || 'Αποτυχία ενέργειας');
        }
      })
      .catch(() => {
        window.alert('Σφάλμα σύνδεσης');
      });
  };

  const renderItem = ({ item }) => (
    <View style={styles.userCard}>
      <View style={{ flex: 1 }}>
        <Text style={styles.username}>{item.username}</Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleAction(item.id, 'delete')}
        >
          <Text style={styles.buttonText}>Διαγραφή</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => handleAction(item.id, 'edit')}
        >
          <Text style={styles.buttonText}>Επεξεργασία</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const handleEmployeeSearch = (text) => {
    setEmployeeSearch(text);
    const filtered = employees.filter(
      u => u.username.toLowerCase().includes(text.toLowerCase())
    );
    setFilteredEmployees(filtered);
  };

  const handleUserSearch = (text) => {
    setUserSearch(text);
    const filtered = users.filter(
      u => u.username.toLowerCase().includes(text.toLowerCase())
    );
    setFilteredUsers(filtered);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {loading ? (
        <ActivityIndicator size="large" />
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 60 }}>
          <Text style={styles.sectionTitle}>Υπάλληλοι</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Αναζήτηση υπαλλήλων..."
            value={employeeSearch}
            onChangeText={handleEmployeeSearch}
          />
          <FlatList
            data={filteredEmployees}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            scrollEnabled={false}
          />

          <Text style={styles.sectionTitle1}>Χρήστες</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Αναζήτηση χρηστών..."
            value={userSearch}
            onChangeText={handleUserSearch}
          />
          <FlatList
            data={filteredUsers}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            scrollEnabled={false}
          />
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f2f2f2',
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  sectionTitle1: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 20,
  },
  searchInput: {
    height: 40,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  userCard: {
    backgroundColor: '#fff',
    padding: 12,
    marginBottom: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  username: {
    fontSize: 16,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  deleteButton: {
    backgroundColor: '#dc3545',
    padding: 8,
    borderRadius: 6,
  },
  editButton: {
    backgroundColor: '#007bff',
    padding: 8,
    borderRadius: 6,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default UsersScreen;