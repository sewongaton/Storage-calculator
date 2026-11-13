import {
  AssessmentType,
  EngagementSetup,
  EnvironmentConfig,
  IndustryVertical,
  ProductWorkloads,
  RecordSizeBenchmarks,
  Scenario,
  ServiceNowProductInfo,
  TechnicalAssumptions,
} from '../types/calculator';

// Standard ServiceNow Physical Table Storage Benchmarks (in KB)
// Source: ServiceNow Performance & Capacity Sizing Guide (Kingston through Xanadu release benchmarks)
export const DEFAULT_RECORD_SIZES: RecordSizeBenchmarks = {
  incidentKb: 12.0, // Includes task sys_id, short_description, references, base journals
  changeKb: 18.0, // Includes change_request, approvals, risk assessment, task workflow
  problemKb: 15.0, // Includes problem, problem_task, root cause and workarounds
  requestKb: 14.0, // Includes sc_req_item + associated sc_item_option_mtom variables
  cmdbCiKb: 8.0, // cmdb_ci base table + extended attributes (hardware, server, app)
  itomEventKb: 3.2, // em_event raw event payload + parsed fields
  itomAlertKb: 6.5, // em_alert aggregated alert record + correlation rules
  csmCaseKb: 16.5, // sn_customerservice_case + contact, account, asset pointers
  hrCaseKb: 14.5, // sn_hr_core_case + employee profile, COE sub-tables
  secIncidentKb: 22.0, // sn_si_incident + observables, threat indicators, security notes
  vulnItemKb: 5.0, // sn_vul_vulnerable_item + NVD vulnerability refs
  customRecordKb: 10.0, // User-defined application table with standard audit
};

export const INDUSTRY_LABELS: Record<IndustryVertical, string> = {
  financial_services: 'Financial Services & Banking',
  healthcare: 'Healthcare & Life Sciences',
  technology: 'Technology & SaaS',
  retail: 'Retail & Consumer Goods',
  manufacturing: 'Manufacturing & Industrial',
  public_sector: 'Public Sector & Federal',
  higher_education: 'Higher Education & Research',
  telecommunications: 'Telecommunications & Media',
  energy_utilities: 'Energy & Utilities',
};

/**
 * Minimum Licensed Storage Entitlement (GB) Matrix
 * Defined per industry vertical and differentiated across each assessment classification type.
 * Enforces architectural and compliance minimum storage quotas.
 */
export const MIN_LICENSED_ENTITLEMENT_GB: Record<IndustryVertical, Record<AssessmentType, number>> = {
  financial_services: {
    new_implementation: 4096, // 4 TB
    expansion: 6144,          // 6 TB
    migration: 8192,          // 8 TB
    consolidation: 12288,     // 12 TB
  },
  healthcare: {
    new_implementation: 4096, // 4 TB
    expansion: 6144,          // 6 TB
    migration: 8192,          // 8 TB
    consolidation: 10240,     // 10 TB
  },
  technology: {
    new_implementation: 2048, // 2 TB
    expansion: 4096,          // 4 TB
    migration: 6144,          // 6 TB
    consolidation: 8192,      // 8 TB
  },
  retail: {
    new_implementation: 2048, // 2 TB
    expansion: 3072,          // 3 TB
    migration: 4096,          // 4 TB
    consolidation: 6144,      // 6 TB
  },
  manufacturing: {
    new_implementation: 3072, // 3 TB
    expansion: 4096,          // 4 TB
    migration: 6144,          // 6 TB
    consolidation: 8192,      // 8 TB
  },
  public_sector: {
    new_implementation: 4096, // 4 TB
    expansion: 6144,          // 6 TB
    migration: 8192,          // 8 TB
    consolidation: 12288,     // 12 TB
  },
  higher_education: {
    new_implementation: 2048, // 2 TB
    expansion: 3072,          // 3 TB
    migration: 4096,          // 4 TB
    consolidation: 6144,      // 6 TB
  },
  telecommunications: {
    new_implementation: 4096, // 4 TB
    expansion: 6144,          // 6 TB
    migration: 8192,          // 8 TB
    consolidation: 12288,     // 12 TB
  },
  energy_utilities: {
    new_implementation: 3072, // 3 TB
    expansion: 4096,          // 4 TB
    migration: 6144,          // 6 TB
    consolidation: 8192,      // 8 TB
  },
};

export function getMinLicensedEntitlement(
  vertical: IndustryVertical = 'financial_services',
  assessmentType: AssessmentType = 'new_implementation'
): number {
  return MIN_LICENSED_ENTITLEMENT_GB[vertical]?.[assessmentType] || 2048;
}

export const INITIAL_SETUP: EngagementSetup = {
  id: 'assessment-primary-2026',
  assessmentName: 'FY27 Enterprise ServiceNow Platform Modernization',
  clientName: 'Global Horizon Financial Group',
  assessorName: 'Marcus Vance, Principal Presales Architect',
  assessmentDate: '2026-11-12',
  assessmentType: 'expansion',
  industryVertical: 'financial_services',
  planningHorizonYears: 5,
  licensedEntitlementGb: 6144, // 6 TB (min requirement for financial_services + expansion)
  currentConsumedGb: 1250,
  targetBufferPercent: 20,
  notes: 'Sizing multi-year storage trajectory incorporating ITOM Discovery expansion, ITSM fulfillers growth, and HRSD launch. Commercial goal is to evaluate if licensed entitlement suffices through Year 3.',
};

