import { useState, useEffect, useRef, useCallback } from 'react';

async function getDeviceIdForFacing(facing) {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videos   = devices.filter(d => d.kind === 'videoinput');
    if (videos.length <= 1) return null;

    // iOS labels contain "front" / "back"; Android labels vary
    const label = facing === 'user' ? 'front' : 'back';
    const match = videos.find(d => d.label.toLowerCase().includes(label));
    if (match) return match.deviceId;

    // Fallback: assume index 0 = back, 1 = front (common on iOS)
    return facing === 'user' ? videos[videos.length - 1].deviceId : videos[0].deviceId;
  } catch {
    return null;
  }
}

export function useCamera() {
  const videoRef         = useRef(null);
  const streamRef        = useRef(null);
  const [cameraState,    setCameraState]    = useState('idle');
  const [capturedBlob,   setCapturedBlob]   = useState(null);
  const [flashVisible,   setFlashVisible]   = useState(false);
  const [captureMethod,  setCaptureMethod]  = useState(null);
  const [facingMode,     setFacingMode]     = useState('environment');
  const [torchOn,        setTorchOn]        = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [zoom,           setZoom]           = useState(1);
  const [zoomRange,      setZoomRange]      = useState({ min: 1, max: 1 });

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => () => stopStream(), [stopStream]);

  const startCameraFacing = useCallback(async (facing) => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraState('unavailable');
      return;
    }
    setCameraState('starting');
    setTorchOn(false);
    setZoom(1);

    try {
      // Try to get exact device ID first (fixes iOS flip)
      const deviceId = await getDeviceIdForFacing(facing);

      const videoConstraints = deviceId
        ? { deviceId: { exact: deviceId }, width: { ideal: 3840 }, height: { ideal: 2160 } }
        : { facingMode: { ideal: facing }, width: { ideal: 3840 }, height: { ideal: 2160 } };

      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: false,   // audio requested only when recording starts
      });

      streamRef.current = stream;

      try {
        const track = stream.getVideoTracks()[0];
        const caps   = track?.getCapabilities?.();
        setTorchSupported(!!(caps?.torch));
        if (caps?.zoom) {
          setZoomRange({ min: caps.zoom.min ?? 1, max: caps.zoom.max ?? 1 });
        } else {
          setZoomRange({ min: 1, max: 1 });
        }
      } catch { setTorchSupported(false); }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraState('active');
    } catch (err) {
      stopStream();
      setCameraState(
        err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError' ? 'denied' : 'unavailable',
      );
    }
  }, [stopStream]);

  const startCamera = useCallback(() => startCameraFacing(facingMode), [startCameraFacing, facingMode]);

  const flipCamera = useCallback(() => {
    const next = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(next);
    stopStream();
    startCameraFacing(next);
  }, [facingMode, stopStream, startCameraFacing]);

  const toggleTorch = useCallback(async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    const next = !torchOn;
    try {
      await track.applyConstraints({ advanced: [{ torch: next }] });
      setTorchOn(next);
    } catch { /* not supported */ }
  }, [torchOn]);

  const applyZoom = useCallback(async (level) => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    try {
      await track.applyConstraints({ advanced: [{ zoom: level }] });
      setZoom(level);
    } catch { /* not supported */ }
  }, []);

  const snapPhoto = useCallback(async () => {
    const video  = videoRef.current;
    const stream = streamRef.current;
    if (!video || !stream || cameraState !== 'active') return;

    setFlashVisible(true);
    setTimeout(() => setFlashVisible(false), 350);
    setCameraState('capturing');

    const videoTrack = stream.getVideoTracks()[0];
    let blob = null;

    if (videoTrack && typeof ImageCapture !== 'undefined') {
      try {
        const ic = new ImageCapture(videoTrack);
        let settings = {};
        try {
          const caps = await ic.getPhotoCapabilities();
          if (caps.imageWidth?.max && caps.imageHeight?.max)
            settings = { imageWidth: caps.imageWidth.max, imageHeight: caps.imageHeight.max };
        } catch { /* skip */ }
        blob = await ic.takePhoto(settings);
        setCaptureMethod('imagecapture');
      } catch { blob = null; }
    }

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
    startCameraFacing(facingMode);
  }, [startCameraFacing, facingMode]);

  return {
    videoRef, cameraState, capturedBlob, flashVisible, captureMethod,
    facingMode, torchOn, torchSupported, zoom, zoomRange,
    startCamera, snapPhoto, retake, stopStream, flipCamera, toggleTorch, applyZoom,
  };
}
