import React, { useState } from 'react';
import {
  GitCompare,
  Plus,
  RotateCcw,
  Copy,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Sliders,
  Bookmark,
} from 'lucide-react';
import { calculateStorageForecast } from '../../utils/calculationEngine';
import { Scenario } from '../../types/calculator';

interface Stage6ScenariosProps {
  scenarios: Scenario[];
  activeScenarioId: string;
  onSaveCurrentAsScenario: (name: string, description: string) => void;
  onRestoreScenario: (scenario: Scenario) => void;
  onDuplicateScenario: (scenario: Scenario) => void;
  onDeleteScenario: (id: string) => void;
  onNext: () => void;
  onPrev: () => void;
}

export const Stage6Scenarios: React.FC<Stage6ScenariosProps> = ({
  scenarios,
  activeScenarioId,
  onSaveCurrentAsScenario,
  onRestoreScenario,
  onDuplicateScenario,
  onDeleteScenario,
  onNext,
  onPrev,
}) => {
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [newScenarioName, setNewScenarioName] = useState('');
  const [newScenarioDesc, setNewScenarioDesc] = useState('');

  // Calculate live results for each scenario if not cached
  const evaluatedScenarios = scenarios.map((sc) => {
    const res = sc.results || calculateStorageForecast(sc.setup, sc.workloads, sc.assumptions, sc.environments, true);
    return {
      ...sc,
      results: res,
    };
  });

  const baselineScenario = evaluatedScenarios.find((s) => s.isBaseline) || evaluatedScenarios[0];
  const baselineY3 = baselineScenario?.results?.year3GrossGb || 1;

  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newScenarioName.trim()) return;
    onSaveCurrentAsScenario(newScenarioName.trim(), newScenarioDesc.trim());
    setNewScenarioName('');
    setNewScenarioDesc('');
    setShowSaveModal(false);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Stage Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 tracking-wider uppercase">
            <span>Stage 6 of 7</span>
            <span>·</span>
            <span>Module FR-06</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 mt-1">
            Scenario Comparison Studio
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Save, restore, duplicate, and compare multiple capacity planning variations side-by-side.
          </p>
        </div>

        <button
          onClick={() => setShowSaveModal(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors whitespace-nowrap self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Save Current as New Scenario</span>
        </button>
      </div>

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-900">Save Current State as Scenario</h3>
              <button
                onClick={() => setShowSaveModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Scenario Name</label>
                <input
                  type="text"
                  required
                  value={newScenarioName}
                  onChange={(e) => setNewScenarioName(e.target.value)}
                  placeholder="e.g. 24-Mo Archiving with 20% Growth"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Description / Hypothesis
                </label>
                <textarea
                  rows={2}
                  value={newScenarioDesc}
                  onChange={(e) => setNewScenarioDesc(e.target.value)}
                  placeholder="Describe key assumption changes and expected outcomes..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSaveModal(false)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md shadow-xs"
                >
                  Save Scenario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Scenarios Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {evaluatedScenarios.map((sc) => {
          const res = sc.results!;
          const isCurrent = sc.id === activeScenarioId;
          const deltaGb = res.year3GrossGb - baselineY3;
          const isBreached = res.year3EntitlementGapGb > 0;

          return (
            <div
              key={sc.id}
              className={`bg-white border rounded-xl p-4 shadow-2xs space-y-3 transition-all ${
                isCurrent ? 'ring-2 ring-emerald-600 border-emerald-600' : 'border-slate-200'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-xs font-bold text-slate-900">{sc.name}</h4>
                    {sc.isBaseline && (
                      <span className="text-[10px] font-mono px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded">
                        Baseline
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{sc.description}</p>
                </div>
              </div>

              {/* Year 3 Key Metric */}
              <div className="p-3 bg-slate-50 rounded-lg space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Year 3 Storage:</span>
                  <span className="font-mono font-bold text-slate-900 tabular-nums">
                    {Math.round(res.year3GrossGb).toLocaleString()} GB
                  </span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>Delta vs Baseline:</span>
                  <span
                    className={`font-mono tabular-nums font-semibold ${
                      deltaGb > 0
                        ? 'text-rose-600'
                        : deltaGb < 0
                        ? 'text-emerald-600'
                        : 'text-slate-500'
                    }`}
                  >
                    {deltaGb > 0 ? `+${Math.round(deltaGb)}` : `${Math.round(deltaGb)}`} GB
                  </span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                  <span>Entitlement Status:</span>
                  <span
                    className={`font-semibold ${isBreached ? 'text-rose-600' : 'text-emerald-600'}`}
                  >
                    {isBreached ? `Deficit +${Math.round(res.year3EntitlementGapGb)} GB` : 'Under Limit'}
                  </span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-between pt-1 text-xs">
                <button
                  onClick={() => onRestoreScenario(sc)}
                  className={`px-2.5 py-1 rounded font-medium transition-colors ${
                    isCurrent
                      ? 'bg-emerald-50 text-emerald-800 font-semibold'
                      : 'text-slate-700 bg-slate-100 hover:bg-slate-200'
                  }`}
                >
                  {isCurrent ? 'Active in Calc' : 'Load into Calc'}
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onDuplicateScenario(sc)}
                    className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
                    title="Duplicate scenario"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  {!sc.isBaseline && (
                    <button
                      onClick={() => onDeleteScenario(sc.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                      title="Delete scenario"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Side-by-Side Detailed Comparison Matrix */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            Side-by-Side Architectural Parameters & Sizing Delta Matrix
          </h3>
          <p className="text-xs text-slate-500">
            Comparison of technical assumptions, retention policies, and capacity requirements
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
            <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-semibold">
              <tr>
                <th className="py-2.5 px-3 min-w-[200px]">Architectural Dimension</th>
                {evaluatedScenarios.map((sc) => (
                  <th key={sc.id} className="py-2.5 px-3 text-right min-w-[140px]">
                    <span className="block truncate">{sc.name}</span>
                    {sc.id === activeScenarioId && (
                      <span className="text-[10px] text-emerald-600 font-normal">Active in Calc</span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono tabular-nums text-slate-800">
              <tr>
                <td className="py-2 px-3 font-sans font-medium text-slate-900">Year 1 Gross Storage</td>
                {evaluatedScenarios.map((sc) => (
                  <td key={sc.id} className="py-2 px-3 text-right">
                    {Math.round(sc.results!.year1GrossGb).toLocaleString()} GB
                  </td>
                ))}
              </tr>
              <tr className="bg-slate-50/50 font-bold">
                <td className="py-2 px-3 font-sans font-semibold text-slate-900">Year 3 Gross Storage</td>
                {evaluatedScenarios.map((sc) => (
                  <td key={sc.id} className="py-2 px-3 text-right text-emerald-800">
                    {Math.round(sc.results!.year3GrossGb).toLocaleString()} GB
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2 px-3 font-sans font-medium text-slate-900">Horizon Gross Storage</td>
                {evaluatedScenarios.map((sc) => (
                  <td key={sc.id} className="py-2 px-3 text-right">
                    {Math.round(sc.results!.horizonGrossGb).toLocaleString()} GB
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2 px-3 font-sans font-medium text-slate-900">Year 3 Entitlement Gap</td>
                {evaluatedScenarios.map((sc) => {
                  const gap = sc.results!.year3EntitlementGapGb;
                  return (
                    <td
                      key={sc.id}
                      className={`py-2 px-3 text-right font-semibold ${
                        gap > 0 ? 'text-rose-600' : 'text-emerald-600'
                      }`}
                    >
                      {gap > 0 ? `+${Math.round(gap)} GB Deficit` : 'Within Quota'}
                    </td>
                  );
                })}
              </tr>
              <tr>
                <td className="py-2 px-3 font-sans font-medium text-slate-900">Active Record Retention</td>
                {evaluatedScenarios.map((sc) => (
                  <td key={sc.id} className="py-2 px-3 text-right font-sans">
                    {sc.assumptions.activeRetentionMonths} Months
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2 px-3 font-sans font-medium text-slate-900">Audit History Retention</td>
                {evaluatedScenarios.map((sc) => (
                  <td key={sc.id} className="py-2 px-3 text-right font-sans">
                    {sc.assumptions.auditRetentionMonths} Months
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2 px-3 font-sans font-medium text-slate-900">Non-PROD Attachments</td>
                {evaluatedScenarios.map((sc) => (
                  <td
                    key={sc.id}
                    className={`py-2 px-3 text-right font-sans font-medium ${
                      sc.environments.excludeAttachmentsNonProd ? 'text-emerald-700' : 'text-amber-700'
                    }`}
                  >
                    {sc.environments.excludeAttachmentsNonProd ? 'Excluded (Clean)' : 'Full Replicate'}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2 px-3 font-sans font-medium text-slate-900">Annual Growth Rate</td>
                {evaluatedScenarios.map((sc) => (
                  <td key={sc.id} className="py-2 px-3 text-right font-sans">
                    {(sc.assumptions.annualGrowthRate * 100).toFixed(0)}% / yr
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2 px-3 font-sans font-medium text-slate-900">Confidence Score</td>
                {evaluatedScenarios.map((sc) => (
                  <td key={sc.id} className="py-2 px-3 text-right font-semibold">
                    {sc.results!.confidenceScore}% ({sc.results!.confidenceRating})
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-4">
        <button
          onClick={onPrev}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors whitespace-nowrap"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Forecast Results</span>
        </button>

        <button
          onClick={onNext}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-colors whitespace-nowrap"
        >
          <span>Generate Evidence Pack</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
