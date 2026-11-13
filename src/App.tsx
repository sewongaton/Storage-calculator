import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { Stage1Engagement } from './components/stages/Stage1Engagement';
import { Stage2Workload } from './components/stages/Stage2Workload';
import { Stage3Assumptions } from './components/stages/Stage3Assumptions';
import { Stage4Environments } from './components/stages/Stage4Environments';
import { Stage5Results } from './components/stages/Stage5Results';
import { Stage6Scenarios } from './components/stages/Stage6Scenarios';
import { Stage7EvidencePack } from './components/stages/Stage7EvidencePack';
import { AiValidationBanner } from './components/ai/AiValidationBanner';
import { AiAdvisorDrawer } from './components/ai/AiAdvisorDrawer';
import {
  ARCHETYPE_PRESETS,
  ArchetypePreset,
  INITIAL_ASSUMPTIONS,
  INITIAL_ENVIRONMENTS,
  INITIAL_PRESET_SCENARIOS,
  INITIAL_SETUP,
  INITIAL_WORKLOADS,
  getMinLicensedEntitlement,
} from './constants/benchmarks';
import { calculateStorageForecast } from './utils/calculationEngine';
import {
  AiValidation,
  EngagementSetup,
  EnvironmentConfig,
  ProductWorkloads,
  RsiProposal,
  Scenario,
  TechnicalAssumptions,
} from './types/calculator';

