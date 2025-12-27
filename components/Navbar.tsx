import React, { useState } from 'react';
import { Menu, X, Heart, Moon, Sun } from 'lucide-react';

interface NavbarProps {
  onNavigate: (path: string) => void;
  currentPath: string;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onNavigate, currentPath, isDarkMode, toggleTheme }) => {
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { name: 'Accueil', path: '/' },
    { name: 'À propos', path: '/about' },
    { name: 'Services', path: '/services' },
    { name: 'Contact', path: '/contact' },
  ];

  return (
    <nav className="bg-white dark:bg-stone-900 shadow-sm sticky top-0 z-50 font-sans transition-colors duration-200 border-b border-stone-100 dark:border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center cursor-pointer" onClick={() => onNavigate('/')}>
            <Heart className="h-8 w-8 text-sage-500 dark:text-sage-400 mr-2" />
            <span className="font-serif text-xl font-bold text-stone-800 dark:text-stone-100">Anne Robin</span>
          </div>
          
          <div className="hidden md:flex items-center space-x-6">
            <div className="flex space-x-4">
              {navLinks.map((link) => (
                <button
                  key={link.path}
                  onClick={() => onNavigate(link.path)}
                  className={`${
                    currentPath === link.path
                      ? 'text-sage-600 dark:text-sage-400 border-b-2 border-sage-500'
                      : 'text-stone-500 dark:text-stone-400 hover:text-sage-600 dark:hover:text-sage-300'
                  } px-1 py-2 text-sm font-medium transition-colors duration-200`}
                >
                  {link.name}
                </button>
              ))}
            </div>
            
            {/* Theme Toggle */}
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
              aria-label="Toggle Dark Mode"
            >
              {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
          </div>

          <div className="flex items-center md:hidden space-x-4">
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300"
            >
              {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 focus:outline-none"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden bg-white dark:bg-stone-900 border-t border-stone-100 dark:border-stone-800 animate-fade-in">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navLinks.map((link) => (
              <button
                key={link.path}
                onClick={() => {
                  onNavigate(link.path);
                  setIsOpen(false);
                }}
                className="block w-full text-left px-3 py-2 text-base font-medium text-stone-600 dark:text-stone-300 hover:text-sage-600 dark:hover:text-sage-400 hover:bg-sage-50 dark:hover:bg-stone-800 rounded-md"
              >
                {link.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
