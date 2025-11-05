// components/equipment/EquipmentForm.jsx
import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { equipmentService } from '../../services/equipmentService';
import { addEquipment, updateEquipment } from '../../store/slices/equipmentSlice';
import { EQUIPMENT_TYPES, EQUIPMENT_BRANDS } from '../../services/equipmentService';

const EquipmentForm = ({ equipment, onCancel, onSuccess }) => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    brand: '',
    model: '',
    rent_price_per_day: '',
    location: '',
    description: '',
    specifications: {
      power: '',
      fuel_type: '',
      capacity: '',
      year: ''
    },
    minimum_rent_days: 1,
    images: []
  });

  useEffect(() => {
    if (equipment) {
      setFormData({
        name: equipment.name || '',
        type: equipment.type || '',
        brand: equipment.brand || '',
        model: equipment.model || '',
        rent_price_per_day: equipment.rent_price_per_day || '',
        location: equipment.location || '',
        description: equipment.description || '',
        specifications: equipment.specifications || {
          power: '',
          fuel_type: '',
          capacity: '',
          year: ''
        },
        minimum_rent_days: equipment.minimum_rent_days || 1,
        images: equipment.images || []
      });
    }
  }, [equipment]);

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

  const handleSpecificationChange = (key, value) => {
    setFormData(prev => ({
      ...prev,
      specifications: {
        ...prev.specifications,
        [key]: value
      }
    }));
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

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Equipment name is required';
    } else if (formData.name.length < 2 || formData.name.length > 100) {
      newErrors.name = 'Name must be between 2-100 characters';
    }

    // Type validation
    if (!formData.type) {
      newErrors.type = 'Equipment type is required';
    }

    // Brand validation
    if (formData.brand && (formData.brand.length < 1 || formData.brand.length > 50)) {
      newErrors.brand = 'Brand must be between 1-50 characters';
    }

    // Model validation
    if (formData.model && (formData.model.length < 1 || formData.model.length > 50)) {
      newErrors.model = 'Model must be between 1-50 characters';
    }

    // Rent price validation
    if (!formData.rent_price_per_day) {
      newErrors.rent_price_per_day = 'Rent price is required';
    } else {
      const price = parseFloat(formData.rent_price_per_day);
      if (price < 100) {
        newErrors.rent_price_per_day = 'Rent price must be at least ₹100 per day';
      } else if (price > 50000) {
        newErrors.rent_price_per_day = 'Rent price cannot exceed ₹50,000 per day';
      }
    }

    // Location validation
    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    } else if (formData.location.length < 2 || formData.location.length > 100) {
      newErrors.location = 'Location must be between 2-100 characters';
    }

    // Description validation
    if (formData.description && (formData.description.length < 10 || formData.description.length > 1000)) {
      newErrors.description = 'Description must be between 10-1000 characters';
    }

    // Minimum rent days validation
    if (!formData.minimum_rent_days || formData.minimum_rent_days < 1) {
      newErrors.minimum_rent_days = 'Minimum rent days must be at least 1';
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
        name: formData.name.trim(),
        type: formData.type,
        brand: formData.brand.trim(),
        model: formData.model.trim(),
        rent_price_per_day: parseFloat(formData.rent_price_per_day),
        location: formData.location.trim(),
        description: formData.description.trim(),
        minimum_rent_days: parseInt(formData.minimum_rent_days),
        images: formData.images,
        // Filter out empty specifications
        specifications: Object.fromEntries(
          Object.entries(formData.specifications).filter(([_, value]) => value !== '')
        )
      };

      if (equipment) {
        // Update existing equipment
        const response = await equipmentService.updateEquipment(equipment.equipment_id, submitData);
        dispatch(updateEquipment({ 
          equipmentId: equipment.equipment_id, 
          updates: response.equipment || submitData 
        }));
      } else {
        // Add new equipment
        const response = await equipmentService.addEquipment(submitData);
        dispatch(addEquipment(response.equipment));
      }

      onSuccess?.();
    } catch (error) {
      console.error('Error saving equipment:', error);
      const errorMessage = error.response?.data?.message || `Failed to ${equipment ? 'update' : 'add'} equipment`;
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
        {equipment ? 'Edit Equipment' : 'Add New Equipment'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Equipment Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Equipment Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.name ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Enter equipment name"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type *
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              required
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.type ? 'border-red-300' : 'border-gray-300'
              }`}
            >
              <option value="">Select Type</option>
              {Object.entries(EQUIPMENT_TYPES).map(([key, value]) => (
                <option key={value} value={value}>
                  {key.charAt(0) + key.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
            {errors.type && (
              <p className="mt-1 text-sm text-red-600">{errors.type}</p>
            )}
          </div>

          {/* Brand */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Brand
            </label>
            <select
              name="brand"
              value={formData.brand}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.brand ? 'border-red-300' : 'border-gray-300'
              }`}
            >
              <option value="">Select Brand</option>
              {Object.entries(EQUIPMENT_BRANDS).map(([key, value]) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
            {errors.brand && (
              <p className="mt-1 text-sm text-red-600">{errors.brand}</p>
            )}
          </div>

          {/* Model */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Model
            </label>
            <input
              type="text"
              name="model"
              value={formData.model}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.model ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Enter model"
            />
            {errors.model && (
              <p className="mt-1 text-sm text-red-600">{errors.model}</p>
            )}
          </div>

          {/* Rent Price per Day */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rent Price per Day (₹) *
            </label>
            <input
              type="number"
              name="rent_price_per_day"
              value={formData.rent_price_per_day}
              onChange={handleChange}
              required
              min="100"
              max="50000"
              step="0.01"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.rent_price_per_day ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="0.00"
            />
            {errors.rent_price_per_day && (
              <p className="mt-1 text-sm text-red-600">{errors.rent_price_per_day}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">Minimum: ₹100, Maximum: ₹50,000</p>
          </div>

          {/* Minimum Rent Days */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Minimum Rental Days *
            </label>
            <input
              type="number"
              name="minimum_rent_days"
              value={formData.minimum_rent_days}
              onChange={handleChange}
              required
              min="1"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.minimum_rent_days ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Enter minimum rental days"
            />
            {errors.minimum_rent_days && (
              <p className="mt-1 text-sm text-red-600">{errors.minimum_rent_days}</p>
            )}
          </div>

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
              placeholder="Enter location"
            />
            {errors.location && (
              <p className="mt-1 text-sm text-red-600">{errors.location}</p>
            )}
          </div>

          {/* Specifications */}
          <div className="md:col-span-2">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Specifications</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Power (HP)
                </label>
                <input
                  type="text"
                  value={formData.specifications.power}
                  onChange={(e) => handleSpecificationChange('power', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 45 HP"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fuel Type
                </label>
                <input
                  type="text"
                  value={formData.specifications.fuel_type}
                  onChange={(e) => handleSpecificationChange('fuel_type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Diesel, Petrol"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Capacity
                </label>
                <input
                  type="text"
                  value={formData.specifications.capacity}
                  onChange={(e) => handleSpecificationChange('capacity', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 2 tons"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Year
                </label>
                <input
                  type="number"
                  value={formData.specifications.year}
                  onChange={(e) => handleSpecificationChange('year', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 2020"
                  min="1900"
                  max={new Date().getFullYear()}
                />
              </div>
            </div>
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
              rows="3"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.description ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Enter equipment description, features, condition, etc. (optional)"
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
              Equipment Images
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
                        alt={`Equipment ${index + 1}`}
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
                id="equipment-images"
                multiple
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleImageUpload}
                className="hidden"
              />
              <label htmlFor="equipment-images" className="cursor-pointer">
                <span className="text-4xl mb-2 block">📷</span>
                <p className="text-gray-600 mb-2">
                  {formData.images.length > 0 ? 'Add more images' : 'Upload equipment images'}
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
          <h3 className="text-sm font-medium text-gray-900 mb-2">Equipment Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Name:</span>
              <p className="font-medium">{formData.name || 'Not specified'}</p>
            </div>
            <div>
              <span className="text-gray-600">Type:</span>
              <p className="font-medium">{formData.type ? formData.type.charAt(0).toUpperCase() + formData.type.slice(1) : 'Not specified'}</p>
            </div>
            <div>
              <span className="text-gray-600">Daily Rate:</span>
              <p className="font-medium">{formData.rent_price_per_day ? `₹${formData.rent_price_per_day}` : 'Not specified'}</p>
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
            className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Saving...' : (equipment ? 'Update Equipment' : 'Add Equipment')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EquipmentForm;