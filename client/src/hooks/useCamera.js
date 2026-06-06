import { useState, useEffect, useRef, useCallback } from 'react';

async function getDeviceIdForFacing(facing) {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videos   = devices.filter(d => d.kind === 'videoinput');
    if (videos.length <= 1) return null;
    const label = facing === 'user' ? 'front' : 'back';
    const match = videos.find(d => d.label.toLowerCase().includes(label));
    if (match) return match.deviceId;
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

  const modeRef  = useRef('photo');
  const ratioRef = useRef(3 / 4); // default 3:4

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => () => stopStream(), [stopStream]);

  const startCameraFacing = useCallback(async (facing, mode, ratio) => {
    const resolvedMode = mode ?? modeRef.current;
    if (ratio !== undefined) ratioRef.current = ratio;

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraState('unavailable');
      return;
    }
    setCameraState('starting');
    setTorchOn(false);
    setZoom(1);

    try {
      const deviceId = await getDeviceIdForFacing(facing);

      // Always request the highest resolution — no aspectRatio constraint.
      // Cropping is handled in canvas at capture time, not in the stream.
      const sizeConstraints = resolvedMode === 'video'
        ? { width: { ideal: 1920 }, height: { ideal: 1080 } }
        : { width: { ideal: 4096 }, height: { ideal: 3072 } };

      const videoConstraints = deviceId
        ? { deviceId: { exact: deviceId }, ...sizeConstraints }
        : { facingMode: { ideal: facing }, ...sizeConstraints };

      const stream = await navigator.mediaDevices.getUserMedia({ video: videoConstraints, audio: false });
      streamRef.current = stream;

      try {
        const track = stream.getVideoTracks()[0];
        const caps   = track?.getCapabilities?.();
        setTorchSupported(!!(caps?.torch));
        setZoomRange(caps?.zoom ? { min: caps.zoom.min ?? 1, max: caps.zoom.max ?? 1 } : { min: 1, max: 1 });
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

  const startCamera = useCallback((mode, ratio) => {
    if (mode  !== undefined) modeRef.current  = mode;
    if (ratio !== undefined) ratioRef.current = ratio;
    return startCameraFacing(facingMode, mode, ratio);
  }, [startCameraFacing, facingMode]);

  const switchMode = useCallback((mode) => {
    modeRef.current = mode;
    stopStream();
    startCameraFacing(facingMode, mode, ratioRef.current);
  }, [facingMode, stopStream, startCameraFacing]);

  const switchRatio = useCallback((ratio) => {
    ratioRef.current = ratio;
    // No stream restart needed — ratio only affects canvas crop at capture time
  }, []);

  const flipCamera = useCallback(() => {
    const next = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(next);
    stopStream();
    startCameraFacing(next, modeRef.current, ratioRef.current);
  }, [facingMode, stopStream, startCameraFacing]);

  const toggleTorch = useCallback(async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    const next = !torchOn;
    try { await track.applyConstraints({ advanced: [{ torch: next }] }); setTorchOn(next); } catch { /* unsupported */ }
  }, [torchOn]);

  const applyZoom = useCallback(async (level) => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    try { await track.applyConstraints({ advanced: [{ zoom: level }] }); setZoom(level); } catch { /* unsupported */ }
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
      const targetAR = ratioRef.current; // w/h, null = no crop
      blob = await new Promise(resolve => {
        const vw = video.videoWidth;
        const vh = video.videoHeight;
        const canvas = document.createElement('canvas');

        if (targetAR === null) {
          canvas.width  = vw;
          canvas.height = vh;
          canvas.getContext('2d').drawImage(video, 0, 0);
        } else {
          const streamAR = vw / vh;
          let sx = 0, sy = 0, sw = vw, sh = vh;
          if (streamAR > targetAR) {
            sw = Math.round(vh * targetAR);
            sx = Math.round((vw - sw) / 2);
          } else if (streamAR < targetAR) {
            sh = Math.round(vw / targetAR);
            sy = Math.round((vh - sh) / 2);
          }
          canvas.width  = sw;
          canvas.height = sh;
          canvas.getContext('2d').drawImage(video, sx, sy, sw, sh, 0, 0, sw, sh);
        }

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
    startCameraFacing(facingMode, modeRef.current, ratioRef.current);
  }, [startCameraFacing, facingMode]);

  return {
    videoRef, cameraState, capturedBlob, flashVisible, captureMethod,
    facingMode, torchOn, torchSupported, zoom, zoomRange,
    startCamera, snapPhoto, retake, stopStream, flipCamera, toggleTorch, applyZoom,
    switchMode, switchRatio,
  };
}
