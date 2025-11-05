// components/land/LandForm.jsx
import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { landService } from '../../services/landService';
import { addLand, updateLand } from '../../store/slices/landSlice';

const LandForm = ({ land, onCancel, onSuccess }) => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    location: '',
    size_in_acres: '',
    price_per_day: '',
    description: '',
    images: []
  });

  useEffect(() => {
    if (land) {
      setFormData({
        location: land.location || '',
        size_in_acres: land.size_in_acres || '',
        price_per_day: land.price_per_day || '',
        description: land.description || '',
        images: land.images || []
      });
    }
  }, [land]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    
    // Validate file types and size
    const validFiles = files.filter(file => {
      const isValidType = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type);
      const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB limit
      
      if (!isValidType) {
        alert('Only JPEG, JPG, PNG, and WebP images are allowed');
        return false;
      }
      
      if (!isValidSize) {
        alert('Image size must be less than 5MB');
        return false;
      }
      
      return true;
    });

    // Convert images to base64 for storage
    const imagePromises = validFiles.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          resolve(e.target.result);
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(imagePromises).then(base64Images => {
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...base64Images].slice(0, 10) // Limit to 10 images
      }));
    });
  };

  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    // Location validation
    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    } else if (formData.location.length < 2 || formData.location.length > 100) {
      newErrors.location = 'Location must be between 2-100 characters';
    }

    // Size validation
    if (!formData.size_in_acres) {
      newErrors.size_in_acres = 'Land size is required';
    } else {
      const size = parseFloat(formData.size_in_acres);
      if (size < 0.1) {
        newErrors.size_in_acres = 'Land size must be at least 0.1 acre';
      } else if (size > 10000) {
        newErrors.size_in_acres = 'Land size cannot exceed 10,000 acres';
      }
    }

    // Price validation
    if (!formData.price_per_day) {
      newErrors.price_per_day = 'Price per day is required';
    } else {
      const price = parseFloat(formData.price_per_day);
      if (price < 100) {
        newErrors.price_per_day = 'Price per day must be at least ₹100';
      } else if (price > 100000) {
        newErrors.price_per_day = 'Price per day cannot exceed ₹100,000';
      }
    }

    // Description validation (optional but with length constraints)
    if (formData.description && (formData.description.length < 10 || formData.description.length > 1000)) {
      newErrors.description = 'Description must be between 10-1000 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setLoading(true);
      
      // Prepare data for API
      const submitData = {
        location: formData.location.trim(),
        size_in_acres: parseFloat(formData.size_in_acres),
        price_per_day: parseFloat(formData.price_per_day),
        description: formData.description.trim(),
        images: formData.images
      };

      if (land) {
        // Update existing land
        const response = await landService.updateLand(land.land_id, submitData);
        dispatch(updateLand({ 
          landId: land.land_id, 
          updates: response.land || submitData 
        }));
      } else {
        // Add new land
        const response = await landService.addLand(submitData);
        dispatch(addLand(response.land));
      }

      onSuccess?.();
    } catch (error) {
      console.error('Error saving land:', error);
      const errorMessage = error.response?.data?.message || `Failed to ${land ? 'update' : 'add'} land`;
      alert(errorMessage);
      
      // Set backend validation errors if any
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">
        {land ? 'Edit Land' : 'Add New Land'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Location */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location *
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              required
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.location ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Enter land location (village, district, state)"
            />
            {errors.location && (
              <p className="mt-1 text-sm text-red-600">{errors.location}</p>
            )}
          </div>

          {/* Size in Acres */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Size (acres) *
            </label>
            <input
              type="number"
              name="size_in_acres"
              value={formData.size_in_acres}
              onChange={handleChange}
              required
              min="0.1"
              max="10000"
              step="0.1"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.size_in_acres ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="0.0"
            />
            {errors.size_in_acres && (
              <p className="mt-1 text-sm text-red-600">{errors.size_in_acres}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">Minimum: 0.1 acre, Maximum: 10,000 acres</p>
          </div>

          {/* Price per Day */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rent Price per Day (₹) *
            </label>
            <input
              type="number"
              name="price_per_day"
              value={formData.price_per_day}
              onChange={handleChange}
              required
              min="100"
              max="100000"
              step="0.01"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.price_per_day ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="0.00"
            />
            {errors.price_per_day && (
              <p className="mt-1 text-sm text-red-600">{errors.price_per_day}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">Minimum: ₹100, Maximum: ₹100,000</p>
          </div>

          {/* Description */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.description ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Describe the land features, soil type, water availability, irrigation facilities, nearby landmarks, etc. (optional)"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              {formData.description.length}/1000 characters (10-1000 characters recommended)
            </p>
          </div>

          {/* Image Upload */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Land Images
            </label>
            
            {/* Image Preview */}
            {formData.images.length > 0 && (
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Uploaded Images ({formData.images.length}/10):</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {formData.images.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={image}
                        alt={`Land ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload Area */}
            <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center hover:border-gray-400 transition-colors">
              <input
                type="file"
                id="land-images"
                multiple
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleImageUpload}
                className="hidden"
              />
              <label htmlFor="land-images" className="cursor-pointer">
                <span className="text-4xl mb-2 block">📷</span>
                <p className="text-gray-600 mb-2">
                  {formData.images.length > 0 ? 'Add more images' : 'Upload land images'}
                </p>
                <p className="text-sm text-gray-500 mb-2">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-gray-400">
                  PNG, JPG, JPEG, WebP up to 5MB each (max 10 images)
                </p>
              </label>
            </div>
          </div>
        </div>

        {/* Form Summary */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h3 className="text-sm font-medium text-gray-900 mb-2">Land Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Location:</span>
              <p className="font-medium">{formData.location || 'Not specified'}</p>
            </div>
            <div>
              <span className="text-gray-600">Size:</span>
              <p className="font-medium">{formData.size_in_acres ? `${formData.size_in_acres} acres` : 'Not specified'}</p>
            </div>
            <div>
              <span className="text-gray-600">Daily Rate:</span>
              <p className="font-medium">{formData.price_per_day ? `₹${formData.price_per_day}` : 'Not specified'}</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-6 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Saving...' : (land ? 'Update Land' : 'Add Land')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default LandForm;