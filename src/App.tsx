
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Index from './pages/Index';
import TutorPage from './pages/tutor/TutorPage';
import VeterinarioPage from './pages/veterinario/VeterinarioPage';
import AdministradorPage from './pages/administrador/AdministradorPage';
import NotFound from './pages/NotFound';
import { Toaster } from './components/ui/toaster';
import { TooltipProvider } from './components/ui/tooltip';

function App() {
  return (
    <>
      <TooltipProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/tutor" element={<TutorPage />} />
            <Route path="/veterinario" element={<VeterinarioPage />} />
            <Route path="/administrador" element={<AdministradorPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </TooltipProvider>
      <Toaster />
    </>
  );
}

export default App;
