import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  StatusBar,
  SafeAreaView,
  ScrollView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';

// Following SOLID principles - Single Responsibility Principle
// This component handles PDF reading and progress tracking using expo-web-browser

const BookReaderScreen = ({ route, navigation }) => {
  const { book, grade, type } = route.params;
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(book.totalPages || 0);
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadProgress();
    
    // Set navigation title
    navigation.setOptions({
      title: book.title,
      headerTintColor: '#fff',
      headerStyle: {
        backgroundColor: '#4CAF50',
      },
      headerTitleStyle: {
        fontWeight: 'bold',
      },
    });
  }, [book.title, navigation]);

  // DRY principle - centralized progress loading
  const loadProgress = async () => {
    try {
      const progressKey = `progress_grade_${grade}`;
      const savedProgress = await AsyncStorage.getItem(progressKey);
      
      if (savedProgress) {
        const parsedProgress = JSON.parse(savedProgress);
        const bookProgress = parsedProgress[book.id];
        
        if (bookProgress && bookProgress.currentPage > 0) {
          setCurrentPage(bookProgress.currentPage);
          updateProgress(bookProgress.currentPage, totalPages);
        }
      }
    } catch (error) {
      console.error('Error loading progress:', error);
    }
  };

  // SOLID - Interface Segregation: Separate progress saving logic
  const saveProgress = async (page, completed = false) => {
    try {
      const progressKey = `progress_grade_${grade}`;
      const existingProgress = await AsyncStorage.getItem(progressKey);
      let progressData = existingProgress ? JSON.parse(existingProgress) : {};
      
      progressData[book.id] = {
        currentPage: page,
        totalPages: totalPages,
        completed: completed,
        lastRead: new Date().toISOString(),
        bookTitle: book.title,
        bookType: type
      };
      
      await AsyncStorage.setItem(progressKey, JSON.stringify(progressData));
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };

  // DRY principle - reusable progress calculation
  const updateProgress = (page, total) => {
    const progressPercent = total > 0 ? Math.round((page / total) * 100) : 0;
    setProgress(progressPercent);
  };

  // Handle opening PDF in external viewer
  const handleOpenPDF = async () => {
    try {
      setIsLoading(true);
      await WebBrowser.openBrowserAsync(book.pdfUrl);
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      Alert.alert(
        'Error',
        'Unable to open PDF. Please check your internet connection and try again.',
        [{ text: 'OK' }]
      );
    }
  };

  // Manual page tracking for progress
  const handlePageUpdate = async (page) => {
    if (page < 1 || page > totalPages) return;
    
    setCurrentPage(page);
    updateProgress(page, totalPages);
    await saveProgress(page, false);
    
    if (page === totalPages) {
      handleBookCompletion();
    }
  };

  // YAGNI principle - only handle completion when needed
  const handleBookCompletion = async () => {
    try {
      await saveProgress(totalPages, true);
      
      Alert.alert(
        'Congratulations! 🎉',
        `You have completed "${book.title}"!`,
        [
          {
            text: 'Continue',
            style: 'cancel'
          },
          {
            text: 'Go Back',
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (error) {
      console.error('Error handling book completion:', error);
    }
  };

  // Following SOLID - Open/Closed Principle: Components can be extended
  const ProgressBar = () => (
    <View style={styles.progressContainer}>
      <View style={styles.progressInfo}>
        <Text style={styles.progressText}>
          Page {currentPage} of {totalPages}
        </Text>
        <Text style={styles.progressPercentage}>
          {progress}%
        </Text>
      </View>
      
      <View style={styles.progressBarBackground}>
        <View 
          style={[
            styles.progressBarFill, 
            { width: `${progress}%` }
          ]} 
        />
      </View>
    </View>
  );

  const ManualProgressControls = () => (
    <View style={styles.manualControlsContainer}>
      <Text style={styles.manualControlsTitle}>Track Your Progress</Text>
      <Text style={styles.manualControlsSubtitle}>
        Update your reading progress manually as you read
      </Text>
      
      <View style={styles.pageInputContainer}>
        <TouchableOpacity
          style={[styles.pageButton, currentPage <= 1 && styles.disabledButton]}
          onPress={() => handlePageUpdate(currentPage - 1)}
          disabled={currentPage <= 1}
        >
          <Text style={[styles.pageButtonText, currentPage <= 1 && styles.disabledButtonText]}>
            ← Previous Page
          </Text>
        </TouchableOpacity>
        
        <View style={styles.currentPageDisplay}>
          <Text style={styles.currentPageText}>{currentPage}</Text>
        </View>
        
        <TouchableOpacity
          style={[styles.pageButton, currentPage >= totalPages && styles.disabledButton]}
          onPress={() => handlePageUpdate(currentPage + 1)}
          disabled={currentPage >= totalPages}
        >
          <Text style={[styles.pageButtonText, currentPage >= totalPages && styles.disabledButtonText]}>
            Next Page →
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.quickJumpContainer}>
        <Text style={styles.quickJumpTitle}>Quick Jump to Page:</Text>
        <View style={styles.quickJumpButtons}>
          {[1, Math.floor(totalPages * 0.25), Math.floor(totalPages * 0.5), Math.floor(totalPages * 0.75), totalPages].map((page, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.quickJumpButton, currentPage === page && styles.activeQuickJumpButton]}
              onPress={() => handlePageUpdate(page)}
            >
              <Text style={[styles.quickJumpButtonText, currentPage === page && styles.activeQuickJumpButtonText]}>
                {page}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4CAF50" />
      
      {/* Progress Bar */}
      <ProgressBar />
      
      <ScrollView style={styles.contentContainer} contentContainerStyle={styles.scrollContent}>
        {/* Book Info */}
        <View style={styles.bookInfoContainer}>
          <Text style={styles.bookTitle}>{book.title}</Text>
          <Text style={styles.bookDetails}>
            Grade {book.grade} • {book.type} Learning • {book.totalPages} pages
          </Text>
        </View>

        {/* PDF Open Button */}
        <View style={styles.pdfContainer}>
          <Text style={styles.pdfInstructions}>
            📖 Tap the button below to open the PDF in your device's PDF reader
          </Text>
          
          <TouchableOpacity
            style={styles.openPdfButton}
            onPress={handleOpenPDF}
            disabled={isLoading}
          >
            <Text style={styles.openPdfButtonText}>
              {isLoading ? 'Opening PDF...' : '📄 Open PDF Book'}
            </Text>
          </TouchableOpacity>
          
          <Text style={styles.pdfNote}>
            After reading in the PDF viewer, come back here to track your progress
          </Text>
        </View>

        {/* Manual Progress Controls */}
        <ManualProgressControls />

        {/* Reading Tips */}
        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>📚 Reading Tips</Text>
          <View style={styles.tipItem}>
            <Text style={styles.tipText}>• Read at your own pace</Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={styles.tipText}>• Update your progress as you go</Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={styles.tipText}>• Complete all pages to unlock achievements</Text>
          </View>
          {type === 'intensive' && (
            <View style={styles.tipItem}>
              <Text style={styles.tipText}>• Finish all intensive books to unlock extensive learning</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  progressContainer: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  progressText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  progressPercentage: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 3,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 3,
  },
  contentContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  bookInfoContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  bookTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
    textAlign: 'center',
  },
  bookDetails: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  pdfContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  pdfInstructions: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  openPdfButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 12,
    marginBottom: 15,
    minWidth: 200,
    alignItems: 'center',
  },
  openPdfButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  pdfNote: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  manualControlsContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  manualControlsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
    textAlign: 'center',
  },
  manualControlsSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  pageInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  pageButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#ddd',
  },
  pageButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  disabledButtonText: {
    color: '#999',
  },
  currentPageDisplay: {
    backgroundColor: '#f8f9fa',
    borderWidth: 2,
    borderColor: '#4CAF50',
    borderRadius: 12,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  currentPageText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  quickJumpContainer: {
    marginTop: 10,
  },
  quickJumpTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 10,
    textAlign: 'center',
  },
  quickJumpButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  },
  quickJumpButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 2,
    marginVertical: 2,
    minWidth: 40,
    alignItems: 'center',
  },
  activeQuickJumpButton: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  quickJumpButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  activeQuickJumpButtonText: {
    color: '#fff',
  },
  tipsContainer: {
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
  tipsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
  },
  tipItem: {
    marginBottom: 8,
  },
  tipText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
});

export default BookReaderScreen; 