export const SERVICENOW_PORTFOLIO_CATALOG: ServiceNowProductInfo[] = [
  // 1. IT Service Management (ITSM)
  {
    id: 'itsm',
    name: 'IT Service Management (ITSM)',
    shortCode: 'ITSM',
    family: 'IT Workflows',
    description: 'Core IT service delivery platform consolidating ticketing, self-service portals, CMDB, and knowledge.',
    iconName: 'Layers',
    modules: [
      { id: 'incident', name: 'Incident Management', description: 'Restores normal service operation swiftly with minimum disruption.', primaryTable: 'incident', typicalRecordKb: 12.0 },
      { id: 'problem', name: 'Problem Management', description: 'Prevents incidents and identifies underlying root causes.', primaryTable: 'problem', typicalRecordKb: 15.0 },
      { id: 'change', name: 'Change Enablement', description: 'Controls lifecycle of all planned infrastructure and app changes.', primaryTable: 'change_request', typicalRecordKb: 18.0 },
      { id: 'request', name: 'Request Management & Catalog', description: 'Service catalog requests, requested items (RITM), and task fulfillment.', primaryTable: 'sc_req_item', typicalRecordKb: 14.0 },
      { id: 'knowledge', name: 'Knowledge Management', description: 'Authoring, categorizing, reviewing, and publishing self-help knowledge articles.', primaryTable: 'kb_knowledge', typicalRecordKb: 24.0 },
      { id: 'slm', name: 'Service Level Management (SLM)', description: 'Tracks SLA contracts, breaches, elapsed times, and notifications.', primaryTable: 'task_sla', typicalRecordKb: 4.0 },
      { id: 'virtual_agent', name: 'Virtual Agent & AI Search', description: 'Automated conversational bot sessions and AI Search indexing.', primaryTable: 'sys_cs_conversation', typicalRecordKb: 8.0 },
    ],
  },
  // 2. IT Operations Management (ITOM)
  {
    id: 'itom',
    name: 'IT Operations Management (ITOM)',
    shortCode: 'ITOM',
    family: 'IT Workflows',
    description: 'Discovers infrastructure, maps business services, correlates events, and predicts IT failures.',
    iconName: 'Server',
    modules: [
      { id: 'discovery', name: 'Discovery & CMDB Population', description: 'Agentless scanning of on-prem servers, storage, network, and software.', primaryTable: 'cmdb_ci', typicalRecordKb: 8.0 },
      { id: 'service_mapping', name: 'Service Mapping', description: 'Top-down service dependency topology connecting infrastructure to business apps.', primaryTable: 'cmdb_rel_ci', typicalRecordKb: 3.0 },
      { id: 'event_mgmt', name: 'Event Management', description: 'Raw event ingestion from monitoring tools (SolarWinds, Dynatrace, Datadog).', primaryTable: 'em_event', typicalRecordKb: 3.2 },
      { id: 'aiops_alerts', name: 'AIOps & Alert Aggregation', description: 'Correlates raw events into actionable alerts using machine learning.', primaryTable: 'em_alert', typicalRecordKb: 6.5 },
      { id: 'cloud_discovery', name: 'Cloud Operations & Cloud Discovery', description: 'AWS, Azure, and GCP resource inventory and provisioning governance.', primaryTable: 'cmdb_ci_cloud_service', typicalRecordKb: 7.0 },
      { id: 'health_logs', name: 'Health Log Analytics (HLA)', description: 'Anomaly detection via streaming log ingestion and log clustering.', primaryTable: 'sn_hla_log_record', typicalRecordKb: 2.5 },
    ],
  },
  // 3. IT Asset Management (ITAM)
  {
    id: 'itam',
    name: 'IT Asset Management (ITAM)',
    shortCode: 'ITAM',
    family: 'IT Workflows',
    description: 'Manages physical hardware, software licenses, SaaS subscriptions, and enterprise assets.',
    iconName: 'Cpu',
    modules: [
      { id: 'ham', name: 'Hardware Asset Management (HAM)', description: 'Tracks physical IT assets, lifecycles, stockrooms, and disposals.', primaryTable: 'alm_hardware', typicalRecordKb: 9.0 },
      { id: 'sam', name: 'Software Asset Management (SAM)', description: 'Reconciles software licenses, entitlements, and installed software publisher packs.', primaryTable: 'cmdb_sam_sw_install', typicalRecordKb: 4.0 },
      { id: 'eam', name: 'Enterprise Asset Management (EAM)', description: 'Manages non-IT clinical, manufacturing, and facilities equipment.', primaryTable: 'alm_facility', typicalRecordKb: 8.5 },
      { id: 'cloud_spend', name: 'Cloud Cost & SaaS Spend Management', description: 'Discovers underutilized cloud compute instances and SaaS user seats.', primaryTable: 'sn_spend_recommendation', typicalRecordKb: 5.0 },
    ],
  },
  // 4. Strategic Portfolio Management (SPM)
  {
    id: 'spm',
    name: 'Strategic Portfolio Management (SPM)',
    shortCode: 'SPM',
    family: 'IT Workflows',
    description: 'Aligns enterprise investments with strategy across programs, portfolios, demands, and agile releases.',
    iconName: 'FolderGit2',
    modules: [
      { id: 'ppm', name: 'Project & Portfolio Management (PPM)', description: 'Tracks project schedules, milestones, budgets, and portfolio rollups.', primaryTable: 'pm_project', typicalRecordKb: 22.0 },
      { id: 'demand', name: 'Demand Management', description: 'Centralizes business ideas, investment requests, and scoring assessments.', primaryTable: 'dmn_demand', typicalRecordKb: 12.0 },
      { id: 'apm', name: 'Application Portfolio Management (APM)', description: 'Catalogs enterprise application landscape, technology debt, and rationalization.', primaryTable: 'cmdb_ci_appl', typicalRecordKb: 11.0 },
      { id: 'agile', name: 'Agile Development & Alignment', description: 'Scrum/SAFe epics, user stories, sprints, backlogs, and alignment planner.', primaryTable: 'rm_story', typicalRecordKb: 6.5 },
      { id: 'time_card', name: 'Resource & Timesheet Tracking', description: 'Timesheet submissions, resource plans, and labor capitalization records.', primaryTable: 'time_card', typicalRecordKb: 3.5 },
    ],
  },
  // 5. Integrated Risk Management (IRM / GRC)
  {
    id: 'irm',
    name: 'Integrated Risk Management (IRM / GRC)',
    shortCode: 'IRM',
    family: 'IT Workflows',
    description: 'Continuous monitoring of enterprise compliance, operational risks, audits, and third-party vendors.',
    iconName: 'ShieldCheck',
    modules: [
      { id: 'compliance', name: 'Policy and Compliance Management', description: 'Maps regulatory authorities (ISO, NIST, SOX) to internal enterprise control tests.', primaryTable: 'sn_compliance_policy', typicalRecordKb: 14.0 },
      { id: 'risk', name: 'Risk Management', description: 'Risk identification, risk scoring matrices, mitigation plans, and risk events.', primaryTable: 'sn_risk_risk', typicalRecordKb: 16.0 },
      { id: 'audit', name: 'Audit Management', description: 'Internal and external audit engagements, workpapers, and finding remediations.', primaryTable: 'sn_audit_engagement', typicalRecordKb: 20.0 },
      { id: 'vendor_risk', name: 'Vendor Risk Management', description: 'Tiered third-party vendor assessments, SIG questionnaires, and remediation issues.', primaryTable: 'sn_vdr_risk_asmt', typicalRecordKb: 18.0 },
      { id: 'bcm', name: 'Business Continuity Management (BCM)', description: 'Business impact analyses (BIA), disaster recovery plans, and crisis exercises.', primaryTable: 'sn_bcm_plan', typicalRecordKb: 25.0 },
    ],
  },
  // 6. Security Operations (SecOps)
  {
    id: 'secops',
    name: 'Security Operations (SecOps)',
    shortCode: 'SecOps',
    family: 'IT Workflows',
    description: 'Accelerates threat response by connecting security tool telemetry to ServiceNow IT and asset context.',
    iconName: 'ShieldAlert',
    modules: [
      { id: 'sir', name: 'Security Incident Response (SIR)', description: 'SOC incident triage, automated playbooks, containment, and post-incident reviews.', primaryTable: 'sn_si_incident', typicalRecordKb: 22.0 },
      { id: 'vr', name: 'Vulnerability Response (VR)', description: 'Ingests Tenable/Qualys/Rapid7 findings, prioritizes by business impact, orchestrates patching.', primaryTable: 'sn_vul_vulnerable_item', typicalRecordKb: 5.0 },
      { id: 'threat_intel', name: 'Threat Intelligence', description: 'STIX/TAXII threat feeds, IOC observables, and MITRE ATT&CK mapping.', primaryTable: 'sn_ti_misp_observable', typicalRecordKb: 6.0 },
      { id: 'msi', name: 'Major Security Incident Management', description: 'Executive crisis response, war room collaboration, and specialized evidence logs.', primaryTable: 'sn_si_msi_incident', typicalRecordKb: 26.0 },
    ],
  },
  // 7. Customer Service Management (CSM)
  {
    id: 'csm',
    name: 'Customer Service Management (CSM)',
    shortCode: 'CSM',
    family: 'Customer Workflows',
    description: 'Delivers omnichannel customer support, connects front, middle, and back-office teams to resolve root causes.',
    iconName: 'Users',
    modules: [
      { id: 'case_mgmt', name: 'Omnichannel Case Management', description: 'B2B and B2C customer service cases, SLA tracking, and resolution workflows.', primaryTable: 'sn_customerservice_case', typicalRecordKb: 16.5 },
      { id: 'customer_data', name: 'Customer & Account Data Model', description: 'B2B accounts, consumer profiles, contacts, relationships, and entitlements.', primaryTable: 'customer_account', typicalRecordKb: 5.0 },
      { id: 'interactions', name: 'Customer Omni-Interactions', description: 'Phone calls, chat transcripts, email interactions, and social queries.', primaryTable: 'interaction', typicalRecordKb: 8.5 },
      { id: 'awa', name: 'Advanced Work Assignment (AWA)', description: 'Skills-based intelligent routing across live chat, messaging, and cases.', primaryTable: 'awa_work_item', typicalRecordKb: 3.0 },
      { id: 'major_issues', name: 'Major Issue Management', description: 'Proactive communication to hundreds of affected customers for common outages.', primaryTable: 'sn_major_issue_case', typicalRecordKb: 18.0 },
    ],
  },
  // 8. Field Service Management (FSM)
  {
    id: 'fsm',
    name: 'Field Service Management (FSM)',
    shortCode: 'FSM',
    family: 'Customer Workflows',
    description: 'Dispatches field technicians, optimizes travel routes, manages truck inventory, and tracks work orders.',
    iconName: 'Truck',
    modules: [
      { id: 'work_orders', name: 'Work Order Management', description: 'Customer site installation, maintenance, and emergency repair orders.', primaryTable: 'wm_order', typicalRecordKb: 15.0 },
      { id: 'work_tasks', name: 'Work Order Tasks & Checklists', description: 'Discrete task steps, safety questionnaires, and technician signature captures.', primaryTable: 'wm_task', typicalRecordKb: 10.0 },
      { id: 'dispatch', name: 'Dynamic Scheduling & Dispatching', description: 'Automated geospatial dispatching, schedule windows, and technician routing.', primaryTable: 'cmn_schedule', typicalRecordKb: 4.0 },
      { id: 'parts_inv', name: 'Mobile Inventory & Parts Tracking', description: 'Trunk stock, part requirements, transfer orders, and defective returns.', primaryTable: 'sm_part_requirement', typicalRecordKb: 5.5 },
    ],
  },
  // 9. HR Service Delivery (HRSD)
  {
    id: 'hrsd',
    name: 'HR Service Delivery (HRSD)',
    shortCode: 'HRSD',
    family: 'Employee Workflows',
    description: 'Empowers employees with consumer-grade service center, automated onboarding journeys, and confidential HR cases.',
    iconName: 'Users',
    modules: [
      { id: 'hr_cases', name: 'HR Case Management (COEs)', description: 'Confidential HR cases across Total Rewards, Payroll, and HR Operations.', primaryTable: 'sn_hr_core_case', typicalRecordKb: 14.5 },
      { id: 'employee_center', name: 'Employee Center & Profile', description: 'Unified enterprise employee portal, worker profiles, and personal data.', primaryTable: 'sn_hr_core_profile', typicalRecordKb: 6.0 },
      { id: 'lifecycle_events', name: 'Lifecycle Events (Onboard / Offboard)', description: 'Cross-departmental transition bundles for new hires, transfers, and retirements.', primaryTable: 'sn_hr_le_case', typicalRecordKb: 18.0 },
      { id: 'doc_mgmt', name: 'Employee Document Management', description: 'Electronic employee personnel files, retention policies, and e-signatures.', primaryTable: 'sn_hr_ef_document', typicalRecordKb: 8.0 },
      { id: 'employee_relations', name: 'Employee Relations & Investigations', description: 'Strictly siloed disciplinary investigations, grievances, and ethics cases.', primaryTable: 'sn_hr_er_case', typicalRecordKb: 16.0 },
    ],
  },
  // 10. Workplace Service Delivery (WSD)
  {
    id: 'wsd',
    name: 'Workplace Service Delivery (WSD)',
    shortCode: 'WSD',
    family: 'Employee Workflows',
    description: 'Enables flexible hybrid work with desk booking, meeting room reservations, space planning, and visitor management.',
    iconName: 'Building',
    modules: [
      { id: 'reservations', name: 'Workplace Reservation Management', description: 'Desk, locker, parking, and meeting room self-service reservations.', primaryTable: 'sn_wsd_core_reservation', typicalRecordKb: 6.0 },
      { id: 'space_mgmt', name: 'Space Allocation & Floorplans', description: 'CAD floorplan ingestion, department space allocations, and occupancy heatmaps.', primaryTable: 'sn_wsd_core_space', typicalRecordKb: 7.0 },
      { id: 'workplace_cases', name: 'Workplace Service Requests', description: 'Facilities requests, catering, temperature control, and office reconfigurations.', primaryTable: 'sn_wsd_case_workplace_case', typicalRecordKb: 12.0 },
      { id: 'visitor', name: 'Workplace Visitor Management', description: 'Guest pre-registration, NDA e-sign, badge printing, and arrival notifications.', primaryTable: 'sn_wsd_visitor_invitation', typicalRecordKb: 5.0 },
    ],
  },
  // 11. Legal Service Delivery (LSD)
  {
    id: 'lsd',
    name: 'Legal Service Delivery (LSD)',
    shortCode: 'LSD',
    family: 'Employee Workflows',
    description: 'Centralizes internal legal inquiries, self-service NDAs, and matter management for general counsel teams.',
    iconName: 'Scale',
    modules: [
      { id: 'legal_requests', name: 'Legal Request Management', description: 'Self-service legal questions, contract review triage, and policy guidance.', primaryTable: 'sn_lg_ops_request', typicalRecordKb: 12.0 },
      { id: 'matters', name: 'Legal Matter Management', description: 'Complex litigation, intellectual property, antitrust, and dispute dossiers.', primaryTable: 'sn_lg_matter_matter', typicalRecordKb: 20.0 },
      { id: 'contracts', name: 'Legal Contracts & Standard NDAs', description: 'Standard agreement templates, redline reviews, and signatory workflows.', primaryTable: 'sn_lg_ops_contract', typicalRecordKb: 16.0 },
    ],
  },
  // 12. Procurement Service Management (PSM)
  {
    id: 'psm',
    name: 'Procurement Service Management (PSM)',
    shortCode: 'PSM',
    family: 'Employee Workflows',
    description: 'Transforms employee purchasing, sourcing requests, supplier onboarding, and invoice validation.',
    iconName: 'ShoppingBag',
    modules: [
      { id: 'sourcing_requests', name: 'Sourcing Request Management', description: 'Internal employee requests for goods, services, and new supplier engagements.', primaryTable: 'sn_shop_sourcing_request', typicalRecordKb: 14.0 },
      { id: 'procurement_ops', name: 'Sourcing & Procurement Operations', description: 'Purchase line verification, RFx event tracking, and approval matrices.', primaryTable: 'sn_psm_case', typicalRecordKb: 16.0 },
      { id: 'suppliers', name: 'Supplier Lifecycle & Onboarding', description: 'Supplier profile database, compliance records, and performance scores.', primaryTable: 'sn_supplier_profile', typicalRecordKb: 10.0 },
    ],
  },
  // 13. App Engine (Creator Workflows)
  {
    id: 'customApps',
    name: 'App Engine (Custom Apps & Creator Workflows)',
    shortCode: 'App Engine',
    family: 'Creator Workflows',
    description: 'Low-code application platform enabling citizen and professional developers to build custom digital workflows.',
    iconName: 'FolderGit2',
    modules: [
      { id: 'custom_tables', name: 'Custom Application Tables', description: 'Custom extended tables (u_* and x_*) tailored to proprietary enterprise processes.', primaryTable: 'sys_db_object', typicalRecordKb: 10.0 },
      { id: 'creator_studio', name: 'Creator Studio & Form Builder', description: 'Visual citizen developer workspace with forms, record creators, and views.', primaryTable: 'sys_ui_form', typicalRecordKb: 4.5 },
      { id: 'flow_designer', name: 'Flow Designer & Process Automation', description: 'Automated flow execution contexts, subflows, action steps, and run history.', primaryTable: 'sys_flow_context', typicalRecordKb: 12.0 },
    ],
  },
  // 14. Automation Engine
  {
    id: 'automationEngine',
    name: 'Automation Engine (Integration & RPA Hub)',
    shortCode: 'Auto Engine',
    family: 'Creator Workflows',
    description: 'Connects legacy systems and SaaS endpoints using Integration Hub spokes, RPA bots, and DocIntel AI extraction.',
    iconName: 'Zap',
    modules: [
      { id: 'integration_hub', name: 'Integration Hub & Spokes', description: 'Pre-built spokes, REST/SOAP outbound integrations, and execution payloads.', primaryTable: 'sys_hub_action_instance', typicalRecordKb: 7.0 },
      { id: 'rpa_hub', name: 'Robotic Process Automation (RPA Hub)', description: 'Unattended and attended robot bot execution runs and credential logs.', primaryTable: 'sn_rpa_bot_execution', typicalRecordKb: 8.0 },
      { id: 'docintel', name: 'Document Intelligence (DocIntel)', description: 'AI OCR parsing of invoices, receipts, and structured PDF forms.', primaryTable: 'sn_docintel_task', typicalRecordKb: 15.0 },
    ],
  },
  // 15. Industry Solutions
  {
    id: 'industrySolutions',
    name: 'Industry Solutions (FSO, HCLS, PSDS, TSM)',
    shortCode: 'Industry Solutions',
    family: 'Industry Solutions',
    description: 'Pre-packaged industry operating models tailored for Financial Services, Healthcare, Public Sector, and Telco.',
    iconName: 'Globe',
    modules: [
      { id: 'fso', name: 'Financial Services Operations (FSO)', description: 'Card disputes, account servicing, loan origination, and KYC workflows.', primaryTable: 'sn_fso_case', typicalRecordKb: 18.0 },
      { id: 'hcls', name: 'Healthcare & Life Sciences (HCLS)', description: 'Patient support programs, clinical trial requests, and medical device service.', primaryTable: 'sn_hcls_case', typicalRecordKb: 18.0 },
      { id: 'psds', name: 'Public Sector Digital Services (PSDS)', description: 'Constituent service requests, business licenses, and agency casework.', primaryTable: 'sn_psds_case', typicalRecordKb: 16.0 },
      { id: 'tsm', name: 'Telecommunications Service Management (TSM)', description: 'Telco trouble ticketing, network service assurance, and subscriber orders.', primaryTable: 'sn_tsm_case', typicalRecordKb: 17.0 },
    ],
  },
];

