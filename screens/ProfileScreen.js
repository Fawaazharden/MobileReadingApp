import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getIntensiveBooks, getExtensiveBooks } from '../data/books';

// Following SOLID principles - Single Responsibility Principle
// This component handles user profile and progress display

const ProfileScreen = ({ navigation }) => {
  const [selectedGrade, setSelectedGrade] = useState(null);
  const [progress, setProgress] = useState({});
  const [stats, setStats] = useState({
    totalBooksCompleted: 0,
    intensiveBooksCompleted: 0,
    extensiveBooksCompleted: 0,
    totalPagesRead: 0,
    currentStreak: 0
  });
  const [recentBooks, setRecentBooks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProfileData();
    
    // Refresh data when screen comes into focus
    const unsubscribe = navigation.addListener('focus', () => {
      loadProfileData();
    });

    return unsubscribe;
  }, [navigation]);

  // DRY principle - centralized data loading
  const loadProfileData = async () => {
    try {
      const grade = await AsyncStorage.getItem('selectedGrade');
      if (!grade) {
        navigation.replace('GradeSelection');
        return;
      }
      
      setSelectedGrade(parseInt(grade));
      await loadProgressData(parseInt(grade));
    } catch (error) {
      console.error('Error loading profile data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // SOLID - Interface Segregation: Separate progress data loading
  const loadProgressData = async (grade) => {
    try {
      const progressKey = `progress_grade_${grade}`;
      const savedProgress = await AsyncStorage.getItem(progressKey);
      
      if (savedProgress) {
        const parsedProgress = JSON.parse(savedProgress);
        setProgress(parsedProgress);
        calculateStats(parsedProgress, grade);
        getRecentBooks(parsedProgress);
      }
    } catch (error) {
      console.error('Error loading progress data:', error);
    }
  };

  // DRY principle - reusable stats calculation
  const calculateStats = (progressData, grade) => {
    const intensiveBooks = getIntensiveBooks(grade);
    const extensiveBooks = getExtensiveBooks(grade);
    
    let totalCompleted = 0;
    let intensiveCompleted = 0;
    let extensiveCompleted = 0;
    let totalPagesRead = 0;

    Object.values(progressData).forEach(bookProgress => {
      if (bookProgress.completed) {
        totalCompleted++;
        
        if (bookProgress.bookType === 'intensive') {
          intensiveCompleted++;
        } else if (bookProgress.bookType === 'extensive') {
          extensiveCompleted++;
        }
      }
      
      totalPagesRead += bookProgress.currentPage || 0;
    });

    setStats({
      totalBooksCompleted: totalCompleted,
      intensiveBooksCompleted: intensiveCompleted,
      extensiveBooksCompleted: extensiveCompleted,
      totalPagesRead: totalPagesRead,
      currentStreak: calculateReadingStreak(progressData),
      totalBooks: intensiveBooks.length + extensiveBooks.length,
      intensiveTotal: intensiveBooks.length,
      extensiveTotal: extensiveBooks.length
    });
  };

  // YAGNI principle - simple streak calculation for now
  const calculateReadingStreak = (progressData) => {
    // Simple implementation - count consecutive days with reading activity
    // For MVP, we'll return a placeholder value
    return Object.keys(progressData).length; // Temporary implementation
  };

  // DRY principle - get recent books
  const getRecentBooks = (progressData) => {
    const recent = Object.entries(progressData)
      .filter(([bookId, data]) => data.lastRead)
      .sort((a, b) => new Date(b[1].lastRead) - new Date(a[1].lastRead))
      .slice(0, 5)
      .map(([bookId, data]) => ({
        id: bookId,
        title: data.bookTitle,
        progress: data.completed ? 100 : Math.round((data.currentPage / data.totalPages) * 100),
        completed: data.completed,
        lastRead: data.lastRead,
        type: data.bookType
      }));
    
    setRecentBooks(recent);
  };

  const handleResetProgress = () => {
    Alert.alert(
      'Reset Progress',
      'Are you sure you want to reset all your reading progress? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              const progressKey = `progress_grade_${selectedGrade}`;
              await AsyncStorage.removeItem(progressKey);
              await loadProfileData();
              Alert.alert('Success', 'Your progress has been reset.');
            } catch (error) {
              console.error('Error resetting progress:', error);
              Alert.alert('Error', 'Failed to reset progress. Please try again.');
            }
          }
        }
      ]
    );
  };

  // Following SOLID - Open/Closed Principle: Components can be extended
  const StatCard = ({ title, value, subtitle, color = '#4CAF50' }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </View>
  );

  const RecentBookItem = ({ book }) => (
    <View style={styles.recentBookItem}>
      <View style={styles.recentBookInfo}>
        <Text style={styles.recentBookTitle} numberOfLines={1}>
          {book.title}
        </Text>
        <Text style={styles.recentBookMeta}>
          {book.type} • {book.completed ? 'Completed' : `${book.progress}% complete`}
        </Text>
        <Text style={styles.recentBookDate}>
          Last read: {new Date(book.lastRead).toLocaleDateString()}
        </Text>
      </View>
      
      <View style={styles.recentBookStatus}>
        {book.completed ? (
          <View style={styles.completedBadge}>
            <Text style={styles.completedBadgeText}>✓</Text>
          </View>
        ) : (
          <Text style={styles.progressText}>{book.progress}%</Text>
        )}
      </View>
    </View>
  );

  const AchievementBadge = ({ title, description, unlocked = false }) => (
    <View style={[styles.achievementBadge, !unlocked && styles.lockedBadge]}>
      <Text style={styles.achievementIcon}>
        {unlocked ? '🏆' : '🔒'}
      </Text>
      <Text style={[styles.achievementTitle, !unlocked && styles.lockedText]}>
        {title}
      </Text>
      <Text style={[styles.achievementDescription, !unlocked && styles.lockedText]}>
        {description}
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Profile</Text>
        <Text style={styles.headerSubtitle}>Grade {selectedGrade}</Text>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsContainer}>
        <View style={styles.statsRow}>
          <StatCard
            title="Books Completed"
            value={stats.totalBooksCompleted}
            subtitle={`of ${stats.totalBooks || 0} total`}
            color="#4CAF50"
          />
          <StatCard
            title="Pages Read"
            value={stats.totalPagesRead}
            color="#2196F3"
          />
        </View>
        
        <View style={styles.statsRow}>
          <StatCard
            title="Intensive Books"
            value={stats.intensiveBooksCompleted}
            subtitle={`of ${stats.intensiveTotal || 0} total`}
            color="#FF9800"
          />
          <StatCard
            title="Extensive Books"
            value={stats.extensiveBooksCompleted}
            subtitle={`of ${stats.extensiveTotal || 0} total`}
            color="#9C27B0"
          />
        </View>
      </View>

      {/* Recent Reading Activity */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Reading Activity</Text>
        {recentBooks.length > 0 ? (
          recentBooks.map((book, index) => (
            <RecentBookItem key={index} book={book} />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              No reading activity yet. Start reading to see your progress here!
            </Text>
          </View>
        )}
      </View>

      {/* Achievements */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Achievements</Text>
        <View style={styles.achievementsGrid}>
          <AchievementBadge
            title="First Book"
            description="Complete your first book"
            unlocked={stats.totalBooksCompleted >= 1}
          />
          <AchievementBadge
            title="Foundation Builder"
            description="Complete all intensive books"
            unlocked={stats.intensiveBooksCompleted === stats.intensiveTotal && stats.intensiveTotal > 0}
          />
          <AchievementBadge
            title="Speed Reader"
            description="Complete 5 books"
            unlocked={stats.totalBooksCompleted >= 5}
          />
          <AchievementBadge
            title="Bookworm"
            description="Read 100 pages"
            unlocked={stats.totalPagesRead >= 100}
          />
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.resetButton} onPress={handleResetProgress}>
          <Text style={styles.resetButtonText}>Reset Progress</Text>
        </TouchableOpacity>
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
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 18,
    color: '#666',
  },
  statsContainer: {
    marginBottom: 30,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 5,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 5,
  },
  statTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 2,
  },
  statSubtitle: {
    fontSize: 12,
    color: '#999',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
  },
  recentBookItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  recentBookInfo: {
    flex: 1,
    marginRight: 15,
  },
  recentBookTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 5,
  },
  recentBookMeta: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  recentBookDate: {
    fontSize: 12,
    color: '#999',
  },
  recentBookStatus: {
    alignItems: 'center',
  },
  completedBadge: {
    backgroundColor: '#4CAF50',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedBadgeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  achievementBadge: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    width: '48%',
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lockedBadge: {
    opacity: 0.6,
    backgroundColor: '#f5f5f5',
  },
  achievementIcon: {
    fontSize: 32,
    marginBottom: 10,
  },
  achievementTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 5,
    textAlign: 'center',
  },
  achievementDescription: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  lockedText: {
    color: '#999',
  },
  emptyState: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  actionsContainer: {
    marginTop: 20,
    marginBottom: 40,
  },
  resetButton: {
    backgroundColor: '#f44336',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProfileScreen; 