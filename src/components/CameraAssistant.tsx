import React, { useState, useRef, useEffect } from 'react';
import { Camera, CameraOff, Upload, RefreshCw, Sparkles, AlertCircle, Trash2, CheckCircle2 } from 'lucide-react';
import { analyzeVisionImage } from '../services/api';

export const CameraAssistant: React.FC = () => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'general' | 'whiteboard'>('general');
  const [customPrompt, setCustomPrompt] = useState('');

  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    return () => {
      // Clean up camera stream on unmount
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  const startCamera = async () => {
    setError(null);
    try {
      const media = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      setStream(media);
      if (videoRef.current) {
        videoRef.current.srcObject = media;
      }
    } catch (err: any) {
      setError(
        'Unable to access camera. Please verify camera permissions in your browser: ' +
          (err.message || 'Permission denied.')
      );
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const captureFrame = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
    setCapturedImage(dataUrl);
    stopCamera();
    runVisionAnalysis(dataUrl);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image must be under 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setCapturedImage(result);
        stopCamera();
        runVisionAnalysis(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const runVisionAnalysis = async (imgData: string) => {
    setLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const result = await analyzeVisionImage({
        imageBase64: imgData,
        mode,
        prompt: customPrompt.trim() || undefined,
      });
      setAnalysis(result);
    } catch (err: any) {
      setError(err.message || 'Vision analysis failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    stopCamera();
    setCapturedImage(null);
    setAnalysis(null);
    setError(null);
  };

  return (
    <div className="flex-1 p-6 md:p-10 overflow-y-auto max-w-5xl mx-auto flex flex-col gap-6">
      {/* Top Header */}
      <div className="border-b border-slate-200/80 dark:border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Camera className="text-sky-600" size={22} /> Camera & Vision Assistant
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Capture whiteboard notes, textbook diagrams, laboratory apparatus, or uploaded diagrams for academic analysis.
          </p>
        </div>

        {/* Mode Selector */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs self-start">
          <button
            onClick={() => setMode('general')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              mode === 'general'
                ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            General Vision
          </button>
          <button
            onClick={() => setMode('whiteboard')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              mode === 'whiteboard'
                ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Whiteboard & Notes OCR
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Camera Viewport */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left Column: Camera / Image Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col gap-4 shadow-xs">
          <div className="relative aspect-video bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center border border-slate-800">
            {stream ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3 bg-rose-600 text-white text-[10px] font-semibold px-2 py-0.5 rounded flex items-center gap-1.5 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-white" /> LIVE CAMERA
                </div>
              </>
            ) : capturedImage ? (
              <img
                src={capturedImage}
                alt="Captured Snapshot"
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="text-center p-6 text-slate-500 flex flex-col items-center gap-2">
                <Camera size={36} className="opacity-50" />
                <p className="text-xs">Camera is currently stopped</p>
                <p className="text-[11px] text-slate-600 max-w-xs">
                  Grant permission to capture blackboard formulas or upload photos directly from your device.
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {!stream && !capturedImage && (
              <button
                onClick={startCamera}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all shadow-xs"
              >
                <Camera size={14} /> Start Camera
              </button>
            )}

            {stream && (
              <>
                <button
                  onClick={captureFrame}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all shadow-xs"
                >
                  <CheckCircle2 size={14} /> Snap & Analyze
                </button>
                <button
                  onClick={stopCamera}
                  className="px-3.5 py-2 bg-slate-700 hover:bg-slate-600 text-white text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  <CameraOff size={14} /> Stop
                </button>
              </>
            )}

            <label className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors border border-slate-200 dark:border-slate-700">
              <Upload size={14} /> Upload Image
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            {capturedImage && (
              <button
                onClick={handleReset}
                className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors ml-auto"
                title="Discard Image"
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>

          {/* Custom Prompt Input */}
          <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="text-[11px] font-medium text-slate-500">
              Optional Specific Prompt
            </span>
            <input
              type="text"
              placeholder={
                mode === 'whiteboard'
                  ? 'e.g. Solve the third equation written on the right side'
                  : 'e.g. Identify this laboratory apparatus and its function'
              }
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              className="text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 outline-none focus:border-sky-500"
            />
            {capturedImage && !loading && (
              <button
                onClick={() => runVisionAnalysis(capturedImage)}
                className="mt-1 self-start px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-medium rounded-md shadow-xs"
              >
                Re-Analyze with Custom Prompt
              </button>
            )}
          </div>
        </div>

        {/* Right Column: AI Analysis Result */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col gap-3 min-h-[400px] shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Sparkles size={14} className="text-sky-600" />
              Vision Breakdown & Analysis
            </span>
            {loading && (
              <span className="text-xs text-sky-600 flex items-center gap-1 font-medium">
                <RefreshCw size={12} className="animate-spin" /> Examining image...
              </span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto max-h-[500px] text-xs leading-relaxed text-slate-800 dark:text-slate-200">
            {loading ? (
              <div className="h-64 flex flex-col items-center justify-center text-center text-slate-400 gap-2">
                <RefreshCw size={24} className="animate-spin text-sky-600" />
                <p>Decoding visual features, formulas, and diagrams...</p>
              </div>
            ) : analysis ? (
              <div className="prose dark:prose-invert max-w-none text-xs whitespace-pre-wrap">
                {analysis}
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-center text-slate-400 gap-1.5">
                <p>No image analyzed yet.</p>
                <p className="text-[11px] text-slate-500">
                  Take a photo or upload an image to receive instant visual breakdowns.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
