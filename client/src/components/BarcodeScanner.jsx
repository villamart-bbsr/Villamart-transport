import React, { useState, useEffect, useRef } from 'react';

const BarcodeScanner = ({ onScanned, onClose, existingBarcodes = [] }) => {
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(false);
  const [barcodes, setBarcodes] = useState(existingBarcodes);
  const [cameraPermission, setCameraPermission] = useState('pending');
  const [capturedImage, setCapturedImage] = useState(null);
  const [processingCapture, setProcessingCapture] = useState(false);
  const [debugInfo, setDebugInfo] = useState({});
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);
  const intervalRef = useRef(null);

  // Enhanced camera permission check
  useEffect(() => {
    const requestCameraPermission = async () => {
      try {
        setCameraPermission('requesting');
        setError('');
        
        // Enhanced browser support checks
        const isHTTPS = window.location.protocol === 'https:' || window.location.hostname === 'localhost';
        // Allow HTTP for Vercel preview or development environments
        const allowHttp = window.location.hostname.endsWith('.vercel.app') || window.location.hostname === '127.0.0.1';
        const hasMediaDevices = navigator.mediaDevices && navigator.mediaDevices.getUserMedia;
        
        setDebugInfo({
          isHTTPS,
          hasMediaDevices,
          userAgent: navigator.userAgent,
          hostname: window.location.hostname,
          protocol: window.location.protocol
        });
        
        if (!isHTTPS && !allowHttp) {
          throw new Error('Camera access requires HTTPS. Please ensure your site is served over HTTPS.');
        }
        
        if (!hasMediaDevices) {
          throw new Error('Camera API not supported in this browser');
        }
        
        // Enhanced mobile constraints with fallbacks
        const constraints = [
          // First try: Ideal mobile settings
          {
            video: {
              facingMode: { ideal: 'environment' },
              width: { ideal: 1280, min: 640 },
              height: { ideal: 720, min: 480 },
              aspectRatio: { ideal: 1.0 }
            }
          },
          // Second try: Environment camera without constraints
          {
            video: { facingMode: 'environment' }
          },
          // Third try: Any camera with basic constraints
          {
            video: {
              width: { ideal: 640 },
              height: { ideal: 480 }
            }
          },
          // Last try: Any camera
          { video: true }
        ];
        
        let stream = null;
        let lastError = null;
        
        for (const constraint of constraints) {
          try {
            console.log('Trying constraint:', constraint);
            stream = await navigator.mediaDevices.getUserMedia(constraint);
            console.log('Successfully got stream with constraint:', constraint);
            break;
          } catch (err) {
            console.log('Constraint failed:', constraint, err);
            lastError = err;
            continue;
          }
        }
        
        if (!stream) {
          throw lastError || new Error('Failed to get camera stream');
        }
        
        streamRef.current = stream;
        
        // Direct video setup - fix the srcObject assignment issue
        if (videoRef.current) {
          const video = videoRef.current;
          
          console.log('Setting up video element with stream:', stream);
          
          // Set video attributes BEFORE assigning stream
          video.setAttribute('playsinline', '');
          video.setAttribute('muted', '');
          video.setAttribute('autoplay', '');
          video.setAttribute('webkit-playsinline', '');
          video.muted = true;
          video.playsInline = true;
          video.autoplay = true;
          
          // Directly assign the stream - this was the main issue
          video.srcObject = stream;
          
          console.log('Stream assigned to video, srcObject:', video.srcObject);
          
          // Wait for the video to load and play
          await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
              reject(new Error('Video initialization timeout'));
            }, 10000);
            
            const onLoadedMetadata = () => {
              console.log('Video metadata loaded:', {
                videoWidth: video.videoWidth,
                videoHeight: video.videoHeight,
                readyState: video.readyState
              });
              
              // Try to play the video
              video.play()
                .then(() => {
                  console.log('Video playing successfully');
                  clearTimeout(timeout);
                  resolve();
                })
                .catch((playError) => {
                  console.error('Video play error:', playError);
                  // Even if play fails, continue - some browsers block autoplay
                  clearTimeout(timeout);
                  resolve();
                });
            };
            
            const onError = (err) => {
              console.error('Video error:', err);
              clearTimeout(timeout);
              reject(err);
            };
            
            // Add listeners
            video.addEventListener('loadedmetadata', onLoadedMetadata, { once: true });
            video.addEventListener('error', onError, { once: true });
            
            // Force load if not already loading
            if (video.readyState === 0) {
              video.load();
            }
            
            // If already loaded, trigger immediately
            if (video.readyState >= 1) {
              setTimeout(onLoadedMetadata, 0);
            }
          });
        }
        
        setCameraPermission('granted');
        setScanning(true);
        console.log('Camera initialized successfully');
        
      } catch (err) {
        console.error('Camera initialization error:', err);
        
        let errorMessage = 'Unable to access camera. ';
        
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setCameraPermission('denied');
          errorMessage += 'Permission was denied. Please allow camera access and refresh the page.';
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          setCameraPermission('denied');
          errorMessage += 'No camera found on this device.';
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
          setCameraPermission('denied');
          errorMessage += 'Camera is already in use by another application.';
        } else if (err.message.includes('HTTPS')) {
          setCameraPermission('denied');
          errorMessage += err.message;
        } else {
          setCameraPermission('denied');
          errorMessage += `${err.message || 'Unknown error occurred'}`;
        }
        
        setError(errorMessage);
      }
    };
    
    requestCameraPermission();
    
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

  // Re-assign stream to video element when camera permission is granted
  useEffect(() => {
    if (cameraPermission === 'granted' && videoRef.current && streamRef.current) {
      // Always re-assign stream to video element
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [cameraPermission, videoRef.current, streamRef.current]);

  const startBarcodeDetection = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      if (videoRef.current && videoRef.current.videoWidth > 0 && videoRef.current.readyState >= 2) {
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
        
        const detectedBarcodes = await barcodeDetector.detect(canvas);
        
        if (detectedBarcodes.length > 0) {
          const detectedBarcode = detectedBarcodes[0].rawValue;
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
        setError('');
        
        // Briefly pause scanning to prevent duplicate scans
        setScanning(false);
        setTimeout(() => setScanning(true), 1500);
      }
    }
  };

  const [manualBarcode, setManualBarcode] = useState('');

  const handleManualSubmit = (e) => {
    if (manualBarcode.trim() && !barcodes.includes(manualBarcode.trim())) {
      setBarcodes(prev => [...prev, manualBarcode.trim()]);
      setManualBarcode('');
      setError('');
    }
  };

  const removeBarcode = (indexToRemove) => {
    setBarcodes(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const captureBarcode = () => {
    if (!videoRef.current || processingCapture) return;
    
    setProcessingCapture(true);
    setScanning(false);
    
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
      setScanning(true);
    }
    
    setProcessingCapture(false);
  };

  const processCapture = async () => {
    setProcessingCapture(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
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

  const isBarcodeDetectorSupported = 'BarcodeDetector' in window;

  // Add this function inside your component
  const forceVideoPlay = () => {
    if (videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.load();
      videoRef.current.play().catch(() => {});
    }
  };

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

        {/* Enhanced Debug Info */}
        {debugInfo.protocol && (
          <div className="mb-4 p-3 bg-gray-50 border border-gray-200 text-gray-600 text-xs rounded-md">
            <strong>Debug Info:</strong><br />
            Protocol: {debugInfo.protocol}<br />
            HTTPS: {debugInfo.isHTTPS ? '✓' : '✗'}<br />
            Media Devices: {debugInfo.hasMediaDevices ? '✓' : '✗'}<br />
            Host: {debugInfo.hostname}
          </div>
        )}

        {/* Browser Support Warning */}
        {!isBarcodeDetectorSupported && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 text-yellow-700 text-sm rounded-md">
            ⚠️ Automatic barcode detection not supported. Use manual input or capture method.
          </div>
        )}

        {/* Enhanced Error Display */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-md">
            <strong>Error:</strong> {error}
            {debugInfo.protocol === 'http:' && debugInfo.hostname !== 'localhost' && (
              <div className="mt-2 text-xs">
                <strong>Solution:</strong> Ensure your site is served over HTTPS for camera access.
              </div>
            )}
          </div>
        )}

        {/* Camera States */}
        {(cameraPermission === 'pending' || cameraPermission === 'requesting') && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 text-blue-600 text-sm rounded-md">
            📷 Requesting camera access...
          </div>
        )}

        {/* Camera View */}
        {cameraPermission === 'granted' && !capturedImage && (
          <div className="mb-4">
            <div
              className="aspect-square bg-gray-900 rounded-md overflow-hidden mb-2 relative"
              style={{ minHeight: 300 }}
              onClick={forceVideoPlay} // <-- Add this
            >
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                muted
                autoPlay
                webkit-playsinline="true"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  background: '#000',
                  display: 'block'
                }}
                onLoadedMetadata={(e) => {
                  console.log('Video metadata loaded:', {
                    videoWidth: e.target.videoWidth,
                    videoHeight: e.target.videoHeight,
                    readyState: e.target.readyState
                  });
                }}
                onCanPlay={() => console.log('Video can play')}
                onPlay={() => console.log('Video started playing')}
                onError={(e) => {
                  console.error('Video error:', e);
                  setError(`Video playback error: ${e.target.error?.message || 'Unknown error'}`);
                }}
                onLoadStart={() => console.log('Video load started')}
                onLoadedData={() => console.log('Video data loaded')}
                onTimeUpdate={(e) => {
                  // Only log occasionally to avoid spam
                  if (Math.floor(e.target.currentTime) % 5 === 0) {
                    console.log('Video time update:', e.target.currentTime);
                  }
                }}
              />
              <canvas ref={canvasRef} className="hidden" />
              
              {/* Video not loading fallback */}
              {videoRef.current && (
                videoRef.current.videoWidth === 0 || 
                videoRef.current.readyState < 2 || 
                videoRef.current.paused
              ) && (
                <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                  <div className="text-center text-white">
                    <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-sm">Loading camera...</p>
                    <p className="text-xs mt-2 opacity-70">
                      {videoRef.current ? `State: ${videoRef.current.readyState}, Paused: ${videoRef.current.paused}` : 'Initializing...'}
                    </p>
                    <button
                      onClick={() => {
                        console.log('Manual retry clicked');
                        if (videoRef.current && streamRef.current) {
                          console.log('Reassigning stream to video element');
                          const video = videoRef.current;
                          video.srcObject = null; // Clear first
                          setTimeout(() => {
                            video.srcObject = streamRef.current;
                            video.load();
                            video.play().catch(console.error);
                          }, 100);
                        }
                      }}
                      className="mt-2 px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                    >
                      Retry Video
                    </button>
                  </div>
                </div>
              )}
              
              {/* Scanning overlay - only show when video is actually playing */}
              {scanning && videoRef.current && videoRef.current.videoWidth > 0 && !videoRef.current.paused && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-48 h-48 border-2 border-green-400 border-dashed rounded-lg flex items-center justify-center animate-pulse">
                    <span className="text-green-400 text-xs font-medium bg-black bg-opacity-70 px-2 py-1 rounded">
                      Position barcode here
                    </span>
                  </div>
                </div>
              )}
              
              {/* Capture Button */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                <button
                  onClick={captureBarcode}
                  disabled={processingCapture || !videoRef.current || videoRef.current.videoWidth === 0}
                  className="bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-shadow disabled:opacity-50"
                >
                  <div className="w-12 h-12 rounded-full border-4 border-blue-500 flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full bg-blue-500"></div>
                  </div>
                </button>
              </div>
              
              {/* Enhanced Video Debug Info */}
              <div className="absolute top-4 left-4 bg-black bg-opacity-70 text-white text-xs p-2 rounded max-w-48">
                Stream: {streamRef.current ? '✓' : '✗'}
                <br />
                Video: {videoRef.current?.videoWidth || 0}x{videoRef.current?.videoHeight || 0}
                <br />
                Ready: {videoRef.current?.readyState || 0}/4
                <br />
                Paused: {videoRef.current?.paused ? 'Yes' : 'No'}
                <br />
                Time: {videoRef.current?.currentTime?.toFixed(1) || 0}s
                <br />
                SrcObject: {videoRef.current?.srcObject ? '✓' : '✗'}
                {streamRef.current && (
                  <>
                    <br />
                    Tracks: {streamRef.current.getTracks().length}
                    <br />
                    Active: {streamRef.current.getTracks().filter(t => t.enabled).length}
                  </>
                )}
              </div>
            </div>
            
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">
                {isBarcodeDetectorSupported 
                  ? "Position the barcode within the green frame" 
                  : "Tap the capture button to take a photo"
                }
              </p>
              <div className="flex items-center justify-center space-x-2 text-xs text-gray-500">
                <div className={`w-2 h-2 rounded-full ${
                  videoRef.current && videoRef.current.videoWidth > 0 && !videoRef.current.paused 
                    ? 'bg-green-500 animate-pulse' 
                    : 'bg-red-500'
                }`}></div>
                <span>
                  {videoRef.current && videoRef.current.videoWidth > 0 && !videoRef.current.paused 
                    ? 'Camera Active' 
                    : 'Camera Loading'
                  }
                </span>
              </div>
            </div>
          </div>
        )}
        
        {/* Captured Image Processing */}
        {capturedImage && (
          <div className="mb-4">
            <div className="aspect-square bg-gray-100 rounded-md overflow-hidden mb-2 relative">
              <img 
                src={capturedImage} 
                alt="Captured barcode" 
                className="w-full h-full object-cover"
              />
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

        {/* Scanned Barcodes */}
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
              disabled={!manualBarcode.trim() || barcodes.includes(manualBarcode.trim())}
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