export type AssessmentType = 'new_implementation' | 'expansion' | 'migration' | 'consolidation';

export type IndustryVertical =
  | 'financial_services'
  | 'healthcare'
  | 'technology'
  | 'retail'
  | 'manufacturing'
  | 'public_sector'
  | 'higher_education'
  | 'telecommunications'
  | 'energy_utilities';

export interface EngagementSetup {
  id: string;
  assessmentName: string;
  clientName: string;
  assessorName: string;
  assessmentDate: string;
  assessmentType: AssessmentType;
  industryVertical: IndustryVertical;
  planningHorizonYears: number; // 1 to 10
  licensedEntitlementGb: number; // e.g. 4096 (4 TB)
  currentConsumedGb: number;
  targetBufferPercent: number; // e.g. 20 (%)
  notes: string;
}

export type WorkflowFamily =
  | 'IT Workflows'
  | 'Customer Workflows'
  | 'Employee Workflows'
  | 'Creator Workflows'
  | 'Industry Solutions';

export interface ServiceNowModuleInfo {
  id: string;
  name: string;
  description: string;
  primaryTable: string;
  typicalRecordKb: number;
}

export interface ServiceNowProductInfo {
  id: keyof ProductWorkloads;
  name: string;
  shortCode: string;
  family: WorkflowFamily;
  description: string;
  iconName: string;
  modules: ServiceNowModuleInfo[];
}

export interface ItsmWorkload {
  enabled: boolean;
  activeModules?: string[];
  fulfillers: number;
  endUsers: number;
  monthlyIncidents: number;
  monthlyRequests: number;
  monthlyChanges: number;
  monthlyProblems: number;
  kbArticles: number;
  cmdbCis: number;
}

export interface ItomWorkload {
  enabled: boolean;
  activeModules?: string[];
  discoveredDevices: number;
  cloudResources: number;
  dailyEvents: number;
  dailyAlerts: number;
  metricRetentionDays: number;
}

export interface ItamWorkload {
  enabled: boolean;
  activeModules?: string[];
  hardwareAssets: number;
  softwareModels: number;
  activeSoftwareInstalls: number;
  contractsAndLeases: number;
}

export interface SpmWorkload {
  enabled: boolean;
  activeModules?: string[];
  annualProjects: number;
  annualDemands: number;
  monthlyStories: number;
  weeklyTimesheets: number;
  applicationsManaged?: number;
}

export interface IrmWorkload {
  enabled: boolean;
  activeModules?: string[];
  compliancePolicies: number;
  controlsManaged: number;
  annualRiskAssessments: number;
  annualAudits: number;
  vendorsManaged: number;
}

export interface SecOpsWorkload {
  enabled: boolean;
  activeModules?: string[];
  monthlySecurityIncidents: number;
  monthlyVulnerableItems: number;
  scansPerWeek: number;
  threatIndicators?: number;
}

export interface CsmWorkload {
  enabled: boolean;
  activeModules?: string[];
  customerContacts: number;
  customerAccounts: number;
  monthlyCases: number;
  monthlyInteractions: number;
}

export interface FsmWorkload {
  enabled: boolean;
  activeModules?: string[];
  fieldAgents: number;
  monthlyWorkOrders: number;
  monthlyTasksPerOrder: number;
  managedPartsInventory: number;
}

export interface HsrdWorkload {
  enabled: boolean;
  activeModules?: string[];
  coveredEmployees: number;
  turnoverRatePercent: number;
  annualCases: number;
  annualLifecycles: number;
}

export interface WsdWorkload {
  enabled: boolean;
  activeModules?: string[];
  managedWorkplaces: number;
  managedDesksAndRooms: number;
  monthlyReservations: number;
  monthlyWorkplaceRequests: number;
  monthlyVisitors: number;
}

export interface LsdWorkload {
  enabled: boolean;
  activeModules?: string[];
  monthlyLegalRequests: number;
  annualLegalMatters: number;
  legalContractsManaged: number;
}

export interface PsmWorkload {
  enabled: boolean;
  activeModules?: string[];
  monthlySourcingRequests: number;
  annualPurchaseOrders: number;
  suppliersManaged: number;
}

export interface CustomAppsWorkload {
  enabled: boolean;
  activeModules?: string[];
  tableCount: number;
  monthlyTransactions: number;
  avgRecordSizeKb: number;
}

export interface AutomationEngineWorkload {
  enabled: boolean;
  activeModules?: string[];
  monthlyIntegrationTransactions: number;
  monthlyRpaBotRuns: number;
  monthlyDocIntelPages: number;
}

export interface IndustrySolutionsWorkload {
  enabled: boolean;
  activeModules?: string[];
  verticalType: 'financial_services' | 'healthcare' | 'public_sector' | 'telecommunications';
  monthlyIndustryCases: number;
  activeSpecializedEntities: number;
}

