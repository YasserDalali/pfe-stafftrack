import React, { useState } from 'react';

const ModalButton = ({ children, value, title, buttonStyle = 'default', className }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleModal = () => setIsOpen(!isOpen);

  const getButtonStyles = () => {
    if (buttonStyle === 'text') {
      return className || "text-blue-500 hover:text-blue-600 font-medium";
    }
    return "py-2.5 px-5 inline-flex items-center gap-x-2 text-sm font-medium rounded-full border border-transparent bg-blue-500 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2 transition-all duration-200";
  };

  return (
    <>
      <button
        onClick={toggleModal}
        className={getButtonStyles()}
      >
        {value}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 backdrop-blur-sm bg-black/30 flex justify-center items-center transition-all duration-300">
          <div 
            className="bg-white/90 dark:bg-neutral-800/90 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 shadow-xl border border-gray-200/50 dark:border-neutral-700/50"
            style={{
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)'
            }}
          >
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white">{title}</h3>
              <button
                type="button"
                onClick={toggleModal}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white rounded-full p-1 transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-neutral-700"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {React.cloneElement(children, { onClose: toggleModal })}
          </div>
        </div>
      )}
    </>
  );
};

export default ModalButton;
