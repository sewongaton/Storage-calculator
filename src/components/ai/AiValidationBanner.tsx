import React, { useState } from 'react';
import { AlertTriangle, AlertCircle, Info, ChevronDown, ChevronUp, Sparkles, RefreshCw } from 'lucide-react';
import { AiValidation } from '../../types/calculator';

interface AiValidationBannerProps {
  validations: AiValidation[];
  loading: boolean;
  onRefresh: () => void;
  onOpenAdvisor: () => void;
}

export const AiValidationBanner: React.FC<AiValidationBannerProps> = ({
  validations,
  loading,
  onRefresh,
  onOpenAdvisor,
}) => {
  const [expanded, setExpanded] = useState(false);

  if (!validations || validations.length === 0) {
    return null;
  }

  const criticals = validations.filter((v) => v.severity === 'critical');
  const warnings = validations.filter((v) => v.severity === 'warning');
  const infos = validations.filter((v) => v.severity === 'info');

  const topIssue = criticals[0] || warnings[0] || infos[0];

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs mb-5 transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <div
            className={`p-1.5 rounded-md mt-0.5 shrink-0 ${
              criticals.length > 0
                ? 'bg-rose-100 text-rose-700'
                : warnings.length > 0
                ? 'bg-amber-100 text-amber-700'
                : 'bg-blue-100 text-blue-700'
            }`}
          >
            {criticals.length > 0 ? (
              <AlertTriangle className="w-4 h-4" />
            ) : warnings.length > 0 ? (
              <AlertCircle className="w-4 h-4" />
            ) : (
              <Info className="w-4 h-4" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900">
                AI Sizing Guardrails & Anomaly Checks:
              </span>
              <span className="text-xs text-slate-600 font-medium">{topIssue.title}</span>
              <div className="flex items-center gap-1 text-[11px] font-mono tabular-nums">
                {criticals.length > 0 && (
                  <span className="text-rose-700 font-semibold">{criticals.length} Critical</span>
                )}
                {warnings.length > 0 && (
                  <span className="text-amber-700 font-semibold">
                    {criticals.length > 0 ? '· ' : ''}
                    {warnings.length} Warning{warnings.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>

            <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
              {topIssue.message}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
            title="Re-run AI anomaly check"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
          </button>

          <button
            onClick={onOpenAdvisor}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md transition-colors"
          >
            <Sparkles className="w-3 h-3 text-emerald-600" />
            <span>Review Proposals</span>
          </button>

          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-md transition-colors"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded list of validations */}
      {expanded && (
        <div className="mt-3 pt-3 border-t border-slate-100 space-y-2.5 animate-in fade-in duration-150">
          {validations.map((val) => (
            <div
              key={val.id}
              className={`p-3 rounded-lg border text-xs space-y-1 ${
                val.severity === 'critical'
                  ? 'bg-rose-50/50 border-rose-200'
                  : val.severity === 'warning'
                  ? 'bg-amber-50/50 border-amber-200'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900">{val.title}</span>
                <span
                  className={`text-[10px] font-mono uppercase font-semibold px-1.5 py-0.2 rounded ${
                    val.severity === 'critical'
                      ? 'bg-rose-100 text-rose-800'
                      : val.severity === 'warning'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {val.severity}
                </span>
              </div>
              <p className="text-slate-600 leading-relaxed">{val.message}</p>
              <div className="pt-1 text-[11px] text-emerald-700 font-medium">
                💡 Recommendation: {val.recommendation}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
