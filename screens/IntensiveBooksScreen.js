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
import { getIntensiveBooks } from '../data/books';

// Following SOLID principles - Single Responsibility Principle
// This component handles intensive books listing and progress tracking

const IntensiveBooksScreen = ({ route, navigation }) => {
  const { grade } = route.params;
  const [books, setBooks] = useState([]);
  const [progress, setProgress] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadBooksAndProgress();
    
    // Refresh data when screen comes into focus
    const unsubscribe = navigation.addListener('focus', () => {
      loadBooksAndProgress();
    });

    return unsubscribe;
  }, [navigation, grade]);

  // DRY principle - centralized data loading
  const loadBooksAndProgress = async () => {
    try {
      const intensiveBooks = getIntensiveBooks(grade);
      setBooks(intensiveBooks);
      
      // Load progress from AsyncStorage
      const progressKey = `progress_grade_${grade}`;
      const savedProgress = await AsyncStorage.getItem(progressKey);
      
      if (savedProgress) {
        setProgress(JSON.parse(savedProgress));
      }
    } catch (error) {
      console.error('Error loading books and progress:', error);
      Alert.alert('Error', 'Failed to load books. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // SOLID - Interface Segregation: Separate book selection logic
  const handleBookSelection = (book) => {
    if (!book) {
      Alert.alert('Error', 'Invalid book selection.');
      return;
    }

    navigation.navigate('BookReader', {
      book,
      grade,
      type: 'intensive'
    });
  };

  // DRY principle - reusable progress calculation
  const getBookProgress = (bookId) => {
    return progress[bookId] || { currentPage: 0, completed: false, totalPages: 0 };
  };

  const getProgressPercentage = (bookId, totalPages) => {
    const bookProgress = getBookProgress(bookId);
    if (bookProgress.completed) return 100;
    return totalPages > 0 ? Math.round((bookProgress.currentPage / totalPages) * 100) : 0;
  };

  // Following SOLID - Open/Closed Principle: Component can be extended
  const BookItem = ({ book }) => {
    const bookProgress = getBookProgress(book.id);
    const progressPercentage = getProgressPercentage(book.id, book.totalPages);
    const isCompleted = bookProgress.completed;

    return (
      <TouchableOpacity
        style={[styles.bookItem, isCompleted && styles.completedBookItem]}
        onPress={() => handleBookSelection(book)}
      >
        <View style={styles.bookHeader}>
          <View style={styles.bookInfo}>
            <Text style={[styles.bookTitle, isCompleted && styles.completedText]}>
              {book.title}
            </Text>
            <Text style={styles.bookDetails}>
              {book.totalPages} pages • Grade {book.grade}
            </Text>
          </View>
          
          <View style={styles.statusContainer}>
            {isCompleted ? (
              <View style={styles.completedBadge}>
                <Text style={styles.completedBadgeText}>✓</Text>
              </View>
            ) : (
              <Text style={styles.progressText}>{progressPercentage}%</Text>
            )}
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBackground}>
            <View 
              style={[
                styles.progressBarFill, 
                { width: `${progressPercentage}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressLabel}>
            {bookProgress.currentPage || 0} / {book.totalPages} pages
          </Text>
        </View>

        {/* Book Description */}
        <Text style={styles.bookDescription}>
          {isCompleted 
            ? "Book completed! Tap to review." 
            : bookProgress.currentPage > 0 
              ? "Continue reading where you left off." 
              : "Start reading this book to build your foundation."
          }
        </Text>
      </TouchableOpacity>
    );
  };

  // YAGNI principle - only render what's needed
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📚</Text>
      <Text style={styles.emptyTitle}>No Books Available</Text>
      <Text style={styles.emptyDescription}>
        No intensive learning books are available for Grade {grade} yet.
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading books...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Intensive Learning</Text>
        <Text style={styles.subtitle}>Grade {grade} • Foundation Building</Text>
        
        {books.length > 0 && (
          <View style={styles.statsContainer}>
            <Text style={styles.statsText}>
              {books.filter(book => getBookProgress(book.id).completed).length} of {books.length} completed
            </Text>
          </View>
        )}
      </View>

      <FlatList
        data={books}
        renderItem={({ item }) => <BookItem book={item} />}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContainer,
          books.length === 0 && styles.emptyListContainer
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
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
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
  },
  statsContainer: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  statsText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  listContainer: {
    padding: 20,
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  bookItem: {
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
  completedBookItem: {
    borderLeftWidth: 5,
    borderLeftColor: '#4CAF50',
  },
  bookHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  bookInfo: {
    flex: 1,
    marginRight: 15,
  },
  bookTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 5,
  },
  completedText: {
    color: '#4CAF50',
  },
  bookDetails: {
    fontSize: 14,
    color: '#666',
  },
  statusContainer: {
    alignItems: 'center',
  },
  completedBadge: {
    backgroundColor: '#4CAF50',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedBadgeText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
  },
  progressBarContainer: {
    marginBottom: 15,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#e9ecef',
    borderRadius: 4,
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  progressLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
  },
  bookDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default IntensiveBooksScreen; 