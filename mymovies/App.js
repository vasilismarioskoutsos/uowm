import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import ArxikhXrhsthScreen from './screens/ArxikhXrhsthScreen';
import DetailScreen from './screens/DetailScreen';
import CreateCategory from './screens/CreateCategory';
import AddMovie from './screens/AddMovie';  
import ArxikhAdmin from './screens/ArxikhAdmin'; 
import AddUser from './screens/AddUser'; 
import UsersScreen from './screens/UsersScreen'; 
import EditDetails from './screens/EditDetails'; 
import EditMovieDetails from './screens/EditMovieDetails'; 
import WatchlistScreen from './screens/WatchlistScreen';
import RecommendationScreen from './screens/Recommendations'; 
import AsyncStorage from '@react-native-async-storage/async-storage';

const Drawer = createDrawerNavigator();
const Stack = createNativeStackNavigator();

function LogoutScreen({ navigation }) {
  React.useEffect(() => {
    const logout = async () => {
      try {
        await AsyncStorage.removeItem('user_id');
        await AsyncStorage.removeItem('role');
      } 
      catch (e) {}
      navigation.reset({
        index: 0,
        routes: [{ name: 'Σύνδεση' }],
      });
    };
    logout();
  }, []);

  return null;
}

function DrawerScreens() {
  const [role, setRole] = useState(null);

  useEffect(() => {
    const getRole = async () => {
      const storedRole = await AsyncStorage.getItem('role');
      setRole(storedRole);
    };
    getRole();
  }, []);

  if (!role) {
    return null;
  }

  return (
  <Drawer.Navigator>
    {role === 'user' && (
      <>
        <Drawer.Screen name="Όλες οι Ταινίες" component={ArxikhXrhsthScreen} />
        <Drawer.Screen name="Watchlist" component={WatchlistScreen} />
        <Drawer.Screen name="Αποσύνδεση" component={LogoutScreen} />
      </>
    )}
    {(role === 'upallilos' || role === 'main') && (
      <>
        <Drawer.Screen name="Όλες οι Ταινίες" component={ArxikhAdmin} />
        <Drawer.Screen name="Δημιουργία Ταινίας" component={AddMovie} />
        <Drawer.Screen name="Δημιουργία Κατηγορίας" component={CreateCategory} />
        {role === 'main' && (
  <>
    <Drawer.Screen name="Προσθήκη υπαλλήλου" component={AddUser} />
    <Drawer.Screen name="Χρήστες" component={UsersScreen} />
  </>
)}

        <Drawer.Screen name="Αποσύνδεση" component={LogoutScreen} />
      </>
    )}
  </Drawer.Navigator>
);
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Σύνδεση">
        <Stack.Screen name="Σύνδεση" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Εγγραφή" component={RegisterScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Λεπτομέρειες ταινίας" component={DetailScreen} options={{ headerShown: true }} />
        <Stack.Screen name="Main" component={DrawerScreens} options={{ headerShown: false }} />
        <Stack.Screen name="Δημιουργία Κατηγορίας" component={CreateCategory} options={{ headerShown: false }} /> 
        <Stack.Screen name="Προσθήκη υπαλλήλου" component={AddUser} options={{ headerShown: false }} /> 
        <Stack.Screen name="Χρήστες" component={UsersScreen} options={{ headerShown: false }} /> 
        <Stack.Screen name="Watchlist" component={WatchlistScreen} options={{ headerShown: false }} /> 
        <Stack.Screen name="Επεξεργασία χρήστη" component={EditDetails} options={{ headerShown: false }} />
        <Stack.Screen name="Επεξεργασία λεπτομερειών ταινίας" component={EditMovieDetails} options={{ headerShown: false }} />
        <Stack.Screen name="Συστάσεις Ταινιών" component={RecommendationScreen} options={{ headerShown: true }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}