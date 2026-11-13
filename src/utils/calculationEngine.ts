import {
  CalculationResults,
  ConfidenceFactor,
  EngagementSetup,
  EnvironmentConfig,
  ProductWorkloads,
  ProvenanceRecord,
  SensitivityItem,
  TechnicalAssumptions,
  YearlyProjection,
} from '../types/calculator';
import { getMinLicensedEntitlement, INDUSTRY_LABELS } from '../constants/benchmarks';

interface AnnualWorkloadMetrics {
  primaryDbGb: number;
  auditGb: number;
  attachmentGb: number;
  productShares: Record<string, number>;
}

/**
 * Calculates single-year production volume for all active ServiceNow products
 */
function calculateAnnualBaseVolumes(
  workloads: ProductWorkloads,
  assumptions: TechnicalAssumptions
): AnnualWorkloadMetrics {
  const rs = assumptions.recordSizes;
  const auditMultiplier = assumptions.auditFactorPercent / 100;
  const attachmentRate = assumptions.attachmentRatePercent / 100;
  const avgAttPerRec = assumptions.avgAttachmentsPerRecord;
  const attSizeGb = assumptions.avgAttachmentSizeKb / (1024 * 1024);

  let totalDbKb = 0;
  let totalAuditKb = 0;
  let totalAttachmentRecords = 0;

  const productShares: Record<string, number> = {
    itsm: 0,
    itom: 0,
    itam: 0,
    spm: 0,
    irm: 0,
    secops: 0,
    csm: 0,
    fsm: 0,
    hrsd: 0,
    wsd: 0,
    lsd: 0,
    psm: 0,
    customApps: 0,
    automationEngine: 0,
    industrySolutions: 0,
    legacyMigration: 0,
  };

  // 1. ITSM
  if (workloads.itsm?.enabled) {
    const incYear = (workloads.itsm.monthlyIncidents || 0) * 12;
    const reqYear = (workloads.itsm.monthlyRequests || 0) * 12;
    const chgYear = (workloads.itsm.monthlyChanges || 0) * 12;
    const prbYear = (workloads.itsm.monthlyProblems || 0) * 12;
    const cmdbCis = workloads.itsm.cmdbCis || 0;
    const kbArticles = workloads.itsm.kbArticles || 0;

    const incKb = incYear * rs.incidentKb;
    const reqKb = reqYear * rs.requestKb;
    const chgKb = chgYear * rs.changeKb;
    const prbKb = prbYear * rs.problemKb;
    const cmdbKb = (cmdbCis * rs.cmdbCiKb) / 3;
    const kbKb = kbArticles * 24;

    const itsmDbKb = incKb + reqKb + chgKb + prbKb + cmdbKb + kbKb;
    const itsmAuditKb = itsmDbKb * auditMultiplier;

    totalDbKb += itsmDbKb;
    totalAuditKb += itsmAuditKb;

    const itsmTxRecords = incYear + reqYear + chgYear + prbYear;
    const itsmAttRecs = itsmTxRecords * attachmentRate;
    totalAttachmentRecords += itsmAttRecs;

    productShares.itsm = (itsmDbKb + itsmAuditKb) / (1024 * 1024) + itsmAttRecs * avgAttPerRec * attSizeGb;
  }

  // 2. ITOM
  if (workloads.itom?.enabled) {
    const devices = workloads.itom.discoveredDevices || 0;
    const cloud = workloads.itom.cloudResources || 0;
    const dailyEvents = workloads.itom.dailyEvents || 0;
    const dailyAlerts = workloads.itom.dailyAlerts || 0;

    const itomCiKb = (devices + cloud) * (rs.cmdbCiKb * 1.5);
    const eventDays = Math.min(assumptions.eventRetentionDays || 14, 90);
    const eventsStored = dailyEvents * eventDays;
    const alertsStored = dailyAlerts * Math.min(eventDays * 3, 180);

    const eventKb = eventsStored * rs.itomEventKb;
    const alertKb = alertsStored * rs.itomAlertKb;

    const itomDbKb = itomCiKb + eventKb + alertKb;
    const itomAuditKb = itomDbKb * (auditMultiplier * 0.4);

    totalDbKb += itomDbKb;
    totalAuditKb += itomAuditKb;

    const itomAttRecs = alertsStored * 0.03;
    totalAttachmentRecords += itomAttRecs;

    productShares.itom = (itomDbKb + itomAuditKb) / (1024 * 1024) + itomAttRecs * avgAttPerRec * attSizeGb;
  }

  // 3. ITAM (Hardware, Software Models, Installs, Contracts)
  if (workloads.itam?.enabled) {
    const hw = workloads.itam.hardwareAssets || 0;
    const swModels = workloads.itam.softwareModels || 0;
    const swInstalls = workloads.itam.activeSoftwareInstalls || 0;
    const contracts = workloads.itam.contractsAndLeases || 0;

    const itamDbKb = hw * 9.0 + swModels * 8.0 + swInstalls * 4.0 + contracts * 15.0;
    const itamAuditKb = itamDbKb * (auditMultiplier * 0.7);

    totalDbKb += itamDbKb;
    totalAuditKb += itamAuditKb;

    const itamAttRecs = (hw * 0.05 + contracts * 0.85); // PO receipts, invoices, leases
    totalAttachmentRecords += itamAttRecs;

    productShares.itam = (itamDbKb + itamAuditKb) / (1024 * 1024) + itamAttRecs * avgAttPerRec * attSizeGb;
  }

  // 4. SPM (Projects, Demands, Stories, Timesheets, APM)
  if (workloads.spm?.enabled) {
    const projects = workloads.spm.annualProjects || 0;
    const demands = workloads.spm.annualDemands || 0;
    const storiesYear = (workloads.spm.monthlyStories || 0) * 12;
    const timesheetsYear = (workloads.spm.weeklyTimesheets || 0) * 52;
    const apps = workloads.spm.applicationsManaged || 0;

    const spmDbKb = projects * 35.0 + demands * 15.0 + storiesYear * 7.5 + timesheetsYear * 2.5 + apps * 11.0;
    const spmAuditKb = spmDbKb * auditMultiplier;

    totalDbKb += spmDbKb;
    totalAuditKb += spmAuditKb;

    const spmAttRecs = (projects * 8 + demands * 2 + storiesYear * 0.15) * attachmentRate;
    totalAttachmentRecords += spmAttRecs;

    productShares.spm = (spmDbKb + spmAuditKb) / (1024 * 1024) + spmAttRecs * avgAttPerRec * attSizeGb;
  }

  // 5. IRM / GRC (Compliance, Risk, Audit, Vendor Risk)
  if (workloads.irm?.enabled) {
    const policies = workloads.irm.compliancePolicies || 0;
    const controls = workloads.irm.controlsManaged || 0;
    const risks = workloads.irm.annualRiskAssessments || 0;
    const audits = workloads.irm.annualAudits || 0;
    const vendors = workloads.irm.vendorsManaged || 0;

    const irmDbKb = policies * 14.0 + controls * 12.0 + risks * 16.0 + audits * 20.0 + vendors * 18.0;
    const irmAuditKb = irmDbKb * (auditMultiplier * 1.5); // High audit compliance requirement

    totalDbKb += irmDbKb;
    totalAuditKb += irmAuditKb;

    const irmAttRecs = (audits * 25 + vendors * 8 + risks * 2) * attachmentRate;
    totalAttachmentRecords += irmAttRecs;

    productShares.irm = (irmDbKb + irmAuditKb) / (1024 * 1024) + irmAttRecs * avgAttPerRec * attSizeGb;
  }

  // 6. SecOps (SIR, Vulnerability Response, Threat Intel)
  if (workloads.secops?.enabled) {
    const secIncYear = (workloads.secops.monthlySecurityIncidents || 0) * 12;
    const vulnsYear = (workloads.secops.monthlyVulnerableItems || 0) * 12;
    const indicators = workloads.secops.threatIndicators || 0;

    const secDbKb = secIncYear * rs.secIncidentKb + vulnsYear * rs.vulnItemKb + indicators * 6.0;
    const secAuditKb = secDbKb * (auditMultiplier * 1.2);

    totalDbKb += secDbKb;
    totalAuditKb += secAuditKb;

    const secAttRecs = secIncYear * 0.45; // PCAPs, logs
    totalAttachmentRecords += secAttRecs;

    productShares.secops = (secDbKb + secAuditKb) / (1024 * 1024) + secAttRecs * avgAttPerRec * attSizeGb;
  }

  // 7. CSM (Customer Service Management)
  if (workloads.csm?.enabled) {
    const casesYear = (workloads.csm.monthlyCases || 0) * 12;
    const interactionsYear = (workloads.csm.monthlyInteractions || 0) * 12;
    const contacts = workloads.csm.customerContacts || 0;

    const caseKb = casesYear * rs.csmCaseKb;
    const interKb = interactionsYear * 8.5;
    const contactKb = contacts * 3.5;

    const csmDbKb = caseKb + interKb + contactKb;
    const csmAuditKb = csmDbKb * (auditMultiplier * 1.1);

    totalDbKb += csmDbKb;
    totalAuditKb += csmAuditKb;

    const csmAttRecs = casesYear * (attachmentRate * 1.25);
    totalAttachmentRecords += csmAttRecs;

    productShares.csm = (csmDbKb + csmAuditKb) / (1024 * 1024) + csmAttRecs * avgAttPerRec * attSizeGb;
  }

  // 8. FSM (Field Service Management)
  if (workloads.fsm?.enabled) {
    const ordersYear = (workloads.fsm.monthlyWorkOrders || 0) * 12;
    const tasksPerOrder = workloads.fsm.monthlyTasksPerOrder || 2.2;
    const parts = workloads.fsm.managedPartsInventory || 0;

    const orderKb = ordersYear * 15.0;
    const taskKb = ordersYear * tasksPerOrder * 10.0;
    const partKb = parts * 5.5;

    const fsmDbKb = orderKb + taskKb + partKb;
    const fsmAuditKb = fsmDbKb * auditMultiplier;

    totalDbKb += fsmDbKb;
    totalAuditKb += fsmAuditKb;

    const fsmAttRecs = ordersYear * (attachmentRate * 1.1); // Site photos, signed dispatch slips
    totalAttachmentRecords += fsmAttRecs;

    productShares.fsm = (fsmDbKb + fsmAuditKb) / (1024 * 1024) + fsmAttRecs * avgAttPerRec * attSizeGb;
  }

  // 9. HRSD (HR Service Delivery)
  if (workloads.hrsd?.enabled) {
    const employees = workloads.hrsd.coveredEmployees || 0;
    const casesYear = workloads.hrsd.annualCases || 0;
    const lifecycles = workloads.hrsd.annualLifecycles || 0;

    const profileKb = employees * 6.0;
    const caseKb = casesYear * rs.hrCaseKb;
    const lifeKb = lifecycles * 18.0;

    const hrsdDbKb = profileKb + caseKb + lifeKb;
    const hrsdAuditKb = hrsdDbKb * auditMultiplier;

    totalDbKb += hrsdDbKb;
    totalAuditKb += hrsdAuditKb;

    const hrsdAttRecs = (casesYear + lifecycles) * (attachmentRate * 1.4);
    totalAttachmentRecords += hrsdAttRecs;

    productShares.hrsd = (hrsdDbKb + hrsdAuditKb) / (1024 * 1024) + hrsdAttRecs * avgAttPerRec * attSizeGb;
  }

  // 10. WSD (Workplace Service Delivery)
  if (workloads.wsd?.enabled) {
    const reservationsYear = (workloads.wsd.monthlyReservations || 0) * 12;
    const requestsYear = (workloads.wsd.monthlyWorkplaceRequests || 0) * 12;
    const visitorsYear = (workloads.wsd.monthlyVisitors || 0) * 12;
    const desks = workloads.wsd.managedDesksAndRooms || 0;

    const resKb = reservationsYear * 6.0;
    const reqKb = requestsYear * 12.0;
    const visKb = visitorsYear * 5.0;
    const deskKb = desks * 7.0;

    const wsdDbKb = resKb + reqKb + visKb + deskKb;
    const wsdAuditKb = wsdDbKb * (auditMultiplier * 0.5);

    totalDbKb += wsdDbKb;
    totalAuditKb += wsdAuditKb;

    const wsdAttRecs = requestsYear * 0.25; // Facilities repair photos
    totalAttachmentRecords += wsdAttRecs;

    productShares.wsd = (wsdDbKb + wsdAuditKb) / (1024 * 1024) + wsdAttRecs * avgAttPerRec * attSizeGb;
  }

  // 11. LSD (Legal Service Delivery)
  if (workloads.lsd?.enabled) {
    const requestsYear = (workloads.lsd.monthlyLegalRequests || 0) * 12;
    const matters = workloads.lsd.annualLegalMatters || 0;
    const contracts = workloads.lsd.legalContractsManaged || 0;

    const lsdDbKb = requestsYear * 12.0 + matters * 20.0 + contracts * 16.0;
    const lsdAuditKb = lsdDbKb * (auditMultiplier * 1.3);

    totalDbKb += lsdDbKb;
    totalAuditKb += lsdAuditKb;

    const lsdAttRecs = (requestsYear + matters * 3) * (attachmentRate * 1.8); // heavy contracts and filings
    totalAttachmentRecords += lsdAttRecs;

    productShares.lsd = (lsdDbKb + lsdAuditKb) / (1024 * 1024) + lsdAttRecs * avgAttPerRec * attSizeGb;
  }

  // 12. PSM (Procurement Service Management)
  if (workloads.psm?.enabled) {
    const sourcingYear = (workloads.psm.monthlySourcingRequests || 0) * 12;
    const posYear = workloads.psm.annualPurchaseOrders || 0;
    const suppliers = workloads.psm.suppliersManaged || 0;

    const psmDbKb = sourcingYear * 14.0 + posYear * 16.0 + suppliers * 10.0;
    const psmAuditKb = psmDbKb * auditMultiplier;

    totalDbKb += psmDbKb;
    totalAuditKb += psmAuditKb;

    const psmAttRecs = (sourcingYear + posYear) * (attachmentRate * 1.3); // Invoices, quotes, vendor docs
    totalAttachmentRecords += psmAttRecs;

    productShares.psm = (psmDbKb + psmAuditKb) / (1024 * 1024) + psmAttRecs * avgAttPerRec * attSizeGb;
  }

  // 13. Custom Apps (App Engine)
  if (workloads.customApps?.enabled) {
    const txYear = (workloads.customApps.monthlyTransactions || 0) * 12;
    const recKb = workloads.customApps.avgRecordSizeKb || rs.customRecordKb;

    const customDbKb = txYear * recKb;
    const customAuditKb = customDbKb * auditMultiplier;

    totalDbKb += customDbKb;
    totalAuditKb += customAuditKb;

    const customAttRecs = txYear * (attachmentRate * 0.5);
    totalAttachmentRecords += customAttRecs;

    productShares.customApps =
      (customDbKb + customAuditKb) / (1024 * 1024) + customAttRecs * avgAttPerRec * attSizeGb;
  }

  // 14. Automation Engine (Integration Hub, RPA Hub, DocIntel)
  if (workloads.automationEngine?.enabled) {
    const txYear = (workloads.automationEngine.monthlyIntegrationTransactions || 0) * 12;
    const rpaRunsYear = (workloads.automationEngine.monthlyRpaBotRuns || 0) * 12;
    const docPagesYear = (workloads.automationEngine.monthlyDocIntelPages || 0) * 12;

    const autoDbKb = txYear * 7.0 + rpaRunsYear * 8.0 + docPagesYear * 15.0;
    const autoAuditKb = autoDbKb * (auditMultiplier * 0.4);

    totalDbKb += autoDbKb;
    totalAuditKb += autoAuditKb;

    const autoAttRecs = docPagesYear * 0.9; // Scanned source PDF attachments
    totalAttachmentRecords += autoAttRecs;

    productShares.automationEngine =
      (autoDbKb + autoAuditKb) / (1024 * 1024) + autoAttRecs * avgAttPerRec * attSizeGb;
  }

  // 15. Industry Solutions (FSO, HCLS, PSDS, TSM)
  if (workloads.industrySolutions?.enabled) {
    const casesYear = (workloads.industrySolutions.monthlyIndustryCases || 0) * 12;
    const entities = workloads.industrySolutions.activeSpecializedEntities || 0;

    const indDbKb = casesYear * 18.0 + entities * 10.0;
    const indAuditKb = indDbKb * (auditMultiplier * 1.2);

    totalDbKb += indDbKb;
    totalAuditKb += indAuditKb;

    const indAttRecs = casesYear * (attachmentRate * 1.5); // Specialized regulatory evidence
    totalAttachmentRecords += indAttRecs;

    productShares.industrySolutions =
      (indDbKb + indAuditKb) / (1024 * 1024) + indAttRecs * avgAttPerRec * attSizeGb;
  }

  const primaryDbGb = totalDbKb / (1024 * 1024);
  const auditGb = totalAuditKb / (1024 * 1024);
  const attachmentGb = totalAttachmentRecords * avgAttPerRec * attSizeGb;

  return {
    primaryDbGb,
    auditGb,
    attachmentGb,
    productShares,
  };
}

