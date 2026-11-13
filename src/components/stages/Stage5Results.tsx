import React, { useState } from 'react';
import {
  BarChart3,
  HardDrive,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  SlidersHorizontal,
  ArrowRight,
  ArrowLeft,
  FileText,
  GitCompare,
  TrendingUp,
  FileDown,
  Loader2,
  Sparkles,
  Download,
} from 'lucide-react';
import { ForecastChart } from '../charts/ForecastChart';
import { CompositionDonut } from '../charts/CompositionDonut';
import {
  CalculationResults,
  EngagementSetup,
  EnvironmentConfig,
  ProductWorkloads,
  TechnicalAssumptions,
} from '../../types/calculator';
import { downloadForecastDocx } from '../../utils/docxExport';

interface Stage5ResultsProps {
  setup: EngagementSetup;
  workloads: ProductWorkloads;
  assumptions: TechnicalAssumptions;
  environments: EnvironmentConfig;
  results: CalculationResults;
  onNext: () => void;
  onPrev: () => void;
  onJumpToScenarios: () => void;
  onJumpToEvidence: () => void;
}

export const Stage5Results: React.FC<Stage5ResultsProps> = ({
  setup,
  workloads,
  assumptions,
  environments,
  results,
  onNext,
  onPrev,
  onJumpToScenarios,
  onJumpToEvidence,
}) => {
  const [isExportingDocx, setIsExportingDocx] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const y3 = results.yearlyProjections[Math.min(2, results.yearlyProjections.length - 1)];
  const horizon = results.yearlyProjections[results.yearlyProjections.length - 1];
  const isBreached = results.year3EntitlementGapGb > 0;
  const isWarning = !isBreached && y3 && y3.status === 'warning';

  const handleDownloadDocx = async () => {
    try {
      setIsExportingDocx(true);
      await downloadForecastDocx(setup, workloads, assumptions, environments, results);
      showToast('Downloaded Word (.docx) capacity report with embedded graphics.');
    } catch (err: any) {
      console.error('Failed to export DOCX:', err);
      showToast('Failed to generate DOCX document. Please try again.');
    } finally {
      setIsExportingDocx(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white text-xs font-medium px-4 py-2.5 rounded-lg shadow-xl animate-in fade-in duration-150">
          {toastMessage}
        </div>
      )}

      {/* Stage Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 tracking-wider uppercase">
            <span>Stage 5 of 7</span>
            <span>·</span>
            <span>Module FR-05</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 mt-1">
            Capacity Forecasting & Entitlement Analytics
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Evaluate multi-year storage consumption, entitlement gap risks, sizing confidence, and sensitivity.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Download DOCX Button */}
          <button
            onClick={handleDownloadDocx}
            disabled={isExportingDocx}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-50 rounded-lg shadow-xs transition-colors whitespace-nowrap"
            title="Download Word (.docx) report with embedded chart graphics and data tables"
          >
            {isExportingDocx ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Generating Graphics...</span>
              </>
            ) : (
              <>
                <FileDown className="w-3.5 h-3.5" />
                <span>Download DOCX Report</span>
              </>
            )}
          </button>

          <button
            onClick={onJumpToScenarios}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors whitespace-nowrap shadow-2xs"
          >
            <GitCompare className="w-3.5 h-3.5" />
            <span>Scenario Studio</span>
          </button>

          <button
            onClick={onJumpToEvidence}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors whitespace-nowrap"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Evidence Pack</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Year 1 Storage */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <span className="text-xs text-slate-500 block">Year 1 Consumption</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-mono tracking-tight text-slate-900 tabular-nums">
              {Math.round(results.year1GrossGb).toLocaleString()}
            </span>
            <span className="text-xs font-mono text-slate-400">GB</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {Math.round((results.year1GrossGb / (setup.licensedEntitlementGb || 1)) * 100)}% of licensed tier
          </span>
        </div>

        {/* KPI 2: Year 3 Storage */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <span className="text-xs text-slate-500 block">Year 3 Consumption</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-mono tracking-tight text-slate-900 tabular-nums">
              {Math.round(results.year3GrossGb).toLocaleString()}
            </span>
            <span className="text-xs font-mono text-slate-400">GB</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {Math.round((results.year3GrossGb / (setup.licensedEntitlementGb || 1)) * 100)}% utilization
          </span>
        </div>

        {/* KPI 3: Horizon Storage */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <span className="text-xs text-slate-500 block">Horizon (Year {horizon.year})</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-mono tracking-tight text-slate-900 tabular-nums">
              {Math.round(horizon.totalGrossGb).toLocaleString()}
            </span>
            <span className="text-xs font-mono text-slate-400">GB</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {Math.round(horizon.utilizationPercent)}% cumulative
          </span>
        </div>

        {/* KPI 4: Entitlement Status */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <span className="text-xs text-slate-500 block">Licensed Entitlement</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-mono tracking-tight text-slate-900 tabular-nums">
              {setup.licensedEntitlementGb.toLocaleString()}
            </span>
            <span className="text-xs font-mono text-slate-400">GB</span>
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-[11px]">
            {isBreached ? (
              <span className="text-rose-600 font-semibold flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Deficit: +{Math.round(results.year3EntitlementGapGb)} GB
              </span>
            ) : isWarning ? (
              <span className="text-amber-600 font-semibold flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Approaching Threshold
              </span>
            ) : (
              <span className="text-emerald-600 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Healthy Headroom
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Interactive Forecast Chart */}
      <ForecastChart
        projections={results.yearlyProjections}
        entitlementGb={setup.licensedEntitlementGb}
        targetBufferPercent={setup.targetBufferPercent}
      />

      {/* Storage Composition & Products */}
      {y3 && <CompositionDonut projection={y3} />}

      {/* Confidence Rating Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-semibold text-slate-900">
              Sizing Confidence Assessment ({results.confidenceScore} / 100)
            </h3>
          </div>
          <span
            className={`text-xs px-2.5 py-1 rounded-md font-medium font-mono ${
              results.confidenceRating === 'High'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : results.confidenceRating === 'Moderate'
                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}
          >
            {results.confidenceRating} Confidence
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {results.confidenceFactors.map((f, idx) => (
            <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    f.impact === 'positive'
                      ? 'bg-emerald-500'
                      : f.impact === 'negative'
                      ? 'bg-rose-500'
                      : 'bg-slate-400'
                  }`}
                />
                <span>{f.label}</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Sensitivity Matrix & What-If Analysis */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            Multi-Variable Sensitivity Matrix & What-If Levers
          </h3>
          <p className="text-xs text-slate-500">
            Impact on Year 3 storage requirements under varied growth, attachment sizes, archiving, and clone rules
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
            <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-semibold">
              <tr>
                <th className="py-2.5 px-3">Sensitivity Parameter</th>
                <th className="py-2.5 px-3">What-If Variation</th>
                <th className="py-2.5 px-3 text-right">Projected Year 3 GB</th>
                <th className="py-2.5 px-3 text-right">Projected Horizon GB</th>
                <th className="py-2.5 px-3 text-right">Delta vs Baseline</th>
                <th className="py-2.5 px-3 text-right">Impact %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono tabular-nums text-slate-800">
              {results.sensitivityAnalysis.map((item, idx) => {
                const isPositive = item.deltaGb > 0;
                return (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2 px-3 font-sans font-medium text-slate-900">{item.parameter}</td>
                    <td className="py-2 px-3 font-sans text-slate-600">{item.scenarioLabel}</td>
                    <td className="py-2 px-3 text-right font-semibold">{item.projectedYear3Gb.toLocaleString()}</td>
                    <td className="py-2 px-3 text-right">{item.projectedHorizonGb.toLocaleString()}</td>
                    <td
                      className={`py-2 px-3 text-right font-semibold ${
                        isPositive ? 'text-rose-600' : 'text-emerald-600'
                      }`}
                    >
                      {isPositive ? `+${item.deltaGb.toLocaleString()}` : `${item.deltaGb.toLocaleString()}`} GB
                    </td>
                    <td
                      className={`py-2 px-3 text-right font-medium ${
                        isPositive ? 'text-rose-600' : 'text-emerald-600'
                      }`}
                    >
                      {isPositive ? `+${item.deltaPercent}%` : `${item.deltaPercent}%`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Navigation & DOCX Download Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200">
        <button
          onClick={onPrev}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors whitespace-nowrap self-start sm:self-auto"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Environments</span>
        </button>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={handleDownloadDocx}
            disabled={isExportingDocx}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap"
          >
            {isExportingDocx ? (
              <Loader2 className="w-4 h-4 animate-spin text-slate-700" />
            ) : (
              <FileDown className="w-4 h-4 text-blue-600" />
            )}
            <span>Export DOCX Report</span>
          </button>

          <button
            onClick={onNext}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-colors whitespace-nowrap"
          >
            <span>Continue to Scenario Comparison</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
