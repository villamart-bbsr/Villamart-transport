import React, { useState, useEffect, useRef } from 'react';

const BarcodeScanner = ({ onScanned, onClose, existingBarcodes = [] }) => {
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(false);
  const [barcodes, setBarcodes] = useState(existingBarcodes);
  const [cameraPermission, setCameraPermission] = useState('pending');
  const [capturedImage, setCapturedImage] = useState(null);
  const [processingCapture, setProcessingCapture] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);
  const intervalRef = useRef(null);

  // Request camera permission on component mount
  useEffect(() => {
    const requestCameraPermission = async () => {
      try {
        setCameraPermission('requesting');
        setError(''); // Clear any previous errors
        
        // Check if getUserMedia is supported
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Camera API not supported');
        }
        
        // Try with basic constraints first
        let constraints = {
          video: {
            facingMode: 'environment'
          }
        };
        
        let stream;
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints);
        } catch (err) {
          // If environment camera fails, try with any camera
          console.log('Environment camera not available, trying any camera:', err);
          constraints = { video: true };
          stream = await navigator.mediaDevices.getUserMedia(constraints);
        }
        
        streamRef.current = stream;
        
        // Wait for video element to be ready
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          
          // Wait for video to load
          await new Promise((resolve, reject) => {
            if (videoRef.current) {
              videoRef.current.onloadedmetadata = () => {
                videoRef.current?.play().then(resolve).catch(reject);
              };
              videoRef.current.onerror = reject;
            } else {
              reject(new Error('Video element not available'));
            }
          });
        }
        
        setCameraPermission('granted');
        setScanning(true);
        console.log('Camera initialized successfully');
        
      } catch (err) {
        console.error('Camera initialization error:', err);
        
        // Check specific error types
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setCameraPermission('denied');
          setError('Camera permission was denied. Please allow camera access and refresh the page.');
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          setCameraPermission('denied');
          setError('No camera found on this device.');
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
          setCameraPermission('denied');
          setError('Camera is already in use by another application.');
        } else {
          setCameraPermission('denied');
          setError(`Camera error: ${err.message || 'Unable to access camera'}. Please check your browser settings.`);
        }
      }
    };
    
    requestCameraPermission();
    
    // Cleanup function
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Start barcode detection when scanning is enabled
  useEffect(() => {
    if (scanning && videoRef.current && canvasRef.current) {
      startBarcodeDetection();
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [scanning]);

  const startBarcodeDetection = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      if (videoRef.current && videoRef.current.videoWidth > 0) {
        detectBarcode();
      }
    }, 500);
  };

  const detectBarcode = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw current video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Try to detect barcode using browser's built-in BarcodeDetector if available
    if ('BarcodeDetector' in window) {
      try {
        const barcodeDetector = new window.BarcodeDetector({
          formats: ['code_128', 'code_39', 'ean_13', 'ean_8', 'upc_a', 'upc_e', 'qr_code']
        });
        
        const barcodes = await barcodeDetector.detect(canvas);
        
        if (barcodes.length > 0) {
          const detectedBarcode = barcodes[0].rawValue;
          handleScanResult(detectedBarcode);
        }
      } catch (err) {
        console.error('BarcodeDetector error:', err);
      }
    }
  };

  const handleScanResult = (result) => {
    if (result && typeof result === 'string' && result.trim()) {
      console.log('Scan result:', result);
      
      const newBarcode = result.trim();
      
      if (!barcodes.includes(newBarcode)) {
        console.log('Adding barcode:', newBarcode);
        setBarcodes(prev => [...prev, newBarcode]);
        setError(''); // Clear any previous errors
        
        // Briefly pause scanning to prevent duplicate scans
        setScanning(false);
        setTimeout(() => setScanning(true), 1500);
      }
    }
  };

  // Fallback manual input
  const [manualBarcode, setManualBarcode] = useState('');

  const handleManualSubmit = (e) => {
    if (manualBarcode.trim() && !barcodes.includes(manualBarcode.trim())) {
      setBarcodes(prev => [...prev, manualBarcode.trim()]);
      setManualBarcode('');
      setError(''); // Clear any errors
    }
  };

  const removeBarcode = (indexToRemove) => {
    setBarcodes(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const captureBarcode = () => {
    if (!videoRef.current || processingCapture) return;
    
    setProcessingCapture(true);
    setScanning(false); // Stop live scanning
    
    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
      setCapturedImage(imageDataUrl);
    } catch (err) {
      console.error('Error capturing image:', err);
      setError('Failed to capture image. Please try again.');
      setScanning(true); // Resume scanning on error
    }
    
    setProcessingCapture(false);
  };

  const processCapture = async () => {
    setProcessingCapture(true);
    
    try {
      // In a real implementation, you would process the captured image
      // For now, let's simulate processing and ask user to enter manually
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Clear captured image and show manual input
      setCapturedImage(null);
      setError('Please enter the barcode manually from the captured image.');
      
    } catch (err) {
      setError('Failed to process captured image.');
    }
    
    setProcessingCapture(false);
  };

  const retryScanning = () => {
    setCapturedImage(null);
    setError('');
    setScanning(true);
  };

  const handleDone = () => {
    onScanned(barcodes);
  };

  // Check if BarcodeDetector is supported
  const isBarcodeDetectorSupported = 'BarcodeDetector' in window;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 m-4 max-w-md w-full max-h-[90vh] overflow-y-auto">
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

        {/* Browser Support Warning */}
        {!isBarcodeDetectorSupported && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 text-yellow-700 text-sm rounded-md">
            ⚠️ Automatic barcode detection is not supported in this browser. Please use manual input or capture and enter manually.
          </div>
        )}

        {/* Camera permission states */}
        {(cameraPermission === 'pending' || cameraPermission === 'requesting') && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 text-blue-600 text-sm rounded-md">
            📷 Requesting camera access... Please allow camera permission when prompted.
          </div>
        )}

        {/* Camera denied or error */}
        {cameraPermission === 'denied' && (
          <div className="mb-4">
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-md mb-2">
              {error || "Camera access denied. Please enable camera permissions in your browser settings and refresh the page."}
            </div>
            <button
              onClick={() => {
                setCameraPermission('pending');
                setError('');
                // Re-trigger the camera permission request
                const event = new Event('retry-camera');
                window.dispatchEvent(event);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Camera is ready and scanning */}
        {scanning && cameraPermission === 'granted' && !capturedImage && (
          <div className="mb-4">
            <div className="aspect-square bg-gray-100 rounded-md overflow-hidden mb-2 relative">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                muted
              />
              <canvas
                ref={canvasRef}
                className="hidden"
              />
              
              {/* Scanning overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-48 h-48 border-2 border-green-500 border-dashed rounded-lg flex items-center justify-center">
                  <span className="text-green-500 text-sm font-medium bg-black bg-opacity-50 px-2 py-1 rounded">
                    Position barcode here
                  </span>
                </div>
              </div>
              
              {/* Capture Button */}
              <button
                onClick={captureBarcode}
                disabled={processingCapture}
                className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white rounded-full p-2 shadow-lg"
              >
                <div className="w-12 h-12 rounded-full border-4 border-blue-500 flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-blue-500"></div>
                </div>
              </button>
            </div>
            
            <p className="text-sm text-gray-600 text-center">
              {isBarcodeDetectorSupported 
                ? "Position the barcode within the green frame for automatic detection" 
                : "Tap the capture button to take a photo of the barcode"
              }
            </p>
          </div>
        )}
        
        {/* Show captured image */}
        {capturedImage && (
          <div className="mb-4">
            <div className="aspect-square bg-gray-100 rounded-md overflow-hidden mb-2 relative">
              <img 
                src={capturedImage} 
                alt="Captured barcode" 
                className="w-full h-full object-cover"
              />
              <button
                onClick={retryScanning}
                className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={processCapture}
                disabled={processingCapture}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md disabled:opacity-50"
              >
                {processingCapture ? "Processing..." : "Process Image"}
              </button>
              <button
                onClick={retryScanning}
                className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-md"
              >
                Retake
              </button>
            </div>
          </div>
        )}

        {/* Error message - only show if not already showing camera permission error */}
        {error && cameraPermission !== 'denied' && (
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

        {/* Manual Input */}
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
                  handleManualSubmit(e);
                }
              }}
              placeholder="Enter barcode number"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
            />
            <button
              onClick={handleManualSubmit}
              disabled={!manualBarcode.trim()}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add
            </button>
          </div>
        </div>

        {/* Action Buttons */}
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
        </div>
      </div>
    </div>
  );
};

export default BarcodeScanner;