import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  const app = express();

  // Port resolution
  let port = Number(process.env.PORT) || 3000;
  const args = process.argv.slice(2);
  const portIdx = args.indexOf('--port');
  if (portIdx !== -1 && args[portIdx + 1]) {
    const p = parseInt(args[portIdx + 1], 10);
    if (!isNaN(p)) port = p;
  }

  app.use(express.json({ limit: '10mb' }));

  // Server-side Google GenAI initialization
  const apiKey = process.env.GEMINI_API_KEY;
  let ai: GoogleGenAI | null = null;
  if (apiKey) {
    ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }

  // Quota & Rate Limit Cooldown Tracker
  let quotaExceededUntil = 0;
  const AI_TIMEOUT_MS = 6500;

  const ALLOWED_MUTATION_FIELDS = new Set([
    'environments.excludeAttachmentsNonProd',
    'environments.truncateAuditNonProd',
    'assumptions.activeRetentionMonths',
    'assumptions.auditRetentionMonths',
    'assumptions.eventRetentionDays',
    'assumptions.avgAttachmentSizeKb',
    'assumptions.attachmentRatePercent',
    'assumptions.auditFactorPercent',
  ]);

  function isQuotaExceeded(): boolean {
    return Date.now() < quotaExceededUntil;
  }

  function recordQuotaError(err: any) {
    const errMsg = String(err?.message || err || '');
    const status = err?.status ?? err?.code ?? '';
    if (
      status === 429 ||
      status === 'RESOURCE_EXHAUSTED' ||
      errMsg.includes('429') ||
      errMsg.includes('Quota exceeded') ||
      errMsg.includes('RESOURCE_EXHAUSTED')
    ) {
      // Cooldown for 15 minutes before attempting Gemini API again
      quotaExceededUntil = Date.now() + 15 * 60 * 1000;
    }
  }

  async function withTimeout<T>(promise: Promise<T>, ms = AI_TIMEOUT_MS): Promise<T> {
    let timer: NodeJS.Timeout | undefined;
    try {
      return await Promise.race([
        promise,
        new Promise<never>((_, reject) => {
          timer = setTimeout(() => reject(new Error(`AI request timed out after ${ms}ms`)), ms);
        }),
      ]);
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  function extractJsonArray(rawText: string | undefined): any[] | null {
    if (!rawText) return null;
    const cleaned = rawText
      .trim()
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return null;
  }

  // Health endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'healthy',
      aiConfigured: Boolean(apiKey),
      isRateLimited: isQuotaExceeded(),
      timestamp: new Date().toISOString(),
    });
  });

  // AI Endpoint 1: Validate Assumptions & Detect Anomalies
  app.post('/api/ai/validate', async (req, res) => {
    try {
      const assessmentData = req.body;

      if (!ai || isQuotaExceeded()) {
        return res.json({
          source: 'heuristic_rules_engine',
          validations: generateHeuristicValidations(assessmentData),
        });
      }

      const prompt = `You are an expert ServiceNow Principal Solution Architect specializing in instance capacity planning and storage sizing.
Analyze the following ServiceNow sizing assessment inputs and identify anomalies, risk factors, or unrealistic assumptions.
Return a valid JSON array of objects with the following schema:
[
  {
    "id": "val_1",
    "category": "workload | retention | attachments | environments | entitlement",
    "severity": "info | warning | critical",
    "title": "Short title",
    "message": "Clear explanation of the finding and risk",
    "recommendation": "Prescriptive remediation step",
    "metricAffected": "e.g., Year 3 Attachments or sys_audit table"
  }
]

Assessment data summary:
${JSON.stringify(assessmentData, null, 2)}

Only return valid JSON array, no markdown fences, no surrounding commentary.`;

      try {
        const response = await withTimeout(
          ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
              systemInstruction:
                'You are an elite ServiceNow Master Certified Solution Architect. Evaluate storage sizing strictly according to Kingston-Xanadu architecture best practices.',
            },
          })
        );

        const parsed = extractJsonArray(response.text);
        if (!parsed) {
          return res.json({
            source: 'heuristic_rules_engine',
            validations: generateHeuristicValidations(assessmentData),
          });
        }
        return res.json({
          source: 'gemini_3.8_flash',
          validations: parsed,
        });
      } catch (geminiErr: any) {
        recordQuotaError(geminiErr);
        return res.json({
          source: 'heuristic_rules_engine',
          validations: generateHeuristicValidations(assessmentData),
        });
      }
    } catch {
      return res.json({
        source: 'heuristic_rules_engine',
        validations: generateHeuristicValidations(req.body),
      });
    }
  });

  // AI Endpoint 2: Generate Recursive Self-Improvement (RSI) Proposals
  app.post('/api/ai/proposals', async (req, res) => {
    try {
      const assessmentData = req.body;

      if (!ai || isQuotaExceeded()) {
        return res.json({
          source: 'heuristic_optimization_engine',
          proposals: generateHeuristicProposals(assessmentData),
        });
      }

      const prompt = `You are an expert ServiceNow Platform Architect.
Review this storage sizing assessment and propose 3-4 concrete Recursive Self-Improvement (RSI) optimizations to prevent storage overages, reduce non-PROD replication waste, or optimize archiving.
Return a valid JSON array of proposals with exact mutations that can be applied to the calculator state:
[
  {
    "id": "prop_1",
    "title": "Clear action title",
    "category": "archiving | attachments | environments | retention",
    "estimatedSavingsGb": 350,
    "rationale": "Why this optimization is recommended based on ServiceNow architecture",
    "mutation": {
      "field": "environments.excludeAttachmentsNonProd | environments.truncateAuditNonProd | assumptions.activeRetentionMonths | assumptions.auditRetentionMonths | assumptions.eventRetentionDays | assumptions.avgAttachmentSizeKb | assumptions.attachmentRatePercent | assumptions.auditFactorPercent",
      "value": true,
      "description": "Readable description of parameter change"
    }
  }
]

Assessment data:
${JSON.stringify(assessmentData, null, 2)}

Only return valid JSON array, no markdown fences, no surrounding commentary.`;

      try {
        const response = await withTimeout(
          ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
              systemInstruction:
                'You are a ServiceNow capacity planning specialist. Propose realistic, high-impact storage reduction techniques.',
            },
          })
        );

        const parsed = extractJsonArray(response.text);
        const validProposals = (parsed || [])
          .filter((p) => p && p.mutation && ALLOWED_MUTATION_FIELDS.has(p.mutation.field))
          .map((p, idx) => ({
            ...p,
            id: p.id || `prop_ai_${idx + 1}`,
            applied: false,
            estimatedSavingsGb: Number(p.estimatedSavingsGb) || 0,
          }));

        if (validProposals.length === 0) {
          return res.json({
            source: 'heuristic_optimization_engine',
            proposals: generateHeuristicProposals(assessmentData),
          });
        }

        return res.json({
          source: 'gemini_3.8_flash',
          proposals: validProposals,
        });
      } catch (geminiErr: any) {
        recordQuotaError(geminiErr);
        return res.json({
          source: 'heuristic_optimization_engine',
          proposals: generateHeuristicProposals(assessmentData),
        });
      }
    } catch {
      return res.json({
        source: 'heuristic_optimization_engine',
        proposals: generateHeuristicProposals(req.body),
      });
    }
  });

  // AI Endpoint 3: Sizing Architect Advisor Chat
  app.post('/api/ai/advisor', async (req, res) => {
    try {
      const { message, assessmentContext, conversationHistory = [] } = req.body;

      if (!ai || isQuotaExceeded()) {
        return res.json({
          reply: generateHeuristicAdvisorReply(message, assessmentContext),
        });
      }

      try {
        const historyList = Array.isArray(conversationHistory) ? conversationHistory : [];
        const contents = [
          {
            role: 'user',
            parts: [{ text: `Current Assessment Context:\n${JSON.stringify(assessmentContext || {}, null, 2)}` }],
          },
          ...historyList
            .filter((item: any) => item && typeof item.text === 'string' && item.text.trim())
            .map((item: any) => ({
              role: item.role === 'user' ? 'user' : 'model',
              parts: [{ text: item.text }],
            })),
          {
            role: 'user',
            parts: [{ text: String(message || 'Provide sizing guidance for this ServiceNow assessment.') }],
          },
        ];

        const response = await withTimeout(
          ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: contents as any,
            config: {
              systemInstruction: `You are the ServiceNow Sizing Advisor, a veteran Presales Principal Architect.
You help architects, platform owners, and capacity planners understand their instance storage forecast, attachment dynamics (sys_attachment_doc 4KB chunks), table audit overhead (sys_audit, sys_history), archiving schedules, and non-PROD clone policies.
Be concise, authoritative, data-driven, and reference specific numbers from the user's assessment when available. Format with bullet points and clean structure.`,
            },
          })
        );

        return res.json({
          reply: response.text || generateHeuristicAdvisorReply(message, assessmentContext),
        });
      } catch (geminiErr: any) {
        recordQuotaError(geminiErr);
        return res.json({
          reply: generateHeuristicAdvisorReply(message, assessmentContext),
        });
      }
    } catch {
      return res.json({
        reply: generateHeuristicAdvisorReply(req.body?.message, req.body?.assessmentContext),
      });
    }
  });

  // Vite development middleware or production static files
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`[ServiceNow Storage Sizing Calculator] Server running on http://0.0.0.0:${port}`);
  });
}

const MIN_LICENSED_ENTITLEMENT_GB: Record<string, Record<string, number>> = {
  financial_services: { new_implementation: 4096, expansion: 6144, migration: 8192, consolidation: 12288 },
  healthcare: { new_implementation: 4096, expansion: 6144, migration: 8192, consolidation: 10240 },
  technology: { new_implementation: 2048, expansion: 4096, migration: 6144, consolidation: 8192 },
  retail: { new_implementation: 2048, expansion: 3072, migration: 4096, consolidation: 6144 },
  manufacturing: { new_implementation: 3072, expansion: 4096, migration: 6144, consolidation: 8192 },
  public_sector: { new_implementation: 4096, expansion: 6144, migration: 8192, consolidation: 12288 },
  higher_education: { new_implementation: 2048, expansion: 3072, migration: 4096, consolidation: 6144 },
  telecommunications: { new_implementation: 4096, expansion: 6144, migration: 8192, consolidation: 12288 },
  energy_utilities: { new_implementation: 3072, expansion: 4096, migration: 6144, consolidation: 8192 },
};

// Resilient Heuristic Validations
function generateHeuristicValidations(data: any) {
  const validations: any[] = [];
  const setup = data?.setup || {};
  const assumptions = data?.assumptions || {};
  const environments = data?.environments || {};
  const workloads = data?.workloads || {};
  const results = data?.results || {};

  const minEntitlement = MIN_LICENSED_ENTITLEMENT_GB[setup.industryVertical]?.[setup.assessmentType] || 2048;
  if (setup.licensedEntitlementGb && setup.licensedEntitlementGb < minEntitlement) {
    validations.push({
      id: 'val_entitlement_below_min',
      category: 'entitlement',
      severity: 'critical',
      title: `Licensed Entitlement Below Industry Baseline (${setup.licensedEntitlementGb} GB < ${minEntitlement} GB)`,
      message: `The configured storage entitlement of ${setup.licensedEntitlementGb} GB is below the minimum mandatory standard of ${minEntitlement} GB (${(minEntitlement / 1024).toFixed(1)} TB) for ${setup.industryVertical?.replace(/_/g, ' ') || 'the industry'} under ${setup.assessmentType?.replace(/_/g, ' ') || 'the assessment type'}.`,
      recommendation: `Increase licensed entitlement tier to at least ${minEntitlement} GB.`,
      metricAffected: 'Licensed Capacity Baseline',
    });
  }

  if (!environments.excludeAttachmentsNonProd && environments.nonProdInstances?.length > 1) {
    validations.push({
      id: 'val_env_attach',
      category: 'environments',
      severity: 'critical',
      title: 'Non-PROD Attachments Replication Unrestricted',
      message: 'Sub-production instances (DEV, TEST, QA) are configured to clone all production attachments. In ServiceNow, attachments typically constitute 40–60% of total storage and have minimal testing value on lower environments.',
      recommendation: 'Enable "Exclude Attachments on Non-PROD" in Environment settings to reduce non-PROD storage footprint by up to 50–70%.',
      metricAffected: 'Non-PROD Total Footprint',
    });
  }

  if (assumptions.activeRetentionMonths > 36) {
    validations.push({
      id: 'val_retention_long',
      category: 'retention',
      severity: 'warning',
      title: 'Extended Transactional Retention Period (>36 Months)',
      message: `Active transactional record retention is set to ${assumptions.activeRetentionMonths} months. Unarchived Incident and Task records increase table scan times and primary database growth without steady-state leveling.`,
      recommendation: 'Implement ServiceNow Data Archiving rules (sys_archive) after 24 or 36 months to move cold records into archive tables.',
      metricAffected: 'Primary Database Storage',
    });
  }

  if (workloads.itom?.enabled && assumptions.eventRetentionDays > 30) {
    validations.push({
      id: 'val_itom_retention',
      category: 'workload',
      severity: 'warning',
      title: 'High-Volume ITOM Event Retention',
      message: `ITOM Event Management raw event retention is configured for ${assumptions.eventRetentionDays} days. High-volume raw events (em_event) can generate tens of gigabytes per week of ephemeral data.`,
      recommendation: 'Standard ServiceNow practice is 7–14 days for raw events (em_event) while retaining aggregated alerts (em_alert) longer.',
      metricAffected: 'ITOM Event Table Footprint',
    });
  }

  if (results.year3EntitlementGapGb > 0) {
    validations.push({
      id: 'val_entitlement_breach',
      category: 'entitlement',
      severity: 'critical',
      title: `Entitlement Capacity Deficit Detected (Year 3: ${Math.round(results.year3EntitlementGapGb)} GB)`,
      message: `Projected storage requirements surpass current licensed capacity tier by Year 3. Over-allocation risks emergency add-on purchases or instance throttling.`,
      recommendation: 'Apply storage optimization proposals (archiving, attachment exclusion) or initiate commercial presales capacity add-on procurement.',
      metricAffected: 'Commercial Entitlement Gap',
    });
  } else if (results.year5EntitlementGapGb > 0) {
    validations.push({
      id: 'val_entitlement_warn_y5',
      category: 'entitlement',
      severity: 'info',
      title: `Horizon Entitlement Threshold Reached in Year 5`,
      message: 'Projected cumulative consumption approaches contract boundary in Year 5 under current growth assumptions.',
      recommendation: 'Schedule a Year 3 platform capacity review to assess whether archiving policies have controlled organic table expansion.',
      metricAffected: 'Year 5 Capacity Limit',
    });
  }

  if (assumptions.annualGrowthRate > 0.25) {
    validations.push({
      id: 'val_high_growth',
      category: 'workload',
      severity: 'info',
      title: 'Aggressive Compound Growth Assumption (25%+ CAGR)',
      message: `Projected annual growth of ${(assumptions.annualGrowthRate * 100).toFixed(0)}% represents high organic business expansion or rapid user onboarding.`,
      recommendation: 'Verify growth expectations against customer historical IT service volume trends.',
      metricAffected: 'Compound Annual Sizing',
    });
  }

  return validations;
}

