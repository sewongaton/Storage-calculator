import React from 'react';
import {
  Briefcase,
  Layers,
  Sliders,
  Server,
  BarChart3,
  GitCompare,
  FileCheck2,
  AlertTriangle,
  CheckCircle2,
  Bookmark,
} from 'lucide-react';
import { CalculationResults, EngagementSetup } from '../../types/calculator';

interface SidebarProps {
  activeStage: number;
  onSelectStage: (stage: number) => void;
  setup: EngagementSetup;
  results: CalculationResults;
  scenariosCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeStage,
  onSelectStage,
  setup,
  results,
  scenariosCount,
}) => {
  const stages = [
    {
      id: 1,
      code: 'FR-01',
      title: 'Engagement Setup',
      subtitle: 'Client profile & entitlement',
      icon: Briefcase,
    },
    {
      id: 2,
      code: 'FR-02',
      title: 'Workload Discovery',
      subtitle: 'Products & transaction volume',
      icon: Layers,
    },
    {
      id: 3,
      code: 'FR-03',
      title: 'Technical Assumptions',
      subtitle: 'Record sizes, retention, attachments',
      icon: Sliders,
    },
    {
      id: 4,
      code: 'FR-04',
      title: 'Environments',
      subtitle: 'PROD & Non-PROD topology',
      icon: Server,
    },
    {
      id: 5,
      code: 'FR-05',
      title: 'Results & Forecasting',
      subtitle: '10-yr forecast, gap & sensitivity',
      icon: BarChart3,
    },
    {
      id: 6,
      code: 'FR-06',
      title: 'Scenarios Comparison',
      subtitle: `${scenariosCount} saved scenarios`,
      icon: GitCompare,
    },
    {
      id: 7,
      code: 'FR-07',
      title: 'Evidence Pack',
      subtitle: 'Traceable audit report & exports',
      icon: FileCheck2,
    },
  ];

  const y3 = results.yearlyProjections[Math.min(2, results.yearlyProjections.length - 1)];
  const isBreached = results.year3EntitlementGapGb > 0;
  const isWarning = !isBreached && y3 && y3.status === 'warning';

  return (
    <aside className="w-64 shrink-0 bg-white border-r border-slate-200 flex flex-col justify-between h-[calc(100vh-57px)] sticky top-[57px]">
      {/* Stages list */}
      <div className="p-3 space-y-1 overflow-y-auto">
        <div className="px-3 pt-2 pb-1 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
          Assessment Workflow
        </div>

        {stages.map((stage) => {
          const Icon = stage.icon;
          const isActive = activeStage === stage.id;
          return (
            <button
              key={stage.id}
              onClick={() => onSelectStage(stage.id)}
              className={`w-full text-left flex items-start gap-3 px-3 py-2.5 rounded-lg text-xs transition-colors ${
                isActive
                  ? 'bg-slate-900 text-white font-medium shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div
                className={`mt-0.5 p-1 rounded-md shrink-0 ${
                  isActive ? 'text-emerald-400 bg-slate-800' : 'text-slate-500 bg-slate-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="truncate">{stage.title}</span>
                  <span
                    className={`font-mono text-[10px] tabular-nums ${
                      isActive ? 'text-slate-400' : 'text-slate-400'
                    }`}
                  >
                    {stage.code}
                  </span>
                </div>
                <div
                  className={`text-[11px] truncate mt-0.5 ${
                    isActive ? 'text-slate-300' : 'text-slate-500'
                  }`}
                >
                  {stage.subtitle}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Instance Capacity Status Card */}
      <div className="p-3 border-t border-slate-200 bg-slate-50/60">
        <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Year 3 Storage</span>
            <span className="font-mono font-semibold text-slate-900 tabular-nums">
              {Math.round(results.year3GrossGb).toLocaleString()} GB
            </span>
          </div>

          {/* Progress bar towards entitlement */}
          <div className="space-y-1">
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  isBreached
                    ? 'bg-rose-500'
                    : isWarning
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
                style={{
                  width: `${Math.min(100, (results.year3GrossGb / setup.licensedEntitlementGb) * 100)}%`,
                }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>Licensed: {setup.licensedEntitlementGb.toLocaleString()} GB</span>
              <span className="font-mono tabular-nums">
                {Math.round((results.year3GrossGb / setup.licensedEntitlementGb) * 100)}%
              </span>
            </div>
          </div>

          {/* Status Indicator */}
          <div className="pt-1 flex items-center gap-1.5 text-xs">
            {isBreached ? (
              <>
                <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span className="text-rose-700 font-medium truncate">
                  Deficit: +{Math.round(results.year3EntitlementGapGb)} GB
                </span>
              </>
            ) : isWarning ? (
              <>
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span className="text-amber-700 font-medium truncate">Buffer warning (&lt;20%)</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="text-emerald-700 font-medium truncate">Within Entitlement</span>
              </>
            )}
          </div>
        </div>

        <div className="mt-2 px-1 flex items-center justify-between text-[11px] text-slate-400">
          <span className="truncate">{setup.clientName || 'Unassigned Client'}</span>
          <span className="font-mono shrink-0">{setup.planningHorizonYears}Y Plan</span>
        </div>
      </div>
    </aside>
  );
};
