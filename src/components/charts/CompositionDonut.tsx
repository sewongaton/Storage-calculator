import React from 'react';
import { YearlyProjection } from '../../types/calculator';

interface CompositionDonutProps {
  projection: YearlyProjection;
}

export const CompositionDonut: React.FC<CompositionDonutProps> = ({ projection }) => {
  if (!projection) return null;

  const total = projection.totalGrossGb || 1;

  // Tier composition
  const tiers = [
    { label: 'Relational Database', val: projection.databaseGrossGb, color: 'bg-emerald-600', hex: '#059669' },
    { label: 'Audit & Journal History', val: projection.auditGrossGb, color: 'bg-teal-500', hex: '#14b8a6' },
    { label: 'Attachments (sys_attachment)', val: projection.attachmentGrossGb, color: 'bg-amber-500', hex: '#f59e0b' },
    { label: 'Non-PROD Footprint', val: projection.nonProdTotalGb, color: 'bg-indigo-500', hex: '#6366f1' },
  ];

  // Dynamic product composition mapping for all ServiceNow products
  const PRODUCT_INFO_MAP: Record<string, { label: string; color: string }> = {
    itsm: { label: 'ITSM Core & CMDB', color: 'bg-blue-600' },
    itom: { label: 'ITOM & Events', color: 'bg-cyan-600' },
    itam: { label: 'IT Asset Mgmt (ITAM)', color: 'bg-indigo-600' },
    spm: { label: 'Strategic Portfolio (SPM)', color: 'bg-purple-600' },
    irm: { label: 'Integrated Risk (IRM)', color: 'bg-emerald-600' },
    secops: { label: 'Security Operations (SecOps)', color: 'bg-rose-600' },
    csm: { label: 'Customer Service (CSM)', color: 'bg-teal-600' },
    fsm: { label: 'Field Service (FSM)', color: 'bg-amber-600' },
    hrsd: { label: 'HR Service Delivery', color: 'bg-pink-600' },
    wsd: { label: 'Workplace Service (WSD)', color: 'bg-emerald-700' },
    lsd: { label: 'Legal Service (LSD)', color: 'bg-violet-600' },
    psm: { label: 'Procurement (PSM)', color: 'bg-sky-600' },
    customApps: { label: 'Custom App Engine', color: 'bg-orange-600' },
    automationEngine: { label: 'Automation & RPA Engine', color: 'bg-amber-500' },
    industrySolutions: { label: 'Industry Vertical Solutions', color: 'bg-blue-700' },
    legacyMigration: { label: 'Historical Migration Baseline', color: 'bg-slate-400' },
  };

  const products = Object.entries(projection.productBreakdown || {})
    .filter(([_, val]) => val > 0.5)
    .map(([key, val]) => ({
      key,
      label: PRODUCT_INFO_MAP[key]?.label || key.toUpperCase(),
      val,
      color: PRODUCT_INFO_MAP[key]?.color || 'bg-slate-600',
    }))
    .sort((a, b) => b.val - a.val);

  const productTotal = products.reduce((acc, p) => acc + p.val, 0) || 1;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {/* 1. Storage Architecture Tier Breakdown */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
        <div>
          <h4 className="text-sm font-semibold text-slate-900">
            Year {projection.year} Storage Architecture Breakdown
          </h4>
          <p className="text-xs text-slate-500">Distribution by physical storage mechanism</p>
        </div>

        {/* Stacked bar line */}
        <div className="w-full h-3 rounded-full overflow-hidden flex bg-slate-100">
          {tiers.map((t, idx) => {
            const pct = (t.val / total) * 100;
            if (pct <= 0) return null;
            return (
              <div
                key={idx}
                className={`${t.color} h-full transition-all duration-300`}
                style={{ width: `${pct}%` }}
                title={`${t.label}: ${Math.round(t.val)} GB (${Math.round(pct)}%)`}
              />
            );
          })}
        </div>

        {/* Legend table */}
        <div className="space-y-2 pt-1">
          {tiers.map((t, idx) => {
            const pct = Math.round((t.val / total) * 100);
            return (
              <div key={idx} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-xs ${t.color}`} />
                  <span className="text-slate-700">{t.label}</span>
                </div>
                <div className="flex items-center gap-2 font-mono tabular-nums">
                  <span className="font-semibold text-slate-900">{Math.round(t.val).toLocaleString()} GB</span>
                  <span className="text-slate-400 w-10 text-right">{pct}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Product Workload Contribution */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
        <div>
          <h4 className="text-sm font-semibold text-slate-900">
            Year {projection.year} Product Contribution
          </h4>
          <p className="text-xs text-slate-500">Storage consumed per active ServiceNow product module</p>
        </div>

        {/* Stacked bar line */}
        <div className="w-full h-3 rounded-full overflow-hidden flex bg-slate-100">
          {products.map((p, idx) => {
            const pct = (p.val / productTotal) * 100;
            return (
              <div
                key={idx}
                className={`${p.color} h-full transition-all duration-300`}
                style={{ width: `${pct}%` }}
                title={`${p.label}: ${Math.round(p.val)} GB (${Math.round(pct)}%)`}
              />
            );
          })}
        </div>

        {/* Legend table */}
        <div className="space-y-2 pt-1 max-h-48 overflow-y-auto">
          {products.map((p, idx) => {
            const pct = Math.round((p.val / productTotal) * 100);
            return (
              <div key={idx} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-xs ${p.color}`} />
                  <span className="text-slate-700">{p.label}</span>
                </div>
                <div className="flex items-center gap-2 font-mono tabular-nums">
                  <span className="font-semibold text-slate-900">{Math.round(p.val).toLocaleString()} GB</span>
                  <span className="text-slate-400 w-10 text-right">{pct}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
