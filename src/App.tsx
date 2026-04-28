
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Index from './pages/Index';
import TutorPage from './pages/tutor/TutorPage';
import VeterinarioPage from './pages/veterinario/VeterinarioPage';
import PetRegistrationPage from './pages/veterinario/PetRegistrationPage';
import PetProfilePage from './pages/veterinario/PetProfilePage';
import AdministradorPage from './pages/administrador/AdministradorPage';
import AuthPage from './pages/auth/AuthPage';
import AccessPendingPage from './pages/auth/AccessPendingPage';
import AccessRejectedPage from './pages/auth/AccessRejectedPage';
import NotFound from './pages/NotFound';
import { Toaster } from './components/ui/toaster';
import { TooltipProvider } from './components/ui/tooltip';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Criar instância do QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Router>
            <AuthProvider>
              <Routes>
                {/* Public auth routes */}
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/access-pending" element={<AccessPendingPage />} />
                <Route path="/access-rejected" element={<AccessRejectedPage />} />

                {/* Private routes — require login */}
                <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
                <Route path="/tutor" element={<ProtectedRoute><TutorPage /></ProtectedRoute>} />
                <Route path="/veterinario" element={<ProtectedRoute><VeterinarioPage /></ProtectedRoute>} />
                <Route path="/veterinario/pet/new" element={<ProtectedRoute><PetRegistrationPage /></ProtectedRoute>} />
                <Route path="/veterinario/pet/:id" element={<ProtectedRoute><PetProfilePage /></ProtectedRoute>} />
                <Route path="/administrador" element={<ProtectedRoute><AdministradorPage /></ProtectedRoute>} />

                <Route path="*" element={<NotFound />} />
              </Routes>
            </AuthProvider>
          </Router>
        </TooltipProvider>
      </QueryClientProvider>
      <Toaster />
    </>
  );
}

export default App;
