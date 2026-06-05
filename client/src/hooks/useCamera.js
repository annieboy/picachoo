import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Manages a getUserMedia camera stream and exposes capture logic.
 *
 * Capture strategy (best → fallback):
 *   1. ImageCapture.takePhoto() — W3C API that triggers a full-resolution
 *      hardware snapshot from the camera sensor, independent of stream res.
 *      Supported on Chrome/Android. NOT on iOS Safari.
 *   2. Canvas drawImage() — screenshots the current video frame at whatever
 *      resolution the browser negotiated (up to 4K if hardware permits).
 *
 * Returns:
 *   videoRef        — attach to <video> element
 *   cameraState     — 'idle' | 'starting' | 'active' | 'capturing' | 'denied' | 'unavailable'
 *   capturedBlob    — Blob after snap, or null
 *   flashVisible    — true for ~400 ms after shutter fires
 *   captureMethod   — 'imagecapture' | 'canvas' — set after first snap
 *   snapPhoto()     — async; fires hardware snapshot or canvas fallback
 *   retake()        — clears capturedBlob to return to live preview
 *   stopStream()    — releases camera (call on unmount / navigation away)
 */
export function useCamera() {
  const videoRef        = useRef(null);
  const streamRef       = useRef(null);
  const [cameraState,   setCameraState]   = useState('idle');
  const [capturedBlob,  setCapturedBlob]  = useState(null);
  const [flashVisible,  setFlashVisible]  = useState(false);
  const [captureMethod, setCaptureMethod] = useState(null);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    return stopStream;
  }, [stopStream]);

  const startCamera = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraState('unavailable');
      return;
    }
    setCameraState('starting');
    try {
      // Request 4K; the browser/device negotiates down to its highest
      // supported resolution. Even on phones this typically yields 1080p+.
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width:      { ideal: 3840 },
          height:     { ideal: 2160 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraState('active');
    } catch (err) {
      stopStream();
      setCameraState(
        err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
          ? 'denied'
          : 'unavailable',
      );
    }
  }, [stopStream]);

  const snapPhoto = useCallback(async () => {
    const video  = videoRef.current;
    const stream = streamRef.current;
    if (!video || !stream || cameraState !== 'active') return;

    // Flash fires immediately — don't await the capture first
    setFlashVisible(true);
    setTimeout(() => setFlashVisible(false), 400);

    // Disable shutter button during async capture
    setCameraState('capturing');

    const videoTrack = stream.getVideoTracks()[0];
    let blob = null;

    // ── Strategy 1: ImageCapture (Chrome / Android) ───────────────────────
    // takePhoto() asks the camera driver for a full-resolution JPEG directly
    // from the sensor, entirely bypassing the compressed video pipeline.
    if (videoTrack && typeof ImageCapture !== 'undefined') {
      try {
        const imageCapture = new ImageCapture(videoTrack);

        // Query the sensor's maximum still-photo resolution
        let photoSettings = {};
        try {
          const caps = await imageCapture.getPhotoCapabilities();
          const maxW  = caps.imageWidth?.max;
          const maxH  = caps.imageHeight?.max;
          if (maxW && maxH) {
            photoSettings = { imageWidth: maxW, imageHeight: maxH };
          }
        } catch {
          // getPhotoCapabilities() not supported on this device — takePhoto()
          // with no settings still uses the hardware default (often full-res)
        }

        blob = await imageCapture.takePhoto(photoSettings);
        setCaptureMethod('imagecapture');
      } catch {
        // takePhoto() can fail on some Android devices despite the API
        // existing; fall through to canvas
        blob = null;
      }
    }

    // ── Strategy 2: Canvas screenshot (iOS Safari, Firefox, fallback) ─────
    // drawImage() at the negotiated video stream resolution (up to 4K).
    if (!blob) {
      blob = await new Promise(resolve => {
        const canvas = document.createElement('canvas');
        canvas.width  = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0);
        canvas.toBlob(b => resolve(b), 'image/jpeg', 0.95);
      });
      setCaptureMethod('canvas');
    }

    stopStream();
    setCapturedBlob(blob);
  }, [cameraState, stopStream]);

  const retake = useCallback(() => {
    setCapturedBlob(null);
    setCaptureMethod(null);
    startCamera();
  }, [startCamera]);

  return {
    videoRef,
    cameraState,
    capturedBlob,
    flashVisible,
    captureMethod,
    startCamera,
    snapPhoto,
    retake,
    stopStream,
  };
}
