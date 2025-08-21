import React, { useState } from 'react';

const LocationPicker = ({ onLocationSelect }) => {
  const [address, setAddress] = useState('');

  const handleAddressChange = (e) => {
    const value = e.target.value;
    setAddress(value);
    onLocationSelect({
      latitude: null,
      longitude: null,
      address: value
    });
  };

  return (
    <div>
      <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
        Location/Address
      </label>
      <input
        type="text"
        id="location"
        value={address}
        onChange={handleAddressChange}
        placeholder="Enter pickup/delivery location"
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
      />
      <p className="mt-1 text-xs text-gray-500">
        Enter the complete address or location details
      </p>
    </div>
  );
};

export default LocationPicker;
