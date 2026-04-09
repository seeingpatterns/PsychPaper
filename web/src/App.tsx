import { Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import ArticlePage from './pages/ArticlePage'
import ArticlesPage from './pages/ArticlesPage'
import AdminUsersPage from './pages/AdminUsersPage'
import AdminLoginPage from './pages/AdminLoginPage'
import AdminDashboardPage from './pages/AdminDashboardPage'
import AdminArticlesPage from './pages/AdminArticlesPage'
import AdminProtectedRoute from './features/auth/ui/AdminProtectedRoute'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/articles" element={<ArticlesPage />} />
      <Route path="/article/:slug" element={<ArticlePage />} />
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route
        path="/admin"
        element={(
          <AdminProtectedRoute>
            <AdminDashboardPage />
          </AdminProtectedRoute>
        )}
      />
      <Route
        path="/admin/users"
        element={(
          <AdminProtectedRoute>
            <AdminUsersPage />
          </AdminProtectedRoute>
        )}
      />
      <Route
        path="/admin/articles"
        element={(
          <AdminProtectedRoute>
            <AdminArticlesPage />
          </AdminProtectedRoute>
        )}
      />
    </Routes>
  )
}

export default App