// Resilient Heuristic Proposals
function generateHeuristicProposals(data: any) {
  const proposals: any[] = [];
  const environments = data?.environments || {};
  const assumptions = data?.assumptions || {};

  if (!environments.excludeAttachmentsNonProd) {
    proposals.push({
      id: 'prop_exclude_attach',
      title: 'Exclude Attachments on Non-Production Instances',
      category: 'environments',
      estimatedSavingsGb: Math.round((data?.results?.year3GrossGb || 1200) * 0.32),
      rationale: 'ServiceNow Cloud Infrastructure best practice dictates excluding sys_attachment_doc records from lower environments (DEV, TEST, QA) clone profiles. This eliminates redundant multi-gigabyte payloads across non-PROD.',
      mutation: {
        field: 'environments.excludeAttachmentsNonProd',
        value: true,
        description: 'Set Exclude Attachments on Non-PROD to ON',
      },
    });
  }

  if (assumptions.activeRetentionMonths > 24) {
    proposals.push({
      id: 'prop_archiving_24m',
      title: 'Activate ServiceNow Data Archiving at 24 Months',
      category: 'archiving',
      estimatedSavingsGb: Math.round((data?.results?.year3DatabaseGb || 600) * 0.28),
      rationale: 'Archiving closed Incidents, Requests, and Changes older than 24 months flattens active table growth and preserves primary database high-performance query caching.',
      mutation: {
        field: 'assumptions.activeRetentionMonths',
        value: 24,
        description: 'Adjust active record retention from current setting to 24 months',
      },
    });
  }

  if (assumptions.auditRetentionMonths > 18) {
    proposals.push({
      id: 'prop_audit_truncate',
      title: 'Implement sys_audit Log Lifecycle Rotation (12 Months)',
      category: 'retention',
      estimatedSavingsGb: Math.round((data?.results?.year3AuditGb || 300) * 0.4),
      rationale: 'Audit history tables (sys_audit) grow exponentially with workflow updates. Rotating raw audit records past 12 months into ServiceNow Audit Archive reduces operational table bloat.',
      mutation: {
        field: 'assumptions.auditRetentionMonths',
        value: 12,
        description: 'Set sys_audit archiving threshold to 12 months',
      },
    });
  }

  if ((assumptions.avgAttachmentSizeKb || 850) > 600) {
    proposals.push({
      id: 'prop_attachment_policy',
      title: 'Enforce Attachment File Optimization Policy (500 KB Avg)',
      category: 'attachments',
      estimatedSavingsGb: Math.round((data?.results?.year3AttachmentGb || 500) * 0.35),
      rationale: 'Adopting portal image compression and file upload size governance prevents oversized screenshots and diagnostic logs from saturating sys_attachment_doc tables.',
      mutation: {
        field: 'assumptions.avgAttachmentSizeKb',
        value: 500,
        description: 'Reduce average ticket attachment benchmark to 500 KB',
      },
    });
  }

  return proposals;
}

