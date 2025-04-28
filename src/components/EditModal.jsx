import React, { useState } from 'react';

const EditModal = ({ isOpen, title, fields, initialValues, onSubmit, onClose, loading, error }) => {
  const [formValues, setFormValues] = useState(initialValues || {});
  const [localError, setLocalError] = useState(null);

  React.useEffect(() => {
    setFormValues(initialValues || {});
    setLocalError(null);
  }, [initialValues, isOpen]);

  const handleChange = (e, field) => {
    const value = field.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormValues((prev) => ({ ...prev, [field.name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);
    try {
      await onSubmit(formValues);
    } catch (err) {
      setLocalError(err.message || 'Failed to update.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6 w-full max-w-2xl m-4 max-h-[90vh] flex flex-col">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
        {(error || localError) && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <p className="text-red-600 dark:text-red-400 text-sm">{error || localError}</p>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto" style={{ maxHeight: '60vh' }}>
          {fields.map((field) => (
            <div key={field.name}>
              <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
                {field.label}
              </label>
              {field.type === 'select' ? (
                <select
                  name={field.name}
                  value={formValues[field.name] || ''}
                  onChange={(e) => handleChange(e, field)}
                  className="w-full px-3 py-2 border rounded-md dark:bg-neutral-700 dark:border-neutral-600 dark:text-white"
                  required={field.required}
                >
                  <option value="" disabled>Select {field.label}</option>
                  {field.options && field.options.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              ) : field.type === 'textarea' ? (
                <textarea
                  name={field.name}
                  value={formValues[field.name] || ''}
                  onChange={(e) => handleChange(e, field)}
                  className="w-full px-3 py-2 border rounded-md dark:bg-neutral-700 dark:border-neutral-600 dark:text-white"
                  required={field.required}
                />
              ) : (
                <input
                  type={field.type}
                  name={field.name}
                  value={formValues[field.name] || ''}
                  onChange={(e) => handleChange(e, field)}
                  className="w-full px-3 py-2 border rounded-md dark:bg-neutral-700 dark:border-neutral-600 dark:text-white"
                  required={field.required}
                  min={field.min}
                  max={field.max}
                  step={field.step}
                  pattern={field.pattern}
                  disabled={field.disabled}
                />
              )}
            </div>
          ))}
          <div className="flex justify-end space-x-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-md"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditModal; 