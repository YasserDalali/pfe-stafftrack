import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, X } from 'lucide-react';
import supabase from '../database/supabase-client';

const LeaveForm = ({ isOpen, onClose, employees, onSuccess }) => {
  const [formData, setFormData] = useState({
    employee_id: '',
    start_date: '',
    end_date: '',
    reason: '',
    type: 'vacation',
    status: 'pending'
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [medicalDocument, setMedicalDocument] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        setError('Please upload a PDF or Word document only.');
        return;
      }
      
      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB.');
        return;
      }
      
      setMedicalDocument(file);
      setError(null);
    }
  };

  const removeFile = () => {
    setMedicalDocument(null);
    // Reset file input
    const fileInput = document.getElementById('medical-document');
    if (fileInput) fileInput.value = '';
  };

  const uploadMedicalDocument = async (file, leaveId) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${leaveId}_${Date.now()}.${fileExt}`;
      const filePath = `medical-documents/${fileName}`;

      const { data, error } = await supabase.storage
        .from('medical-documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('medical-documents')
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Validate medical document for sick leave
      if (formData.type === 'sick' && !medicalDocument) {
        setError('Medical document is required for sick leave requests.');
        setLoading(false);
        return;
      }

      // Check for overlapping leaves for this employee
      const { data: overlapping, error: checkError } = await supabase
        .from('leaves')
        .select('id')
        .eq('employee_id', formData.employee_id)
        .or(`and(start_date.lte.${formData.end_date},end_date.gte.${formData.start_date})`)
        .limit(1);

      if (checkError) throw checkError;
      if (overlapping && overlapping.length > 0) {
        setError('Leave already exists for this period');
        setLoading(false);
        return;
      }

      // Calculate duration
      const startDate = new Date(formData.start_date);
      const endDate = new Date(formData.end_date);
      const duration = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

      // Insert new leave request
      const { data, error: insertError } = await supabase
        .from('leaves')
        .insert([{
          employee_id: formData.employee_id,
          start_date: formData.start_date,
          end_date: formData.end_date,
          duration: duration,
          reason: formData.reason,
          type: formData.type,
          status: 'pending'
        }])
        .select('id')
        .single();

      if (insertError) throw insertError;

      let documentUrl = null;
      
      // Upload medical document if it's a sick leave
      if (formData.type === 'sick' && medicalDocument && data?.id) {
        setUploadProgress(50);
        documentUrl = await uploadMedicalDocument(medicalDocument, data.id);
        
        // Update the leave record with the document URL
        const { error: updateError } = await supabase
          .from('leaves')
          .update({ medical_document_url: documentUrl })
          .eq('id', data.id);
          
        if (updateError) throw updateError;
        setUploadProgress(100);
      }

      if (data?.id) {
        onClose();
        if (onSuccess) {
          onSuccess();
        }
        // Reset form
        setFormData({
          employee_id: '',
          start_date: '',
          end_date: '',
          reason: '',
          type: 'vacation',
          status: 'pending'
        });
        setMedicalDocument(null);
        setUploadProgress(0);
      }
    } catch (err) {
      console.error('Error submitting leave request:', err);
      setError(err.message || 'Failed to submit leave request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear medical document if changing from sick to other type
    if (name === 'type' && value !== 'sick' && medicalDocument) {
      setMedicalDocument(null);
      const fileInput = document.getElementById('medical-document');
      if (fileInput) fileInput.value = '';
    }
    
    setError(null);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
        >
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
            Plan Leave
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-red-600 dark:text-red-400 text-sm">
                {error}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Employee
              </label>
              <select
                name="employee_id"
                value={formData.employee_id}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-neutral-700 dark:text-white"
              >
                <option value="">Select Employee</option>
                {employees?.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Leave Type
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-neutral-700 dark:text-white"
              >
                <option value="vacation">Vacation</option>
                <option value="sick">Sick Leave</option>
                <option value="personal">Personal Leave</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Medical Document Upload - Only show for sick leave */}
            {formData.type === 'sick' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Medical Document <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  Upload a medical certificate (PDF or Word document, max 10MB)
                </p>
                
                {!medicalDocument ? (
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4">
                    <div className="text-center">
                      <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                      <label htmlFor="medical-document" className="cursor-pointer">
                        <span className="text-sm font-medium text-blue-600 hover:text-blue-500">
                          Click to upload
                        </span>
                        <span className="text-sm text-gray-500"> or drag and drop</span>
                      </label>
                      <input
                        id="medical-document"
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-neutral-700 rounded-lg border">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-5 w-5 text-blue-500" />
                      <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                        {medicalDocument.name}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={removeFile}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
                
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="mt-2">
                    <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Uploading... {uploadProgress}%</p>
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Start Date
              </label>
              <input
                type="date"
                name="start_date"
                value={formData.start_date}
                onChange={handleChange}
                required
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-neutral-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                End Date
              </label>
              <input
                type="date"
                name="end_date"
                value={formData.end_date}
                onChange={handleChange}
                required
                min={formData.start_date || new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-neutral-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Reason
              </label>
              <textarea
                name="reason"
                value={formData.reason}
                onChange={handleChange}
                required
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-neutral-700 dark:text-white"
                placeholder="Please provide a reason for your leave request..."
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-md"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || (formData.type === 'sick' && !medicalDocument)}
                className={`px-4 py-2 text-sm font-medium text-white rounded-md ${
                  loading || (formData.type === 'sick' && !medicalDocument)
                    ? 'bg-blue-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {loading ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default LeaveForm;