/**
 * Executes full multi-year storage forecasting across PROD and Non-PROD
 */
export function calculateStorageForecast(
  setup: EngagementSetup,
  workloads: ProductWorkloads,
  assumptions: TechnicalAssumptions,
  environments: EnvironmentConfig,
  skipSensitivity: boolean = false
): CalculationResults {
  const horizon = Math.max(1, Math.min(10, setup.planningHorizonYears || 5));
  const annualGrowth = assumptions.annualGrowthRate || 0.15;
  const activeRetentionYears = (assumptions.activeRetentionMonths || 36) / 12;
  const auditRetentionYears = (assumptions.auditRetentionMonths || 24) / 12;

  // Baseline base annual metrics (Year 1 volume)
  const baseYear = calculateAnnualBaseVolumes(workloads, assumptions);

  // Migration baseline
  const legacyDbGb = (assumptions.legacyRecords * 14) / (1024 * 1024);
  const legacyAttGb = assumptions.legacyAttachmentGb || 0;
  const migrationBaselineGb = legacyDbGb + legacyAttGb;

  const yearlyProjections: YearlyProjection[] = [];

  let cumDbGb = (setup.currentConsumedGb ? setup.currentConsumedGb * 0.45 : 0) + legacyDbGb;
  let cumAuditGb = (setup.currentConsumedGb ? setup.currentConsumedGb * 0.2 : 0);
  let cumAttGb = (setup.currentConsumedGb ? setup.currentConsumedGb * 0.35 : 0) + legacyAttGb;

  const annualHistoryDb: number[] = [];
  const annualHistoryAudit: number[] = [];
  const annualHistoryAtt: number[] = [];

  for (let y = 1; y <= horizon; y++) {
    // Compound growth factor for Year y
    const growthMultiplier = Math.pow(1 + annualGrowth, y - 1);

    const yearIncDb = baseYear.primaryDbGb * growthMultiplier;
    const yearIncAudit = baseYear.auditGb * growthMultiplier;
    const yearIncAtt = baseYear.attachmentGb * growthMultiplier;

    annualHistoryDb.push(yearIncDb);
    annualHistoryAudit.push(yearIncAudit);
    annualHistoryAtt.push(yearIncAtt);

    // Dynamic retention windowing (Archiving / Purge rolling window)
    let activeDbThisYear = legacyDbGb;
    const startYearDb = Math.max(0, Math.floor(y - activeRetentionYears));
    for (let i = startYearDb; i < y; i++) {
      activeDbThisYear += annualHistoryDb[i];
    }

    let activeAuditThisYear = 0;
    const startYearAudit = Math.max(0, Math.floor(y - auditRetentionYears));
    for (let i = startYearAudit; i < y; i++) {
      activeAuditThisYear += annualHistoryAudit[i];
    }

    // Attachments accumulate unless purged
    let activeAttThisYear = legacyAttGb;
    for (let i = 0; i < y; i++) {
      activeAttThisYear += annualHistoryAtt[i];
    }

    // Add baseline current consumed if present
    if (setup.currentConsumedGb && y === 1) {
      activeDbThisYear += setup.currentConsumedGb * 0.45;
      activeAuditThisYear += setup.currentConsumedGb * 0.2;
      activeAttThisYear += setup.currentConsumedGb * 0.35;
    }

    const prodTotalGb = activeDbThisYear + activeAuditThisYear + activeAttThisYear;

    // Calculate Non-PROD Footprint
    let nonProdTotalGb = 0;
    environments.nonProdInstances.forEach((inst) => {
      const scale = (inst.dataScalePercent || 0) / 100;
      const includeAtt = environments.excludeAttachmentsNonProd
        ? false
        : inst.includeAttachments;

      let instDb = activeDbThisYear * scale;
      let instAudit = environments.truncateAuditNonProd
        ? activeAuditThisYear * scale * 0.2 // Truncated audit
        : activeAuditThisYear * scale;

      let instAtt = includeAtt ? activeAttThisYear * scale : 0;
      nonProdTotalGb += instDb + instAudit + instAtt;
    });

    const totalGrossGb = prodTotalGb + nonProdTotalGb;
    const entitlementGb = setup.licensedEntitlementGb || 4096;
    const headroomGb = entitlementGb - totalGrossGb;
    const utilizationPercent = (totalGrossGb / entitlementGb) * 100;

    let status: 'optimal' | 'warning' | 'breach' = 'optimal';
    const bufferThreshold = 100 - (setup.targetBufferPercent || 20);

    if (totalGrossGb > entitlementGb) {
      status = 'breach';
    } else if (utilizationPercent >= bufferThreshold) {
      status = 'warning';
    }

    // Product breakdown for this year
    const productScale = (totalGrossGb / (prodTotalGb || 1));
    const breakdown: Record<string, number> = {};
    Object.keys(baseYear.productShares).forEach((prodKey) => {
      breakdown[prodKey] = (baseYear.productShares[prodKey] || 0) * growthMultiplier * productScale;
    });
    breakdown.legacyMigration = migrationBaselineGb;

    yearlyProjections.push({
      year: y,
      databaseGrossGb: activeDbThisYear,
      auditGrossGb: activeAuditThisYear,
      attachmentGrossGb: activeAttThisYear,
      prodTotalGb,
      nonProdTotalGb,
      totalGrossGb,
      entitlementGb,
      headroomGb,
      utilizationPercent,
      status,
      productBreakdown: breakdown,
    });
  }

  // Key milestones
  const year1Proj = yearlyProjections[0] || yearlyProjections[yearlyProjections.length - 1];
  const year3Proj = yearlyProjections[Math.min(2, yearlyProjections.length - 1)];
  const year5Proj = yearlyProjections[Math.min(4, yearlyProjections.length - 1)];
  const horizonProj = yearlyProjections[yearlyProjections.length - 1];

  const year3EntitlementGapGb = Math.max(0, year3Proj.totalGrossGb - year3Proj.entitlementGb);
  const year5EntitlementGapGb = Math.max(0, year5Proj.totalGrossGb - year5Proj.entitlementGb);

  let firstBreachYear: number | null = null;
  const breach = yearlyProjections.find((p) => p.totalGrossGb > p.entitlementGb);
  if (breach) {
    firstBreachYear = breach.year;
  }

  // Confidence Score Math
  const { score: confidenceScore, rating: confidenceRating, factors: confidenceFactors } =
    calculateConfidenceScore(setup, workloads, assumptions, environments, yearlyProjections);

  // Sensitivity Analysis Matrix
  const sensitivityAnalysis = skipSensitivity
    ? []
    : calculateSensitivityAnalysis(
        setup,
        workloads,
        assumptions,
        environments,
        year3Proj.totalGrossGb,
        horizonProj.totalGrossGb
      );

  return {
    yearlyProjections,
    year1GrossGb: year1Proj.totalGrossGb,
    year3GrossGb: year3Proj.totalGrossGb,
    year5GrossGb: year5Proj.totalGrossGb,
    horizonGrossGb: horizonProj.totalGrossGb,
    year3DatabaseGb: year3Proj.databaseGrossGb,
    year3AuditGb: year3Proj.auditGrossGb,
    year3AttachmentGb: year3Proj.attachmentGrossGb,
    year3NonProdGb: year3Proj.nonProdTotalGb,
    year3EntitlementGapGb,
    year5EntitlementGapGb,
    firstBreachYear,
    confidenceScore,
    confidenceRating,
    confidenceFactors,
    sensitivityAnalysis,
  };
}

