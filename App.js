import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';

// Import all screens
import GradeSelectionScreen from './screens/GradeSelectionScreen';
import HomeScreen from './screens/HomeScreen';
import IntensiveBooksScreen from './screens/IntensiveBooksScreen';
import BookReaderScreen from './screens/BookReaderScreen';
import ProfileScreen from './screens/ProfileScreen';

// Following SOLID principles - Single Responsibility Principle
// This component handles app-level navigation structure

const Stack = createStackNavigator();

// KISS principle - simple and clear navigation structure
const App = () => {
  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator
        initialRouteName="GradeSelection"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#4CAF50',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        {/* Grade Selection - First screen */}
        <Stack.Screen
          name="GradeSelection"
          component={GradeSelectionScreen}
          options={{
            title: 'Select Your Grade',
            headerLeft: null, // Prevent going back
          }}
        />
        
        {/* Home Screen - Main navigation hub */}
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{
            title: 'Reading Adventures',
            headerLeft: null, // Prevent going back to grade selection
          }}
        />
        
        {/* Intensive Learning Books List */}
        <Stack.Screen
          name="IntensiveBooks"
          component={IntensiveBooksScreen}
          options={{
            title: 'Intensive Learning',
          }}
        />
        
        {/* Book Reader for PDFs */}
        <Stack.Screen
          name="BookReader"
          component={BookReaderScreen}
          options={{
            title: 'Reading',
            headerShown: false, // Full screen reading experience
          }}
        />
        
        {/* Profile Screen */}
        <Stack.Screen
          name="Profile"
          component={ProfileScreen}
          options={{
            title: 'My Profile',
          }}
        />
        
        {/* Future screens for Phase 2 and 3 can be added here */}
        {/* ExtensiveBooks, Quiz screens will be added in later phases */}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App; 