export interface ProductWorkloads {
  itsm: ItsmWorkload;
  itom: ItomWorkload;
  itam: ItamWorkload;
  spm: SpmWorkload;
  irm: IrmWorkload;
  secops: SecOpsWorkload;
  csm: CsmWorkload;
  fsm: FsmWorkload;
  hrsd: HsrdWorkload;
  wsd: WsdWorkload;
  lsd: LsdWorkload;
  psm: PsmWorkload;
  customApps: CustomAppsWorkload;
  automationEngine: AutomationEngineWorkload;
  industrySolutions: IndustrySolutionsWorkload;
}

export interface RecordSizeBenchmarks {
  incidentKb: number;
  changeKb: number;
  problemKb: number;
  requestKb: number;
  cmdbCiKb: number;
  itomEventKb: number;
  itomAlertKb: number;
  csmCaseKb: number;
  hrCaseKb: number;
  secIncidentKb: number;
  vulnItemKb: number;
  customRecordKb: number;
}

export interface AttachmentProfileMetadata {
  profileName: string;
  fileName: string;
  uploadedAt: string;
  sourceType: 'JSON' | 'CSV';
  extensionDistribution?: Record<string, number>;
  tableSpecificRates?: Record<string, number>;
  notes?: string;
}

export interface TechnicalAssumptions {
  recordSizes: RecordSizeBenchmarks;
  auditFactorPercent: number; // default 45%
  activeRetentionMonths: number; // default 36
  auditRetentionMonths: number; // default 24
  eventRetentionDays: number; // default 14
  annualGrowthRate: number; // default 0.15 (15%)
  attachmentRatePercent: number; // default 25 (%)
  avgAttachmentsPerRecord: number; // default 1.3
  avgAttachmentSizeKb: number; // default 850 (KB)
  legacyRecords: number;
  legacyAttachmentGb: number;
  migrationYear: number;
  uploadedAttachmentProfile?: AttachmentProfileMetadata;
}

export interface NonProdInstance {
  id: string;
  name: string;
  type: 'DEV' | 'TEST' | 'STAGE' | 'SANDBOX' | 'OTHER';
  dataScalePercent: number; // 0 to 100
  includeAttachments: boolean;
  purpose: string;
}

export interface EnvironmentConfig {
  excludeAttachmentsNonProd: boolean;
  truncateAuditNonProd: boolean;
  nonProdInstances: NonProdInstance[];
}

export interface YearlyProjection {
  year: number;
  databaseGrossGb: number;
  auditGrossGb: number;
  attachmentGrossGb: number;
  prodTotalGb: number;
  nonProdTotalGb: number;
  totalGrossGb: number;
  entitlementGb: number;
  headroomGb: number;
  utilizationPercent: number;
  status: 'optimal' | 'warning' | 'breach';
  productBreakdown: Record<string, number>;
}

export interface SensitivityItem {
  parameter: string;
  scenarioLabel: string;
  multiplier: number;
  projectedYear3Gb: number;
  projectedHorizonGb: number;
  deltaGb: number;
  deltaPercent: number;
}

export interface ConfidenceFactor {
  label: string;
  impact: 'positive' | 'neutral' | 'negative';
  description: string;
}

export interface CalculationResults {
  yearlyProjections: YearlyProjection[];
  year1GrossGb: number;
  year3GrossGb: number;
  year5GrossGb: number;
  horizonGrossGb: number;
  year3DatabaseGb: number;
  year3AuditGb: number;
  year3AttachmentGb: number;
  year3NonProdGb: number;
  year3EntitlementGapGb: number;
  year5EntitlementGapGb: number;
  firstBreachYear: number | null;
  confidenceScore: number; // 0-100
  confidenceRating: 'High' | 'Moderate' | 'Low';
  confidenceFactors: ConfidenceFactor[];
  sensitivityAnalysis: SensitivityItem[];
}

export interface Scenario {
  id: string;
  name: string;
  description: string;
  isBaseline: boolean;
  createdAt: string;
  setup: EngagementSetup;
  workloads: ProductWorkloads;
  assumptions: TechnicalAssumptions;
  environments: EnvironmentConfig;
  results?: CalculationResults;
}

export interface AiValidation {
  id: string;
  category: 'workload' | 'retention' | 'attachments' | 'environments' | 'entitlement';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  recommendation: string;
  metricAffected: string;
}

export interface RsiProposal {
  id: string;
  title: string;
  category: 'archiving' | 'attachments' | 'environments' | 'retention';
  estimatedSavingsGb: number;
  rationale: string;
  applied: boolean;
  mutation: {
    field: string;
    value: any;
    description: string;
    previousValue?: any;
  };
}

export interface ProvenanceRecord {
  field: string;
  label: string;
  value: string | number;
  source: 'Customer Input' | 'ServiceNow Benchmark' | 'Assessor Presales Assumption' | 'AI RSI Proposal';
  benchmarkRef: string;
}