/**
 * Calculates Confidence Score (0–100) and provides concrete architecture rationale
 */
function calculateConfidenceScore(
  setup: EngagementSetup,
  workloads: ProductWorkloads,
  assumptions: TechnicalAssumptions,
  environments: EnvironmentConfig,
  projections: YearlyProjection[]
): { score: number; rating: 'High' | 'Moderate' | 'Low'; factors: ConfidenceFactor[] } {
  let score = 75; // Baseline
  const factors: ConfidenceFactor[] = [];

  // Active products check
  const activeProducts = Object.values(workloads).filter((w) => w?.enabled).length;
  if (activeProducts >= 3) {
    score += 8;
    factors.push({
      label: 'Multi-Product Scope Calibrated',
      impact: 'positive',
      description: `${activeProducts} active ServiceNow products with explicit transaction volumes specified.`,
    });
  } else if (activeProducts === 1) {
    score -= 5;
    factors.push({
      label: 'Single Product Scope',
      impact: 'neutral',
      description: 'Only 1 module modeled; secondary module adoption may alter trajectory.',
    });
  }

  // Environments fidelity
  if (environments.nonProdInstances.length >= 3) {
    score += 6;
    factors.push({
      label: 'Complete Non-PROD Topology',
      impact: 'positive',
      description: `${environments.nonProdInstances.length} lower environments modeled with distinct data sampling percentages.`,
    });
  } else {
    score -= 6;
    factors.push({
      label: 'Minimal Non-PROD Detail',
      impact: 'negative',
      description: 'Fewer than 3 sub-production instances configured; clone replication may be understated.',
    });
  }

  // Attachment configuration
  if (assumptions.avgAttachmentSizeKb > 0 && assumptions.attachmentRatePercent > 0) {
    score += 5;
    factors.push({
      label: 'Attachment Dynamics Modeled',
      impact: 'positive',
      description: `Attachment rate (${assumptions.attachmentRatePercent}%) and size (${assumptions.avgAttachmentSizeKb} KB) calibrated to customer profile.`,
    });
  }

  // Retention policy check
  if (assumptions.activeRetentionMonths <= 36) {
    score += 6;
    factors.push({
      label: 'Defined Archiving Schedule',
      impact: 'positive',
      description: `Transactional archiving at ${assumptions.activeRetentionMonths} months limits runaway table growth.`,
    });
  } else {
    score -= 7;
    factors.push({
      label: 'Extended Active Retention',
      impact: 'negative',
      description: `Retention > 36 months introduces cumulative variance over multi-year horizon.`,
    });
  }

  // Growth rate realism
  if (assumptions.annualGrowthRate >= 0.08 && assumptions.annualGrowthRate <= 0.25) {
    score += 5;
    factors.push({
      label: 'Standard Growth Parameter',
      impact: 'positive',
      description: `Annual growth rate (${(assumptions.annualGrowthRate * 100).toFixed(0)}%) aligns with enterprise ServiceNow benchmarks.`,
    });
  } else if (assumptions.annualGrowthRate > 0.3) {
    score -= 8;
    factors.push({
      label: 'Extreme Growth Rate (>30%)',
      impact: 'negative',
      description: 'Aggressive CAGR compound variance may skew multi-year capital requirements.',
    });
  }

  // Non-PROD attachment policy
  if (environments.excludeAttachmentsNonProd) {
    score += 4;
    factors.push({
      label: 'Sub-PROD Storage Governance',
      impact: 'positive',
      description: 'Attachment clone exclusion prevents non-PROD storage multiplication.',
    });
  } else {
    score -= 6;
    factors.push({
      label: 'Unrestricted Non-PROD Attachments',
      impact: 'negative',
      description: 'Full attachment replication across lower environments introduces significant sizing risk.',
    });
  }

  score = Math.max(35, Math.min(98, score));
  let rating: 'High' | 'Moderate' | 'Low' = 'Moderate';
  if (score >= 85) rating = 'High';
  else if (score < 65) rating = 'Low';

  return { score, rating, factors };
}

