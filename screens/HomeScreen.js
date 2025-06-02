import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getIntensiveBooks } from '../data/books';

// Following SOLID principles - Single Responsibility Principle
// This component handles home screen navigation and state

const HomeScreen = ({ navigation }) => {
  const [selectedGrade, setSelectedGrade] = useState(null);
  const [extensiveLearningUnlocked, setExtensiveLearningUnlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUserData();
    
    // Set up focus listener to refresh data when screen comes into focus
    const unsubscribe = navigation.addListener('focus', () => {
      loadUserData();
    });

    return unsubscribe;
  }, [navigation]);

  // DRY principle - centralized data loading
  const loadUserData = async () => {
    try {
      const grade = await AsyncStorage.getItem('selectedGrade');
      if (!grade) {
        // If no grade selected, navigate to grade selection
        navigation.replace('GradeSelection');
        return;
      }
      
      setSelectedGrade(parseInt(grade));
      
      // Check if extensive learning should be unlocked
      const unlocked = await checkExtensiveLearningStatus(parseInt(grade));
      setExtensiveLearningUnlocked(unlocked);
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // SOLID - Interface Segregation: Separate concerns
  const checkExtensiveLearningStatus = async (grade) => {
    try {
      const progressKey = `progress_grade_${grade}`;
      const progress = await AsyncStorage.getItem(progressKey);
      
      if (progress) {
        const parsedProgress = JSON.parse(progress);
        const intensiveBooks = getIntensiveBooks(grade);
        
        if (intensiveBooks.length === 0) return false;
        
        return intensiveBooks.every(book => {
          const bookProgress = parsedProgress[book.id];
          return bookProgress && bookProgress.completed;
        });
      }
      
      return false;
    } catch (error) {
      console.error('Error checking extensive learning status:', error);
      return false;
    }
  };

  const handleIntensiveLearning = () => {
    if (!selectedGrade) {
      Alert.alert('Error', 'Please select your grade first.');
      return;
    }
    navigation.navigate('IntensiveBooks', { grade: selectedGrade });
  };

  const handleExtensiveLearning = () => {
    if (!selectedGrade) {
      Alert.alert('Error', 'Please select your grade first.');
      return;
    }
    
    if (!extensiveLearningUnlocked) {
      Alert.alert(
        'Locked',
        'Complete all Intensive Learning books to unlock Extensive Learning.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    navigation.navigate('ExtensiveBooks', { grade: selectedGrade });
  };

  const handleProfile = () => {
    navigation.navigate('Profile');
  };

  const handleChangeGrade = () => {
    Alert.alert(
      'Change Grade',
      'Are you sure you want to change your grade? This will reset your progress.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Change', 
          onPress: () => navigation.navigate('GradeSelection'),
          style: 'destructive'
        }
      ]
    );
  };

  // Following SOLID - Open/Closed Principle: Components can be extended
  const FeatureCard = ({ title, description, onPress, locked = false, icon }) => (
    <TouchableOpacity
      style={[styles.featureCard, locked && styles.lockedCard]}
      onPress={onPress}
      disabled={locked}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardIcon}>{icon}</Text>
        {locked && <Text style={styles.lockIcon}>🔒</Text>}
      </View>
      <Text style={[styles.cardTitle, locked && styles.lockedText]}>{title}</Text>
      <Text style={[styles.cardDescription, locked && styles.lockedText]}>
        {description}
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
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Welcome to</Text>
        <Text style={styles.appTitle}>Reading Adventures</Text>
        {selectedGrade && (
          <View style={styles.gradeContainer}>
            <Text style={styles.gradeText}>Grade {selectedGrade}</Text>
            <TouchableOpacity onPress={handleChangeGrade} style={styles.changeGradeButton}>
              <Text style={styles.changeGradeText}>Change</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Feature Cards */}
      <View style={styles.featuresContainer}>
        <FeatureCard
          title="Intensive Learning"
          description="Build your reading foundation with guided practice"
          onPress={handleIntensiveLearning}
          icon="📚"
        />
        
        <FeatureCard
          title="Extensive Learning"
          description="Practice fluency with timed reading and recording"
          onPress={handleExtensiveLearning}
          locked={!extensiveLearningUnlocked}
          icon="⏱️"
        />
        
        <FeatureCard
          title="My Profile"
          description="View your progress, achievements, and recordings"
          onPress={handleProfile}
          icon="👤"
        />
      </View>
      
      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        <Text style={styles.progressTitle}>Your Journey</Text>
        <View style={styles.progressBar}>
          <View style={styles.progressStep}>
            <View style={[styles.stepCircle, styles.activeStep]}>
              <Text style={styles.stepText}>1</Text>
            </View>
            <Text style={styles.stepLabel}>Grade Selection</Text>
          </View>
          
          <View style={styles.progressLine} />
          
          <View style={styles.progressStep}>
            <View style={[styles.stepCircle, styles.activeStep]}>
              <Text style={styles.stepText}>2</Text>
            </View>
            <Text style={styles.stepLabel}>Intensive Learning</Text>
          </View>
          
          <View style={styles.progressLine} />
          
          <View style={styles.progressStep}>
            <View style={[
              styles.stepCircle, 
              extensiveLearningUnlocked ? styles.activeStep : styles.inactiveStep
            ]}>
              <Text style={styles.stepText}>3</Text>
            </View>
            <Text style={styles.stepLabel}>Extensive Learning</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  contentContainer: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    fontSize: 18,
    color: '#666',
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    paddingTop: 20,
  },
  welcomeText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 5,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
  },
  gradeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
  },
  gradeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 10,
  },
  changeGradeButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  changeGradeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  featuresContainer: {
    marginBottom: 30,
  },
  featureCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  lockedCard: {
    opacity: 0.6,
    backgroundColor: '#f5f5f5',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardIcon: {
    fontSize: 32,
  },
  lockIcon: {
    fontSize: 20,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
  lockedText: {
    color: '#999',
  },
  progressContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 20,
    textAlign: 'center',
  },
  progressBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressStep: {
    alignItems: 'center',
  },
  stepCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  activeStep: {
    backgroundColor: '#4CAF50',
  },
  inactiveStep: {
    backgroundColor: '#ddd',
  },
  stepText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  stepLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    maxWidth: 80,
  },
  progressLine: {
    height: 2,
    backgroundColor: '#ddd',
    flex: 1,
    marginHorizontal: 10,
  },
});

export default HomeScreen; 