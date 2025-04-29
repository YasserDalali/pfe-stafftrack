import { motion } from 'framer-motion';

const AnimatedComponent = ({ children, className, delay = 0, direction = 'up' }) => {
  // Determine animation direction
  const getInitialProps = () => {
    switch(direction) {
      case 'left':
        return { opacity: 0, x: -15, y: 0 };
      case 'right':
        return { opacity: 0, x: 15, y: 0 };
      case 'down':
        return { opacity: 0, y: -15, x: 0 };
      case 'up':
      default:
        return { opacity: 0, y: 15, x: 0 };
    }
  };

  return (
    <motion.div
      initial={getInitialProps()}
      animate={{ opacity: 1, y: 0, x: 0 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30,
        delay,
        mass: 0.8
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default AnimatedComponent; 