import React, { useState, useEffect } from 'react';
import BarcodeScannerComponent from 'react-qr-barcode-scanner';

const BarcodeScanner = ({ onScanned, onClose, existingBarcodes = [] }) => {
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(false);
  const [barcodes, setBarcodes] = useState(existingBarcodes);
  const [cameraPermission, setCameraPermission] = useState('pending');

  // Request camera permission on component mount
  useEffect(() => {
    const requestCameraPermission = async () => {
      try {
        setCameraPermission('requesting');
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        
        // If we get here, permission was granted
        setCameraPermission('granted');
        setScanning(true);
        
        // Clean up function to stop all tracks when component unmounts
        return () => {
          stream.getTracks().forEach(track => track.stop());
        };
      } catch (err) {
        console.error('Camera permission error:', err);
        setCameraPermission('denied');
        setError('Camera access denied. Please check your browser settings or enter barcodes manually.');
      }
    };
    
    requestCameraPermission();
  }, []);

  const handleScan = (result) => {
    if (result) {
      const newBarcode = result.text || result;
      if (!barcodes.includes(newBarcode)) {
        setBarcodes(prev => [...prev, newBarcode]);
        setScanning(true); // Keep scanning for more barcodes
      }
    }
  };

  const handleError = (error) => {
    console.error('Barcode scan error:', error);
    // Only set the error if we haven't already determined camera permission
    if (cameraPermission !== 'denied') {
      setError('Scanner error. Please try again or enter barcode manually.');
    }
  };

  // Fallback manual input
  const [manualBarcode, setManualBarcode] = useState('');

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualBarcode.trim() && !barcodes.includes(manualBarcode.trim())) {
      setBarcodes(prev => [...prev, manualBarcode.trim()]);
      setManualBarcode('');
    }
  };

  const removeBarcode = (indexToRemove) => {
    setBarcodes(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleDone = () => {
    onScanned(barcodes);
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

        {/* Camera permission pending or requesting */}
        {(cameraPermission === 'pending' || cameraPermission === 'requesting') && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 text-blue-600 text-sm rounded-md">
            Requesting camera access... Please allow camera permission when prompted.
          </div>
        )}

        {/* Camera is ready and scanning */}
        {scanning && cameraPermission === 'granted' && (
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

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-md">
            {error}
          </div>
        )}

        {/* Scanned Barcodes List */}
        {barcodes.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">
              Scanned Barcodes ({barcodes.length}):
            </h4>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {barcodes.map((barcode, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-md">
                  <span className="text-sm font-mono text-gray-800">{barcode}</span>
                  <button
                    onClick={() => removeBarcode(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Manual Input Fallback */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-2">
            Add barcode manually:
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
              Add
            </button>
          </form>
        </div>

        <div className="mt-4 flex space-x-2">
          <button
            onClick={handleDone}
            disabled={barcodes.length === 0}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Done ({barcodes.length})
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default BarcodeScanner;
