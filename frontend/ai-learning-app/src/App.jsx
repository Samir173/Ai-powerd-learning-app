//import React from 'react';
import {BrowserRouter as Router, Routes, Route, Navigate} from 'react-router-dom';
import LoginPage from './Pages/Auth/LoginPage';
import RegisterPage from './Pages/Auth/RegisterPage';
import NotFoundPage from './Pages/NotFoundPage';
import DocumentListPage from './Pages/Document/DocumentListPage';
import DocumentDetailPage from './Pages/Document/DocumentDetailPage';
import FlashcardListPage from './Pages/Flashcard/FlashcardListPage';
import FlashcardPage from './Pages/Flashcard/FlashcardPage';
import QuizTakePage from './Pages/Quizzes/QuizTakePage';
import QuizResultPage from './Pages/Quizzes/QuizResultPage';
import ProfilePage from './Pages/Profile/ProfilePage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Dashboardpage from './Pages/Dashboard/Dashboardpage';

const App = () => {
  const isAuthenticated = true
  const loading = false

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <Router>
      <Routes>

          <Route 
            path="/"
            element={
              isAuthenticated 
                ? <Navigate to="/dashboard"  replace /> 
                : <Navigate to="/login" replace />} 
          />

          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboardpage />} />
            <Route path="/documentation" element={<DocumentListPage />} />
            <Route path="/documentation/:id" element={<DocumentDetailPage />} />
            <Route path="/flashcards" element={<FlashcardListPage />} />
            <Route path="/documents/:id/flashcards" element={<FlashcardPage />} />
            <Route path="/quizzes/:quizId" element={<QuizTakePage />} />
            <Route path="/quizzes/:quizId/results" element={<QuizResultPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
          
          <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  )
}

export default App