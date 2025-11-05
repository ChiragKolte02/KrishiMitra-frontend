// components/products/ProductForm.jsx
import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { productService } from '../../services/productService';
import { addProduct, updateProduct } from '../../store/slices/productSlice';
import { PRODUCT_CATEGORIES, PRODUCT_QUALITY, PRODUCT_UNITS } from '../../services/productService';

const ProductForm = ({ product, onCancel, onSuccess }) => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    crop_name: '',
    category: '',
    quantity: '',
    unit: 'kg',
    price_per_kg: '',
    quality: 'A',
    location: '',
    harvest_date: '',
    description: '',
    images: []
  });

  useEffect(() => {
    if (product) {
      setFormData({
        crop_name: product.crop_name || '',
        category: product.category || '',
        quantity: product.quantity || '',
        unit: product.unit || 'kg',
        price_per_kg: product.price_per_kg || '',
        quality: product.quality || 'A',
        location: product.location || '',
        harvest_date: product.harvest_date ? product.harvest_date.split('T')[0] : '',
        description: product.description || '',
        images: product.images || []
      });
    }
  }, [product]);

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

    // Crop name validation
    if (!formData.crop_name.trim()) {
      newErrors.crop_name = 'Crop name is required';
    } else if (formData.crop_name.length < 2 || formData.crop_name.length > 50) {
      newErrors.crop_name = 'Crop name must be between 2-50 characters';
    }

    // Category validation
    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    // Quantity validation
    if (!formData.quantity) {
      newErrors.quantity = 'Quantity is required';
    } else {
      const quantity = parseFloat(formData.quantity);
      if (quantity < 0.1) {
        newErrors.quantity = 'Quantity must be at least 0.1 kg';
      } else if (quantity > 100000) {
        newErrors.quantity = 'Quantity cannot exceed 100,000 kg';
      }
    }

    // Price validation
    if (!formData.price_per_kg) {
      newErrors.price_per_kg = 'Price per kg is required';
    } else {
      const price = parseFloat(formData.price_per_kg);
      if (price < 1) {
        newErrors.price_per_kg = 'Price must be at least ₹1 per kg';
      } else if (price > 1000) {
        newErrors.price_per_kg = 'Price cannot exceed ₹1000 per kg';
      }
    }

    // Location validation
    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    } else if (formData.location.length < 2 || formData.location.length > 100) {
      newErrors.location = 'Location must be between 2-100 characters';
    }

    // Harvest date validation
    if (!formData.harvest_date) {
      newErrors.harvest_date = 'Harvest date is required';
    } else {
      const harvestDate = new Date(formData.harvest_date);
      const minDate = new Date('2020-01-01');
      if (harvestDate < minDate) {
        newErrors.harvest_date = 'Harvest date must be after 2020';
      }
    }

    // Description validation
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
        crop_name: formData.crop_name.trim(),
        category: formData.category,
        quantity: parseFloat(formData.quantity),
        unit: formData.unit,
        price_per_kg: parseFloat(formData.price_per_kg),
        quality: formData.quality,
        location: formData.location.trim(),
        harvest_date: formData.harvest_date,
        description: formData.description.trim(),
        images: formData.images
      };

      if (product) {
        // Update existing product
        const response = await productService.updateProduct(product.product_id, submitData);
        dispatch(updateProduct({ 
          productId: product.product_id, 
          updates: response.product || submitData 
        }));
      } else {
        // Add new product
        const response = await productService.addProduct(submitData);
        dispatch(addProduct(response.product));
      }

      onSuccess?.();
    } catch (error) {
      console.error('Error saving product:', error);
      const errorMessage = error.response?.data?.message || `Failed to ${product ? 'update' : 'add'} product`;
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
        {product ? 'Edit Product' : 'Add New Product'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Crop Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Crop Name *
            </label>
            <input
              type="text"
              name="crop_name"
              value={formData.crop_name}
              onChange={handleChange}
              required
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                errors.crop_name ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Enter crop name"
            />
            {errors.crop_name && (
              <p className="mt-1 text-sm text-red-600">{errors.crop_name}</p>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category *
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                errors.category ? 'border-red-300' : 'border-gray-300'
              }`}
            >
              <option value="">Select Category</option>
              {Object.entries(PRODUCT_CATEGORIES).map(([key, value]) => (
                <option key={value} value={value}>
                  {key.charAt(0) + key.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className="mt-1 text-sm text-red-600">{errors.category}</p>
            )}
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quantity *
            </label>
            <div className="flex space-x-2">
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                required
                min="0.1"
                max="100000"
                step="0.1"
                className={`flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                  errors.quantity ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="0.0"
              />
              <select
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                {Object.entries(PRODUCT_UNITS).map(([key, value]) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>
            {errors.quantity && (
              <p className="mt-1 text-sm text-red-600">{errors.quantity}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">Minimum: 0.1 kg, Maximum: 100,000 kg</p>
          </div>

          {/* Price per kg */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Price per kg (₹) *
            </label>
            <input
              type="number"
              name="price_per_kg"
              value={formData.price_per_kg}
              onChange={handleChange}
              required
              min="1"
              max="1000"
              step="0.01"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                errors.price_per_kg ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="0.00"
            />
            {errors.price_per_kg && (
              <p className="mt-1 text-sm text-red-600">{errors.price_per_kg}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">Minimum: ₹1, Maximum: ₹1000</p>
          </div>

          {/* Quality */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quality *
            </label>
            <select
              name="quality"
              value={formData.quality}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              {Object.entries(PRODUCT_QUALITY).map(([key, value]) => (
                <option key={value} value={value}>
                  {value.charAt(0).toUpperCase() + value.slice(1)} Grade
                </option>
              ))}
            </select>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location *
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              required
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                errors.location ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Enter location"
            />
            {errors.location && (
              <p className="mt-1 text-sm text-red-600">{errors.location}</p>
            )}
          </div>

          {/* Harvest Date */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Harvest Date *
            </label>
            <input
              type="date"
              name="harvest_date"
              value={formData.harvest_date}
              onChange={handleChange}
              required
              min="2020-01-01"
              max={new Date().toISOString().split('T')[0]}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                errors.harvest_date ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.harvest_date && (
              <p className="mt-1 text-sm text-red-600">{errors.harvest_date}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">Must be after 2020</p>
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
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                errors.description ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Enter product description, quality details, storage information, etc. (optional)"
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
              Product Images
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
                        alt={`Product ${index + 1}`}
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
                id="product-images"
                multiple
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleImageUpload}
                className="hidden"
              />
              <label htmlFor="product-images" className="cursor-pointer">
                <span className="text-4xl mb-2 block">📷</span>
                <p className="text-gray-600 mb-2">
                  {formData.images.length > 0 ? 'Add more images' : 'Upload product images'}
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
          <h3 className="text-sm font-medium text-gray-900 mb-2">Product Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Crop:</span>
              <p className="font-medium">{formData.crop_name || 'Not specified'}</p>
            </div>
            <div>
              <span className="text-gray-600">Quantity:</span>
              <p className="font-medium">
                {formData.quantity ? `${formData.quantity} ${formData.unit}` : 'Not specified'}
              </p>
            </div>
            <div>
              <span className="text-gray-600">Price:</span>
              <p className="font-medium">{formData.price_per_kg ? `₹${formData.price_per_kg}/kg` : 'Not specified'}</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-6 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Saving...' : (product ? 'Update Product' : 'Add Product')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductForm;