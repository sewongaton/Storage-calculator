import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
  ImageRun,
  HeadingLevel,
} from 'docx';
import {
  CalculationResults,
  EngagementSetup,
  EnvironmentConfig,
  ProductWorkloads,
  TechnicalAssumptions,
  YearlyProjection,
} from '../types/calculator';
import { INDUSTRY_LABELS } from '../constants/benchmarks';

/**
 * Renders the multi-year stacked storage growth chart to a PNG ArrayBuffer using HTML5 Canvas
 */
export async function renderForecastChartPng(
  projections: YearlyProjection[],
  entitlementGb: number,
  targetBufferPercent: number
): Promise<Uint8Array> {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 540;
  const ctx = canvas.getContext('2d')!;

  // Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Outer border
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 2;
  ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

  // Title & Subtitle
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
  ctx.fillText('Multi-Year Instance Storage Growth & Entitlement Threshold', 40, 50);

  ctx.fillStyle = '#64748b';
  ctx.font = '14px system-ui, -apple-system, sans-serif';
  ctx.fillText('Gross storage across Database, Audit logs, Attachments, and Non-PROD replication', 40, 74);

  // Legend at top right
  const legends = [
    { label: 'Database', color: '#059669' },
    { label: 'Audit / Journals', color: '#14b8a6' },
    { label: 'Attachments', color: '#f59e0b' },
    { label: 'Non-PROD', color: '#6366f1' },
    { label: 'Entitlement', color: '#ef4444', isDashed: true },
  ];

  let legendX = 40;
  const legendY = 105;
  legends.forEach((item) => {
    if (item.isDashed) {
      ctx.strokeStyle = item.color;
      ctx.lineWidth = 3;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(legendX, legendY - 5);
      ctx.lineTo(legendX + 20, legendY - 5);
      ctx.stroke();
      ctx.setLineDash([]);
    } else {
      ctx.fillStyle = item.color;
      ctx.fillRect(legendX, legendY - 12, 14, 14);
    }
    ctx.fillStyle = '#334155';
    ctx.font = '13px system-ui, -apple-system, sans-serif';
    ctx.fillText(item.label, legendX + 26, legendY);
    legendX += ctx.measureText(item.label).width + 50;
  });

  // Chart area coordinates
  const paddingLeft = 100;
  const paddingRight = 60;
  const paddingTop = 140;
  const paddingBottom = 70;
  const chartWidth = canvas.width - paddingLeft - paddingRight;
  const chartHeight = canvas.height - paddingTop - paddingBottom;

  const maxGrossGb = Math.max(...projections.map((p) => p.totalGrossGb));
  const chartMax = Math.max(entitlementGb * 1.15, maxGrossGb * 1.15);

  const getY = (valGb: number) => {
    return paddingTop + chartHeight - (valGb / chartMax) * chartHeight;
  };

  // Horizontal grid lines
  const steps = [0, 0.25, 0.5, 0.75, 1.0];
  ctx.lineWidth = 1;
  ctx.strokeStyle = '#f1f5f9';
  ctx.fillStyle = '#94a3b8';
  ctx.font = '12px monospace';

  steps.forEach((ratio) => {
    const val = chartMax * ratio;
    const y = getY(val);
    ctx.beginPath();
    ctx.moveTo(paddingLeft, y);
    ctx.lineTo(canvas.width - paddingRight, y);
    ctx.stroke();

    ctx.fillText(`${Math.round(val).toLocaleString()} GB`, paddingLeft - 85, y + 4);
  });

  // Warning threshold line (80%)
  const warningGb = entitlementGb * (1 - targetBufferPercent / 100);
  const warnY = getY(warningGb);
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(paddingLeft, warnY);
  ctx.lineTo(canvas.width - paddingRight, warnY);
  ctx.stroke();
  ctx.setLineDash([]);

  // Entitlement threshold line
  const entY = getY(entitlementGb);
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 2.5;
  ctx.setLineDash([8, 5]);
  ctx.beginPath();
  ctx.moveTo(paddingLeft, entY);
  ctx.lineTo(canvas.width - paddingRight, entY);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = '#dc2626';
  ctx.font = 'bold 12px monospace';
  ctx.fillText(`Licensed Entitlement: ${entitlementGb.toLocaleString()} GB`, canvas.width - paddingRight - 220, entY - 8);

  // Draw Stacked Bars for each projection year
  const numYears = projections.length;
  const stepX = chartWidth / numYears;
  const barWidth = Math.min(80, stepX - 30);

  projections.forEach((p, idx) => {
    const centerX = paddingLeft + idx * stepX + stepX / 2;
    const x = centerX - barWidth / 2;

    const dbHeight = (p.databaseGrossGb / chartMax) * chartHeight;
    const auditHeight = (p.auditGrossGb / chartMax) * chartHeight;
    const attHeight = (p.attachmentGrossGb / chartMax) * chartHeight;
    const npHeight = (p.nonProdTotalGb / chartMax) * chartHeight;

    let curY = paddingTop + chartHeight;

    // 1. Relational DB
    curY -= dbHeight;
    ctx.fillStyle = '#059669';
    ctx.fillRect(x, curY, barWidth, dbHeight);

    // 2. Audit
    curY -= auditHeight;
    ctx.fillStyle = '#14b8a6';
    ctx.fillRect(x, curY, barWidth, auditHeight);

    // 3. Attachments
    curY -= attHeight;
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(x, curY, barWidth, attHeight);

    // 4. Non-PROD
    curY -= npHeight;
    ctx.fillStyle = '#6366f1';
    ctx.fillRect(x, curY, barWidth, npHeight);

    // Year Label
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 14px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`Year ${p.year}`, centerX, canvas.height - 35);

    // Value text on top
    ctx.font = 'bold 12px monospace';
    ctx.fillStyle = p.totalGrossGb > entitlementGb ? '#dc2626' : '#334155';
    ctx.fillText(`${Math.round(p.totalGrossGb).toLocaleString()} GB`, centerX, curY - 8);
    ctx.textAlign = 'left';
  });

  const blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), 'image/png'));
  const arrayBuffer = await blob.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

/**
 * Renders the Storage Architecture Tier & Product Breakdown to a PNG ArrayBuffer
 */
export async function renderCompositionChartPng(y3: YearlyProjection): Promise<Uint8Array> {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 360;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 2;
  ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

  // Title
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 20px system-ui, -apple-system, sans-serif';
  ctx.fillText(`Year ${y3.year} Storage Architecture & Workload Breakdown`, 40, 48);

  const total = y3.totalGrossGb || 1;
  const tiers = [
    { label: 'Relational Database', val: y3.databaseGrossGb, color: '#059669' },
    { label: 'Audit & Journal History', val: y3.auditGrossGb, color: '#14b8a6' },
    { label: 'Attachments (sys_attachment_doc)', val: y3.attachmentGrossGb, color: '#f59e0b' },
    { label: 'Non-PROD Replication', val: y3.nonProdTotalGb, color: '#6366f1' },
  ];

  // Draw Horizontal Stacked Bar
  const barX = 40;
  const barY = 90;
  const barW = canvas.width - 80;
  const barH = 34;

  let curX = barX;
  tiers.forEach((t) => {
    const segW = (t.val / total) * barW;
    ctx.fillStyle = t.color;
    ctx.fillRect(curX, barY, segW, barH);
    curX += segW;
  });

  // Legend rows for tiers
  let itemX = 40;
  let itemY = 165;
  tiers.forEach((t) => {
    const pct = Math.round((t.val / total) * 100);
    ctx.fillStyle = t.color;
    ctx.fillRect(itemX, itemY - 14, 16, 16);

    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
    ctx.fillText(`${t.label}: `, itemX + 26, itemY);

    ctx.font = '13px monospace';
    ctx.fillStyle = '#475569';
    const valText = `${Math.round(t.val).toLocaleString()} GB (${pct}%)`;
    ctx.fillText(valText, itemX + 26 + ctx.measureText(`${t.label}: `).width, itemY);

    itemX += 280;
    if (itemX > canvas.width - 200) {
      itemX = 40;
      itemY += 35;
    }
  });

  // Product modules breakdown
  const pb = y3.productBreakdown || {};
  const PRODUCT_LABEL_MAP: Record<string, { label: string; color: string }> = {
    itsm: { label: 'ITSM Core', color: '#2563eb' },
    itom: { label: 'ITOM Discovery & Events', color: '#0891b2' },
    itam: { label: 'IT Asset Mgmt (ITAM)', color: '#4f46e5' },
    spm: { label: 'Strategic Portfolio (SPM)', color: '#9333ea' },
    irm: { label: 'Integrated Risk (IRM)', color: '#059669' },
    secops: { label: 'Security Ops & Vuln', color: '#e11d48' },
    csm: { label: 'Customer Service (CSM)', color: '#0d9488' },
    fsm: { label: 'Field Service (FSM)', color: '#d97706' },
    hrsd: { label: 'HR Service Delivery', color: '#db2777' },
    wsd: { label: 'Workplace Service (WSD)', color: '#047857' },
    lsd: { label: 'Legal Service (LSD)', color: '#7c3aed' },
    psm: { label: 'Procurement (PSM)', color: '#0284c7' },
    customApps: { label: 'App Engine Custom', color: '#ea580c' },
    automationEngine: { label: 'Automation & RPA', color: '#f59e0b' },
    industrySolutions: { label: 'Industry Vertical', color: '#1d4ed8' },
  };

  const products = Object.entries(pb)
    .filter(([k, val]) => (val as number) > 0.5 && k !== 'legacyMigration')
    .map(([k, val]) => ({
      label: PRODUCT_LABEL_MAP[k]?.label || k.toUpperCase(),
      val: val as number,
      color: PRODUCT_LABEL_MAP[k]?.color || '#475569',
    }))
    .sort((a, b) => b.val - a.val);

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 15px system-ui, -apple-system, sans-serif';
  ctx.fillText('Active Product Volume Contribution:', 40, 245);

  let pX = 40;
  let pY = 280;
  products.forEach((p) => {
    ctx.fillStyle = p.color;
    ctx.fillRect(pX, pY - 12, 12, 12);

    ctx.fillStyle = '#334155';
    ctx.font = '12px system-ui, -apple-system, sans-serif';
    const txt = `${p.label}: ${Math.round(p.val).toLocaleString()} GB`;
    ctx.fillText(txt, pX + 18, pY);

    pX += ctx.measureText(txt).width + 45;
    if (pX > canvas.width - 150) {
      pX = 40;
      pY += 30;
    }
  });

  const blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), 'image/png'));
  const arrayBuffer = await blob.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