export const INITIAL_WORKLOADS: ProductWorkloads = {
  itsm: {
    enabled: true,
    activeModules: ['incident', 'problem', 'change', 'request', 'knowledge', 'slm', 'virtual_agent'],
    fulfillers: 850,
    endUsers: 24000,
    monthlyIncidents: 6200,
    monthlyRequests: 8400,
    monthlyChanges: 420,
    monthlyProblems: 45,
    kbArticles: 1800,
    cmdbCis: 45000,
  },
  itom: {
    enabled: true,
    activeModules: ['discovery', 'service_mapping', 'event_mgmt', 'aiops_alerts', 'cloud_discovery'],
    discoveredDevices: 32000,
    cloudResources: 18000,
    dailyEvents: 95000,
    dailyAlerts: 1800,
    metricRetentionDays: 30,
  },
  itam: {
    enabled: false,
    activeModules: ['ham', 'sam'],
    hardwareAssets: 25000,
    softwareModels: 1200,
    activeSoftwareInstalls: 85000,
    contractsAndLeases: 450,
  },
  spm: {
    enabled: false,
    activeModules: ['ppm', 'demand', 'agile'],
    annualProjects: 120,
    annualDemands: 350,
    monthlyStories: 3500,
    weeklyTimesheets: 950,
    applicationsManaged: 420,
  },
  irm: {
    enabled: false,
    activeModules: ['compliance', 'risk', 'audit'],
    compliancePolicies: 350,
    controlsManaged: 2800,
    annualRiskAssessments: 1200,
    annualAudits: 65,
    vendorsManaged: 350,
  },
  secops: {
    enabled: true,
    activeModules: ['sir', 'vr', 'threat_intel'],
    monthlySecurityIncidents: 180,
    monthlyVulnerableItems: 38000,
    scansPerWeek: 4,
    threatIndicators: 15000,
  },
  csm: {
    enabled: false,
    activeModules: ['case_mgmt', 'customer_data', 'interactions'],
    customerContacts: 150000,
    customerAccounts: 1200,
    monthlyCases: 8500,
    monthlyInteractions: 5000,
  },
  fsm: {
    enabled: false,
    activeModules: ['work_orders', 'work_tasks', 'dispatch'],
    fieldAgents: 250,
    monthlyWorkOrders: 4200,
    monthlyTasksPerOrder: 2.4,
    managedPartsInventory: 15000,
  },
  hrsd: {
    enabled: true,
    activeModules: ['hr_cases', 'employee_center', 'lifecycle_events'],
    coveredEmployees: 22000,
    turnoverRatePercent: 12,
    annualCases: 28000,
    annualLifecycles: 2600,
  },
  wsd: {
    enabled: false,
    activeModules: ['reservations', 'space_mgmt', 'workplace_cases'],
    managedWorkplaces: 14,
    managedDesksAndRooms: 3500,
    monthlyReservations: 12000,
    monthlyWorkplaceRequests: 1800,
    monthlyVisitors: 2400,
  },
  lsd: {
    enabled: false,
    activeModules: ['legal_requests', 'matters'],
    monthlyLegalRequests: 450,
    annualLegalMatters: 180,
    legalContractsManaged: 2200,
  },
  psm: {
    enabled: false,
    activeModules: ['sourcing_requests', 'procurement_ops', 'suppliers'],
    monthlySourcingRequests: 850,
    annualPurchaseOrders: 4200,
    suppliersManaged: 1100,
  },
  customApps: {
    enabled: false,
    activeModules: ['custom_tables', 'creator_studio'],
    tableCount: 6,
    monthlyTransactions: 35000,
    avgRecordSizeKb: 10,
  },
  automationEngine: {
    enabled: false,
    activeModules: ['integration_hub', 'rpa_hub', 'docintel'],
    monthlyIntegrationTransactions: 120000,
    monthlyRpaBotRuns: 8500,
    monthlyDocIntelPages: 4500,
  },
  industrySolutions: {
    enabled: false,
    activeModules: ['fso'],
    verticalType: 'financial_services',
    monthlyIndustryCases: 4500,
    activeSpecializedEntities: 12000,
  },
};

