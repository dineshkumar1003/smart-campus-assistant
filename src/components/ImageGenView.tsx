import React, { useState } from 'react';
import { Image as ImageIcon, Sparkles, Download, RefreshCw, AlertCircle, Copy, Check } from 'lucide-react';
import { requestImageGeneration } from '../services/api';

export const ImageGenView: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9' | '4:3' | '3:4' | '9:16'>('1:1');
  const [loading, setLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [imageDescription, setImageDescription] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const samplePrompts = [
    '3D isometric architectural model of a futuristic smart campus library with glass solar domes',
    'Detailed scientific biological illustration of a plant cell chloroplast with labeled thylakoids',
    'Modern university robotics lab with autonomous rovers and computer workstations',
    'Minimalist poster illustrating quantum entanglement with neon blue wave functions'
  ];

  const handleGenerate = async () => {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setError(null);
    setGeneratedImage(null);
    setImageDescription(null);

    try {
      const res = await requestImageGeneration(prompt.trim(), aspectRatio);
      if (res.imageUrl) {
        setGeneratedImage(res.imageUrl);
        setImageDescription(res.description || null);
      } else {
        setError(res.description || 'No image was returned.');
      }
    } catch (err: any) {
      setError(
        err.message ||
          'Image generation failed. Ensure your Gemini API credentials support image generation or review service quota.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!generatedImage) return;
    const a = document.createElement('a');
    a.href = generatedImage;
    a.download = `smart_campus_${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const copyPrompt = (p: string) => {
    setPrompt(p);
  };

  return (
    <div className="flex-1 p-6 md:p-10 overflow-y-auto max-w-5xl mx-auto flex flex-col gap-6">
      {/* Header */}
      <div className="border-b border-slate-200/80 dark:border-slate-800 pb-4">
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <ImageIcon className="text-sky-600" size={22} /> Campus Image Studio
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Generate high-fidelity academic illustrations, concept diagrams, project mockups, and campus visualizations using Gemini image generation.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Image Generation Notice</p>
            <p className="mt-0.5 leading-relaxed">{error}</p>
            <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
              Note: Image generation models requires an authorized API key with access to Gemini image models. If unavailable, you can generate concepts, flowcharts, and diagrams via the AI Agents and Chat tabs.
            </p>
          </div>
        </div>
      )}

      {/* Generation Input Box */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col gap-4 shadow-xs">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Prompt Description
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the campus visual, scientific diagram, or concept illustration you want to generate..."
            rows={3}
            className="w-full text-xs md:text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 outline-none focus:border-sky-500 transition-colors leading-relaxed"
          />
        </div>

        {/* Aspect Ratio & Generate Button */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Aspect Ratio:</span>
            {(['1:1', '16:9', '4:3', '3:4', '9:16'] as const).map((ratio) => (
              <button
                key={ratio}
                onClick={() => setAspectRatio(ratio)}
                className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                  aspectRatio === ratio
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {ratio}
              </button>
            ))}
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
            className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white text-xs font-semibold rounded-lg flex items-center gap-2 transition-all shadow-xs"
          >
            {loading ? (
              <>
                <RefreshCw size={14} className="animate-spin" /> Generating Image...
              </>
            ) : (
              <>
                <Sparkles size={14} /> Generate Studio Visual
              </>
            )}
          </button>
        </div>

        {/* Inspiration Prompts */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
            Campus Inspiration Prompts
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {samplePrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => copyPrompt(p)}
                className="text-left text-xs p-2.5 bg-slate-50 dark:bg-slate-950/60 hover:bg-sky-50 dark:hover:bg-sky-950/30 border border-slate-200/60 dark:border-slate-800/60 rounded-lg text-slate-600 dark:text-slate-400 transition-colors line-clamp-2"
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Image Preview & Output */}
      {generatedImage && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col items-center gap-4 shadow-xs">
          <div className="flex items-center justify-between w-full border-b border-slate-100 dark:border-slate-800 pb-3">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Sparkles size={14} className="text-sky-600" /> Generated Visual Asset
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownload}
                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <Download size={13} /> Download Asset
              </button>
            </div>
          </div>

          <div className="max-w-xl w-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-md">
            <img src={generatedImage} alt={prompt} className="w-full h-auto object-contain" />
          </div>

          {imageDescription && (
            <p className="text-xs text-slate-500 text-center max-w-lg italic">
              {imageDescription}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
