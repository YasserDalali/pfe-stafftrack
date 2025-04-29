import React from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Alert({ message, type, className, onClose }) {
    let styles = {
      bg: "from-gray-500/90 to-gray-600/90",
      icon: "text-gray-100",
      border: "border-gray-300/20"
    };

    if (type === "success") {
      styles = {
        bg: "from-green-500/90 to-green-600/90",
        icon: "text-green-100",
        border: "border-green-300/20"
      };
    } else if (type === "error") {
      styles = {
        bg: "from-red-500/90 to-red-600/90", 
        icon: "text-red-100",
        border: "border-red-300/20"
      };
    } else if (type === "warning") {
      styles = {
        bg: "from-amber-500/90 to-amber-600/90",
        icon: "text-amber-100", 
        border: "border-amber-300/20"
      };
    }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        role="alert"
        className={`mt-3 flex p-4 text-sm text-white bg-gradient-to-br ${styles.bg} rounded-xl shadow-lg border ${styles.border} ${className}`}
        style={{
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="2.5"
          stroke="currentColor"
          className={`h-5 w-5 mr-3 ${styles.icon}`}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
          ></path>
        </svg>
        <span className="font-medium">{message}</span>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onClose}
          className="flex items-center justify-center transition-all w-8 h-8 rounded-full text-white hover:bg-white/20 active:bg-white/30 absolute top-2 right-2"
          type="button"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            className="h-4 w-4"
            strokeWidth="3"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            ></path>
          </svg>
        </motion.button>
      </motion.div>
    </AnimatePresence>
  );
}
