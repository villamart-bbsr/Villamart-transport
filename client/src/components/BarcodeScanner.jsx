import React, { useState, useEffect, useRef } from 'react';
import Quagga from 'quagga'; // <-- Add this import

const BarcodeScanner = ({ onScanned, onClose, existingBarcodes = [] }) => {
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(false);
  const [barcodes, setBarcodes] = useState(existingBarcodes);
  const [cameraPermission, setCameraPermission] = useState('pending');
  const [manualBarcode, setManualBarcode] = useState('');

  const scannerRef = useRef(null);

  useEffect(() => {
    if (cameraPermission === 'pending') {
      setCameraPermission('requesting');
      setError('');
      // Quagga will handle permission errors
      setCameraPermission('granted');
      setScanning(true);
    }
  }, [cameraPermission]);

  useEffect(() => {
    if (
      scanning &&
      cameraPermission === 'granted' &&
      scannerRef.current // <-- Ensure ref is ready
    ) {
      Quagga.init({
        inputStream: {
          type: "LiveStream",
          target: scannerRef.current,
          constraints: {
            facingMode: "environment"
          }
        },
        decoder: {
          readers: [
            "code_128_reader",
            "ean_reader",
            "ean_8_reader",
            "code_39_reader",
            "upc_reader",
            "upc_e_reader",
            "codabar_reader"
          ]
        }
      }, (err) => {
        if (err) {
          setError("Camera initialization error: " + err.message);
          setCameraPermission('denied');
          return;
        }
        Quagga.start();
      });

      Quagga.onDetected((data) => {
        const code = data.codeResult.code;
        if (code && !barcodes.includes(code)) {
          // Set the scanned code in the manual input field
          setManualBarcode(code);
          setError('');
          setScanning(false);
          // Stop scanning after successful detection
          Quagga.stop();
        }
      });
    }

    return () => {
      if (Quagga && Quagga.stop) {
        try {
          Quagga.stop();
        } catch (e) {}
      }
      if (Quagga && Quagga.offDetected) {
        Quagga.offDetected();
      }
    };
  }, [scanning, cameraPermission, barcodes, scannerRef.current]);

  const handleManualSubmit = () => {
    if (manualBarcode.trim() && !barcodes.includes(manualBarcode.trim())) {
      setBarcodes(prev => [...prev, manualBarcode.trim()]);
      setManualBarcode('');
      setError('');
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
      <div className="bg-white rounded-lg p-6 m-4 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Scan Barcode</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-md">
            <strong>Error:</strong> {error}
          </div>
        )}

        <div className="mb-4">
          <div
            ref={scannerRef}
            className="aspect-square bg-gray-900 rounded-md overflow-hidden mb-2 relative"
            style={{ minHeight: 300 }}
          >
            {/* Show a button if not scanning */}
            {!scanning && (
              <button
                onClick={() => setScanning(true)}
                className="absolute inset-0 m-auto bg-blue-600 text-white px-4 py-2 rounded"
                style={{ top: '40%', left: '30%' }}
              >
                Start Camera
              </button>
            )}
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">
              Position the barcode within the frame
            </p>
          </div>
        </div>

        {barcodes.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">
              Scanned Barcodes ({barcodes.length}):
            </h4>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {barcodes.map((barcode, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-md">
                  <span className="text-sm font-mono text-gray-800 break-all">{barcode}</span>
                  <button
                    onClick={() => removeBarcode(index)}
                    className="text-red-500 hover:text-red-700 ml-2 flex-shrink-0"
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

        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">
            Add barcode manually:
          </h4>
          <div className="flex space-x-2">
            <input
              type="text"
              value={manualBarcode}
              onChange={(e) => setManualBarcode(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleManualSubmit();
                }
              }}
              placeholder="Enter barcode number"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
            />
            <button
              onClick={handleManualSubmit}
              disabled={!manualBarcode.trim() || barcodes.includes(manualBarcode.trim())}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add
            </button>
          </div>
        </div>

        <div className="flex space-x-2">
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
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 text-sm"
          >
            Reload
          </button>
        </div>
      </div>
    </div>
  );
};

export default BarcodeScanner;