/**
 * Generates and downloads a complete Microsoft Word (.docx) document
 * containing executive summaries, multi-year forecast tables, sensitivity matrices,
 * and high-resolution embedded chart graphics.
 */
export async function downloadForecastDocx(
  setup: EngagementSetup,
  workloads: ProductWorkloads,
  assumptions: TechnicalAssumptions,
  environments: EnvironmentConfig,
  results: CalculationResults
): Promise<void> {
  const y3 = results.yearlyProjections[Math.min(2, results.yearlyProjections.length - 1)];
  const horizon = results.yearlyProjections[results.yearlyProjections.length - 1];
  const isBreached = results.year3EntitlementGapGb > 0;

  // 1. Generate chart images
  const chartImageBytes = await renderForecastChartPng(
    results.yearlyProjections,
    setup.licensedEntitlementGb,
    setup.targetBufferPercent
  );

  const compositionImageBytes = await renderCompositionChartPng(y3);

  // Helper for table cells
  const makeCell = (
    text: string,
    isHeader = false,
    align: 'left' | 'right' | 'center' = 'left',
    bold = false,
    bgColor?: string
  ) => {
    return new TableCell({
      shading: bgColor ? { fill: bgColor } : isHeader ? { fill: 'F1F5F9' } : undefined,
      children: [
        new Paragraph({
          alignment:
            align === 'right'
              ? AlignmentType.RIGHT
              : align === 'center'
              ? AlignmentType.CENTER
              : AlignmentType.LEFT,
          children: [
            new TextRun({
              text,
              bold: isHeader || bold,
              size: 18, // 9pt
              font: isHeader || !align ? 'Calibri' : 'Consolas',
              color: isHeader ? '0F172A' : '1E293B',
            }),
          ],
        }),
      ],
    });
  };

  // 2. Build Multi-Year Forecast Ledger Table
  const ledgerHeaderRow = new TableRow({
    tableHeader: true,
    children: [
      makeCell('Year', true, 'left'),
      makeCell('Database (GB)', true, 'right'),
      makeCell('Audit / Journals', true, 'right'),
      makeCell('Attachments', true, 'right'),
      makeCell('PROD Total', true, 'right'),
      makeCell('Non-PROD Total', true, 'right'),
      makeCell('Gross Consumed', true, 'right'),
      makeCell('Entitlement', true, 'right'),
      makeCell('Headroom', true, 'right'),
      makeCell('Utilization', true, 'center'),
      makeCell('Status', true, 'center'),
    ],
  });

  const ledgerDataRows = results.yearlyProjections.map((p) => {
    const isY3 = p.year === 3;
    const rowBg = isY3 ? 'ECFDF5' : undefined;
    return new TableRow({
      children: [
        makeCell(`Year ${p.year}`, false, 'left', isY3, rowBg),
        makeCell(Math.round(p.databaseGrossGb).toLocaleString(), false, 'right', false, rowBg),
        makeCell(Math.round(p.auditGrossGb).toLocaleString(), false, 'right', false, rowBg),
        makeCell(Math.round(p.attachmentGrossGb).toLocaleString(), false, 'right', false, rowBg),
        makeCell(Math.round(p.prodTotalGb).toLocaleString(), false, 'right', false, rowBg),
        makeCell(Math.round(p.nonProdTotalGb).toLocaleString(), false, 'right', false, rowBg),
        makeCell(Math.round(p.totalGrossGb).toLocaleString(), false, 'right', true, isY3 ? 'D1FAE5' : 'F8FAFC'),
        makeCell(p.entitlementGb.toLocaleString(), false, 'right', false, rowBg),
        makeCell(Math.round(p.headroomGb).toLocaleString(), false, 'right', false, rowBg),
        makeCell(`${Math.round(p.utilizationPercent)}%`, false, 'center', false, rowBg),
        makeCell(p.status.toUpperCase(), false, 'center', true, rowBg),
      ],
    });
  });

  const forecastTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [ledgerHeaderRow, ...ledgerDataRows],
  });

  // 3. Build Sensitivity Matrix Table
  const sensitivityHeader = new TableRow({
    tableHeader: true,
    children: [
      makeCell('Sensitivity Parameter', true, 'left'),
      makeCell('What-If Scenario', true, 'left'),
      makeCell('Projected Year 3 (GB)', true, 'right'),
      makeCell('Projected Horizon (GB)', true, 'right'),
      makeCell('Delta vs Baseline (GB)', true, 'right'),
      makeCell('Impact %', true, 'right'),
    ],
  });

  const sensitivityRows = results.sensitivityAnalysis.map((item) => {
    const isPos = item.deltaGb > 0;
    return new TableRow({
      children: [
        makeCell(item.parameter, false, 'left'),
        makeCell(item.scenarioLabel, false, 'left'),
        makeCell(item.projectedYear3Gb.toLocaleString(), false, 'right'),
        makeCell(item.projectedHorizonGb.toLocaleString(), false, 'right'),
        makeCell(isPos ? `+${item.deltaGb.toLocaleString()}` : `${item.deltaGb.toLocaleString()}`, false, 'right', true),
        makeCell(isPos ? `+${item.deltaPercent}%` : `${item.deltaPercent}%`, false, 'right'),
      ],
    });
  });

  const sensitivityTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [sensitivityHeader, ...sensitivityRows],
  });

  // 4. Build Document Object
  const doc = new Document({
    title: `ServiceNow Capacity Forecasting Report - ${setup.clientName}`,
    description: 'Enterprise ServiceNow storage sizing forecast, entitlement gap analytics, and architectural recommendations',
    sections: [
      {
        properties: {},
        children: [
          // Header / Title
          new Paragraph({
            text: 'ServiceNow Instance Storage Sizing & Capacity Forecast',
            heading: HeadingLevel.TITLE,
            spacing: { after: 120 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `${setup.assessmentName} | Official Architecture Evidence Report`,
                bold: true,
                size: 22,
                color: '059669',
              }),
            ],
            spacing: { after: 200 },
          }),

          // Metadata Table
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  makeCell('Client Organization:', true),
                  makeCell(setup.clientName),
                  makeCell('Technical Assessor:', true),
                  makeCell(setup.assessorName),
                ],
              }),
              new TableRow({
                children: [
                  makeCell('Assessment Date:', true),
                  makeCell(setup.assessmentDate),
                  makeCell('Planning Horizon:', true),
                  makeCell(`${setup.planningHorizonYears} Years`),
                ],
              }),
              new TableRow({
                children: [
                  makeCell('Industry Vertical:', true),
                  makeCell(INDUSTRY_LABELS[setup.industryVertical] || setup.industryVertical),
                  makeCell('Assessment Type:', true),
                  makeCell(setup.assessmentType.replace('_', ' ').toUpperCase()),
                ],
              }),
              new TableRow({
                children: [
                  makeCell('Licensed Entitlement:', true),
                  makeCell(`${setup.licensedEntitlementGb.toLocaleString()} GB (${(setup.licensedEntitlementGb / 1024).toFixed(1)} TB)`),
                  makeCell('Target Buffer Headroom:', true),
                  makeCell(`${setup.targetBufferPercent}%`),
                ],
              }),
            ],
          }),

          new Paragraph({ text: '', spacing: { after: 200 } }),

          // Executive Summary Section
          new Paragraph({
            text: '1. Executive Capacity Verdict & Key Milestones',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 200, after: 120 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `By Year 3, gross instance storage consumption is projected to reach `,
              }),
              new TextRun({
                text: `${Math.round(results.year3GrossGb).toLocaleString()} GB`,
                bold: true,
              }),
              new TextRun({
                text: ` representing `,
              }),
              new TextRun({
                text: `${Math.round(y3.utilizationPercent)}% `,
                bold: true,
              }),
              new TextRun({
                text: `of the licensed entitlement ceiling (${setup.licensedEntitlementGb.toLocaleString()} GB). `,
              }),
              new TextRun({
                text: isBreached
                  ? `An entitlement shortfall of ${Math.round(results.year3EntitlementGapGb)} GB is anticipated under current growth assumptions.`
                  : `Storage remains comfortably within licensed entitlement boundaries with ${Math.round(setup.licensedEntitlementGb - results.year3GrossGb).toLocaleString()} GB (${Math.round(100 - y3.utilizationPercent)}%) available operational headroom.`,
                bold: true,
                color: isBreached ? 'DC2626' : '059669',
              }),
            ],
            spacing: { after: 140 },
          }),

          // Key Milestones Summary
          new Paragraph({
            children: [
              new TextRun({
                text: `• Year 1 Consumption: ${Math.round(results.year1GrossGb).toLocaleString()} GB (${Math.round((results.year1GrossGb / setup.licensedEntitlementGb) * 100)}% utilization)\n`,
              }),
              new TextRun({
                text: `• Year 3 Consumption: ${Math.round(y3.totalGrossGb).toLocaleString()} GB (${Math.round(y3.utilizationPercent)}% utilization)\n`,
              }),
              new TextRun({
                text: `• Horizon Year ${horizon.year} Consumption: ${Math.round(horizon.totalGrossGb).toLocaleString()} GB (${Math.round(horizon.utilizationPercent)}% utilization)\n`,
              }),
              new TextRun({
                text: `• Sizing Confidence Rating: ${results.confidenceRating} (${results.confidenceScore} / 100)\n`,
              }),
            ],
            spacing: { after: 200 },
          }),

          // Embedded Graphic 1: Growth Trajectory Chart
          new Paragraph({
            text: '2. Multi-Year Storage Growth Trajectory & Entitlement Graphic',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 240, after: 140 },
          }),
          new Paragraph({
            children: [
              new ImageRun({
                data: chartImageBytes,
                type: 'png',
                transformation: {
                  width: 600,
                  height: 270,
                },
              }),
            ],
            spacing: { after: 240 },
          }),

          // Multi-Year Capacity Ledger
          new Paragraph({
            text: '3. Annual Capacity Forecasting Ledger (GB)',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 200, after: 140 },
          }),
          forecastTable,

          new Paragraph({ text: '', spacing: { after: 240 } }),

          // Embedded Graphic 2: Storage Architecture & Product Breakdown
          new Paragraph({
            text: '4. Storage Architecture Tiers & Product Workloads Graphic',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 240, after: 140 },
          }),
          new Paragraph({
            children: [
              new ImageRun({
                data: compositionImageBytes,
                type: 'png',
                transformation: {
                  width: 600,
                  height: 180,
                },
              }),
            ],
            spacing: { after: 200 },
          }),

          // Sensitivity Analysis Section
          new Paragraph({
            text: '5. Multi-Variable Sensitivity & What-If Matrix',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 240, after: 140 },
          }),
          new Paragraph({
            text: 'Evaluates the impact on Year 3 storage requirements under varied growth rates, attachment file policies, archiving schedules, and non-PROD clone configurations:',
            spacing: { after: 120 },
          }),
          sensitivityTable,

          new Paragraph({ text: '', spacing: { after: 200 } }),

          // Presales Architecture Recommendations
          new Paragraph({
            text: '6. Strategic Solution Architecture Recommendations',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 240, after: 140 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: '1. Sub-PROD Clone Policy Governance: ',
                bold: true,
              }),
              new TextRun({
                text: `${environments.excludeAttachmentsNonProd ? 'Attachment exclusion is currently ACTIVE on non-PROD instances.' : 'Attachment exclusion should be ACTIVATED immediately on DEV, TEST, and QA clone profiles to save 40–60% non-PROD storage.'}\n\n`,
              }),
              new TextRun({
                text: '2. Transactional Archiving Schedules: ',
                bold: true,
              }),
              new TextRun({
                text: `Implement automated ServiceNow Data Archiving (sys_archive) for closed tasks and incidents older than ${assumptions.activeRetentionMonths} months to stabilize active database tables.\n\n`,
              }),
              new TextRun({
                text: '3. Audit History Log Rotation: ',
                bold: true,
              }),
              new TextRun({
                text: `Establish 12–18 month archiving rules for sys_audit and sys_journal_field to prevent unconstrained audit table growth.\n\n`,
              }),
              new TextRun({
                text: '4. Attachment Size Optimization: ',
                bold: true,
              }),
              new TextRun({
                text: `Enforce attachment compression policies on the Service Portal to maintain average ticket file payloads around ${assumptions.avgAttachmentSizeKb} KB.`,
              }),
            ],
            spacing: { after: 300 },
          }),

          // Sign-Off Block
          new Paragraph({
            text: 'Technical Assessor Sign-Off & Platform Authority',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Prepared by: ${setup.assessorName}\nSignature: __________________________    Date: ${setup.assessmentDate}\n`,
              }),
            ],
          }),
        ],
      },
    ],
  });

  // 5. Pack and trigger download
  const blob = await Packer.toBlob(doc);
  const filename = `ServiceNow_Capacity_Forecast_${setup.clientName.replace(/\s+/g, '_')}_${setup.assessmentDate}.docx`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