export const INITIAL_ASSUMPTIONS: TechnicalAssumptions = {
  recordSizes: { ...DEFAULT_RECORD_SIZES },
  auditFactorPercent: 45, // sys_audit + sys_journal adds 45% to transactional DB
  activeRetentionMonths: 36, // 3-year transactional lifecycle before archiving
  auditRetentionMonths: 24, // 2-year audit log retention
  eventRetentionDays: 14, // 14-day raw event retention (ServiceNow standard)
  annualGrowthRate: 0.15, // 15% compound annual growth
  attachmentRatePercent: 28, // 28% of transactional tickets include attachments
  avgAttachmentsPerRecord: 1.35, // Average files per ticket when present
  avgAttachmentSizeKb: 850, // 850 KB average attachment size (screenshots, PDFs, logs)
  legacyRecords: 450000, // Migrated legacy tickets
  legacyAttachmentGb: 180, // Migrated attachments
  migrationYear: 1, // Year 1 Day-1 baseline
};

export const INITIAL_ENVIRONMENTS: EnvironmentConfig = {
  excludeAttachmentsNonProd: true, // Recommended best practice
  truncateAuditNonProd: true,
  nonProdInstances: [
    {
      id: 'env-dev',
      name: 'Development (DEV)',
      type: 'DEV',
      dataScalePercent: 30,
      includeAttachments: false,
      purpose: 'Core development, agile sprints, and catalog configuration',
    },
    {
      id: 'env-test',
      name: 'Testing / QA (TEST)',
      type: 'TEST',
      dataScalePercent: 60,
      includeAttachments: false,
      purpose: 'Functional testing, integration testing, and automated ATF runs',
    },
    {
      id: 'env-stage',
      name: 'Staging / Pre-PROD (STAGE)',
      type: 'STAGE',
      dataScalePercent: 100,
      includeAttachments: true,
      purpose: 'Full-fidelity release verification, performance testing, and UAT',
    },
    {
      id: 'env-sandbox',
      name: 'Training & Sandbox (SANDBOX)',
      type: 'SANDBOX',
      dataScalePercent: 20,
      includeAttachments: false,
      purpose: 'End-user training, prototype sandbox, and release preview',
    },
  ],
};

