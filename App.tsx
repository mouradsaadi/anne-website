
import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Services from './components/Services';
import About from './components/About';
import BookingCalendar from './components/BookingCalendar';
import Legal from './components/Legal';
import { config } from './config';
import Contact from './components/Contact';

const AdminDashboard = lazy(() => import('./components/AdminDashboard'));

const HomePage = ({ onBookNow }: { onBookNow: () => void }) => (
  <>
    <Hero onBookNow={onBookNow} />
    <About />
    <Services />
    <div className="bg-sage-600 dark:bg-sage-800 py-12 text-center px-4 transition-colors duration-200">
      <p className="text-2xl text-white font-serif italic max-w-3xl mx-auto">"La qualité de votre vie dépend de la qualité de vos relations."</p>
      <p className="text-sage-200 mt-4 font-medium">- Esther Perel</p>
    </div>
  </>
);

const App: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const assetBaseUrl = import.meta.env.BASE_URL.endsWith('/')
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`;

  // Initialize Dark Mode from local storage or system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDarkMode(true);
    }
  };

  return (
    <div className="min-h-screen bg-sand-50 dark:bg-stone-950 flex flex-col font-sans transition-colors duration-200">
      <Navbar onNavigate={navigate} currentPath={location.pathname} isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
      
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<HomePage onBookNow={() => navigate('/booking')} />} />
          <Route path="/about" element={<About />} />
          <Route path="/services" element={<Services />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/booking" element={<BookingCalendar />} />
          <Route
            path="/admin"
            element={
              config.useSupabase ? (
                <div className="max-w-2xl mx-auto px-4 py-16 text-center">
                  <h1 className="text-2xl font-serif font-bold text-stone-900 dark:text-stone-100">Espace admin indisponible</h1>
                  <p className="mt-3 text-stone-600 dark:text-stone-400">
                    L’espace professionnel est désactivé lorsque le stockage Supabase est activé.
                  </p>
                </div>
              ) : (
                <Suspense fallback={<div className="p-8 text-center text-stone-500">Chargement...</div>}>
                  <AdminDashboard />
                </Suspense>
              )
            }
          />
          <Route path="/legal" element={<Legal />} />
        </Routes>
      </main>

      <footer className="bg-stone-900 dark:bg-black text-stone-400 py-12 mt-auto transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-12">
          <div>
             <h4 className="text-white text-lg font-serif mb-6 tracking-wider">Anne Robin</h4>
             <p className="text-sm leading-relaxed">Conseillère conjugale et familiale : couples, familles, parents, individus et adolescents.</p>
          </div>
          <div>
             <h4 className="text-white text-lg font-serif mb-6 tracking-wider">Contact</h4>
             <div className="space-y-2 text-sm">
                <p>109 ter, Rue Pierre Loti, 17300 Rochefort</p>
                <p>annerobinccf@outlook.fr</p>
                <p>06 13 37 56 58</p>
             </div>
          </div>
          <div>
             <h4 className="text-white text-lg font-serif mb-6 tracking-wider">Horaires</h4>
             <div className="space-y-2 text-sm">
                <p>Lun - Ven : 09h00 - 19h00</p>
                <p>Sur rendez-vous</p>
             </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 border-t border-stone-800 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-stone-600">
          <p>© 2025 Anne Robin. Tous droits réservés.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <button onClick={() => navigate('/legal')} className="hover:text-stone-300 transition-colors">Mentions Légales</button>
            <button onClick={() => navigate('/legal')} className="hover:text-stone-300 transition-colors">Politique de Confidentialité</button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