/**
 * Generates Sensitivity Matrix for Levers: Growth, Attachments, Retention, Non-PROD
 */
function calculateSensitivityAnalysis(
  setup: EngagementSetup,
  workloads: ProductWorkloads,
  assumptions: TechnicalAssumptions,
  environments: EnvironmentConfig,
  baseYear3Gb: number,
  baseHorizonGb: number
): SensitivityItem[] {
  const items: SensitivityItem[] = [];

  const levers = [
    {
      parameter: 'Annual Volume Growth',
      variations: [
        { label: 'Low Growth (-20% relative)', growth: assumptions.annualGrowthRate * 0.8 },
        { label: 'High Growth (+20% relative)', growth: assumptions.annualGrowthRate * 1.2 },
        { label: 'Aggressive Expansion (+50% relative)', growth: assumptions.annualGrowthRate * 1.5 },
      ],
      run: (v: any) => ({
        ...assumptions,
        annualGrowthRate: v.growth,
      }),
    },
    {
      parameter: 'Average Attachment Size',
      variations: [
        { label: 'Optimized (500 KB)', size: 500 },
        { label: 'Heavy Media / Diagnostics (1.5 MB)', size: 1500 },
        { label: 'Uncompressed Attachments (3.0 MB)', size: 3000 },
      ],
      run: (v: any) => ({
        ...assumptions,
        avgAttachmentSizeKb: v.size,
      }),
    },
    {
      parameter: 'Data Archiving Horizon',
      variations: [
        { label: 'Aggressive Archiving (24 Months)', months: 24 },
        { label: 'Extended Retention (48 Months)', months: 48 },
        { label: 'Unrestricted (60 Months)', months: 60 },
      ],
      run: (v: any) => ({
        ...assumptions,
        activeRetentionMonths: v.months,
      }),
    },
  ];

  levers.forEach((lever) => {
    lever.variations.forEach((variation) => {
      const patchedAssumptions = lever.run(variation);
      const testResult = calculateStorageForecast(setup, workloads, patchedAssumptions, environments, true);
      const testYear3 = testResult.year3GrossGb;
      const testHorizon = testResult.horizonGrossGb;
      const deltaGb = testYear3 - baseYear3Gb;
      const deltaPercent = (deltaGb / (baseYear3Gb || 1)) * 100;

      items.push({
        parameter: lever.parameter,
        scenarioLabel: variation.label,
        multiplier: 1,
        projectedYear3Gb: Math.round(testYear3),
        projectedHorizonGb: Math.round(testHorizon),
        deltaGb: Math.round(deltaGb),
        deltaPercent: Math.round(deltaPercent * 10) / 10,
      });
    });
  });

  // Non-PROD Attachment exclusion lever
  const toggleNonProdAttach = !environments.excludeAttachmentsNonProd;
  const nonProdPatchedEnv = {
    ...environments,
    excludeAttachmentsNonProd: toggleNonProdAttach,
  };
  const testNonProd = calculateStorageForecast(setup, workloads, assumptions, nonProdPatchedEnv, true);
  const npDelta = testNonProd.year3GrossGb - baseYear3Gb;
  items.push({
    parameter: 'Non-PROD Attachments',
    scenarioLabel: toggleNonProdAttach
      ? 'Include Attachments on Sub-PRODs'
      : 'Exclude Attachments on Sub-PRODs',
    multiplier: 1,
    projectedYear3Gb: Math.round(testNonProd.year3GrossGb),
    projectedHorizonGb: Math.round(testNonProd.horizonGrossGb),
    deltaGb: Math.round(npDelta),
    deltaPercent: Math.round((npDelta / (baseYear3Gb || 1)) * 1000) / 10,
  });

  return items;
}

