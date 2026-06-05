import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Manages a getUserMedia camera stream and exposes capture logic.
 *
 * Returns:
 *   videoRef        — attach to <video> element
 *   cameraState     — 'idle' | 'starting' | 'active' | 'denied' | 'unavailable'
 *   capturedBlob    — Blob after snap, or null
 *   flashVisible    — true for ~400 ms after shutter fires (white flash overlay)
 *   snapPhoto()     — draws current video frame to canvas → Blob
 *   retake()        — clears capturedBlob to return to live preview
 *   stopStream()    — releases camera (call on unmount / navigation away)
 */
export function useCamera() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [cameraState, setCameraState] = useState('idle');
  const [capturedBlob, setCapturedBlob] = useState(null);
  const [flashVisible, setFlashVisible] = useState(false);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    // Don't auto-start; caller invokes startCamera() explicitly.
    return stopStream;
  }, [stopStream]);

  const startCamera = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraState('unavailable');
      return;
    }
    setCameraState('starting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' }, // rear camera first
          width:  { ideal: 1920 },
          height: { ideal: 1080 },
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
      // NotAllowedError → user denied; NotFoundError → no camera hardware
      setCameraState(
        err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
          ? 'denied'
          : 'unavailable',
      );
    }
  }, [stopStream]);

  const snapPhoto = useCallback(() => {
    const video = videoRef.current;
    if (!video || cameraState !== 'active') return;

    // White flash effect
    setFlashVisible(true);
    setTimeout(() => setFlashVisible(false), 400);

    const canvas = document.createElement('canvas');
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);

    canvas.toBlob(
      blob => {
        stopStream();
        setCapturedBlob(blob);
      },
      'image/jpeg',
      0.95, // near-lossless quality
    );
  }, [cameraState, stopStream]);

  const retake = useCallback(() => {
    setCapturedBlob(null);
    startCamera();
  }, [startCamera]);

  return {
    videoRef,
    cameraState,
    capturedBlob,
    flashVisible,
    startCamera,
    snapPhoto,
    retake,
    stopStream,
  };
}
