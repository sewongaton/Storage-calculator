import React, { useState } from 'react';
import {
  Briefcase,
  Building2,
  Calendar,
  User,
  Clock,
  HardDrive,
  Shield,
  Sparkles,
  ArrowRight,
  Info,
  AlertTriangle,
  Table,
  CheckCircle2,
  X,
} from 'lucide-react';
import {
  ARCHETYPE_PRESETS,
  ArchetypePreset,
  INDUSTRY_LABELS,
  MIN_LICENSED_ENTITLEMENT_GB,
  getMinLicensedEntitlement,
} from '../../constants/benchmarks';
import { AssessmentType, EngagementSetup, IndustryVertical } from '../../types/calculator';

interface Stage1EngagementProps {
  setup: EngagementSetup;
  onUpdateSetup: (patch: Partial<EngagementSetup>) => void;
  onApplyPreset: (preset: ArchetypePreset) => void;
  onNext: () => void;
}

export const Stage1Engagement: React.FC<Stage1EngagementProps> = ({
  setup,
  onUpdateSetup,
  onApplyPreset,
  onNext,
}) => {
  const [showMatrixModal, setShowMatrixModal] = useState(false);

  const assessmentTypes: { id: AssessmentType; label: string; desc: string }[] = [
    {
      id: 'new_implementation',
      label: 'New Implementation',
      desc: 'Fresh greenfield ServiceNow deployment with zero legacy data footprint.',
    },
    {
      id: 'expansion',
      label: 'Module Expansion',
      desc: 'Adding new products (e.g. ITOM, HRSD, CSM) to an existing production instance.',
    },
    {
      id: 'migration',
      label: 'Platform Migration',
      desc: 'Replacing legacy tools (Remedy, Jira, Cherwell) with historical data import.',
    },
    {
      id: 'consolidation',
      label: 'Instance Consolidation',
      desc: 'Merging multiple regional instances or acquired entity platforms into one.',
    },
  ];

  const currentMinEntitlement = getMinLicensedEntitlement(setup.industryVertical, setup.assessmentType);
  const isBelowMin = setup.licensedEntitlementGb < currentMinEntitlement;

  // Handle changing industry vertical with automatic minimum entitlement adjustment
  const handleIndustryChange = (newVertical: IndustryVertical) => {
    const oldMin = getMinLicensedEntitlement(setup.industryVertical, setup.assessmentType);
    const newMin = getMinLicensedEntitlement(newVertical, setup.assessmentType);

    // If current entitlement was at the previous min, or is now below the new min, automatically align to new min
    const shouldUpdateEntitlement = setup.licensedEntitlementGb === oldMin || setup.licensedEntitlementGb < newMin;

    onUpdateSetup({
      industryVertical: newVertical,
      ...(shouldUpdateEntitlement ? { licensedEntitlementGb: newMin } : {}),
    });
  };

  // Handle changing assessment classification type with automatic minimum entitlement adjustment
  const handleAssessmentTypeChange = (newType: AssessmentType) => {
    const oldMin = getMinLicensedEntitlement(setup.industryVertical, setup.assessmentType);
    const newMin = getMinLicensedEntitlement(setup.industryVertical, newType);

    const shouldUpdateEntitlement = setup.licensedEntitlementGb === oldMin || setup.licensedEntitlementGb < newMin;

    onUpdateSetup({
      assessmentType: newType,
      ...(shouldUpdateEntitlement ? { licensedEntitlementGb: newMin } : {}),
    });
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Stage Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 tracking-wider uppercase">
            <span>Stage 1 of 7</span>
            <span>·</span>
            <span>Module FR-01</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 mt-1">
            Engagement Context & Capacity Baseline
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Capture client profile, planning parameters, assessment scope, and mandatory licensed entitlement baseline.
          </p>
        </div>

        {/* 1-Click Archetype Presets Dropdown/Bar */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-slate-500 hidden md:inline">Quick Archetypes:</span>
          <div className="flex flex-wrap gap-1.5">
            {ARCHETYPE_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => onApplyPreset(preset)}
                className="px-2.5 py-1 text-xs font-medium bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 hover:border-emerald-300 rounded-md transition-all shadow-2xs whitespace-nowrap"
                title={preset.description}
              >
                {preset.name.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Form Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Client & Assessment Profile */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 pb-2 border-b border-slate-100">
            <Building2 className="w-4 h-4 text-emerald-600" />
            <span>Client & Assessor Profile</span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Client / Organisation Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={setup.clientName}
                onChange={(e) => onUpdateSetup({ clientName: e.target.value })}
                placeholder="e.g. Acme Financial Group"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Assessment Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={setup.assessmentName}
                onChange={(e) => onUpdateSetup({ assessmentName: e.target.value })}
                placeholder="e.g. FY27 ITSM & ITOM Cloud Modernization"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Assessor Name
                </label>
                <input
                  type="text"
                  value={setup.assessorName}
                  onChange={(e) => onUpdateSetup({ assessorName: e.target.value })}
                  placeholder="e.g. Lead Solution Architect"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Assessment Date
                </label>
                <input
                  type="date"
                  value={setup.assessmentDate}
                  onChange={(e) => onUpdateSetup({ assessmentDate: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors font-mono"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-slate-700">
                  Industry Vertical <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowMatrixModal(true)}
                  className="text-[11px] text-emerald-700 hover:text-emerald-800 font-medium inline-flex items-center gap-1"
                >
                  <Table className="w-3 h-3" />
                  <span>View Min Entitlements Matrix</span>
                </button>
              </div>
              <select
                value={setup.industryVertical}
                onChange={(e) => handleIndustryChange(e.target.value as IndustryVertical)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
              >
                {Object.entries(INDUSTRY_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
              <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-500">
                <span>Selected: {INDUSTRY_LABELS[setup.industryVertical]}</span>
                <span className="font-mono text-emerald-700 font-semibold">
                  Min Tier: {currentMinEntitlement.toLocaleString()} GB ({(currentMinEntitlement / 1024).toFixed(1)} TB)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Planning Parameters & Capacity Ceiling */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 pb-2 border-b border-slate-100">
            <HardDrive className="w-4 h-4 text-emerald-600" />
            <span>Planning Parameters & Commercial Baseline</span>
          </div>

          <div className="space-y-4">
            {/* Planning Horizon Selector */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Planning Horizon (Years)
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[1, 3, 5, 7].map((yr) => (
                  <button
                    key={yr}
                    type="button"
                    onClick={() => onUpdateSetup({ planningHorizonYears: yr })}
                    className={`py-2 text-xs font-medium rounded-lg border transition-all text-center ${
                      setup.planningHorizonYears === yr
                        ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {yr} Year{yr > 1 ? 's' : ''}
                  </button>
                ))}
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-[11px] text-slate-500">Custom horizon (1–10 yrs):</span>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={setup.planningHorizonYears}
                  onChange={(e) =>
                    onUpdateSetup({
                      planningHorizonYears: Math.max(1, Math.min(10, parseInt(e.target.value) || 1)),
                    })
                  }
                  className="w-16 px-2 py-1 text-xs text-right bg-slate-50 border border-slate-200 rounded font-mono"
                />
              </div>
            </div>

            {/* Licensed Entitlement with Minimum Validation Callout */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-700">
                  Licensed Storage Entitlement
                </label>
                <div className="flex items-center gap-2 text-[11px] font-mono">
                  <span className="text-slate-500">
                    {(setup.licensedEntitlementGb / 1024).toFixed(1)} TB
                  </span>
                  <span className="text-slate-300">·</span>
                  <span className="text-emerald-700 font-semibold">
                    Min: {currentMinEntitlement.toLocaleString()} GB
                  </span>
                </div>
              </div>

              <div className="relative">
                <input
                  type="number"
                  step="512"
                  min={currentMinEntitlement}
                  value={setup.licensedEntitlementGb}
                  onChange={(e) =>
                    onUpdateSetup({ licensedEntitlementGb: Math.max(0, parseInt(e.target.value) || 0) })
                  }
                  className={`w-full pl-3 pr-12 py-2 text-sm bg-slate-50 border rounded-lg focus:outline-none focus:ring-2 font-mono tabular-nums transition-colors ${
                    isBelowMin
                      ? 'border-amber-400 bg-amber-50/50 focus:ring-amber-500/20 focus:border-amber-500 text-amber-900'
                      : 'border-slate-200 focus:ring-emerald-500/20 focus:border-emerald-500'
                  }`}
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-mono">GB</span>
              </div>

              {/* Warning if below minimum entitlement */}
              {isBelowMin ? (
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs space-y-1 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between text-amber-800 font-semibold">
                    <span className="flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      Below Industry Minimum Baseline
                    </span>
                    <button
                      type="button"
                      onClick={() => onUpdateSetup({ licensedEntitlementGb: currentMinEntitlement })}
                      className="px-2 py-0.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-[11px] font-medium transition-colors"
                    >
                      Set to Min ({currentMinEntitlement.toLocaleString()} GB)
                    </button>
                  </div>
                  <p className="text-[11px] text-amber-700 leading-relaxed">
                    Mandatory minimum for <strong>{INDUSTRY_LABELS[setup.industryVertical]}</strong> under{' '}
                    <strong>{assessmentTypes.find((a) => a.id === setup.assessmentType)?.label}</strong> is{' '}
                    <strong>{currentMinEntitlement.toLocaleString()} GB ({(currentMinEntitlement / 1024).toFixed(1)} TB)</strong>.
                  </p>
                </div>
              ) : (
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span className="flex items-center gap-1 text-emerald-700">
                    <CheckCircle2 className="w-3 h-3" />
                    Meets industry compliance threshold
                  </span>
                  <span className="font-mono">
                    Baseline: {currentMinEntitlement.toLocaleString()} GB
                  </span>
                </div>
              )}
            </div>

            {/* Current Consumed Storage (if expansion/migration) */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Current Consumed Storage (GB)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  value={setup.currentConsumedGb}
                  onChange={(e) =>
                    onUpdateSetup({ currentConsumedGb: Math.max(0, parseInt(e.target.value) || 0) })
                  }
                  placeholder="0 for new implementation"
                  className="w-full pl-3 pr-12 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono tabular-nums"
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-mono">GB</span>
              </div>
            </div>

            {/* Target Headroom Buffer */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-slate-700">
                  Target Operational Headroom Buffer
                </label>
                <span className="text-xs font-mono font-semibold text-emerald-700">
                  {setup.targetBufferPercent}%
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="35"
                step="5"
                value={setup.targetBufferPercent}
                onChange={(e) => onUpdateSetup({ targetBufferPercent: parseInt(e.target.value) || 20 })}
                className="w-full accent-emerald-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-0.5">
                <span>10% (Tight)</span>
                <span>20% (Recommended)</span>
                <span>35% (Conservative)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Assessment Type Radio Matrix with Dynamic Min Entitlement Badges */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-semibold text-slate-900">
            Assessment Classification Type & Mandatory Entitlement Minimums
          </label>
          <span className="text-[11px] text-slate-500">
            Industry: <strong>{INDUSTRY_LABELS[setup.industryVertical]}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {assessmentTypes.map((type) => {
            const isSelected = setup.assessmentType === type.id;
            const typeMin = getMinLicensedEntitlement(setup.industryVertical, type.id);
            return (
              <div
                key={type.id}
                onClick={() => handleAssessmentTypeChange(type.id)}
                className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
                  isSelected
                    ? 'border-emerald-600 bg-emerald-50/40 ring-1 ring-emerald-600 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-semibold ${isSelected ? 'text-emerald-900' : 'text-slate-800'}`}>
                    {type.label}
                  </span>
                  <div
                    className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                      isSelected ? 'border-emerald-600 bg-emerald-600' : 'border-slate-300'
                    }`}
                  >
                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </div>

                <div className="mt-1.5 inline-block text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                  Min: {typeMin.toLocaleString()} GB ({(typeMin / 1024).toFixed(1)} TB)
                </div>

                <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">{type.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Engagement Notes */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-2">
        <label className="block text-xs font-semibold text-slate-900">
          Customer Sizing Objectives & Presales Scope Notes
        </label>
        <textarea
          rows={3}
          value={setup.notes}
          onChange={(e) => onUpdateSetup({ notes: e.target.value })}
          placeholder="Document specific customer requirements, upcoming rollout milestones, or storage concerns..."
          className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-700 leading-relaxed"
        />
      </div>

      {/* Modal: Comprehensive Minimum Entitlements Standard Matrix */}
      {showMatrixModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-3xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Table className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  ServiceNow Mandatory Minimum Licensed Storage Entitlement Matrix (GB)
                </h3>
              </div>
              <button
                onClick={() => setShowMatrixModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Minimum capacity tiers established based on regulatory compliance, audit log retention, historical migration volumes, and instance consolidation complexity across all 9 industry verticals.
            </p>

            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Industry Vertical</th>
                    <th className="py-2.5 px-3 text-right">New Implementation</th>
                    <th className="py-2.5 px-3 text-right">Module Expansion</th>
                    <th className="py-2.5 px-3 text-right">Platform Migration</th>
                    <th className="py-2.5 px-3 text-right">Instance Consolidation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono tabular-nums text-slate-800">
                  {Object.entries(MIN_LICENSED_ENTITLEMENT_GB).map(([vertKey, typeMap]) => {
                    const isCurrent = vertKey === setup.industryVertical;
                    return (
                      <tr
                        key={vertKey}
                        className={`hover:bg-slate-50 transition-colors ${
                          isCurrent ? 'bg-emerald-50/60 font-semibold' : ''
                        }`}
                      >
                        <td className="py-2.5 px-3 font-sans font-medium text-slate-900">
                          {INDUSTRY_LABELS[vertKey as IndustryVertical]}
                          {isCurrent && (
                            <span className="ml-2 text-[10px] font-sans px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded">
                              Current
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right">{typeMap.new_implementation.toLocaleString()} GB</td>
                        <td className="py-2.5 px-3 text-right">{typeMap.expansion.toLocaleString()} GB</td>
                        <td className="py-2.5 px-3 text-right">{typeMap.migration.toLocaleString()} GB</td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-950">
                          {typeMap.consolidation.toLocaleString()} GB
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowMatrixModal(false)}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs"
              >
                Close Matrix Reference
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer Navigation */}
      <div className="flex items-center justify-end pt-2">
        <button
          onClick={onNext}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-colors whitespace-nowrap"
        >
          <span>Continue to Workload Discovery</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
