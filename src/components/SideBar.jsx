import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { User, Clock, Camera, Home, Calendar, Settings, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';

const Sidebar = () => {
  const location = useLocation();

  const menuItems = [
    { path: '/admin/', icon: Home, label: 'Dashboard' },
    { path: '/admin/leave-management', icon: Calendar, label: 'Leave Management' },
    { path: '/admin/employees', icon: User, label: 'Employees' },
    { path: '/admin/attendance', icon: Clock, label: 'Attendance' },
    { path: '/admin/facedetection', icon: Camera, label: 'Face Detection' },
/*     { path: '/admin/reports', icon: BarChart3, label: 'Reports' },
 */  ];

  const isActive = (path) => location.pathname === path;

  const menuItemVariants = {
    hover: {
      scale: 1.05,
      transition: {
        duration: 0.2,
        ease: "easeInOut"
      }
    }
  };

  return (
    <aside 
      className="fixed h-screen w-18 flex flex-col bg-white/80 dark:bg-neutral-800/90 border-r border-gray-200/50 dark:border-neutral-700/50 z-50"
      style={{
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
      }}
    >
      {/* Logo Area */}
      <div className="flex items-center justify-center h-16 border-b border-gray-200/30 dark:border-neutral-700/30">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center shadow-md">
          <span className="text-white font-medium text-xl">F</span>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 py-6">
        <div className="px-3 space-y-4">
          {menuItems.map((item, index) => (
            <motion.div
              key={item.path}
              variants={menuItemVariants}
              whileHover="hover"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.3,
                delay: index * 0.05,
                ease: [0.4, 0, 0.2, 1]
              }}
            >
              <Link
                to={item.path}
                className={`relative flex items-center justify-center h-12 w-12 mx-auto rounded-xl
                  transition-all duration-300 ease-in-out group
                  ${isActive(item.path)
                    ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 dark:text-neutral-400 hover:bg-gray-100/80 dark:hover:bg-neutral-700/50'
                  }`}
                style={{
                  boxShadow: isActive(item.path) ? '0 2px 5px rgba(59, 130, 246, 0.1)' : 'none'
                }}
              >
                <item.icon 
                  size={22} 
                  strokeWidth={isActive(item.path) ? 2.5 : 2}
                  className={`transition-all duration-200 ${isActive(item.path) ? 'scale-105' : ''}`}
                />
                
                {/* Indicator dot for active item */}
                {isActive(item.path) && (
                  <motion.div 
                    className="absolute -right-0.5 w-1.5 h-1.5 bg-blue-500 rounded-full"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                  />
                )}
                
                {/* Tooltip */}
                <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-white/90 dark:bg-neutral-800/90 text-gray-800 dark:text-white text-xs font-medium
                  rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible
                  transition-all duration-200 whitespace-nowrap z-50 shadow-lg border border-gray-200/50 dark:border-neutral-700/50"
                  style={{
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)'
                  }}
                >
                  {item.label}
                  {/* Triangle */}
                  <div className="absolute top-1/2 -left-1.5 -mt-1.5 border-8 border-transparent
                    border-r-white/90 dark:border-r-neutral-800/90"></div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </nav>

      {/* Settings */}
      <div className="p-3 border-t border-gray-200/30 dark:border-neutral-700/30 mb-5">
        <Link
          to="/admin/settings"
          className={`relative flex items-center justify-center h-12 w-12 mx-auto rounded-xl
            transition-all duration-300 ease-in-out group
            ${isActive('/admin/settings')
              ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
              : 'text-gray-600 dark:text-neutral-400 hover:bg-gray-100/80 dark:hover:bg-neutral-700/50'
            }`}
          style={{
            boxShadow: isActive('/admin/settings') ? '0 2px 5px rgba(59, 130, 246, 0.1)' : 'none'
          }}
        >
          <Settings 
            size={22} 
            strokeWidth={isActive('/admin/settings') ? 2.5 : 2}
            className={`transition-transform duration-200
              ${isActive('/admin/settings') ? 'scale-105' : ''}`}
          />
          
          {/* Indicator dot for active item */}
          {isActive('/admin/settings') && (
            <motion.div 
              className="absolute -right-0.5 w-1.5 h-1.5 bg-blue-500 rounded-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            />
          )}
          
          {/* Settings Tooltip */}
          <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-white/90 dark:bg-neutral-800/90 text-gray-800 dark:text-white text-xs font-medium
            rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible
            transition-all duration-200 whitespace-nowrap z-50 shadow-lg border border-gray-200/50 dark:border-neutral-700/50"
            style={{
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)'
            }}
          >
            Settings
            <div className="absolute top-1/2 -left-1.5 -mt-1.5 border-8 border-transparent
              border-r-white/90 dark:border-r-neutral-800/90"></div>
          </div>
        </Link>
      </div>
    </aside>
  );
};

export default Sidebar;
