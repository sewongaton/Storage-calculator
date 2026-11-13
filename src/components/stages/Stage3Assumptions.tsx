import React, { useState, useRef } from 'react';
import {
  Sliders,
  RotateCcw,
  Clock,
  Paperclip,
  TrendingUp,
  Database,
  ArrowRight,
  ArrowLeft,
  FileArchive,
  Info,
  Upload,
  Download,
  CheckCircle2,
  Trash2,
  FileText,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { DEFAULT_RECORD_SIZES } from '../../constants/benchmarks';
import { TechnicalAssumptions } from '../../types/calculator';
import { triggerFileDownload } from '../../utils/exportUtils';

interface Stage3AssumptionsProps {
  assumptions: TechnicalAssumptions;
  onUpdateAssumptions: (patch: Partial<TechnicalAssumptions>) => void;
  onNext: () => void;
  onPrev: () => void;
}

export const Stage3Assumptions: React.FC<Stage3AssumptionsProps> = ({
  assumptions,
  onUpdateAssumptions,
  onNext,
  onPrev,
}) => {
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const rs = assumptions.recordSizes;

  const updateRecordSize = (key: keyof typeof rs, val: number) => {
    onUpdateAssumptions({
      recordSizes: {
        ...rs,
        [key]: Math.max(0.5, val),
      },
    });
  };

  const handleResetRecordSizes = () => {
    onUpdateAssumptions({
      recordSizes: { ...DEFAULT_RECORD_SIZES },
    });
  };

  // Download Sample JSON Template
  const handleDownloadSampleJson = () => {
    const sample = {
      profileName: 'Customer Production Empirical Profile 2026',
      attachmentRatePercent: 32,
      avgAttachmentsPerRecord: 1.45,
      avgAttachmentSizeKb: 920,
      extensionDistribution: {
        PDF: 42,
        'Screenshots / PNG': 34,
        'Office Docs': 14,
        'Logs / Diagnostic Text': 10,
      },
      notes: 'Sampled from 125,000 empirical ServiceNow task attachments.',
    };
    triggerFileDownload(
      JSON.stringify(sample, null, 2),
      'servicenow_attachment_profile_sample.json',
      'application/json'
    );
  };

  // Download Sample CSV Template
  const handleDownloadSampleCsv = () => {
    const csvContent = `parameter,value,description
attachmentRatePercent,32,Percentage of records with attachments
avgAttachmentsPerRecord,1.45,Average files per record
avgAttachmentSizeKb,920,Average file size in KB
pdfDistributionPercent,45,Percentage of attachments that are PDF
imagesDistributionPercent,35,Percentage of attachments that are images
officeDistributionPercent,12,Percentage of attachments that are Office files
logsDistributionPercent,8,Percentage of attachments that are log text files`;

    triggerFileDownload(
      csvContent,
      'servicenow_attachment_profile_sample.csv',
      'text/csv'
    );
  };

  // Parse Uploaded File (JSON or CSV)
  const processUploadedProfile = (text: string, filename: string) => {
    try {
      setUploadError(null);
      const isJson = filename.endsWith('.json') || text.trim().startsWith('{');

      if (isJson) {
        const parsed = JSON.parse(text);
        const rate = parseFloat(parsed.attachmentRatePercent);
        const count = parseFloat(parsed.avgAttachmentsPerRecord);
        const sizeKb = parseFloat(parsed.avgAttachmentSizeKb);

        if (isNaN(rate) || isNaN(count) || isNaN(sizeKb)) {
          throw new Error('JSON profile must contain numeric attachmentRatePercent, avgAttachmentsPerRecord, and avgAttachmentSizeKb.');
        }

        onUpdateAssumptions({
          attachmentRatePercent: Math.max(1, Math.min(100, Math.round(rate))),
          avgAttachmentsPerRecord: Math.max(0.1, Math.min(10, Math.round(count * 100) / 100)),
          avgAttachmentSizeKb: Math.max(10, Math.round(sizeKb)),
          uploadedAttachmentProfile: {
            profileName: parsed.profileName || filename.replace(/\.[^/.]+$/, ''),
            fileName: filename,
            uploadedAt: new Date().toISOString(),
            sourceType: 'JSON',
            extensionDistribution: parsed.extensionDistribution || undefined,
            notes: parsed.notes || undefined,
          },
        });
      } else {
        // Parse CSV
        const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
        const values: Record<string, number> = {};

        lines.forEach((line) => {
          const parts = line.split(',').map((p) => p.trim().replace(/^"|"$/g, ''));
          if (parts.length >= 2) {
            const key = parts[0];
            const num = parseFloat(parts[1]);
            if (!isNaN(num)) {
              values[key] = num;
            }
          }
        });

        const rate = values['attachmentRatePercent'] || 25;
        const count = values['avgAttachmentsPerRecord'] || 1.3;
        const sizeKb = values['avgAttachmentSizeKb'] || 850;

        const extDist: Record<string, number> = {};
        if (values['pdfDistributionPercent']) extDist['PDF'] = values['pdfDistributionPercent'];
        if (values['imagesDistributionPercent']) extDist['Images / PNG'] = values['imagesDistributionPercent'];
        if (values['officeDistributionPercent']) extDist['Office Docs'] = values['officeDistributionPercent'];
        if (values['logsDistributionPercent']) extDist['Diagnostic Logs'] = values['logsDistributionPercent'];

        onUpdateAssumptions({
          attachmentRatePercent: Math.max(1, Math.min(100, Math.round(rate))),
          avgAttachmentsPerRecord: Math.max(0.1, Math.min(10, Math.round(count * 100) / 100)),
          avgAttachmentSizeKb: Math.max(10, Math.round(sizeKb)),
          uploadedAttachmentProfile: {
            profileName: filename.replace(/\.[^/.]+$/, ''),
            fileName: filename,
            uploadedAt: new Date().toISOString(),
            sourceType: 'CSV',
            extensionDistribution: Object.keys(extDist).length > 0 ? extDist : undefined,
          },
        });
      }

      setShowUploadModal(false);
    } catch (err: any) {
      setUploadError(err.message || 'Failed to parse file. Please verify format.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      processUploadedProfile(content, file.name);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleResetProfile = () => {
    onUpdateAssumptions({
      attachmentRatePercent: 28,
      avgAttachmentsPerRecord: 1.35,
      avgAttachmentSizeKb: 850,
      uploadedAttachmentProfile: undefined,
    });
  };

  const uploadedProfile = assumptions.uploadedAttachmentProfile;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Stage Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 tracking-wider uppercase">
            <span>Stage 3 of 7</span>
            <span>·</span>
            <span>Module FR-03</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 mt-1">
            Technical Assumptions & Storage Benchmarks
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Configure physical table record sizes, audit factors, retention horizons, attachments profile upload, and migration seed.
          </p>
        </div>

        <button
          onClick={handleResetRecordSizes}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-md transition-colors whitespace-nowrap self-start sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset to Benchmarks</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Data Retention & Archiving Policies */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 pb-2 border-b border-slate-100">
            <Clock className="w-4 h-4 text-emerald-600" />
            <span>Data Archiving & Retention Lifecycles</span>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-slate-700">
                  Transactional Active Table Retention (sys_archive)
                </label>
                <span className="text-xs font-mono font-semibold text-slate-900">
                  {assumptions.activeRetentionMonths} Months ({(assumptions.activeRetentionMonths / 12).toFixed(1)} Yrs)
                </span>
              </div>
              <input
                type="range"
                min="12"
                max="60"
                step="6"
                value={assumptions.activeRetentionMonths}
                onChange={(e) =>
                  onUpdateAssumptions({ activeRetentionMonths: parseInt(e.target.value) || 36 })
                }
                className="w-full accent-emerald-600 cursor-pointer"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Records older than this horizon move to archive tables, preventing active database index degradation.
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-slate-700">
                  Audit History Retention (sys_audit)
                </label>
                <span className="text-xs font-mono font-semibold text-slate-900">
                  {assumptions.auditRetentionMonths} Months
                </span>
              </div>
              <input
                type="range"
                min="6"
                max="48"
                step="6"
                value={assumptions.auditRetentionMonths}
                onChange={(e) =>
                  onUpdateAssumptions({ auditRetentionMonths: parseInt(e.target.value) || 24 })
                }
                className="w-full accent-emerald-600 cursor-pointer"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Rotates audit log rows into archive history. Recommended: 12–24 months.
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-slate-700">
                  ITOM Raw Event Retention Window (em_event)
                </label>
                <span className="text-xs font-mono font-semibold text-slate-900">
                  {assumptions.eventRetentionDays} Days
                </span>
              </div>
              <input
                type="range"
                min="7"
                max="60"
                step="7"
                value={assumptions.eventRetentionDays}
                onChange={(e) =>
                  onUpdateAssumptions({ eventRetentionDays: parseInt(e.target.value) || 14 })
                }
                className="w-full accent-emerald-600 cursor-pointer"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Raw incoming event retention before rollup into aggregated alert history.
              </p>
            </div>
          </div>
        </div>

        {/* Card 2: Growth & Audit Factors */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 pb-2 border-b border-slate-100">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <span>Growth & Audit Multipliers</span>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-slate-700">
                  Annual Compound Growth Rate (CAGR)
                </label>
                <span className="text-xs font-mono font-semibold text-emerald-700">
                  {(assumptions.annualGrowthRate * 100).toFixed(0)}% / year
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="0.35"
                step="0.01"
                value={assumptions.annualGrowthRate}
                onChange={(e) =>
                  onUpdateAssumptions({ annualGrowthRate: parseFloat(e.target.value) || 0.15 })
                }
                className="w-full accent-emerald-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-0.5">
                <span>0% (Flat)</span>
                <span>15% (Typical Enterprise)</span>
                <span>35% (High Growth)</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-slate-700">
                  sys_audit & Journal Overhead Factor
                </label>
                <span className="text-xs font-mono font-semibold text-slate-900">
                  {assumptions.auditFactorPercent}%
                </span>
              </div>
              <input
                type="range"
                min="15"
                max="80"
                step="5"
                value={assumptions.auditFactorPercent}
                onChange={(e) =>
                  onUpdateAssumptions({ auditFactorPercent: parseInt(e.target.value) || 45 })
                }
                className="w-full accent-emerald-600 cursor-pointer"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Database overhead added by state changes, work notes, and sys_audit history lines.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Card 3: Attachment Storage Architecture & Profile Upload */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Paperclip className="w-4 h-4 text-emerald-600" />
            <span>Attachment Storage Profile (sys_attachment & sys_attachment_doc)</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowUploadModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md shadow-2xs transition-colors whitespace-nowrap"
            >
              <Upload className="w-3.5 h-3.5 text-emerald-400" />
              <span>Upload Storage Profile</span>
            </button>

            <div className="relative group">
              <button
                type="button"
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                title="Download Template"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Template</span>
              </button>
              <div className="absolute right-0 top-full mt-1 hidden group-hover:flex flex-col bg-white border border-slate-200 rounded-lg shadow-lg z-20 py-1 min-w-[140px]">
                <button
                  type="button"
                  onClick={handleDownloadSampleJson}
                  className="px-3 py-1.5 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5 text-emerald-600" />
                  <span>JSON Template</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadSampleCsv}
                  className="px-3 py-1.5 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" />
                  <span>CSV Template</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Display Uploaded Profile Banner if active */}
        {uploadedProfile ? (
          <div className="p-3.5 bg-emerald-50/70 border border-emerald-300 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-xs font-bold text-emerald-900">
                  Custom Empirical Profile Active: {uploadedProfile.profileName}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded">
                  {uploadedProfile.sourceType}
                </span>
              </div>
              <button
                type="button"
                onClick={handleResetProfile}
                className="text-xs text-slate-500 hover:text-rose-600 font-medium inline-flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                <span>Remove Profile</span>
              </button>
            </div>

            {uploadedProfile.extensionDistribution && (
              <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-600">
                <span className="font-medium text-slate-700">Extension Breakdown:</span>
                {Object.entries(uploadedProfile.extensionDistribution).map(([ext, pct]) => (
                  <span
                    key={ext}
                    className="px-2 py-0.5 bg-white border border-emerald-200 rounded font-mono text-[11px] text-slate-800"
                  >
                    {ext}: {pct}%
                  </span>
                ))}
              </div>
            )}
            {uploadedProfile.notes && (
              <p className="text-[11px] text-emerald-800 italic">{uploadedProfile.notes}</p>
            )}
          </div>
        ) : null}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Attachment Rate (% of records)
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                max="90"
                value={assumptions.attachmentRatePercent}
                onChange={(e) =>
                  onUpdateAssumptions({
                    attachmentRatePercent: Math.max(1, Math.min(90, parseInt(e.target.value) || 25)),
                  })
                }
                className="w-full pl-3 pr-10 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md font-mono tabular-nums"
              />
              <span className="absolute right-3 top-2 text-xs text-slate-400 font-mono">%</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Percentage of tickets carrying at least one document or screenshot.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Average Files Per Ticket
            </label>
            <input
              type="number"
              step="0.05"
              min="0.5"
              max="10.0"
              value={assumptions.avgAttachmentsPerRecord}
              onChange={(e) =>
                onUpdateAssumptions({
                  avgAttachmentsPerRecord: Math.max(0.1, parseFloat(e.target.value) || 1.3),
                })
              }
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md font-mono tabular-nums"
            />
            <p className="text-[11px] text-slate-500 mt-1">Average attachments attached when present.</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Average File Size (KB)
            </label>
            <div className="relative">
              <input
                type="number"
                step="50"
                min="50"
                max="25000"
                value={assumptions.avgAttachmentSizeKb}
                onChange={(e) =>
                  onUpdateAssumptions({
                    avgAttachmentSizeKb: Math.max(50, parseInt(e.target.value) || 850),
                  })
                }
                className="w-full pl-3 pr-10 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md font-mono tabular-nums"
              />
              <span className="absolute right-3 top-2 text-xs text-slate-400 font-mono">KB</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Average size ({Math.round((assumptions.avgAttachmentSizeKb / 1024) * 10) / 10} MB). Stored in 4 KB chunks.
            </p>
          </div>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,.csv"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Upload Modal Dialog */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Upload className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Upload Empirical Attachment Storage Profile
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Upload customer empirical telemetry from production ServiceNow instance tables (<code className="font-mono text-slate-800">sys_attachment</code> / <code className="font-mono text-slate-800">sys_attachment_doc</code>) to calibrate real attachment rates, average file sizes, and extension breakdown.
            </p>

            {/* Dropzone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-xl p-8 text-center cursor-pointer bg-slate-50 hover:bg-emerald-50/30 transition-all space-y-2"
            >
              <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center mx-auto text-slate-600">
                <Upload className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="text-xs font-semibold text-slate-900">
                Click to browse or drop attachment profile
              </div>
              <p className="text-[11px] text-slate-500">Supports .JSON and .CSV profile files</p>
            </div>

            {uploadError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{uploadError}</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={handleDownloadSampleJson}
                  className="text-emerald-700 hover:underline"
                >
                  Download JSON Template
                </button>
                <span>·</span>
                <button
                  type="button"
                  onClick={handleDownloadSampleCsv}
                  className="text-blue-700 hover:underline"
                >
                  Download CSV
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-md"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Card 4: Benchmark Record Sizes (KB) */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Database className="w-4 h-4 text-emerald-600" />
            <span>Physical Record Size Calibration (KB / Record)</span>
          </div>
          <span className="text-[11px] text-slate-500">ServiceNow Schema Specifications</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {[
            { key: 'incidentKb', label: 'Incident (KB)' },
            { key: 'requestKb', label: 'Request Item (KB)' },
            { key: 'changeKb', label: 'Change Request (KB)' },
            { key: 'problemKb', label: 'Problem Record (KB)' },
            { key: 'cmdbCiKb', label: 'CMDB CI (KB)' },
            { key: 'itomEventKb', label: 'Raw Event (KB)' },
            { key: 'csmCaseKb', label: 'CSM Case (KB)' },
            { key: 'hrCaseKb', label: 'HR Case (KB)' },
            { key: 'secIncidentKb', label: 'Sec Incident (KB)' },
            { key: 'vulnItemKb', label: 'Vuln Item (KB)' },
            { key: 'customRecordKb', label: 'Custom Record (KB)' },
          ].map((item) => (
            <div key={item.key} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
              <label className="block text-[11px] font-medium text-slate-600 truncate mb-1">
                {item.label}
              </label>
              <input
                type="number"
                step="0.5"
                min="1"
                value={rs[item.key as keyof typeof rs]}
                onChange={(e) =>
                  updateRecordSize(item.key as keyof typeof rs, parseFloat(e.target.value) || 5)
                }
                className="w-full px-2 py-1 text-xs bg-white border border-slate-200 rounded font-mono tabular-nums text-right"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Card 5: Legacy Historical Migration Seed */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 pb-2 border-b border-slate-100">
          <FileArchive className="w-4 h-4 text-emerald-600" />
          <span>Historical Migration Data Seed (Day-1 Baseline)</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Historical Legacy Records Imported
            </label>
            <input
              type="number"
              min="0"
              value={assumptions.legacyRecords}
              onChange={(e) =>
                onUpdateAssumptions({ legacyRecords: Math.max(0, parseInt(e.target.value) || 0) })
              }
              placeholder="e.g. 500000"
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md font-mono tabular-nums"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Tickets migrated from Remedy, Jira, or prior instances.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Historical Attachment Volume (GB)
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                value={assumptions.legacyAttachmentGb}
                onChange={(e) =>
                  onUpdateAssumptions({
                    legacyAttachmentGb: Math.max(0, parseInt(e.target.value) || 0),
                  })
                }
                placeholder="e.g. 200"
                className="w-full pl-3 pr-10 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md font-mono tabular-nums"
              />
              <span className="absolute right-3 top-2 text-xs text-slate-400 font-mono">GB</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-4">
        <button
          onClick={onPrev}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors whitespace-nowrap"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Workloads</span>
        </button>

        <button
          onClick={onNext}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-colors whitespace-nowrap"
        >
          <span>Continue to Environments</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
