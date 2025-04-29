import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

const Navbar = () => {
  const [darkMode, setDarkMode] = useState(false);
  const location = useLocation();

  // Get current page title based on route
  const getPageTitle = (pathname) => {
    const path = pathname.split('/')[2] || pathname.split('/')[1];
    if (!path) return 'Dashboard';
    return path.charAt(0).toUpperCase() + path.slice(1).replace('-', ' ');
  };

  useEffect(() => {
    // Check for system preference first
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const savedTheme = localStorage.getItem('darkMode');
    
    // Use saved preference if exists, otherwise use system preference
    const isDarkMode = savedTheme !== null ? savedTheme === 'true' : systemPrefersDark;
    
    setDarkMode(isDarkMode);
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode.toString());
    
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <motion.nav 
      className="fixed top-0 right-0 left-18 w-full ps-20 h-16 bg-white/90 dark:bg-neutral-800/90 border-b border-gray-200/30 dark:border-neutral-700/30 z-40 transition-colors duration-200"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
      }}
    >
      <div className="h-full px-6 flex items-center justify-between">
        <motion.h1 
          className="text-lg font-medium text-gray-800 dark:text-white transition-colors duration-200"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.3 }}
        >
          {getPageTitle(location.pathname)}
        </motion.h1>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleDarkMode}
          className="p-2 rounded-full hover:bg-gray-100/80 dark:hover:bg-neutral-700/50 transition-all duration-200 text-gray-600 dark:text-gray-300"
          aria-label="Toggle dark mode"
          style={{
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
          }}
        >
          {darkMode ? (
            <Sun className="h-5 w-5 transition-transform duration-300 hover:rotate-12" />
          ) : (
            <Moon className="h-5 w-5 transition-transform duration-300 hover:-rotate-12" />
          )}
        </motion.button>
      </div>
    </motion.nav>
  );
};

export default Navbar; 