// Resilient Heuristic Advisor Reply
function generateHeuristicAdvisorReply(question: string, context: any) {
  const q = (question || '').toLowerCase();
  const results = context?.results || {};
  const currentTotal = results.year3GrossGb ? Math.round(results.year3GrossGb) : 1850;
  const entitlement = context?.setup?.licensedEntitlementGb || 4096;

  if (q.includes('attachment') || q.includes('file')) {
    return `### Attachment Storage Analysis in ServiceNow
In modern ServiceNow deployments, attachments stored in **sys_attachment** and chunked in **sys_attachment_doc** (4 KB blocks) routinely account for **35% to 65%** of gross instance storage.

**Key Observations for Your Current Assessment:**
- Attachments are projected to consume **${results.year3AttachmentGb ? Math.round(results.year3AttachmentGb) : '~620'} GB** by Year 3.
- **Critical Recommendation:** Ensure **Non-PROD clone exclusion** is active. Cloning attachments into 3-4 sub-production instances multiplies attachment storage 3x–4x with zero developer utility.
- Implementing an attachment size governance policy (e.g., maximum 5 MB per file and automated image compression on the Service Portal) typically delivers **25%–40%** immediate attachment savings.`;
  }

  if (q.includes('archive') || q.includes('retention') || q.includes('audit')) {
    return `### Data Archiving & Retention Strategy
ServiceNow provides built-in Data Archiving (**sys_archive**) and Table Cleaner rules to control exponential table growth.

**Recommended Architectural Policies:**
1. **Task & Transactional Tables (Incident, Change, Problem):** Archive after **24 months** of closure. This transitions records into read-only \`ar_incident\` tables without database index degradation.
2. **Audit History (\`sys_audit\`, \`sys_journal_field\`):** Archive or roll off after **12 to 18 months**. The audit table often equals or exceeds the parent table size!
3. **ITOM Metric & Raw Event Logs:** Retain raw events (\`em_event\`) for **7 to 14 days** maximum, while retaining actionable alerts (\`em_alert\`) for 90 days.`;
  }

  if (q.includes('cio') || q.includes('executive') || q.includes('summary') || q.includes('justif')) {
    return `### Executive Capacity Justification for Leadership
**Assessment Overview:**
- **Instance Scope:** ${context?.setup?.assessmentName || 'Enterprise ServiceNow Deployment'}
- **Current Licensed Capacity:** ${entitlement.toLocaleString()} GB (${(entitlement / 1024).toFixed(1)} TB)
- **Year 3 Projected Storage:** ${currentTotal.toLocaleString()} GB (${((currentTotal / entitlement) * 100).toFixed(0)}% utilization)
- **Capacity Status:** ${currentTotal <= entitlement ? 'Comfortably within licensed quota with healthy operational headroom.' : 'Exceeds standard allocation; capacity optimization or tier expansion required.'}

**Key Strategic Recommendations:**
1. Adopt the storage-optimized sub-production clone profile to avoid paying for duplicated non-PROD storage.
2. Establish formal 24-month lifecycle archiving for task records before Year 2 production go-live.
3. Conduct semi-annual capacity true-up reviews against actual cmdb_ci and transaction volumes.`;
  }

  return `### ServiceNow Storage Architecture Insights
Based on your current configuration (**${context?.setup?.assessmentName || 'ServiceNow Assessment'}**):
- **Planning Horizon:** ${context?.setup?.planningHorizonYears || 5} Years
- **Projected Horizon Storage:** ${results.horizonGrossGb ? Math.round(results.horizonGrossGb) : currentTotal} GB
- **Database vs. Attachment Split:** Approximately ${results.year3DatabaseGb ? Math.round((results.year3DatabaseGb / (results.year3GrossGb || 1)) * 100) : 55}% Database / ${results.year3AttachmentGb ? Math.round((results.year3AttachmentGb / (results.year3GrossGb || 1)) * 100) : 45}% Attachments & Non-PROD.

Feel free to ask about:
- **"How to optimize non-PROD instance cloning?"**
- **"What is the best archiving rule for sys_audit?"**
- **"How does ITOM Discovery & Event volume affect DB storage?"**
- **"Write an executive summary for our proposal"**`;
}

startServer();
