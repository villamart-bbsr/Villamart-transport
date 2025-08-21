import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { entryService } from '../services/api';
import BarcodeScanner from './BarcodeScanner';

const UserForm = () => {
  const { user, logout } = useAuth();
  const [formData, setFormData] = useState({
    distributor: '',
    inOut: '',
    location: '',
    barcode: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [showScanner, setShowScanner] = useState(false);

  const distributors = ['Blinkit', 'Instamart', 'Zepto', 'BigBasket'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.distributor || !formData.inOut || !formData.location || !formData.barcode) {
      setError('All fields are required');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await entryService.createEntry(formData);
      setSuccess('Entry submitted successfully!');
      
      // Reset form
      setFormData({
        distributor: '',
        inOut: '',
        location: '',
        barcode: ''
      });
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to submit entry');
    }

    setLoading(false);
  };


  const handleBarcodeScanned = (barcode) => {
    setFormData(prev => ({ ...prev, barcode }));
    setShowScanner(false);
  };

  return (
    <div className="min-h-screen bg-green-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Distribution Entry Form
                </h2>
                <p className="text-sm text-gray-600">
                  Welcome, {user.name}
                </p>
              </div>
              <button
                onClick={logout}
                className="text-sm text-red-600 hover:text-red-500"
              >
                Logout
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Distributor Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Distributor
                </label>
                <select
                  value={formData.distributor}
                  onChange={(e) => setFormData(prev => ({ ...prev, distributor: e.target.value }))}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">Select Distributor</option>
                  {distributors.map(dist => (
                    <option key={dist} value={dist}>{dist}</option>
                  ))}
                </select>
              </div>

              {/* In/Out Toggle */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, inOut: 'In' }))}
                    className={`px-4 py-2 rounded-md font-medium ${
                      formData.inOut === 'In'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    In
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, inOut: 'Out' }))}
                    className={`px-4 py-2 rounded-md font-medium ${
                      formData.inOut === 'Out'
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Out
                  </button>
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Enter pickup/delivery location"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                />
              </div>

              {/* Barcode Scanner */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Barcode
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={formData.barcode}
                    onChange={(e) => setFormData(prev => ({ ...prev, barcode: e.target.value }))}
                    placeholder="Scan or enter barcode"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowScanner(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Scan
                  </button>
                </div>
              </div>

              {/* Error/Success Messages */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md">
                  {success}
                </div>
              )}

              {/* Submit Button */}
              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                >
                  {loading ? 'Submitting...' : 'Submit Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Barcode Scanner Modal */}
      {showScanner && (
        <BarcodeScanner
          onScanned={handleBarcodeScanned}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
};

export default UserForm;
