import React, { useState } from 'react';
import {
  FileCheck2,
  Printer,
  Download,
  Upload,
  Copy,
  Check,
  ShieldCheck,
  Building2,
  Calendar,
  User,
  HardDrive,
  FileSpreadsheet,
  FileCode,
  ArrowLeft,
  FileDown,
  Loader2,
} from 'lucide-react';
import { buildInputProvenanceMatrix } from '../../utils/calculationEngine';
import {
  generateExecutiveMarkdown,
  generateLedgerCsv,
  triggerFileDownload,
} from '../../utils/exportUtils';
import { downloadForecastDocx } from '../../utils/docxExport';
import {
  CalculationResults,
  EngagementSetup,
  EnvironmentConfig,
  ProductWorkloads,
  TechnicalAssumptions,
} from '../../types/calculator';

interface Stage7EvidencePackProps {
  setup: EngagementSetup;
  workloads: ProductWorkloads;
  assumptions: TechnicalAssumptions;
  environments: EnvironmentConfig;
  results: CalculationResults;
  onImportJson: (imported: any) => void;
  onPrev: () => void;
}

export const Stage7EvidencePack: React.FC<Stage7EvidencePackProps> = ({
  setup,
  workloads,
  assumptions,
  environments,
  results,
  onImportJson,
  onPrev,
}) => {
  const [copied, setCopied] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [isDownloadingDocx, setIsDownloadingDocx] = useState(false);

  const provenanceRecords = buildInputProvenanceMatrix(setup, workloads, assumptions, environments);
  const y3 = results.yearlyProjections[Math.min(2, results.yearlyProjections.length - 1)];
  const isBreached = results.year3EntitlementGapGb > 0;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadDocx = async () => {
    try {
      setIsDownloadingDocx(true);
      await downloadForecastDocx(setup, workloads, assumptions, environments, results);
    } catch (err) {
      console.error('Failed to export DOCX:', err);
    } finally {
      setIsDownloadingDocx(false);
    }
  };

  const handleDownloadCsv = () => {
    const csv = generateLedgerCsv(setup, results);
    const filename = `ServiceNow_Storage_Sizing_${setup.clientName.replace(/\s+/g, '_')}_${setup.assessmentDate}.csv`;
    triggerFileDownload(csv, filename, 'text/csv');
  };

  const handleExportJson = () => {
    const archive = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      setup,
      workloads,
      assumptions,
      environments,
      results,
    };
    const jsonStr = JSON.stringify(archive, null, 2);
    const filename = `ServiceNow_Sizing_Assessment_${setup.clientName.replace(/\s+/g, '_')}.json`;
    triggerFileDownload(jsonStr, filename, 'application/json');
  };

  const handleCopyMarkdown = () => {
    const md = generateExecutiveMarkdown(setup, results);
    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setImportError(null);
      const parsed = JSON.parse(importJsonText);
      if (!parsed.setup || !parsed.workloads || !parsed.assumptions) {
        throw new Error('Invalid assessment schema. Missing required setup or workload fields.');
      }
      onImportJson(parsed);
      setShowImportModal(false);
      setImportJsonText('');
    } catch (err: any) {
      setImportError(err.message || 'Failed to parse JSON file.');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Stage Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 no-print">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 tracking-wider uppercase">
            <span>Stage 7 of 7</span>
            <span>·</span>
            <span>Module FR-07</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 mt-1">
            Traceable Evidence Pack & Assessment Export
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Audit-grade sizing report, mathematical input provenance matrix, and machine-readable data exports.
          </p>
        </div>

        {/* Action Buttons Bar */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleCopyMarkdown}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors whitespace-nowrap shadow-2xs"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy Summary'}</span>
          </button>

          <button
            onClick={handleDownloadDocx}
            disabled={isDownloadingDocx}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors whitespace-nowrap shadow-2xs disabled:opacity-50"
            title="Download complete Word document with embedded chart graphics and analysis"
          >
            {isDownloadingDocx ? (
              <Loader2 className="w-3.5 h-3.5 text-emerald-700 animate-spin" />
            ) : (
              <FileDown className="w-3.5 h-3.5 text-emerald-700" />
            )}
            <span>{isDownloadingDocx ? 'Generating DOCX...' : 'DOCX Report'}</span>
          </button>

          <button
            onClick={handleDownloadCsv}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors whitespace-nowrap shadow-2xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>CSV Ledger</span>
          </button>

          <button
            onClick={handleExportJson}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors whitespace-nowrap shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-indigo-600" />
            <span>JSON Archive</span>
          </button>

          <button
            onClick={() => setShowImportModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors whitespace-nowrap shadow-2xs"
          >
            <Upload className="w-3.5 h-3.5 text-slate-600" />
            <span>Import JSON</span>
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors whitespace-nowrap"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 no-print">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-900">Import Assessment JSON Archive</h3>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleImportSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Paste JSON Payload or Configuration
                </label>
                <textarea
                  rows={8}
                  required
                  value={importJsonText}
                  onChange={(e) => setImportJsonText(e.target.value)}
                  placeholder="Paste previously exported JSON assessment payload here..."
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800"
                />
              </div>

              {importError && (
                <div className="p-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded">
                  {importError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md shadow-xs"
                >
                  Load Assessment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Formal Printable Document Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-xs space-y-8 print:border-none print:shadow-none print:p-0">
        {/* Document Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <span className="text-[11px] font-mono tracking-widest text-emerald-700 uppercase font-semibold block">
              Official ServiceNow Sizing Evidence Document
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
              {setup.assessmentName}
            </h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 mt-2">
              <span className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <strong className="text-slate-800">Client:</strong> {setup.clientName}
              </span>
              <span>·</span>
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <strong className="text-slate-800">Assessor:</strong> {setup.assessorName}
              </span>
              <span>·</span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <strong className="text-slate-800">Date:</strong> {setup.assessmentDate}
              </span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-right shrink-0">
            <span className="text-[11px] text-slate-500 block">Assessment Rating</span>
            <div className="flex items-center justify-end gap-1.5 mt-0.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span className="text-base font-bold font-mono text-slate-900">
                {results.confidenceScore}% ({results.confidenceRating})
              </span>
            </div>
            <span className="text-[10px] text-slate-400 block font-mono">
              Horizon: {setup.planningHorizonYears} Years
            </span>
          </div>
        </div>

        {/* Executive Summary Narrative */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            1. Executive Sizing & Capacity Summary
          </h3>
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 leading-relaxed space-y-2">
            <p>
              This storage sizing assessment models multi-year instance growth for{' '}
              <strong className="text-slate-900">{setup.clientName}</strong> across a{' '}
              <strong className="text-slate-900">{setup.planningHorizonYears}-year planning horizon</strong>. Current licensed capacity under the ordering agreement provides{' '}
              <strong className="text-slate-900 font-mono">
                {setup.licensedEntitlementGb.toLocaleString()} GB ({(setup.licensedEntitlementGb / 1024).toFixed(1)} TB)
              </strong>.
            </p>
            <p>
              By <strong className="text-slate-900">Year 3</strong>, gross instance storage is projected to reach{' '}
              <strong className="text-slate-900 font-mono">
                {Math.round(results.year3GrossGb).toLocaleString()} GB
              </strong>{' '}
              ({Math.round((results.year3GrossGb / (setup.licensedEntitlementGb || 1)) * 100)}% utilization).{' '}
              {isBreached ? (
                <span className="text-rose-700 font-semibold">
                  A capacity shortfall of {Math.round(results.year3EntitlementGapGb)} GB is anticipated under current growth settings. Recommended actions include activating 24-month task archiving and sub-PROD attachment exclusions.
                </span>
              ) : (
                <span className="text-emerald-700 font-semibold">
                  Storage remains well within licensed capacity with {Math.round(setup.licensedEntitlementGb - results.year3GrossGb).toLocaleString()} GB ({Math.round(100 - (results.year3GrossGb / (setup.licensedEntitlementGb || 1)) * 100)}%) operational headroom remaining.
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Detailed 10-Year Sizing Ledger */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              2. Multi-Year Capacity Forecast Ledger (GB)
            </h3>
            <span className="text-xs text-slate-500 font-mono">Tabular Figures</span>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Horizon Year</th>
                  <th className="py-2.5 px-3 text-right">Relational DB</th>
                  <th className="py-2.5 px-3 text-right">Audit & Journals</th>
                  <th className="py-2.5 px-3 text-right">Attachments</th>
                  <th className="py-2.5 px-3 text-right">PROD Total</th>
                  <th className="py-2.5 px-3 text-right">Non-PROD Total</th>
                  <th className="py-2.5 px-3 text-right bg-slate-100 font-bold">Gross Consumed</th>
                  <th className="py-2.5 px-3 text-right">Entitlement</th>
                  <th className="py-2.5 px-3 text-right">Headroom</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono tabular-nums text-slate-800">
                {results.yearlyProjections.map((p) => {
                  const isY3 = p.year === 3;
                  return (
                    <tr
                      key={p.year}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isY3 ? 'bg-emerald-50/40 font-semibold' : ''
                      }`}
                    >
                      <td className="py-2 px-3 font-sans font-medium text-slate-900">
                        Year {p.year} {isY3 ? '(Benchmark)' : ''}
                      </td>
                      <td className="py-2 px-3 text-right">{Math.round(p.databaseGrossGb).toLocaleString()}</td>
                      <td className="py-2 px-3 text-right">{Math.round(p.auditGrossGb).toLocaleString()}</td>
                      <td className="py-2 px-3 text-right">{Math.round(p.attachmentGrossGb).toLocaleString()}</td>
                      <td className="py-2 px-3 text-right font-medium">{Math.round(p.prodTotalGb).toLocaleString()}</td>
                      <td className="py-2 px-3 text-right">{Math.round(p.nonProdTotalGb).toLocaleString()}</td>
                      <td className="py-2 px-3 text-right bg-slate-100/60 font-bold text-slate-950">
                        {Math.round(p.totalGrossGb).toLocaleString()}
                      </td>
                      <td className="py-2 px-3 text-right text-slate-600">
                        {p.entitlementGb.toLocaleString()}
                      </td>
                      <td
                        className={`py-2 px-3 text-right font-semibold ${
                          p.headroomGb < 0 ? 'text-rose-600' : 'text-emerald-700'
                        }`}
                      >
                        {Math.round(p.headroomGb).toLocaleString()}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span
                          className={`text-[10px] font-sans px-2 py-0.5 rounded font-medium ${
                            p.status === 'breach'
                              ? 'bg-rose-100 text-rose-800'
                              : p.status === 'warning'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {p.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Traceable Input Provenance Matrix */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              3. Traceable Input Provenance & Benchmark Matrix
            </h3>
            <span className="text-xs text-slate-500 font-mono">Full Audit Provenance</span>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Parameter / Input Variable</th>
                  <th className="py-2.5 px-3">Configured Value</th>
                  <th className="py-2.5 px-3">Input Provenance Source</th>
                  <th className="py-2.5 px-3">Authoritative Benchmark Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {provenanceRecords.map((r, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2 px-3 font-medium text-slate-900">{r.label}</td>
                    <td className="py-2 px-3 font-mono font-semibold tabular-nums text-slate-800">
                      {r.value}
                    </td>
                    <td className="py-2 px-3">
                      <span className="text-xs font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                        {r.source}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-slate-600 font-mono text-[11px]">{r.benchmarkRef}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Assessor Sign-Off Block */}
        <div className="pt-6 border-t border-slate-200 grid grid-cols-2 gap-8 text-xs text-slate-600">
          <div>
            <span className="block font-semibold text-slate-900 mb-1">Presales Technical Assessor:</span>
            <div className="h-10 border-b border-slate-300 flex items-end pb-1 font-mono text-slate-800">
              {setup.assessorName}
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Signature & Certification ID</span>
          </div>

          <div>
            <span className="block font-semibold text-slate-900 mb-1">Client Platform Acceptance:</span>
            <div className="h-10 border-b border-slate-300 flex items-end pb-1 font-mono text-slate-800">
              {setup.clientName} Architecture Review Board
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Capacity Review & Approval Date</span>
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-4 no-print">
        <button
          onClick={onPrev}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors whitespace-nowrap"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Scenarios</span>
        </button>

        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-colors whitespace-nowrap"
        >
          <Printer className="w-4 h-4" />
          <span>Print / Export PDF Evidence Pack</span>
        </button>
      </div>
    </div>
  );
};
