import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Following SOLID principles - Single Responsibility Principle
// This component is only responsible for grade selection

const GradeSelectionScreen = ({ navigation }) => {
  const [selectedGrade, setSelectedGrade] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Grades 1-12 following KISS principle - simple array
  const grades = Array.from({ length: 12 }, (_, i) => i + 1);

  useEffect(() => {
    loadSavedGrade();
  }, []);

  // DRY principle - separate function for loading grade
  const loadSavedGrade = async () => {
    try {
      const savedGrade = await AsyncStorage.getItem('selectedGrade');
      if (savedGrade) {
        setSelectedGrade(parseInt(savedGrade));
      }
    } catch (error) {
      console.error('Error loading saved grade:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // DRY principle - separate function for saving grade
  const saveGrade = async (grade) => {
    try {
      await AsyncStorage.setItem('selectedGrade', grade.toString());
      setSelectedGrade(grade);
      
      // Navigate to home after successful save
      navigation.navigate('Home');
    } catch (error) {
      console.error('Error saving grade:', error);
      Alert.alert('Error', 'Failed to save grade selection. Please try again.');
    }
  };

  const handleGradeSelection = (grade) => {
    Alert.alert(
      'Confirm Grade',
      `Are you sure you want to select Grade ${grade}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: () => saveGrade(grade) }
      ]
    );
  };

  // Following SOLID - Open/Closed Principle: Component can be extended
  const renderGradeItem = ({ item: grade }) => (
    <TouchableOpacity
      style={[
        styles.gradeItem,
        selectedGrade === grade && styles.selectedGradeItem
      ]}
      onPress={() => handleGradeSelection(grade)}
    >
      <Text style={[
        styles.gradeText,
        selectedGrade === grade && styles.selectedGradeText
      ]}>
        Grade {grade}
      </Text>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Your Grade</Text>
      <Text style={styles.subtitle}>
        Choose your current grade level to get started
      </Text>
      
      <FlatList
        data={grades}
        renderItem={renderGradeItem}
        keyExtractor={(item) => item.toString()}
        numColumns={3}
        contentContainerStyle={styles.gradesList}
        showsVerticalScrollIndicator={false}
      />
      
      {selectedGrade && (
        <View style={styles.selectedContainer}>
          <Text style={styles.selectedText}>
            Currently selected: Grade {selectedGrade}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    fontSize: 18,
    color: '#666',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginTop: 40,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
  },
  gradesList: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  gradeItem: {
    flex: 1,
    backgroundColor: '#fff',
    margin: 8,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  selectedGradeItem: {
    backgroundColor: '#4CAF50',
  },
  gradeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  selectedGradeText: {
    color: '#fff',
  },
  selectedContainer: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
  },
  selectedText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default GradeSelectionScreen; 