export default function App() {
  const [activeStage, setActiveStage] = useState<number>(1);
  const [setup, setSetup] = useState<EngagementSetup>(INITIAL_SETUP);
  const [workloads, setWorkloads] = useState<ProductWorkloads>(INITIAL_WORKLOADS);
  const [assumptions, setAssumptions] = useState<TechnicalAssumptions>(INITIAL_ASSUMPTIONS);
  const [environments, setEnvironments] = useState<EnvironmentConfig>(INITIAL_ENVIRONMENTS);

  const [scenarios, setScenarios] = useState<Scenario[]>(INITIAL_PRESET_SCENARIOS);
  const [activeScenarioId, setActiveScenarioId] = useState<string>('scenario-baseline');

  const [isAdvisorOpen, setIsAdvisorOpen] = useState(false);
  const [aiValidations, setAiValidations] = useState<AiValidation[]>([]);
  const [rsiProposals, setRsiProposals] = useState<RsiProposal[]>([]);
  const [appliedHistory, setAppliedHistory] = useState<RsiProposal[]>([]);
  const [loadingAi, setLoadingAi] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Live real-time calculation engine execution
  const results = useMemo(() => {
    return calculateStorageForecast(setup, workloads, assumptions, environments);
  }, [setup, workloads, assumptions, environments]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Run AI checks and proposals
  const runAiValidationAndProposals = async () => {
    setLoadingAi(true);
    const assessmentPayload = {
      setup,
      workloads,
      assumptions,
      environments,
      results: {
        year1GrossGb: results.year1GrossGb,
        year3GrossGb: results.year3GrossGb,
        year5GrossGb: results.year5GrossGb,
        horizonGrossGb: results.horizonGrossGb,
        year3DatabaseGb: results.year3DatabaseGb,
        year3AuditGb: results.year3AuditGb,
        year3AttachmentGb: results.year3AttachmentGb,
        year3NonProdGb: results.year3NonProdGb,
        year3EntitlementGapGb: results.year3EntitlementGapGb,
        year5EntitlementGapGb: results.year5EntitlementGapGb,
      },
    };

    try {
      // 1. Fetch validations
      const valRes = await fetch('/api/ai/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assessmentPayload),
      });
      const valData = await valRes.json();
      if (Array.isArray(valData.validations)) {
        setAiValidations(valData.validations);
      }

      // 2. Fetch proposals
      const propRes = await fetch('/api/ai/proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assessmentPayload),
      });
      const propData = await propRes.json();
      if (Array.isArray(propData.proposals)) {
        setRsiProposals(propData.proposals);
      }
    } catch {
      // Fallback handled seamlessly
    } finally {
      setLoadingAi(false);
    }
  };

  // Trigger initial validation on load
  useEffect(() => {
    runAiValidationAndProposals();
  }, []);

  // Update handlers
  const handleUpdateSetup = (patch: Partial<EngagementSetup>) => {
    setSetup((prev) => ({ ...prev, ...patch }));
  };

  const handleUpdateWorkloads = (patch: Partial<ProductWorkloads>) => {
    setWorkloads((prev) => ({ ...prev, ...patch }));
  };

  const handleUpdateAssumptions = (patch: Partial<TechnicalAssumptions>) => {
    setAssumptions((prev) => ({ ...prev, ...patch }));
  };

  const handleUpdateEnvironments = (patch: Partial<EnvironmentConfig>) => {
    setEnvironments((prev) => ({ ...prev, ...patch }));
  };

  const normalizeWorkloads = (
    incoming?: Partial<ProductWorkloads>,
    resetMissingToDisabled = false
  ): ProductWorkloads => {
    const normalized: any = {};
    (Object.keys(INITIAL_WORKLOADS) as Array<keyof ProductWorkloads>).forEach((key) => {
      const base = INITIAL_WORKLOADS[key];
      const patch = incoming?.[key];
      if (patch) {
        normalized[key] = {
          ...base,
          ...patch,
          activeModules: patch.activeModules || base.activeModules,
        };
      } else {
        normalized[key] = {
          ...base,
          enabled: resetMissingToDisabled ? false : base.enabled,
        };
      }
    });
    return normalized as ProductWorkloads;
  };

  // Apply archetype preset (e.g. Healthcare, FinTech, Tech SaaS)
  const handleApplyPreset = (preset: ArchetypePreset) => {
    const targetVertical = preset.vertical || setup.industryVertical;
    const targetType = preset.setupPatch?.assessmentType || setup.assessmentType;
    const minEntitlement = getMinLicensedEntitlement(targetVertical, targetType);
    const patchedEntitlement = preset.setupPatch?.licensedEntitlementGb
      ? Math.max(preset.setupPatch.licensedEntitlementGb, minEntitlement)
      : minEntitlement;

    if (preset.setupPatch) {
      setSetup((prev) => ({
        ...prev,
        ...preset.setupPatch,
        industryVertical: preset.vertical,
        planningHorizonYears: preset.horizon,
        licensedEntitlementGb: patchedEntitlement,
      }));
    }
    if (preset.workloads) {
      setWorkloads(normalizeWorkloads(preset.workloads, true));
    }
    showToast(`Applied preset: ${preset.name}`);
  };

  // Recursive Self-Improvement (RSI): Apply Proposal Mutation
  const handleApplyProposal = (proposal: RsiProposal) => {
    const field = proposal.mutation.field;
    const newVal = proposal.mutation.value;

    let previousVal: any = undefined;
    let supported = true;

    if (field === 'environments.excludeAttachmentsNonProd') {
      previousVal = environments.excludeAttachmentsNonProd;
      setEnvironments((prev) => ({ ...prev, excludeAttachmentsNonProd: Boolean(newVal) }));
    } else if (field === 'environments.truncateAuditNonProd') {
      previousVal = environments.truncateAuditNonProd;
      setEnvironments((prev) => ({ ...prev, truncateAuditNonProd: Boolean(newVal) }));
    } else if (field === 'assumptions.activeRetentionMonths') {
      previousVal = assumptions.activeRetentionMonths;
      setAssumptions((prev) => ({ ...prev, activeRetentionMonths: Number(newVal) || prev.activeRetentionMonths }));
    } else if (field === 'assumptions.auditRetentionMonths') {
      previousVal = assumptions.auditRetentionMonths;
      setAssumptions((prev) => ({ ...prev, auditRetentionMonths: Number(newVal) || prev.auditRetentionMonths }));
    } else if (field === 'assumptions.eventRetentionDays') {
      previousVal = assumptions.eventRetentionDays;
      setAssumptions((prev) => ({ ...prev, eventRetentionDays: Number(newVal) || prev.eventRetentionDays }));
    } else if (field === 'assumptions.avgAttachmentSizeKb') {
      previousVal = assumptions.avgAttachmentSizeKb;
      setAssumptions((prev) => ({ ...prev, avgAttachmentSizeKb: Number(newVal) || prev.avgAttachmentSizeKb }));
    } else if (field === 'assumptions.attachmentRatePercent') {
      previousVal = assumptions.attachmentRatePercent;
      setAssumptions((prev) => ({ ...prev, attachmentRatePercent: Number(newVal) || prev.attachmentRatePercent }));
    } else if (field === 'assumptions.auditFactorPercent') {
      previousVal = assumptions.auditFactorPercent;
      setAssumptions((prev) => ({ ...prev, auditFactorPercent: Number(newVal) || prev.auditFactorPercent }));
    } else {
      supported = false;
    }

    if (!supported) {
      showToast(`Optimization note: ${proposal.mutation.description}`);
      return;
    }

    const appliedProposal: RsiProposal = {
      ...proposal,
      applied: true,
      mutation: {
        ...proposal.mutation,
        previousValue: previousVal,
      },
    };

    setRsiProposals((prev) =>
      prev.map((p) => (p.id === proposal.id ? appliedProposal : p))
    );
    setAppliedHistory((prev) => [appliedProposal, ...prev]);

    showToast(`Applied Optimization: ${proposal.title} (Savings: ~${proposal.estimatedSavingsGb} GB)`);
  };

  // Rollback Proposal Mutation
  const handleRollbackProposal = (proposalId: string) => {
    const record = appliedHistory.find((p) => p.id === proposalId);
    if (!record || record.mutation.previousValue === undefined) return;

    const field = record.mutation.field;
    const oldVal = record.mutation.previousValue;

    if (field === 'environments.excludeAttachmentsNonProd') {
      setEnvironments((prev) => ({ ...prev, excludeAttachmentsNonProd: oldVal }));
    } else if (field === 'environments.truncateAuditNonProd') {
      setEnvironments((prev) => ({ ...prev, truncateAuditNonProd: oldVal }));
    } else if (field === 'assumptions.activeRetentionMonths') {
      setAssumptions((prev) => ({ ...prev, activeRetentionMonths: oldVal }));
    } else if (field === 'assumptions.auditRetentionMonths') {
      setAssumptions((prev) => ({ ...prev, auditRetentionMonths: oldVal }));
    } else if (field === 'assumptions.eventRetentionDays') {
      setAssumptions((prev) => ({ ...prev, eventRetentionDays: oldVal }));
    } else if (field === 'assumptions.avgAttachmentSizeKb') {
      setAssumptions((prev) => ({ ...prev, avgAttachmentSizeKb: oldVal }));
    } else if (field === 'assumptions.attachmentRatePercent') {
      setAssumptions((prev) => ({ ...prev, attachmentRatePercent: oldVal }));
    } else if (field === 'assumptions.auditFactorPercent') {
      setAssumptions((prev) => ({ ...prev, auditFactorPercent: oldVal }));
    }

    setRsiProposals((prev) =>
      prev.map((p) => (p.id === proposalId ? { ...p, applied: false } : p))
    );
    setAppliedHistory((prev) => prev.filter((p) => p.id !== proposalId));

    showToast(`Rolled back optimization: ${record.title}`);
  };

  // Scenario Management
  const handleSaveCurrentAsScenario = (name: string, description: string) => {
    const newScenario: Scenario = {
      id: `scenario-${Date.now()}`,
      name,
      description,
      isBaseline: false,
      createdAt: new Date().toISOString(),
      setup: { ...setup },
      workloads: JSON.parse(JSON.stringify(workloads)),
      assumptions: JSON.parse(JSON.stringify(assumptions)),
      environments: JSON.parse(JSON.stringify(environments)),
      results: { ...results },
    };

    setScenarios((prev) => [...prev, newScenario]);
    setActiveScenarioId(newScenario.id);
    showToast(`Saved scenario: "${name}"`);
  };

  const handleRestoreScenario = (sc: Scenario) => {
    setSetup({ ...INITIAL_SETUP, ...sc.setup });
    setWorkloads(normalizeWorkloads(JSON.parse(JSON.stringify(sc.workloads))));
    setAssumptions({
      ...INITIAL_ASSUMPTIONS,
      ...JSON.parse(JSON.stringify(sc.assumptions)),
      recordSizes: {
        ...INITIAL_ASSUMPTIONS.recordSizes,
        ...(sc.assumptions?.recordSizes || {}),
      },
    });
    setEnvironments({ ...INITIAL_ENVIRONMENTS, ...JSON.parse(JSON.stringify(sc.environments)) });
    setActiveScenarioId(sc.id);
    showToast(`Loaded scenario: "${sc.name}"`);
  };

  const handleDuplicateScenario = (sc: Scenario) => {
    const dup: Scenario = {
      ...sc,
      id: `scenario-${Date.now()}`,
      name: `${sc.name} (Copy)`,
      isBaseline: false,
      createdAt: new Date().toISOString(),
    };
    setScenarios((prev) => [...prev, dup]);
    showToast(`Duplicated scenario: "${dup.name}"`);
  };

  const handleDeleteScenario = (id: string) => {
    setScenarios((prev) => prev.filter((s) => s.id !== id));
    showToast('Deleted scenario.');
  };

  // Import JSON assessment payload
  const handleImportJson = (imported: any) => {
    if (imported.setup) {
      setSetup({ ...INITIAL_SETUP, ...imported.setup });
    }
    if (imported.workloads) {
      setWorkloads(normalizeWorkloads(imported.workloads));
    }
    if (imported.assumptions) {
      setAssumptions({
        ...INITIAL_ASSUMPTIONS,
        ...imported.assumptions,
        recordSizes: {
          ...INITIAL_ASSUMPTIONS.recordSizes,
          ...(imported.assumptions.recordSizes || {}),
        },
      });
    }
    if (imported.environments) {
      setEnvironments({
        ...INITIAL_ENVIRONMENTS,
        ...imported.environments,
        nonProdInstances: Array.isArray(imported.environments.nonProdInstances)
          ? imported.environments.nonProdInstances
          : INITIAL_ENVIRONMENTS.nonProdInstances,
      });
    }
    showToast('Assessment successfully imported and recalculated.');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white text-xs font-medium px-4 py-2.5 rounded-lg shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-150 border border-slate-800">
          {toastMessage}
        </div>
      )}

      {/* Top Header */}
      <Header
        activeStage={activeStage}
        onSelectStage={(st) => setActiveStage(st)}
        onOpenAiAdvisor={() => setIsAdvisorOpen(true)}
        onExportEvidence={() => setActiveStage(7)}
        confidenceScore={results.confidenceScore}
        confidenceRating={results.confidenceRating}
      />

      {/* Main Workspace with Sidebar & Content */}
      <div className="flex-1 flex">
        {/* Left Workflow Sidebar (hidden in print) */}
        <div className="no-print hidden md:block">
          <Sidebar
            activeStage={activeStage}
            onSelectStage={(st) => setActiveStage(st)}
            setup={setup}
            results={results}
            scenariosCount={scenarios.length}
          />
        </div>

        {/* Center Main Stage Content */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-6xl mx-auto">
          {/* Breadcrumb Context Strip */}
          <div className="mb-4 flex items-center justify-between text-xs text-slate-500 no-print">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700">{setup.clientName || 'Unassigned Client'}</span>
              <span>/</span>
              <span className="text-slate-600">{setup.assessmentName}</span>
              <span>/</span>
              <span className="text-emerald-700 font-medium">Stage {activeStage} of 7</span>
            </div>
            <div className="hidden sm:flex items-center gap-2 font-mono tabular-nums text-[11px]">
              <span>Licensed: {(setup.licensedEntitlementGb / 1024).toFixed(1)} TB</span>
              <span>·</span>
              <span className={results.year3EntitlementGapGb > 0 ? 'text-rose-600 font-bold' : 'text-slate-700'}>
                Y3: {Math.round(results.year3GrossGb).toLocaleString()} GB
              </span>
            </div>
          </div>

          {/* AI Guardrails Anomaly Banner */}
          <div className="no-print">
            <AiValidationBanner
              validations={aiValidations}
              loading={loadingAi}
              onRefresh={runAiValidationAndProposals}
              onOpenAdvisor={() => setIsAdvisorOpen(true)}
            />
          </div>

          {/* Stage Router */}
          {activeStage === 1 && (
            <Stage1Engagement
              setup={setup}
              onUpdateSetup={handleUpdateSetup}
              onApplyPreset={handleApplyPreset}
              onNext={() => setActiveStage(2)}
            />
          )}

          {activeStage === 2 && (
            <Stage2Workload
              workloads={workloads}
              onUpdateWorkloads={handleUpdateWorkloads}
              onNext={() => setActiveStage(3)}
              onPrev={() => setActiveStage(1)}
            />
          )}

          {activeStage === 3 && (
            <Stage3Assumptions
              assumptions={assumptions}
              onUpdateAssumptions={handleUpdateAssumptions}
              onNext={() => setActiveStage(4)}
              onPrev={() => setActiveStage(2)}
            />
          )}

          {activeStage === 4 && (
            <Stage4Environments
              environments={environments}
              onUpdateEnvironments={handleUpdateEnvironments}
              year3ProdTotalGb={results.yearlyProjections[2]?.prodTotalGb || 1000}
              onNext={() => setActiveStage(5)}
              onPrev={() => setActiveStage(3)}
            />
          )}

          {activeStage === 5 && (
            <Stage5Results
              setup={setup}
              workloads={workloads}
              assumptions={assumptions}
              environments={environments}
              results={results}
              onNext={() => setActiveStage(6)}
              onPrev={() => setActiveStage(4)}
              onJumpToScenarios={() => setActiveStage(6)}
              onJumpToEvidence={() => setActiveStage(7)}
            />
          )}

          {activeStage === 6 && (
            <Stage6Scenarios
              scenarios={scenarios}
              activeScenarioId={activeScenarioId}
              onSaveCurrentAsScenario={handleSaveCurrentAsScenario}
              onRestoreScenario={handleRestoreScenario}
              onDuplicateScenario={handleDuplicateScenario}
              onDeleteScenario={handleDeleteScenario}
              onNext={() => setActiveStage(7)}
              onPrev={() => setActiveStage(5)}
            />
          )}

          {activeStage === 7 && (
            <Stage7EvidencePack
              setup={setup}
              workloads={workloads}
              assumptions={assumptions}
              environments={environments}
              results={results}
              onImportJson={handleImportJson}
              onPrev={() => setActiveStage(6)}
            />
          )}
        </main>
      </div>

      {/* AI Sizing Advisor & RSI Optimization Drawer */}
      <AiAdvisorDrawer
        isOpen={isAdvisorOpen}
        onClose={() => setIsAdvisorOpen(false)}
        proposals={rsiProposals}
        onApplyProposal={handleApplyProposal}
        onRollbackProposal={handleRollbackProposal}
        appliedHistory={appliedHistory}
        assessmentContext={{
          setup,
          workloads,
          assumptions,
          environments,
          results: {
            year1GrossGb: results.year1GrossGb,
            year3GrossGb: results.year3GrossGb,
            year5GrossGb: results.year5GrossGb,
            horizonGrossGb: results.horizonGrossGb,
            year3DatabaseGb: results.year3DatabaseGb,
            year3AuditGb: results.year3AuditGb,
            year3AttachmentGb: results.year3AttachmentGb,
            year3NonProdGb: results.year3NonProdGb,
            year3EntitlementGapGb: results.year3EntitlementGapGb,
            confidenceScore: results.confidenceScore,
            confidenceRating: results.confidenceRating,
          },
        }}
      />
    </div>
  );
}
