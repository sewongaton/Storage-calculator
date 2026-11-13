import React, { useState } from 'react';
import {
  Server,
  Plus,
  Trash2,
  ShieldCheck,
  CheckCircle2,
  HelpCircle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Zap,
  Check,
  AlertTriangle,
  RotateCcw,
  Info,
} from 'lucide-react';
import { EnvironmentConfig, NonProdInstance } from '../../types/calculator';

interface Stage4EnvironmentsProps {
  environments: EnvironmentConfig;
  onUpdateEnvironments: (patch: Partial<EnvironmentConfig>) => void;
  year3ProdTotalGb: number;
  onNext: () => void;
  onPrev: () => void;
}

// ServiceNow Recommended Architecture Standards
const RECOMMENDED_ENV_STANDARDS: Record<
  string,
  { minScale: number; maxScale: number; defaultScale: number; includeAttachments: boolean; roleDescription: string }
> = {
  DEV: {
    minScale: 20,
    maxScale: 30,
    defaultScale: 25,
    includeAttachments: false,
    roleDescription: 'Agile sprints, catalog configuration, update set development (attachments redundant)',
  },
  TEST: {
    minScale: 40,
    maxScale: 60,
    defaultScale: 50,
    includeAttachments: false,
    roleDescription: 'Automated test framework (ATF), functional regression, and integration testing',
  },
  STAGE: {
    minScale: 100,
    maxScale: 100,
    defaultScale: 100,
    includeAttachments: true,
    roleDescription: 'Full-scale pre-production rehearsal, UAT, and release dress rehearsals',
  },
  SANDBOX: {
    minScale: 15,
    maxScale: 20,
    defaultScale: 20,
    includeAttachments: false,
    roleDescription: 'Prototyping, API sandbox exploration, and user training sessions',
  },
  OTHER: {
    minScale: 20,
    maxScale: 40,
    defaultScale: 30,
    includeAttachments: false,
    roleDescription: 'Dedicated reporting or custom utility instance',
  },
};

