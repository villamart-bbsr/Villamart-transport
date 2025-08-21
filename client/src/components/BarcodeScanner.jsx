import React, { useState } from 'react';
import BarcodeScannerComponent from 'react-qr-barcode-scanner';

const BarcodeScanner = ({ onScanned, onClose }) => {
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(true);

  const handleScan = (result) => {
    if (result) {
      setScanning(false);
      onScanned(result.text || result);
    }
  };

  const handleError = (error) => {
    console.error('Barcode scan error:', error);
    setError('Unable to access camera. Please enter barcode manually.');
  };

  // Fallback manual input
  const [manualBarcode, setManualBarcode] = useState('');

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualBarcode.trim()) {
      onScanned(manualBarcode.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 m-4 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Scan Barcode</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {scanning && !error && (
          <div className="mb-4">
            <div className="aspect-square bg-gray-100 rounded-md overflow-hidden mb-2">
              <BarcodeScannerComponent
                width="100%"
                height="100%"
                onUpdate={(err, result) => {
                  if (result) handleScan(result);
                  if (err) handleError(err);
                }}
              />
            </div>
            <p className="text-sm text-gray-600 text-center">
              Position the barcode within the frame
            </p>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-md">
            {error}
          </div>
        )}

        {/* Manual Input Fallback */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-2">
            Or enter manually:
          </h4>
          <form onSubmit={handleManualSubmit} className="flex space-x-2">
            <input
              type="text"
              value={manualBarcode}
              onChange={(e) => setManualBarcode(e.target.value)}
              placeholder="Enter barcode"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              Use
            </button>
          </form>
        </div>

        <div className="mt-4">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default BarcodeScanner;
