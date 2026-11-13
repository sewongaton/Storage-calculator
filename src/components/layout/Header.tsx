import React from 'react';
import { Database, Sparkles, FileText, Download, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  activeStage: number;
  onSelectStage: (stage: number) => void;
  onOpenAiAdvisor: () => void;
  onExportEvidence: () => void;
  confidenceScore: number;
  confidenceRating: string;
}

export const Header: React.FC<HeaderProps> = ({
  activeStage,
  onSelectStage,
  onOpenAiAdvisor,
  onExportEvidence,
  confidenceScore,
  confidenceRating,
}) => {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-8 px-6 py-3.5 bg-white border-b border-slate-200">
      {/* Zone 1: Single text element Brand Zone */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-xs">
          <Database className="w-4 h-4" />
        </div>
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            onSelectStage(1);
          }}
          className="text-base font-semibold tracking-tight text-slate-900 whitespace-nowrap shrink-0 hover:text-emerald-700 transition-colors"
        >
          ServiceNow Storage Sizing Calculator
        </a>
      </div>

      {/* Zone 2: Concise single-line navigation links */}
      <nav className="hidden lg:flex items-center gap-6 text-xs font-medium text-slate-600">
        <button
          onClick={() => onSelectStage(1)}
          className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${
            activeStage === 1 ? 'text-emerald-700 font-semibold' : ''
          }`}
        >
          1. Setup
        </button>
        <button
          onClick={() => onSelectStage(2)}
          className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${
            activeStage === 2 ? 'text-emerald-700 font-semibold' : ''
          }`}
        >
          2. Workloads
        </button>
        <button
          onClick={() => onSelectStage(3)}
          className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${
            activeStage === 3 ? 'text-emerald-700 font-semibold' : ''
          }`}
        >
          3. Assumptions
        </button>
        <button
          onClick={() => onSelectStage(4)}
          className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${
            activeStage === 4 ? 'text-emerald-700 font-semibold' : ''
          }`}
        >
          4. Environments
        </button>
        <button
          onClick={() => onSelectStage(5)}
          className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${
            activeStage === 5 ? 'text-emerald-700 font-semibold' : ''
          }`}
        >
          5. Forecast Results
        </button>
        <button
          onClick={() => onSelectStage(6)}
          className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${
            activeStage === 6 ? 'text-emerald-700 font-semibold' : ''
          }`}
        >
          6. Scenarios
        </button>
        <button
          onClick={() => onSelectStage(7)}
          className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${
            activeStage === 7 ? 'text-emerald-700 font-semibold' : ''
          }`}
        >
          7. Evidence Pack
        </button>
      </nav>

      {/* Zone 3: Primary Action & Assistant */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 font-mono tabular-nums">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Confidence:</span>
          <span className="font-semibold text-slate-800">{confidenceScore}%</span>
        </div>

        <button
          onClick={onExportEvidence}
          className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors whitespace-nowrap shrink-0"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Evidence Pack</span>
        </button>

        <button
          onClick={onOpenAiAdvisor}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-md shadow-xs transition-colors whitespace-nowrap shrink-0"
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>AI Sizing Advisor</span>
        </button>
      </div>
    </header>
  );
};