export const Stage4Environments: React.FC<Stage4EnvironmentsProps> = ({
  environments,
  onUpdateEnvironments,
  year3ProdTotalGb,
  onNext,
  onPrev,
}) => {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const updateInstance = (id: string, patch: Partial<NonProdInstance>) => {
    const updated = environments.nonProdInstances.map((inst) =>
      inst.id === id ? { ...inst, ...patch } : inst
    );
    onUpdateEnvironments({ nonProdInstances: updated });
  };

  const handleAddInstance = () => {
    const newId = `env-custom-${Date.now()}`;
    const newInstance: NonProdInstance = {
      id: newId,
      name: 'Custom Non-PROD Instance',
      type: 'OTHER',
      dataScalePercent: 30,
      includeAttachments: false,
      purpose: 'Specialized testing / API sandbox',
    };
    onUpdateEnvironments({
      nonProdInstances: [...environments.nonProdInstances, newInstance],
    });
  };

  const handleRemoveInstance = (id: string) => {
    onUpdateEnvironments({
      nonProdInstances: environments.nonProdInstances.filter((inst) => inst.id !== id),
    });
  };

  // 1-Click: Apply All ServiceNow Recommended Architecture Standards
  const handleApplyAllRecommendations = () => {
    const updated = environments.nonProdInstances.map((inst) => {
      const std = RECOMMENDED_ENV_STANDARDS[inst.type] || RECOMMENDED_ENV_STANDARDS.OTHER;
      return {
        ...inst,
        dataScalePercent: std.defaultScale,
        includeAttachments: std.includeAttachments,
      };
    });

    onUpdateEnvironments({
      excludeAttachmentsNonProd: true,
      truncateAuditNonProd: true,
      nonProdInstances: updated,
    });

    showToast('Applied ServiceNow recommended architecture standards across all environments.');
  };

  // Align single instance to its recommended standard
  const handleAlignSingleInstance = (inst: NonProdInstance) => {
    const std = RECOMMENDED_ENV_STANDARDS[inst.type] || RECOMMENDED_ENV_STANDARDS.OTHER;
    updateInstance(inst.id, {
      dataScalePercent: std.defaultScale,
      includeAttachments: std.includeAttachments,
    });
    showToast(`Aligned ${inst.name} to recommended ${std.defaultScale}% scale.`);
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
            <span>Stage 4 of 7</span>
            <span>·</span>
            <span>Module FR-04</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 mt-1">
            Instance Topologies & Non-PROD Replication
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Model Production and sub-production instances (DEV, TEST, STAGE, SANDBOX) compared against ServiceNow recommended architecture standards.
          </p>
        </div>

        {/* 1-Click Apply Recommended Standards */}
        <button
          type="button"
          onClick={handleApplyAllRecommendations}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs transition-colors whitespace-nowrap self-start sm:self-auto"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Apply Recommended Standards</span>
        </button>
      </div>

      {/* Master Architecture Best Practice Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Policy 1: Exclude Attachments */}
        <div
          className={`p-4 rounded-xl border transition-all ${
            environments.excludeAttachmentsNonProd
              ? 'bg-emerald-50/70 border-emerald-300'
              : 'bg-amber-50/80 border-amber-300'
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2.5">
              <div
                className={`p-1.5 rounded-md text-white mt-0.5 shrink-0 ${
                  environments.excludeAttachmentsNonProd ? 'bg-emerald-600' : 'bg-amber-600'
                }`}
              >
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">
                  Exclude Attachments on Non-PROD
                </h4>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[11px] font-medium text-emerald-800">
                    Recommended: <strong>ENABLED</strong>
                  </span>
                  <span className="text-slate-300">·</span>
                  <span className="text-[11px] font-mono text-slate-600">
                    Current: {environments.excludeAttachmentsNonProd ? 'Active' : 'Disabled'}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() =>
                onUpdateEnvironments({
                  excludeAttachmentsNonProd: !environments.excludeAttachmentsNonProd,
                })
              }
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors shrink-0 ${
                environments.excludeAttachmentsNonProd
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-slate-900 hover:bg-slate-800 text-white'
              }`}
            >
              {environments.excludeAttachmentsNonProd ? 'Active' : 'Enable'}
            </button>
          </div>
          <p className="text-[11px] text-slate-600 mt-2 leading-relaxed">
            ServiceNow KB0713837: Excludes <code className="font-mono text-slate-800">sys_attachment_doc</code> from clone profiles. Saves 40–60% non-PROD storage.
          </p>
        </div>

        {/* Policy 2: Truncate Audit Logs */}
        <div
          className={`p-4 rounded-xl border transition-all ${
            environments.truncateAuditNonProd
              ? 'bg-emerald-50/70 border-emerald-300'
              : 'bg-amber-50/80 border-amber-300'
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2.5">
              <div
                className={`p-1.5 rounded-md text-white mt-0.5 shrink-0 ${
                  environments.truncateAuditNonProd ? 'bg-emerald-600' : 'bg-amber-600'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">
                  Truncate Audit Tables on Non-PROD
                </h4>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[11px] font-medium text-emerald-800">
                    Recommended: <strong>ENABLED</strong>
                  </span>
                  <span className="text-slate-300">·</span>
                  <span className="text-[11px] font-mono text-slate-600">
                    Current: {environments.truncateAuditNonProd ? 'Active' : 'Disabled'}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() =>
                onUpdateEnvironments({
                  truncateAuditNonProd: !environments.truncateAuditNonProd,
                })
              }
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors shrink-0 ${
                environments.truncateAuditNonProd
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-slate-900 hover:bg-slate-800 text-white'
              }`}
            >
              {environments.truncateAuditNonProd ? 'Active' : 'Enable'}
            </button>
          </div>
          <p className="text-[11px] text-slate-600 mt-2 leading-relaxed">
            Truncates <code className="font-mono text-slate-800">sys_audit</code> and <code className="font-mono text-slate-800">sys_journal_field</code> on clone targets to prevent developer database bloat.
          </p>
        </div>
      </div>

      {/* Production Instance Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
            <h3 className="text-sm font-semibold text-slate-900">Production Instance (PROD)</h3>
          </div>
          <span className="text-xs font-mono font-semibold text-emerald-700">100% Data Scale (Reference Standard)</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 text-xs">
          <div>
            <span className="text-slate-500 block">Instance Role</span>
            <span className="font-medium text-slate-900">Primary Enterprise Production</span>
          </div>
          <div>
            <span className="text-slate-500 block">Attachment Storage</span>
            <span className="font-medium text-slate-900">100% Full Retention</span>
          </div>
          <div>
            <span className="text-slate-500 block">Estimated Year 3 Footprint</span>
            <span className="font-mono font-semibold text-slate-900 tabular-nums">
              ~{Math.round(year3ProdTotalGb).toLocaleString()} GB
            </span>
          </div>
        </div>
      </div>

      {/* Non-PROD Instances Grid with Recommended Values Display */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Sub-Production Instances & Recommended Sizing ({environments.nonProdInstances.length})
            </h3>
            <p className="text-xs text-slate-500">
              Each environment displays its ServiceNow recommended data sampling baseline and attachment rules.
            </p>
          </div>

          <button
            onClick={handleAddInstance}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors whitespace-nowrap shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Sub-PROD Instance</span>
          </button>
        </div>

        <div className="space-y-3">
          {environments.nonProdInstances.map((inst, index) => {
            const std = RECOMMENDED_ENV_STANDARDS[inst.type] || RECOMMENDED_ENV_STANDARDS.OTHER;
            const isScaleMatches = inst.dataScalePercent >= std.minScale && inst.dataScalePercent <= std.maxScale;
            const isScaleHigher = inst.dataScalePercent > std.maxScale;
            const isScaleLower = inst.dataScalePercent < std.minScale;

            const isAttMatches = environments.excludeAttachmentsNonProd || inst.includeAttachments === std.includeAttachments;

            return (
              <div
                key={inst.id}
                className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3"
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-slate-400">0{index + 1}.</span>
                    <input
                      type="text"
                      value={inst.name}
                      onChange={(e) => updateInstance(inst.id, { name: e.target.value })}
                      className="text-xs font-semibold text-slate-900 bg-transparent hover:bg-slate-50 border border-transparent hover:border-slate-200 px-1.5 py-0.5 rounded transition-colors"
                    />
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                      {inst.type}
                    </span>
                  </div>

                  {/* Recommended Baseline Indicator & Quick Reset */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-slate-500">Recommended:</span>
                      <span className="font-mono font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {std.minScale === std.maxScale ? `${std.minScale}%` : `${std.minScale}% - ${std.maxScale}%`}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-mono font-semibold text-slate-900 tabular-nums">
                        Current: {inst.dataScalePercent}%
                      </span>

                      {!isScaleMatches && (
                        <button
                          type="button"
                          onClick={() => handleAlignSingleInstance(inst)}
                          className="px-2 py-0.5 text-[11px] font-medium text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded transition-colors"
                          title="Set to recommended scale"
                        >
                          Align to {std.defaultScale}%
                        </button>
                      )}
                    </div>

                    {environments.nonProdInstances.length > 1 && (
                      <button
                        onClick={() => handleRemoveInstance(inst.id)}
                        className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                        title="Remove instance"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Role Description & Architecture Guidance */}
                <div className="text-[11px] text-slate-500 italic">
                  Best Practice Role: {std.roleDescription}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                  {/* Scale slider */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-600">
                      <span>Sampling Scale Slider</span>
                      <span className="font-mono font-semibold">{inst.dataScalePercent}%</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      step="5"
                      value={inst.dataScalePercent}
                      onChange={(e) =>
                        updateInstance(inst.id, { dataScalePercent: parseInt(e.target.value) || 20 })
                      }
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                      <span>10% (Minimal)</span>
                      <span className="text-emerald-700 font-semibold">
                        Rec: {std.minScale === std.maxScale ? `${std.minScale}%` : `${std.minScale}–${std.maxScale}%`}
                      </span>
                      <span>100% (Full)</span>
                    </div>
                  </div>

                  {/* Attachments toggle */}
                  <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-lg space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-700">Clone Attachments</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={
                            environments.excludeAttachmentsNonProd ? false : inst.includeAttachments
                          }
                          disabled={environments.excludeAttachmentsNonProd}
                          onChange={(e) =>
                            updateInstance(inst.id, { includeAttachments: e.target.checked })
                          }
                          className="sr-only peer"
                        />
                        <div className="w-8 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-600 disabled:opacity-40" />
                      </label>
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Recommended: <strong>{std.includeAttachments ? 'Included (STAGE only)' : 'Excluded'}</strong>
                    </div>
                  </div>

                  {/* Purpose text */}
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Instance Role / Purpose
                    </label>
                    <input
                      type="text"
                      value={inst.purpose}
                      onChange={(e) => updateInstance(inst.id, { purpose: e.target.value })}
                      placeholder="Instance purpose notes"
                      className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md text-slate-700"
                    />
                  </div>
                </div>

                {/* Status Callout Bar */}
                <div className="pt-1 flex items-center justify-between text-[11px]">
                  {isScaleMatches ? (
                    <span className="text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Matches ServiceNow recommended data scale ({std.minScale}%–{std.maxScale}%)
                    </span>
                  ) : isScaleHigher ? (
                    <span className="text-amber-700 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      Scale exceeds recommended range ({std.maxScale}%) — causes additional non-PROD storage overhead
                    </span>
                  ) : (
                    <span className="text-blue-700 flex items-center gap-1">
                      <Info className="w-3.5 h-3.5 text-blue-600" />
                      Scale is below recommended ({std.minScale}%) — verify that testing workflows have sufficient data
                    </span>
                  )}

                  <span className="text-slate-400 font-mono">
                    PROD DB Ratio: {(inst.dataScalePercent / 100).toFixed(2)}x
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-4">
        <button
          onClick={onPrev}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors whitespace-nowrap"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Assumptions</span>
        </button>

        <button
          onClick={onNext}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-colors whitespace-nowrap"
        >
          <span>Calculate Forecast Results</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
