import { Routes, Route } from 'react-router-dom'

import { AuthProvider } from './context/AuthContext.jsx'
import Navbar from './components/Navbar.jsx'
import Footer from './components/Footer.jsx'

import Home from './pages/Home.jsx'
import Doctors from './pages/Doctors.jsx'
import Appointments from './pages/Appointments.jsx'
import Quiz from './pages/Quiz.jsx'
import HealthTips from './pages/HealthTips.jsx'
import Register from './pages/Register.jsx'

export default function App() {
  return (
    <AuthProvider>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/doctors" element={<Doctors />} />
        <Route path="/appointments" element={<Appointments />} />
        <Route path="/quiz" element={<Quiz />} />
        <Route path="/health-tips" element={<HealthTips />} />
        <Route path="/register" element={<Register />} />
      </Routes>
      <Footer />
    </AuthProvider>
  )
}