// Preset Archetypes for 1-Click Discovery Auto-Population
export interface ArchetypePreset {
  id: string;
  name: string;
  description: string;
  vertical: IndustryVertical;
  horizon: number;
  workloads: Partial<ProductWorkloads>;
  setupPatch: Partial<EngagementSetup>;
}

export const ARCHETYPE_PRESETS: ArchetypePreset[] = [
  {
    id: 'preset-fintech',
    name: 'Global Financial Institution',
    description: 'High audit overhead, strict compliance, deep ITOM discovery, SecOps vulnerability scanning, 35k employees.',
    vertical: 'financial_services',
    horizon: 5,
    setupPatch: {
      clientName: 'Barclay & Stone International',
      assessmentType: 'expansion',
      licensedEntitlementGb: 6144, // 6 TB
      currentConsumedGb: 1800,
    },
    workloads: {
      itsm: {
        enabled: true,
        fulfillers: 1200,
        endUsers: 38000,
        monthlyIncidents: 11000,
        monthlyRequests: 14500,
        monthlyChanges: 850,
        monthlyProblems: 75,
        kbArticles: 3200,
        cmdbCis: 85000,
      },
      itom: {
        enabled: true,
        discoveredDevices: 65000,
        cloudResources: 42000,
        dailyEvents: 180000,
        dailyAlerts: 3200,
        metricRetentionDays: 30,
      },
      secops: {
        enabled: true,
        monthlySecurityIncidents: 350,
        monthlyVulnerableItems: 75000,
        scansPerWeek: 7,
      },
      hrsd: {
        enabled: true,
        coveredEmployees: 35000,
        turnoverRatePercent: 10,
        annualCases: 42000,
        annualLifecycles: 3500,
      },
    },
  },
  {
    id: 'preset-healthcare',
    name: 'Regional Healthcare Network',
    description: 'Heavy CSM patient/member cases, high attachment densities (medical documents), HRSD onboarding, 28k employees.',
    vertical: 'healthcare',
    horizon: 5,
    setupPatch: {
      clientName: 'Providence Valley Health System',
      assessmentType: 'new_implementation',
      licensedEntitlementGb: 4096,
      currentConsumedGb: 0,
    },
    workloads: {
      itsm: {
        enabled: true,
        fulfillers: 650,
        endUsers: 28000,
        monthlyIncidents: 7500,
        monthlyRequests: 9200,
        monthlyChanges: 280,
        monthlyProblems: 35,
        kbArticles: 2100,
        cmdbCis: 38000,
      },
      csm: {
        enabled: true,
        customerContacts: 350000,
        customerAccounts: 4500,
        monthlyCases: 16000,
        monthlyInteractions: 12000,
      },
      hrsd: {
        enabled: true,
        coveredEmployees: 28000,
        turnoverRatePercent: 14,
        annualCases: 36000,
        annualLifecycles: 4200,
      },
    },
  },
  {
    id: 'preset-tech-saas',
    name: 'Fast-Growth Cloud Technology',
    description: 'Cloud-native CMDB, high 25% annual growth, Strategic Portfolio Management (SPM), custom scoped applications.',
    vertical: 'technology',
    horizon: 3,
    setupPatch: {
      clientName: 'NovaCloud Systems Inc.',
      assessmentType: 'new_implementation',
      licensedEntitlementGb: 4096,
      currentConsumedGb: 0,
    },
    workloads: {
      itsm: {
        enabled: true,
        fulfillers: 450,
        endUsers: 12000,
        monthlyIncidents: 3800,
        monthlyRequests: 5400,
        monthlyChanges: 650,
        monthlyProblems: 50,
        kbArticles: 1400,
        cmdbCis: 55000,
      },
      spm: {
        enabled: true,
        annualProjects: 180,
        annualDemands: 450,
        monthlyStories: 6500,
        weeklyTimesheets: 1400,
      },
      customApps: {
        enabled: true,
        tableCount: 12,
        monthlyTransactions: 80000,
        avgRecordSizeKb: 12,
      },
    },
  },
  {
    id: 'preset-midmarket',
    name: 'Mid-Market Corporate',
    description: 'Lean ITSM core + HRSD, moderate growth (10%), standard 3-year capacity planning horizon.',
    vertical: 'retail',
    horizon: 3,
    setupPatch: {
      clientName: 'Apex Brands Retail Corp',
      assessmentType: 'migration',
      licensedEntitlementGb: 2048, // 2 TB
      currentConsumedGb: 650,
    },
    workloads: {
      itsm: {
        enabled: true,
        fulfillers: 280,
        endUsers: 9500,
        monthlyIncidents: 2400,
        monthlyRequests: 3200,
        monthlyChanges: 140,
        monthlyProblems: 18,
        kbArticles: 850,
        cmdbCis: 16000,
      },
      hrsd: {
        enabled: true,
        coveredEmployees: 9500,
        turnoverRatePercent: 18,
        annualCases: 14000,
        annualLifecycles: 1800,
      },
    },
  },
];

