import { Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import ArticlePage from './pages/ArticlePage'
import AdminUsersPage from './pages/AdminUsersPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/article/:slug" element={<ArticlePage />} />
      <Route path="/admin/users" element={<AdminUsersPage />} />
    </Routes>
  )
}

export default App
