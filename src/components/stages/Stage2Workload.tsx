import React, { useState, useMemo } from 'react';
import {
  Layers,
  Server,
  Cpu,
  FolderGit2,
  ShieldCheck,
  ShieldAlert,
  Users,
  Truck,
  Building,
  Scale,
  ShoppingBag,
  Zap,
  Globe,
  Search,
  Check,
  Filter,
  Sparkles,
  Database,
  ArrowRight,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Table,
  CheckSquare,
  Square,
} from 'lucide-react';
import {
  ProductWorkloads,
  WorkflowFamily,
  ServiceNowProductInfo,
} from '../../types/calculator';
import { SERVICENOW_PORTFOLIO_CATALOG } from '../../constants/benchmarks';

interface Stage2WorkloadProps {
  workloads: ProductWorkloads;
  onUpdateWorkloads: (patch: Partial<ProductWorkloads>) => void;
  onNext: () => void;
  onPrev: () => void;
}

export const Stage2Workload: React.FC<Stage2WorkloadProps> = ({
  workloads,
  onUpdateWorkloads,
  onNext,
  onPrev,
}) => {
  const [selectedFamily, setSelectedFamily] = useState<WorkflowFamily | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({
    itsm: true,
    itom: true,
  });

  const updateProduct = <K extends keyof ProductWorkloads>(
    key: K,
    patch: Partial<ProductWorkloads[K]>
  ) => {
    onUpdateWorkloads({
      [key]: {
        ...(workloads[key] || {}),
        ...patch,
      },
    });
  };

  const toggleModule = (productId: keyof ProductWorkloads, moduleId: string) => {
    const currentList = workloads[productId]?.activeModules || [];
    const exists = currentList.includes(moduleId);
    const updated = exists
      ? currentList.filter((m) => m !== moduleId)
      : [...currentList, moduleId];

    updateProduct(productId, { activeModules: updated });
  };

  const toggleAllModulesForProduct = (product: ServiceNowProductInfo) => {
    const currentList = workloads[product.id]?.activeModules || [];
    const allModuleIds = product.modules.map((m) => m.id);
    const areAllActive = allModuleIds.every((id) => currentList.includes(id));
    const updated = areAllActive ? [] : allModuleIds;

    updateProduct(product.id, { activeModules: updated });
  };

  const toggleExpand = (productId: string) => {
    setExpandedModules((prev) => ({
      ...prev,
      [productId]: !prev[productId],
    }));
  };

  // Quick bundle selection presets
  const applyWorkflowBundle = (bundle: 'CORE_IT' | 'ENTERPRISE_IT' | 'EMPLOYEE' | 'CUSTOMER' | 'ALL') => {
    const patch: Partial<ProductWorkloads> = {};

    SERVICENOW_PORTFOLIO_CATALOG.forEach((p) => {
      let enable = false;
      if (bundle === 'ALL') {
        enable = true;
      } else if (bundle === 'CORE_IT') {
        enable = p.id === 'itsm' || p.id === 'itom';
      } else if (bundle === 'ENTERPRISE_IT') {
        enable = ['itsm', 'itom', 'itam', 'spm', 'irm', 'secops'].includes(p.id);
      } else if (bundle === 'EMPLOYEE') {
        enable = ['hrsd', 'wsd', 'lsd', 'psm'].includes(p.id);
      } else if (bundle === 'CUSTOMER') {
        enable = ['csm', 'fsm'].includes(p.id);
      }

      patch[p.id] = {
        ...workloads[p.id],
        enabled: enable,
        activeModules: enable
          ? workloads[p.id]?.activeModules?.length
            ? workloads[p.id].activeModules
            : p.modules.map((m) => m.id)
          : workloads[p.id]?.activeModules,
      } as any;
    });

    onUpdateWorkloads(patch);
  };

  // Filtered products based on workflow family and search term
  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return SERVICENOW_PORTFOLIO_CATALOG.filter((prod) => {
      const matchesFamily = selectedFamily === 'ALL' || prod.family === selectedFamily;
      if (!matchesFamily) return false;

      if (!q) return true;

      const matchesName = prod.name.toLowerCase().includes(q) || prod.shortCode.toLowerCase().includes(q);
      const matchesDesc = prod.description.toLowerCase().includes(q);
      const matchesModule = prod.modules.some(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.primaryTable.toLowerCase().includes(q) ||
          m.description.toLowerCase().includes(q)
      );

      return matchesName || matchesDesc || matchesModule;
    });
  }, [selectedFamily, searchQuery]);

  // Overall Catalog Statistics
  const activeProductsCount = useMemo(() => {
    return SERVICENOW_PORTFOLIO_CATALOG.filter((p) => workloads[p.id]?.enabled).length;
  }, [workloads]);

  const activeModulesCount = useMemo(() => {
    let count = 0;
    SERVICENOW_PORTFOLIO_CATALOG.forEach((p) => {
      if (workloads[p.id]?.enabled) {
        count += (workloads[p.id]?.activeModules || p.modules.map((m) => m.id)).length;
      }
    });
    return count;
  }, [workloads]);

  const totalCatalogModulesCount = useMemo(() => {
    return SERVICENOW_PORTFOLIO_CATALOG.reduce((acc, p) => acc + p.modules.length, 0);
  }, []);

  const getProductIcon = (iconName: string, enabled: boolean) => {
    const className = `w-4 h-4 ${enabled ? 'text-white' : 'text-slate-500'}`;
    switch (iconName) {
      case 'Layers':
        return <Layers className={className} />;
      case 'Server':
        return <Server className={className} />;
      case 'Cpu':
        return <Cpu className={className} />;
      case 'FolderGit2':
        return <FolderGit2 className={className} />;
      case 'ShieldCheck':
        return <ShieldCheck className={className} />;
      case 'ShieldAlert':
        return <ShieldAlert className={className} />;
      case 'Users':
        return <Users className={className} />;
      case 'Truck':
        return <Truck className={className} />;
      case 'Building':
        return <Building className={className} />;
      case 'Scale':
        return <Scale className={className} />;
      case 'ShoppingBag':
        return <ShoppingBag className={className} />;
      case 'Zap':
        return <Zap className={className} />;
      case 'Globe':
        return <Globe className={className} />;
      default:
        return <Layers className={className} />;
    }
  };

  const getProductColor = (id: string, enabled: boolean) => {
    if (!enabled) return 'bg-slate-300';
    switch (id) {
      case 'itsm':
        return 'bg-blue-600';
      case 'itom':
        return 'bg-cyan-600';
      case 'itam':
        return 'bg-indigo-600';
      case 'spm':
        return 'bg-purple-600';
      case 'irm':
        return 'bg-emerald-600';
      case 'secops':
        return 'bg-rose-600';
      case 'csm':
        return 'bg-teal-600';
      case 'fsm':
        return 'bg-amber-600';
      case 'hrsd':
        return 'bg-pink-600';
      case 'wsd':
        return 'bg-emerald-700';
      case 'lsd':
        return 'bg-violet-600';
      case 'psm':
        return 'bg-sky-600';
      case 'customApps':
        return 'bg-orange-600';
      case 'automationEngine':
        return 'bg-amber-500';
      case 'industrySolutions':
        return 'bg-blue-700';
      default:
        return 'bg-slate-700';
    }
  };

  const renderProductInputs = (product: ServiceNowProductInfo) => {
    const id = product.id;
    const w = (workloads[id] || {}) as any;

    switch (id) {
      case 'itsm':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                IT Fulfillers / Agents
              </label>
              <input
                type="number"
                min="0"
                value={w.fulfillers || 0}
                onChange={(e) => updateProduct('itsm', { fulfillers: Math.max(0, parseInt(e.target.value) || 0) })}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md font-mono tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                End Users Population
              </label>
              <input
                type="number"
                min="0"
                value={w.endUsers || 0}
                onChange={(e) => updateProduct('itsm', { endUsers: Math.max(0, parseInt(e.target.value) || 0) })}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md font-mono tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Monthly Incidents (incident)
              </label>
              <input
                type="number"
                min="0"
                value={w.monthlyIncidents || 0}
                onChange={(e) => updateProduct('itsm', { monthlyIncidents: Math.max(0, parseInt(e.target.value) || 0) })}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md font-mono tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Monthly Requests (sc_req_item)
              </label>
              <input
                type="number"
                min="0"
                value={w.monthlyRequests || 0}
                onChange={(e) => updateProduct('itsm', { monthlyRequests: Math.max(0, parseInt(e.target.value) || 0) })}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md font-mono tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Monthly Changes (change_request)
              </label>
              <input
                type="number"
                min="0"
                value={w.monthlyChanges || 0}
                onChange={(e) => updateProduct('itsm', { monthlyChanges: Math.max(0, parseInt(e.target.value) || 0) })}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md font-mono tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Monthly Problems (problem)
              </label>
              <input
                type="number"
                min="0"
                value={w.monthlyProblems || 0}
                onChange={(e) => updateProduct('itsm', { monthlyProblems: Math.max(0, parseInt(e.target.value) || 0) })}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md font-mono tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Knowledge Articles (kb_knowledge)
              </label>
              <input
                type="number"
                min="0"
                value={w.kbArticles || 0}
                onChange={(e) => updateProduct('itsm', { kbArticles: Math.max(0, parseInt(e.target.value) || 0) })}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md font-mono tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                CMDB Baseline CIs (cmdb_ci)
              </label>
              <input
                type="number"
                min="0"
                value={w.cmdbCis || 0}
                onChange={(e) => updateProduct('itsm', { cmdbCis: Math.max(0, parseInt(e.target.value) || 0) })}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md font-mono tabular-nums"
              />
            </div>
          </div>
        );

      case 'itom':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Discovered Physical/VM Devices
              </label>
              <input
                type="number"
                min="0"
                value={w.discoveredDevices || 0}
                onChange={(e) => updateProduct('itom', { discoveredDevices: Math.max(0, parseInt(e.target.value) || 0) })}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md font-mono tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Discovered Cloud Resources (AWS/Azure/GCP)
              </label>
              <input
                type="number"
                min="0"
                value={w.cloudResources || 0}
                onChange={(e) => updateProduct('itom', { cloudResources: Math.max(0, parseInt(e.target.value) || 0) })}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md font-mono tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Daily Ingested Events (em_event)
              </label>
              <input
                type="number"
                min="0"
                value={w.dailyEvents || 0}
                onChange={(e) => updateProduct('itom', { dailyEvents: Math.max(0, parseInt(e.target.value) || 0) })}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md font-mono tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Daily Correlated Alerts (em_alert)
              </label>
              <input
                type="number"
                min="0"
                value={w.dailyAlerts || 0}
                onChange={(e) => updateProduct('itom', { dailyAlerts: Math.max(0, parseInt(e.target.value) || 0) })}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md font-mono tabular-nums"
              />
            </div>
          </div>
        );

      case 'itam':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Tracked Hardware Assets (alm_hardware)
              </label>
              <input
                type="number"
                min="0"
                value={w.hardwareAssets || 0}
                onChange={(e) => updateProduct('itam', { hardwareAssets: Math.max(0, parseInt(e.target.value) || 0) })}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md font-mono tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Software Models & Publishers
              </label>
              <input
                type="number"
                min="0"
                value={w.softwareModels || 0}
                onChange={(e) => updateProduct('itam', { softwareModels: Math.max(0, parseInt(e.target.value) || 0) })}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md font-mono tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Discovered Software Installs (SAM)
              </label>
              <input
                type="number"
                min="0"
                value={w.activeSoftwareInstalls || 0}
                onChange={(e) => updateProduct('itam', { activeSoftwareInstalls: Math.max(0, parseInt(e.target.value) || 0) })}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md font-mono tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Contracts, Leases & Entitlements
              </label>
              <input
                type="number"
                min="0"
                value={w.contractsAndLeases || 0}
                onChange={(e) => updateProduct('itam', { contractsAndLeases: Math.max(0, parseInt(e.target.value) || 0) })}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md font-mono tabular-nums"
              />
            </div>
          </div>
        );

      case 'spm':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Annual Capital Projects (pm_project)
              </label>
              <input
                type="number"
                min="0"
                value={w.annualProjects || 0}
                onChange={(e) => updateProduct('spm', { annualProjects: Math.max(0, parseInt(e.target.value) || 0) })}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md font-mono tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Annual Demands (dmn_demand)
              </label>
              <input
                type="number"
                min="0"
                value={w.annualDemands || 0}
                onChange={(e) => updateProduct('spm', { annualDemands: Math.max(0, parseInt(e.target.value) || 0) })}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md font-mono tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Monthly Agile Stories (rm_story)
              </label>
              <input
                type="number"
                min="0"
                value={w.monthlyStories || 0}
                onChange={(e) => updateProduct('spm', { monthlyStories: Math.max(0, parseInt(e.target.value) || 0) })}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md font-mono tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Weekly Timesheets (time_card)
              </label>
              <input
                type="number"
                min="0"
                value={w.weeklyTimesheets || 0}
                onChange={(e) => updateProduct('spm', { weeklyTimesheets: Math.max(0, parseInt(e.target.value) || 0) })}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md font-mono tabular-nums"
              />
            </div>
          </div>
        );

      case 'irm':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Compliance Policies & Mandates
              </label>
              <input
                type="number"
                min="0"
                value={w.compliancePolicies || 0}
                onChange={(e) => updateProduct('irm', { compliancePolicies: Math.max(0, parseInt(e.target.value) || 0) })}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md font-mono tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Active Control Test Instances
              </label>
              <input
                type="number"
                min="0"
                value={w.controlsManaged || 0}
                onChange={(e) => updateProduct('irm', { controlsManaged: Math.max(0, parseInt(e.target.value) || 0) })}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md font-mono tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Annual Risk Assessments (sn_risk_risk)
              </label>
              <input
                type="number"
                min="0"
                value={w.annualRiskAssessments || 0}
                onChange={(e) => updateProduct('irm', { annualRiskAssessments: Math.max(0, parseInt(e.target.value) || 0) })}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md font-mono tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Third-Party Vendors Tracked (VRM)
              </label>
              <input
                type="number"
                min="0"
                value={w.vendorsManaged || 0}
                onChange={(e) => updateProduct('irm', { vendorsManaged: Math.max(0, parseInt(e.target.value) || 0) })}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md font-mono tabular-nums"
              />
            </div>
          </div>
        );

      case 'secops':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Monthly Security Incidents (SIR)
              </label>
              <input
                type="number"
                min="0"
                value={w.monthlySecurityIncidents || 0}
                onChange={(e) => updateProduct('secops', { monthlySecurityIncidents: Math.max(0, parseInt(e.target.value) || 0) })}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md font-mono tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Monthly Vulnerable Items (VR)
              </label>
              <input
                type="number"
                min="0"
                value={w.monthlyVulnerableItems || 0}
                onChange={(e) => updateProduct('secops', { monthlyVulnerableItems: Math.max(0, parseInt(e.target.value) || 0) })}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md font-mono tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Vulnerability Scans Ingested / Week
              </label>
              <input
                type="number"
                min="0"
                value={w.scansPerWeek || 0}
                onChange={(e) => updateProduct('secops', { scansPerWeek: Math.max(0, parseInt(e.target.value) || 0) })}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md font-mono tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Threat Intelligence Indicators (IOCs)
              </label>
              <input
                type="number"
                min="0"
                value={w.threatIndicators || 0}
                onChange={(e) => updateProduct('secops', { threatIndicators: Math.max(0, parseInt(e.target.value) || 0) })}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md font-mono tabular-nums"
              />
            </div>
          </div>
        );

      case 'csm':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Customer Contacts Registered
              </label>
              <input
                type="number"
                min="0"
                value={w.customerContacts || 0}
                onChange={(e) => updateProduct('csm', { customerContacts: Math.max(0, parseInt(e.target.value) || 0) })}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md font-mono tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Customer Accounts (B2B)
              </label>
              <input
                type="number"
                min="0"
                value={w.customerAccounts || 0}
                onChange={(e) => updateProduct('csm', { customerAccounts: Math.max(0, parseInt(e.target.value) || 0) })}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md font-mono tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Monthly Cases (sn_customerservice_case)
              </label>
              <input
                type="number"
                min="0"
                value={w.monthlyCases || 0}
                onChange={(e) => updateProduct('csm', { monthlyCases: Math.max(0, parseInt(e.target.value) || 0) })}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md font-mono tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Monthly Omnichannel Interactions
              </label>
              <input
                type="number"
                min="0"
                value={w.monthlyInteractions || 0}
                onChange={(e) => updateProduct('csm', { monthlyInteractions: Math.max(0, parseInt(e.target.value) || 0) })}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md font-mono tabular-nums"
              />
            </div>
          </div>
        );

      case 'fsm':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Active Field Technicians / Agents
              </label>
              <input
                type="number"
                min="0"
                value={w.fieldAgents || 0}
                onChange={(e) => updateProduct('fsm', { fieldAgents: Math.max(0, parseInt(e.target.value) || 0) })}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md font-mono tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Monthly Work Orders (wm_order)
              </label>
              <input
                type="number"
                min="0"
                value={w.monthlyWorkOrders || 0}
                onChange={(e) => updateProduct('fsm', { monthlyWorkOrders: Math.max(0, parseInt(e.target.value) || 0) })}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md font-mono tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Average Tasks per Work Order
              </label>
              <input
                type="number"
                step="0.1"
                min="1"
                value={w.monthlyTasksPerOrder || 2.2}
                onChange={(e) => updateProduct('fsm', { monthlyTasksPerOrder: Math.max(1, parseFloat(e.target.value) || 1) })}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md font-mono tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Truck Parts Inventory Records
              </label>
              <input
                type="number"
                min="0"
                value={w.managedPartsInventory || 0}
                onChange={(e) => updateProduct('fsm', { managedPartsInventory: Math.max(0, parseInt(e.target.value) || 0) })}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md font-mono tabular-nums"
              />
            </div>
          </div>
        );

      case 'hrsd':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Covered Global Employees
              </label>
              <input
                type="number"
                min="0"
                value={w.coveredEmployees || 0}
                onChange={(e) => updateProduct('hrsd', { coveredEmployees: Math.max(0, parseInt(e.target.value) || 0) })}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md font-mono tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Annual Turnover Rate (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={w.turnoverRatePercent || 0}
                onChange={(e) => updateProduct('hrsd', { turnoverRatePercent: Math.max(0, parseInt(e.target.value) || 0) })}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md font-mono tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Annual HR Cases (sn_hr_core_case)
              </label>
              <input
                type="number"
                min="0"
                value={w.annualCases || 0}
                onChange={(e) => updateProduct('hrsd', { annualCases: Math.max(0, parseInt(e.target.value) || 0) })}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md font-mono tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Annual Lifecycles (Onboarding/Transfers)
              </label>
              <input
                type="number"
                min="0"
                value={w.annualLifecycles || 0}
                onChange={(e) => updateProduct('hrsd', { annualLifecycles: Math.max(0, parseInt(e.target.value) || 0) })}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md font-mono tabular-nums"
              />
            </div>
          </div>
        );

      case 'wsd':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Managed Campus Workplaces / Buildings
              </label>
              <input
                type="number"
                min="0"
                value={w.managedWorkplaces || 0}
                onChange={(e) => updateProduct('wsd', { managedWorkplaces: Math.max(0, parseInt(e.target.value) || 0) })}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md font-mono tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Managed Desks & Meeting Rooms
              </label>
              <input
                type="number"
                min="0"
                value={w.managedDesksAndRooms || 0}
                onChange={(e) => updateProduct('wsd', { managedDesksAndRooms: Math.max(0, parseInt(e.target.value) || 0) })}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md font-mono tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Monthly Desk/Room Reservations
              </label>
              <input
                type="number"
                min="0"
                value={w.monthlyReservations || 0}
                onChange={(e) => updateProduct('wsd', { monthlyReservations: Math.max(0, parseInt(e.target.value) || 0) })}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md font-mono tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Monthly Workplace Service Requests
              </label>
              <input
                type="number"
                min="0"
                value={w.monthlyWorkplaceRequests || 0}
                onChange={(e) => updateProduct('wsd', { monthlyWorkplaceRequests: Math.max(0, parseInt(e.target.value) || 0) })}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md font-mono tabular-nums"
              />
            </div>
          </div>
        );

      case 'lsd':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Monthly Legal Requests (sn_lg_ops_request)
              </label>
              <input
                type="number"
                min="0"
                value={w.monthlyLegalRequests || 0}
                onChange={(e) => updateProduct('lsd', { monthlyLegalRequests: Math.max(0, parseInt(e.target.value) || 0) })}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md font-mono tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Annual Complex Legal Matters
              </label>
              <input
                type="number"
                min="0"
                value={w.annualLegalMatters || 0}
                onChange={(e) => updateProduct('lsd', { annualLegalMatters: Math.max(0, parseInt(e.target.value) || 0) })}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md font-mono tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Legal Contracts & NDAs Managed
              </label>
              <input
                type="number"
                min="0"
                value={w.legalContractsManaged || 0}
                onChange={(e) => updateProduct('lsd', { legalContractsManaged: Math.max(0, parseInt(e.target.value) || 0) })}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md font-mono tabular-nums"
              />
            </div>
          </div>
        );

      case 'psm':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Monthly Sourcing Requests (sn_shop_sourcing_request)
              </label>
              <input
                type="number"
                min="0"
                value={w.monthlySourcingRequests || 0}
                onChange={(e) => updateProduct('psm', { monthlySourcingRequests: Math.max(0, parseInt(e.target.value) || 0) })}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md font-mono tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Annual Purchase Orders Processed
              </label>
              <input
                type="number"
                min="0"
                value={w.annualPurchaseOrders || 0}
                onChange={(e) => updateProduct('psm', { annualPurchaseOrders: Math.max(0, parseInt(e.target.value) || 0) })}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md font-mono tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Registered Enterprise Suppliers (SLM)
              </label>
              <input
                type="number"
                min="0"
                value={w.suppliersManaged || 0}
                onChange={(e) => updateProduct('psm', { suppliersManaged: Math.max(0, parseInt(e.target.value) || 0) })}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md font-mono tabular-nums"
              />
            </div>
          </div>
        );

      case 'customApps':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Custom Table Count (u_* / x_*)
              </label>
              <input
                type="number"
                min="1"
                value={w.tableCount || 1}
                onChange={(e) => updateProduct('customApps', { tableCount: Math.max(1, parseInt(e.target.value) || 1) })}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md font-mono tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Monthly Transactional Inserts
              </label>
              <input
                type="number"
                min="0"
                value={w.monthlyTransactions || 0}
                onChange={(e) => updateProduct('customApps', { monthlyTransactions: Math.max(0, parseInt(e.target.value) || 0) })}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md font-mono tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Avg Custom Record Size (KB)
              </label>
              <input
                type="number"
                step="0.5"
                min="1"
                value={w.avgRecordSizeKb || 10}
                onChange={(e) => updateProduct('customApps', { avgRecordSizeKb: Math.max(1, parseFloat(e.target.value) || 1) })}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md font-mono tabular-nums"
              />
            </div>
          </div>
        );

      case 'automationEngine':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Monthly Integration Transactions (Integration Hub)
              </label>
              <input
                type="number"
                min="0"
                value={w.monthlyIntegrationTransactions || 0}
                onChange={(e) => updateProduct('automationEngine', { monthlyIntegrationTransactions: Math.max(0, parseInt(e.target.value) || 0) })}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md font-mono tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Monthly RPA Bot Execution Runs
              </label>
              <input
                type="number"
                min="0"
                value={w.monthlyRpaBotRuns || 0}
                onChange={(e) => updateProduct('automationEngine', { monthlyRpaBotRuns: Math.max(0, parseInt(e.target.value) || 0) })}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md font-mono tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Monthly Document Intelligence Pages Extracted
              </label>
              <input
                type="number"
                min="0"
                value={w.monthlyDocIntelPages || 0}
                onChange={(e) => updateProduct('automationEngine', { monthlyDocIntelPages: Math.max(0, parseInt(e.target.value) || 0) })}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md font-mono tabular-nums"
              />
            </div>
          </div>
        );

      case 'industrySolutions':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Industry Solution Operating Model
              </label>
              <select
                value={w.verticalType || 'financial_services'}
                onChange={(e) => updateProduct('industrySolutions', { verticalType: e.target.value as any })}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md font-medium text-slate-800"
              >
                <option value="financial_services">Financial Services Operations (FSO)</option>
                <option value="healthcare">Healthcare & Life Sciences (HCLS)</option>
                <option value="public_sector">Public Sector Digital Services (PSDS)</option>
                <option value="telecommunications">Telecommunications Service Mgmt (TSM)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Monthly Specialized Cases
              </label>
              <input
                type="number"
                min="0"
                value={w.monthlyIndustryCases || 0}
                onChange={(e) => updateProduct('industrySolutions', { monthlyIndustryCases: Math.max(0, parseInt(e.target.value) || 0) })}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md font-mono tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Active Industry Entities (Accounts/Clinics)
              </label>
              <input
                type="number"
                min="0"
                value={w.activeSpecializedEntities || 0}
                onChange={(e) => updateProduct('industrySolutions', { activeSpecializedEntities: Math.max(0, parseInt(e.target.value) || 0) })}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md font-mono tabular-nums"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Stage Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 tracking-wider uppercase">
            <span>Stage 2 of 7</span>
            <span>·</span>
            <span>Module FR-02</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 mt-1">
            ServiceNow Product & Module Workload Discovery
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Select products and modules across all ServiceNow Workflow Families and configure operational transaction rates.
          </p>
        </div>

        {/* Catalog Scope Summary KPI */}
        <div className="flex items-center gap-3 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs shrink-0">
          <div className="flex items-center gap-2 pr-3 border-r border-slate-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-slate-600">
              <strong className="text-slate-900 font-mono">{activeProductsCount}</strong> of {SERVICENOW_PORTFOLIO_CATALOG.length} Products Active
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-600">
            <Database className="w-3.5 h-3.5 text-emerald-600" />
            <span>
              <strong className="text-slate-900 font-mono">{activeModulesCount}</strong> of {totalCatalogModulesCount} Modules in Scope
            </span>
          </div>
        </div>
      </div>

      {/* Quick Selection Presets & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by product name, module, or database table (e.g., incident, em_event, alm_hardware)..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          )}
        </div>

        {/* Quick Bundles Dropdown/Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>Bundles:</span>
          </span>
          <button
            onClick={() => applyWorkflowBundle('CORE_IT')}
            className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors whitespace-nowrap"
            title="Enable ITSM and ITOM Discovery"
          >
            Core IT
          </button>
          <button
            onClick={() => applyWorkflowBundle('ENTERPRISE_IT')}
            className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors whitespace-nowrap"
            title="Enable ITSM, ITOM, ITAM, SPM, IRM and SecOps"
          >
            Enterprise IT
          </button>
          <button
            onClick={() => applyWorkflowBundle('EMPLOYEE')}
            className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors whitespace-nowrap"
            title="Enable HRSD, WSD, LSD and PSM"
          >
            Employee Exp
          </button>
          <button
            onClick={() => applyWorkflowBundle('CUSTOMER')}
            className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors whitespace-nowrap"
            title="Enable CSM and FSM"
          >
            Customer & Field
          </button>
          <button
            onClick={() => applyWorkflowBundle('ALL')}
            className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md transition-colors whitespace-nowrap"
            title="Enable all 15 ServiceNow products"
          >
            All Products
          </button>
        </div>
      </div>

      {/* Workflow Family Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto border-b border-slate-200 pb-2">
        <button
          onClick={() => setSelectedFamily('ALL')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            selectedFamily === 'ALL'
              ? 'bg-slate-900 text-white font-semibold shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span>All Portfolio</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200/40">
            {SERVICENOW_PORTFOLIO_CATALOG.length}
          </span>
        </button>

        <button
          onClick={() => setSelectedFamily('IT Workflows')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            selectedFamily === 'IT Workflows'
              ? 'bg-blue-600 text-white font-semibold shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span>Technology / IT Workflows</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200/40">6</span>
        </button>

        <button
          onClick={() => setSelectedFamily('Customer Workflows')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            selectedFamily === 'Customer Workflows'
              ? 'bg-teal-600 text-white font-semibold shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span>Customer Workflows</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200/40">2</span>
        </button>

        <button
          onClick={() => setSelectedFamily('Employee Workflows')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            selectedFamily === 'Employee Workflows'
              ? 'bg-pink-600 text-white font-semibold shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span>Employee Workflows</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200/40">4</span>
        </button>

        <button
          onClick={() => setSelectedFamily('Creator Workflows')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            selectedFamily === 'Creator Workflows'
              ? 'bg-orange-600 text-white font-semibold shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span>Creator Workflows</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200/40">2</span>
        </button>

        <button
          onClick={() => setSelectedFamily('Industry Solutions')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            selectedFamily === 'Industry Solutions'
              ? 'bg-blue-700 text-white font-semibold shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span>Industry Solutions</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200/40">1</span>
        </button>
      </div>

      {/* Product List */}
      <div className="space-y-4">
        {filteredProducts.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl">
            <p className="text-sm font-medium text-slate-700">No ServiceNow products match your search or filter.</p>
            <p className="text-xs text-slate-500 mt-1">Try clearing your search query or switching workflow family tabs.</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedFamily('ALL');
              }}
              className="mt-3 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-white border border-emerald-300 rounded-lg hover:bg-emerald-50 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          filteredProducts.map((product) => {
            const isEnabled = workloads[product.id]?.enabled || false;
            const activeModules = workloads[product.id]?.activeModules || product.modules.map((m) => m.id);
            const isExpanded = expandedModules[product.id] ?? false;
            const allModulesSelected = product.modules.every((m) => activeModules.includes(m.id));

            return (
              <div
                key={product.id}
                className={`border rounded-xl transition-all ${
                  isEnabled
                    ? 'bg-white border-slate-300 shadow-2xs'
                    : 'bg-slate-50/70 border-slate-200 opacity-75'
                }`}
              >
                {/* Product Header */}
                <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors shadow-2xs ${getProductColor(
                        product.id,
                        isEnabled
                      )}`}
                    >
                      {getProductIcon(product.iconName, isEnabled)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-bold text-slate-900">{product.name}</h3>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 uppercase tracking-wider">
                          {product.family}
                        </span>
                        {isEnabled && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                            {activeModules.length} of {product.modules.length} Modules In Scope
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{product.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                    {isEnabled && (
                      <button
                        type="button"
                        onClick={() => toggleExpand(product.id)}
                        className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 transition-colors px-2 py-1 rounded hover:bg-slate-100"
                        title="Toggle modules and detailed tables"
                      >
                        <Table className="w-3.5 h-3.5 text-slate-400" />
                        <span>Modules ({activeModules.length})</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    )}

                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isEnabled}
                        onChange={(e) => updateProduct(product.id, { enabled: e.target.checked } as any)}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600" />
                    </label>
                  </div>
                </div>

                {/* Expanded Modules Drawer (Available when product is enabled) */}
                {isEnabled && isExpanded && (
                  <div className="p-4 bg-slate-50/80 border-b border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <Table className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Active ServiceNow Modules & Database Tables</span>
                      </span>

                      <button
                        type="button"
                        onClick={() => toggleAllModulesForProduct(product)}
                        className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold"
                      >
                        {allModulesSelected ? 'Deselect All Modules' : 'Select All Modules'}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {product.modules.map((m) => {
                        const isModActive = activeModules.includes(m.id);
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => toggleModule(product.id, m.id)}
                            className={`p-2.5 rounded-lg border text-left transition-all flex items-start gap-2 ${
                              isModActive
                                ? 'bg-white border-emerald-300 shadow-2xs'
                                : 'bg-slate-100/70 border-slate-200 opacity-60 hover:opacity-100'
                            }`}
                          >
                            <div className="mt-0.5">
                              {isModActive ? (
                                <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Square className="w-3.5 h-3.5 text-slate-400" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-xs font-bold text-slate-800 truncate">{m.name}</span>
                                <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 shrink-0">
                                  {m.typicalRecordKb} KB
                                </span>
                              </div>
                              <span className="text-[10px] font-mono text-emerald-700 block truncate">
                                table: {m.primaryTable}
                              </span>
                              <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{m.description}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Sizing Volumetric Drivers & Inputs */}
                {isEnabled && (
                  <div className="p-5 bg-white rounded-b-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Operational Sizing Volumes & Parameters
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">Real-time Sizing Drivers</span>
                    </div>

                    {renderProductInputs(product)}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <button
          onClick={onPrev}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors whitespace-nowrap"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Engagement Setup</span>
        </button>

        <button
          onClick={onNext}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-colors whitespace-nowrap"
        >
          <span>Continue to Technical Assumptions</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