export const INITIAL_PRESET_SCENARIOS: Scenario[] = [
  {
    id: 'scenario-baseline',
    name: 'Baseline (Presales Recommended)',
    description: 'Recommended architecture with 36-month active retention, 24-month audit rotation, and Non-PROD attachment exclusion active.',
    isBaseline: true,
    createdAt: '2026-11-12T07:00:00.000Z',
    setup: { ...INITIAL_SETUP },
    workloads: { ...INITIAL_WORKLOADS },
    assumptions: { ...INITIAL_ASSUMPTIONS },
    environments: { ...INITIAL_ENVIRONMENTS },
  },
  {
    id: 'scenario-unrestricted',
    name: 'Unrestricted Retention & Non-PROD Attachments',
    description: 'Worst-case high-growth scenario: 60-month retention, no audit archiving, and full attachment replication across all Non-PROD instances.',
    isBaseline: false,
    createdAt: '2026-11-12T07:05:00.000Z',
    setup: {
      ...INITIAL_SETUP,
      notes: 'Stress test scenario modeling unrestricted storage consumption.',
    },
    workloads: { ...INITIAL_WORKLOADS },
    assumptions: {
      ...INITIAL_ASSUMPTIONS,
      activeRetentionMonths: 60,
      auditRetentionMonths: 48,
      annualGrowthRate: 0.22,
    },
    environments: {
      ...INITIAL_ENVIRONMENTS,
      excludeAttachmentsNonProd: false,
      nonProdInstances: INITIAL_ENVIRONMENTS.nonProdInstances.map((e) => ({
        ...e,
        includeAttachments: true,
        dataScalePercent: Math.min(100, e.dataScalePercent * 1.4),
      })),
    },
  },
  {
    id: 'scenario-optimized',
    name: 'Storage-Optimized (Archiving & Governed Attachments)',
    description: 'Aggressive storage governance: 24-month task archiving, 12-month audit rotation, 500 KB average attachment ceiling, and trimmed sub-prods.',
    isBaseline: false,
    createdAt: '2026-11-12T07:10:00.000Z',
    setup: {
      ...INITIAL_SETUP,
      notes: 'Cost-containment scenario designed to keep storage footprint within standard 4TB license ceiling.',
    },
    workloads: { ...INITIAL_WORKLOADS },
    assumptions: {
      ...INITIAL_ASSUMPTIONS,
      activeRetentionMonths: 24,
      auditRetentionMonths: 12,
      avgAttachmentSizeKb: 550,
      eventRetentionDays: 7,
    },
    environments: {
      ...INITIAL_ENVIRONMENTS,
      excludeAttachmentsNonProd: true,
      nonProdInstances: [
        { ...INITIAL_ENVIRONMENTS.nonProdInstances[0], dataScalePercent: 20 },
        { ...INITIAL_ENVIRONMENTS.nonProdInstances[1], dataScalePercent: 40 },
        { ...INITIAL_ENVIRONMENTS.nonProdInstances[2], dataScalePercent: 80 },
        { ...INITIAL_ENVIRONMENTS.nonProdInstances[3], dataScalePercent: 15 },
      ],
    },
  },
];
