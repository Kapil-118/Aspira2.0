import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { 
  FileText, 
  Upload, 
  CheckCircle, 
  AlertCircle, 
  HelpCircle, 
  Play, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import API from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const ResumeAnalyzer = () => {
  const [file, setFile] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [insights, setInsights] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.type !== 'application/pdf') {
        toast.error('Only PDF documents are supported for resume analysis.', { theme: 'dark' });
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!file) {
      return toast.error('Please pick a resume PDF first.', { theme: 'dark' });
    }

    setAnalyzing(true);
    setInsights(null);

    const formData = new FormData();
    formData.append('resume', file);

    try {
      const res = await API.post('/ai/resume-analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        setInsights(res.data.insights);
        toast.success('Resume analyzed successfully!', { theme: 'dark' });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to complete resume analysis.', { theme: 'dark' });
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 text-left max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white flex items-center gap-2">
          <Sparkles className="w-7 h-7 text-indigo-400 animate-pulse" />
          <span>AI Resume Analyzer</span>
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Upload your resume PDF to receive instant feedback, executive summary reports, and suggest core key improvements.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Upload form Panel */}
        <div className="md:col-span-1 flex flex-col gap-6">
          <div className="glass-panel rounded-2xl p-6 border border-white/5 flex flex-col gap-4">
            <h3 className="text-sm font-bold text-gray-200">Upload Document</h3>
            
            <form onSubmit={handleAnalyze} className="flex flex-col gap-4">
              <div className="border border-dashed border-white/10 rounded-xl p-6 flex flex-col items-center justify-center gap-3 bg-darkBg/40 hover:border-indigo-500/50 cursor-pointer relative transition-all">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <Upload className="w-8 h-8 text-indigo-400" />
                <span className="text-xs text-gray-400 text-center font-medium">
                  {file ? file.name : 'Pick Resume PDF File'}
                </span>
                <span className="text-[9px] text-gray-500">Max size 5MB</span>
              </div>

              <button
                type="submit"
                disabled={analyzing || !file}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-3 px-4 rounded-xl text-xs shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {analyzing ? (
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Analyze Resume</span>
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="glass-panel rounded-2xl p-5 border border-white/5 text-gray-500 text-[10px] leading-relaxed">
            <div className="flex items-center gap-1.5 text-xs text-gray-400 font-semibold mb-2 uppercase tracking-wider">
              <HelpCircle className="w-4 h-4 text-indigo-400" />
              <span>How it works</span>
            </div>
            <p>Our backend extracts text buffers from the PDF and passes them through natural language checkers. If your HF key is configured, it calls Facebook's pre-trained BART CNN model to compile an executive overview summaries directly.</p>
          </div>
        </div>

        {/* Output Results Panel */}
        <div className="md:col-span-2">
          {analyzing ? (
            <div className="glass-panel rounded-2xl p-16 text-center border border-white/5 flex flex-col items-center justify-center gap-4">
              <LoadingSpinner size="medium" />
              <p className="text-sm text-gray-400 animate-pulse">Running natural language parsers and AI summary builders...</p>
            </div>
          ) : insights ? (
            <div className="flex flex-col gap-6">
              {/* Executive Summary Card */}
              <div className="glass-panel rounded-2xl p-6 border border-indigo-500/20 relative overflow-hidden bg-gradient-to-r from-indigo-950/10 to-purple-950/10">
                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl"></div>
                <h3 className="font-extrabold text-sm text-indigo-400 uppercase tracking-widest mb-3">Executive AI Summary</h3>
                <p className="text-xs text-gray-300 leading-relaxed text-left">
                  {insights.executiveSummary}
                </p>
              </div>

              {/* Strengths and Improvements grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-left">
                
                {/* Strengths */}
                <div className="glass-panel rounded-2xl p-5 border border-emerald-500/10 flex flex-col gap-4">
                  <h3 className="font-bold text-emerald-400 text-xs uppercase tracking-wider flex items-center gap-1.5 border-b border-white/5 pb-2.5">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span>Key Strengths</span>
                  </h3>
                  <ul className="flex flex-col gap-3.5">
                    {insights.strengths.map((str, i) => (
                      <li key={i} className="text-[11px] text-gray-300 leading-relaxed flex items-start gap-2">
                        <span className="text-emerald-400 mt-0.5">•</span>
                        <span>{str}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Improvements */}
                <div className="glass-panel rounded-2xl p-5 border border-red-500/10 flex flex-col gap-4">
                  <h3 className="font-bold text-red-400 text-xs uppercase tracking-wider flex items-center gap-1.5 border-b border-white/5 pb-2.5">
                    <AlertCircle className="w-4 h-4 text-red-400" />
                    <span>Suggested Fixes</span>
                  </h3>
                  <ul className="flex flex-col gap-3.5">
                    {insights.improvements.map((imp, i) => (
                      <li key={i} className="text-[11px] text-gray-300 leading-relaxed flex items-start gap-2">
                        <span className="text-red-400 mt-0.5">•</span>
                        <span>{imp}</span>
                      </li>
                    ))}
                  </ul>
                </div>

              </div>
            </div>
          ) : (
            <div className="glass-panel rounded-2xl py-24 text-center text-gray-500 border border-white/5 flex flex-col items-center justify-center">
              <FileText className="w-12 h-12 text-indigo-500/10 mb-4" />
              <p className="text-sm">Upload your resume on the left to start compiling your AI insights.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default ResumeAnalyzer;
