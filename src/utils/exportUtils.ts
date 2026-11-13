import { CalculationResults, EngagementSetup, Scenario } from '../types/calculator';

/**
 * Generates CSV string of the Sizing Ledger and Workload Summary
 */
export function generateLedgerCsv(
  setup: EngagementSetup,
  results: CalculationResults
): string {
  const rows: string[] = [];

  rows.push(`"ServiceNow Storage Sizing Calculator - Assessment Ledger"`);
  rows.push(`"Assessment Name","${setup.assessmentName}"`);
  rows.push(`"Client","${setup.clientName}"`);
  rows.push(`"Assessor","${setup.assessorName}"`);
  rows.push(`"Assessment Date","${setup.assessmentDate}"`);
  rows.push(`"Licensed Entitlement (GB)","${setup.licensedEntitlementGb}"`);
  rows.push(`"Target Buffer (%)","${setup.targetBufferPercent}%"`);
  rows.push('');

  // Table headers
  rows.push(
    [
      '"Year"',
      '"Primary Database (GB)"',
      '"Audit & Journal (GB)"',
      '"Attachments (GB)"',
      '"PROD Total (GB)"',
      '"Non-PROD Total (GB)"',
      '"Total Gross Storage (GB)"',
      '"Licensed Entitlement (GB)"',
      '"Available Headroom (GB)"',
      '"Utilization (%)"',
      '"Capacity Status"',
    ].join(',')
  );

  results.yearlyProjections.forEach((p) => {
    rows.push(
      [
        `"Year ${p.year}"`,
        Math.round(p.databaseGrossGb),
        Math.round(p.auditGrossGb),
        Math.round(p.attachmentGrossGb),
        Math.round(p.prodTotalGb),
        Math.round(p.nonProdTotalGb),
        Math.round(p.totalGrossGb),
        p.entitlementGb,
        Math.round(p.headroomGb),
        `${Math.round(p.utilizationPercent)}%`,
        `"${p.status.toUpperCase()}"`,
      ].join(',')
    );
  });

  return rows.join('\n');
}

/**
 * Downloads a file to client's browser
 */
export function triggerFileDownload(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Generates an executive Markdown summary for copy-paste
 */
export function generateExecutiveMarkdown(
  setup: EngagementSetup,
  results: CalculationResults
): string {
  const y3 = results.yearlyProjections[Math.min(2, results.yearlyProjections.length - 1)];
  const horizon = results.yearlyProjections[results.yearlyProjections.length - 1];

  return `# ServiceNow Storage Capacity Assessment Summary

**Client:** ${setup.clientName}  
**Assessment:** ${setup.assessmentName}  
**Assessor:** ${setup.assessorName}  
**Date:** ${setup.assessmentDate}  
**Planning Horizon:** ${setup.planningHorizonYears} Years  
**Licensed Entitlement:** ${setup.licensedEntitlementGb.toLocaleString()} GB (${(setup.licensedEntitlementGb / 1024).toFixed(1)} TB)  

---

### Key Capacity Milestones
- **Year 1 Consumption:** ${Math.round(results.year1GrossGb).toLocaleString()} GB (${Math.round((results.year1GrossGb / setup.licensedEntitlementGb) * 100)}% entitlement)
- **Year 3 Consumption:** ${Math.round(y3.totalGrossGb).toLocaleString()} GB (${Math.round(y3.utilizationPercent)}% entitlement)
- **Horizon (Year ${horizon.year}) Consumption:** ${Math.round(horizon.totalGrossGb).toLocaleString()} GB (${Math.round(horizon.utilizationPercent)}% entitlement)
- **Capacity Status:** ${results.year3EntitlementGapGb > 0 ? `🚨 Deficit of ${Math.round(results.year3EntitlementGapGb)} GB by Year 3` : '✅ Within licensed capacity tier through Year 3'}
- **Confidence Rating:** ${results.confidenceRating} (${results.confidenceScore}/100)

### Year 3 Storage Composition Breakdown
- **Relational Database:** ${Math.round(y3.databaseGrossGb).toLocaleString()} GB
- **Audit & Journal Logs (sys_audit):** ${Math.round(y3.auditGrossGb).toLocaleString()} GB
- **Attachment Chunks (sys_attachment_doc):** ${Math.round(y3.attachmentGrossGb).toLocaleString()} GB
- **Non-Production Environments:** ${Math.round(y3.nonProdTotalGb).toLocaleString()} GB

### Presales Architectural Recommendations
1. Maintain attachment clone exclusions on lower environments (DEV, TEST, QA) to avoid duplicating high-volume document chunks.
2. Institute automated ServiceNow Data Archiving (sys_archive) for closed incident/task tables at 24–36 months.
3. Review ITOM event management retention thresholds to ensure raw events roll off after 14 days.
`;
}
