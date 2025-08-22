import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import QrScanner from 'react-qr-scanner';

const BarcodeScanner = ({ onScanned, onClose, existingBarcodes = [] }) => {
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(false);
  const [barcodes, setBarcodes] = useState(existingBarcodes);
  const [manualBarcode, setManualBarcode] = useState('');
  const [scanner, setScanner] = useState(null);
  const [scannerType, setScannerType] = useState('html5'); // 'html5' or 'react'

  const scannerRef = useRef(null);

  useEffect(() => {
    if (scanning && scannerRef.current && !scanner) {
      initializeScanner();
    }
    return () => {
      if (scanner) {
        scanner.clear().catch(console.error);
      }
    };
  }, [scanning, scanner]);

  const initializeScanner = () => {
    if (scannerType === 'html5') {
      try {
        const html5QrcodeScanner = new Html5QrcodeScanner(
          "qr-reader",
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
            showTorchButtonIfSupported: true,
            showZoomSliderIfSupported: true,
            defaultZoomValueIfSupported: 2,
            rememberLastUsedCamera: true,
          },
          false
        );

        html5QrcodeScanner.render(
          (decodedText, decodedResult) => {
            console.log('HTML5 Scanned:', decodedText, decodedResult);
            if (decodedText && !barcodes.includes(decodedText)) {
              setManualBarcode(decodedText);
              setError('');
            }
          },
          (error) => {
            // Handle scan errors silently
          }
        );

        setScanner(html5QrcodeScanner);
      } catch (err) {
        setError('HTML5 scanner failed, trying alternative scanner...');
        setScannerType('react');
      }
    }
  };

  const handleReactQrScan = (data) => {
    if (data && !barcodes.includes(data)) {
      console.log('React QR Scanned:', data);
      setManualBarcode(data);
      setError('');
    }
  };

  const handleReactQrError = (err) => {
    console.log('React QR Error:', err);
  };


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
          {!scanning ? (
            <div className="text-center">
              <button
                onClick={() => setScanning(true)}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Start QR/Barcode Scanner
              </button>
              <p className="text-sm text-gray-600 mt-2">
                Click to start scanning QR codes and barcodes
              </p>
              <div className="mt-4 flex justify-center space-x-2">
                <button
                  onClick={() => setScannerType('html5')}
                  className={`px-3 py-1 text-xs rounded ${scannerType === 'html5' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                >
                  HTML5 Scanner
                </button>
                <button
                  onClick={() => setScannerType('react')}
                  className={`px-3 py-1 text-xs rounded ${scannerType === 'react' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                >
                  React Scanner
                </button>
              </div>
            </div>
          ) : (
            <div>
              {scannerType === 'html5' ? (
                <div
                  id="qr-reader"
                  ref={scannerRef}
                  className="bg-gray-900 rounded-md overflow-hidden mb-2"
                  style={{ minHeight: 300 }}
                ></div>
              ) : (
                <div className="bg-gray-900 rounded-md overflow-hidden mb-2" style={{ minHeight: 300 }}>
                  <QrScanner
                    delay={300}
                    onError={handleReactQrError}
                    onScan={handleReactQrScan}
                    style={{ width: '100%', height: '300px' }}
                    constraints={{
                      video: {
                        facingMode: 'environment'
                      }
                    }}
                  />
                </div>
              )}
              <div className="text-center">
                <button
                  onClick={() => {
                    setScanning(false);
                    if (scanner && scannerType === 'html5') {
                      scanner.clear().catch(console.error);
                      setScanner(null);
                    }
                  }}
                  className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors mr-2"
                >
                  Stop Scanner
                </button>
                <button
                  onClick={() => {
                    setScannerType(scannerType === 'html5' ? 'react' : 'html5');
                    if (scanner && scannerType === 'html5') {
                      scanner.clear().catch(console.error);
                      setScanner(null);
                    }
                  }}
                  className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 transition-colors"
                >
                  Switch Scanner
                </button>
                <p className="text-sm text-gray-600 mt-2">
                  Position the QR code or barcode within the frame
                </p>
                <p className="text-xs text-gray-500">
                  Using: {scannerType === 'html5' ? 'HTML5' : 'React'} Scanner
                </p>
              </div>
            </div>
          )}
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