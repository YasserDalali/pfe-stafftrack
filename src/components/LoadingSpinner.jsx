import React from 'react';
import { motion } from 'framer-motion';

const LoadingSpinner = () => {
  // Apple-style loading dots animation
  const containerVariants = {
    animate: {
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const dotVariants = {
    initial: { opacity: 0.3, scale: 0.8 },
    animate: {
      opacity: [0.3, 1, 0.3],
      scale: [0.8, 1, 0.8],
      transition: {
        repeat: Infinity,
        duration: 1.5
      }
    }
  };

  return (
    <div 
      className="flex flex-col gap-6 justify-center items-center fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
      style={{
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)'
      }}
    >
      {/* Apple-style loading indicator */}
      <motion.div
        className="flex space-x-3"
        variants={containerVariants}
        initial="initial"
        animate="animate"
      >
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            variants={dotVariants}
            className="w-4 h-4 bg-white rounded-full"
          />
        ))}
      </motion.div>

      <motion.div 
        className="text-white text-xl font-light tracking-wide"
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        Loading models and camera...
      </motion.div>
    </div>
  );
};

export default LoadingSpinner;
