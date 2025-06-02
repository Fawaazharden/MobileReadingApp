// Sample book data for the Mobile Reading Application
// Following KISS principle - simple data structure

export const booksData = {
  // Grade 1 Books
  1: {
    intensive: [
      {
        id: 'grade1_intensive_1',
        title: 'The Cat and the Hat',
        grade: 1,
        type: 'intensive',
        pdfUrl: 'https://www.africau.edu/images/default/sample.pdf', // Sample PDF URL
        totalPages: 10,
        completed: false
      },
      {
        id: 'grade1_intensive_2',
        title: 'Simple Stories',
        grade: 1,
        type: 'intensive',
        pdfUrl: 'https://www.africau.edu/images/default/sample.pdf',
        totalPages: 8,
        completed: false
      }
    ],
    extensive: [
      {
        id: 'grade1_extensive_1',
        title: 'Fun Reading Adventures',
        grade: 1,
        type: 'extensive',
        pdfUrl: 'https://www.africau.edu/images/default/sample.pdf',
        totalPages: 15,
        completed: false,
        quizQuestions: [
          {
            id: 'q1',
            question: 'What color was the main character?',
            options: ['Red', 'Blue', 'Green', 'Yellow'],
            correctAnswer: 0
          },
          {
            id: 'q2',
            question: 'Where did the story take place?',
            options: ['School', 'Home', 'Park', 'Store'],
            correctAnswer: 2
          }
        ]
      }
    ]
  },
  
  // Grade 2 Books
  2: {
    intensive: [
      {
        id: 'grade2_intensive_1',
        title: 'Amazing Animals',
        grade: 2,
        type: 'intensive',
        pdfUrl: 'https://www.africau.edu/images/default/sample.pdf',
        totalPages: 12,
        completed: false
      }
    ],
    extensive: [
      {
        id: 'grade2_extensive_1',
        title: 'Nature Wonders',
        grade: 2,
        type: 'extensive',
        pdfUrl: 'https://www.africau.edu/images/default/sample.pdf',
        totalPages: 18,
        completed: false,
        quizQuestions: [
          {
            id: 'q1',
            question: 'How many types of trees were mentioned?',
            options: ['2', '3', '4', '5'],
            correctAnswer: 1
          }
        ]
      }
    ]
  }
  
  // Additional grades can be added following the same pattern
};

// Helper functions following DRY principle
export const getBooksByGrade = (grade) => {
  return booksData[grade] || { intensive: [], extensive: [] };
};

export const getIntensiveBooks = (grade) => {
  const books = getBooksByGrade(grade);
  return books.intensive || [];
};

export const getExtensiveBooks = (grade) => {
  const books = getBooksByGrade(grade);
  return books.extensive || [];
};

export const getBookById = (bookId) => {
  for (const grade in booksData) {
    const gradeBooks = booksData[grade];
    const intensiveBook = gradeBooks.intensive?.find(book => book.id === bookId);
    if (intensiveBook) return intensiveBook;
    
    const extensiveBook = gradeBooks.extensive?.find(book => book.id === bookId);
    if (extensiveBook) return extensiveBook;
  }
  return null;
};

export const checkAllIntensiveBooksCompleted = (grade, progressData = {}) => {
  const intensiveBooks = getIntensiveBooks(grade);
  if (intensiveBooks.length === 0) return false;
  
  return intensiveBooks.every(book => {
    const bookProgress = progressData[book.id];
    return bookProgress && bookProgress.completed;
  });
}; 