
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Index from './pages/Index';
import TutorPage from './pages/tutor/TutorPage';
import VeterinarioPage from './pages/veterinario/VeterinarioPage';
import AdministradorPage from './pages/administrador/AdministradorPage';
import AuthPage from './pages/auth/AuthPage';
import NotFound from './pages/NotFound';
import { Toaster } from './components/ui/toaster';
import { TooltipProvider } from './components/ui/tooltip';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';

function App() {
  return (
    <>
      <TooltipProvider>
        <Router>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/tutor" element={
                <ProtectedRoute>
                  <TutorPage />
                </ProtectedRoute>
              } />
              <Route path="/veterinario" element={
                <ProtectedRoute requiredRole="veterinarian">
                  <VeterinarioPage />
                </ProtectedRoute>
              } />
              <Route path="/administrador" element={
                <ProtectedRoute requiredRole="admin">
                  <AdministradorPage />
                </ProtectedRoute>
              } />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </Router>
      </TooltipProvider>
      <Toaster />
    </>
  );
}

export default App;