/**
 * Builds Traceable Input Provenance records for Evidence Pack (FR-07)
 */
export function buildInputProvenanceMatrix(
  setup: EngagementSetup,
  workloads: ProductWorkloads,
  assumptions: TechnicalAssumptions,
  environments: EnvironmentConfig
): ProvenanceRecord[] {
  const minEntitlement = getMinLicensedEntitlement(setup.industryVertical, setup.assessmentType);
  const records: ProvenanceRecord[] = [
    {
      field: 'setup.licensedEntitlementGb',
      label: 'Licensed Storage Entitlement',
      value: `${setup.licensedEntitlementGb.toLocaleString()} GB (${(setup.licensedEntitlementGb / 1024).toFixed(1)} TB)`,
      source: 'Customer Input',
      benchmarkRef: 'ServiceNow Master Ordering Agreement (MOA) Tier',
    },
    {
      field: 'setup.minLicensedEntitlementGb',
      label: 'Minimum Industry Entitlement Benchmark',
      value: `${minEntitlement.toLocaleString()} GB (${(minEntitlement / 1024).toFixed(1)} TB)`,
      source: 'ServiceNow Benchmark',
      benchmarkRef: `Mandatory minimum standard for ${INDUSTRY_LABELS[setup.industryVertical] || setup.industryVertical} (${setup.assessmentType})`,
    },
    {
      field: 'setup.targetBufferPercent',
      label: 'Operational Headroom Buffer Target',
      value: `${setup.targetBufferPercent}%`,
      source: 'Assessor Presales Assumption',
      benchmarkRef: 'ServiceNow Architecture Governance Standard (20% Target)',
    },
    {
      field: 'assumptions.annualGrowthRate',
      label: 'Annual Business Volume Growth Rate',
      value: `${(assumptions.annualGrowthRate * 100).toFixed(0)}% / year`,
      source: 'Customer Input',
      benchmarkRef: 'Customer Historical IT Volume Trend',
    },
    {
      field: 'assumptions.auditFactorPercent',
      label: 'sys_audit & Journal Overhead Factor',
      value: `${assumptions.auditFactorPercent}%`,
      source: 'ServiceNow Benchmark',
      benchmarkRef: 'ServiceNow Database Sizing Spec v1.3 (sys_audit / sys_journal)',
    },
    {
      field: 'assumptions.activeRetentionMonths',
      label: 'Transactional Archiving Lifecycle',
      value: `${assumptions.activeRetentionMonths} Months`,
      source: 'Customer Input',
      benchmarkRef: 'Data Retention & Archiving Policy (sys_archive)',
    },
    {
      field: 'assumptions.avgAttachmentSizeKb',
      label: 'Average Ticket Attachment Size',
      value: `${assumptions.avgAttachmentSizeKb} KB`,
      source: 'ServiceNow Benchmark',
      benchmarkRef: 'Enterprise ServiceNow sys_attachment_doc Empirical Sample',
    },
    {
      field: 'environments.excludeAttachmentsNonProd',
      label: 'Non-PROD Attachment Clone Exclusion',
      value: environments.excludeAttachmentsNonProd ? 'ENABLED (Excludes lower envs)' : 'DISABLED (Full replication)',
      source: environments.excludeAttachmentsNonProd ? 'ServiceNow Benchmark' : 'Customer Input',
      benchmarkRef: 'ServiceNow Clone Engine Architecture Best Practice (KB0713837)',
    },
  ];

  if (workloads.itsm?.enabled) {
    records.push({
      field: 'workloads.itsm.monthlyIncidents',
      label: 'ITSM Monthly Incident Volume',
      value: `${(workloads.itsm.monthlyIncidents || 0).toLocaleString()} / month`,
      source: 'Customer Input',
      benchmarkRef: 'Customer Service Desk ITSM Metrics',
    });
    records.push({
      field: 'assumptions.recordSizes.incidentKb',
      label: 'Incident Physical Record Size Benchmark',
      value: `${assumptions.recordSizes.incidentKb} KB`,
      source: 'ServiceNow Benchmark',
      benchmarkRef: 'Task & Incident Schema Footprint Benchmark',
    });
  }

  if (workloads.itom?.enabled) {
    records.push({
      field: 'workloads.itom.discoveredDevices',
      label: 'ITOM Discovered Devices / IPs',
      value: `${(workloads.itom.discoveredDevices || 0).toLocaleString()} CIs`,
      source: 'Customer Input',
      benchmarkRef: 'Customer Network & Infrastructure Inventory',
    });
    records.push({
      field: 'assumptions.eventRetentionDays',
      label: 'ITOM Raw Event (em_event) Retention',
      value: `${assumptions.eventRetentionDays} Days`,
      source: 'ServiceNow Benchmark',
      benchmarkRef: 'ServiceNow Event Management Best Practice (7-14 Days)',
    });
  }

  return records;
}
