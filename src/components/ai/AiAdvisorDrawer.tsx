import React, { useState } from 'react';
import {
  Sparkles,
  X,
  Send,
  Zap,
  CheckCircle2,
  RotateCcw,
  ArrowRight,
  TrendingDown,
  MessageSquare,
  Bot,
  User,
  Shield,
  Layers,
} from 'lucide-react';
import { RsiProposal } from '../../types/calculator';

interface AiAdvisorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  proposals: RsiProposal[];
  onApplyProposal: (proposal: RsiProposal) => void;
  onRollbackProposal: (proposalId: string) => void;
  appliedHistory: RsiProposal[];
  assessmentContext: any;
}

export const AiAdvisorDrawer: React.FC<AiAdvisorDrawerProps> = ({
  isOpen,
  onClose,
  proposals,
  onApplyProposal,
  onRollbackProposal,
  appliedHistory,
  assessmentContext,
}) => {
  const [activeTab, setActiveTab] = useState<'proposals' | 'chat'>('proposals');
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([
    {
      role: 'assistant',
      text: `Hello! I am your **ServiceNow Sizing Architect Advisor**. I analyze instance storage consumption, \`sys_attachment_doc\` chunk dynamics, \`sys_audit\` overhead, and sub-PROD clone multipliers.

How can I assist your presales sizing or capacity planning today?`,
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [sending, setSending] = useState(false);

  if (!isOpen) return null;

  const quickPrompts = [
    'Why are attachments taking so much space?',
    'What archiving rule should we use for task tables?',
    'How should we adjust our non-PROD clone policy?',
    'Draft an executive summary for our CIO',
  ];

  const handleSendMessage = async (msgToSend?: string) => {
    const text = msgToSend || inputMessage;
    if (!text.trim() || sending) return;

    const userMsg = { role: 'user' as const, text };
    setChatMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setSending(true);

    try {
      const res = await fetch('/api/ai/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          assessmentContext,
          conversationHistory: chatMessages.slice(-6),
        }),
      });

      const data = await res.json();
      setChatMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: data.reply || 'Unable to generate advice at this moment.',
        },
      ]);
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: 'Encountered an issue communicating with the sizing advisor service. Please retry.',
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const totalEstimatedSavings = proposals
    .filter((p) => !p.applied)
    .reduce((acc, p) => acc + p.estimatedSavingsGb, 0);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/30 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white h-full shadow-2xl border-l border-slate-200 flex flex-col justify-between animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-xs">
              <Sparkles className="w-4 h-4 text-emerald-200" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                AI Sizing & Optimization Engine
              </h3>
              <p className="text-[11px] text-slate-500">Recursive Self-Improvement & Advisory</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Segmented Tab Controls */}
        <div className="px-5 pt-3 pb-2 border-b border-slate-200 bg-white">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              onClick={() => setActiveTab('proposals')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'proposals'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-emerald-600" />
              <span>RSI Proposals</span>
              {proposals.filter((p) => !p.applied).length > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded-full font-mono">
                  {proposals.filter((p) => !p.applied).length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'chat'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
              <span>Architect Advisor</span>
            </button>
          </div>
        </div>

        {/* Tab 1: RSI Improvement Proposals */}
        {activeTab === 'proposals' && (
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {totalEstimatedSavings > 0 && (
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs font-medium text-emerald-900 block">
                    Available Optimization Savings:
                  </span>
                  <span className="text-base font-bold font-mono text-emerald-700 tabular-nums">
                    ~{totalEstimatedSavings.toLocaleString()} GB Total Storage
                  </span>
                </div>
                <TrendingDown className="w-6 h-6 text-emerald-600" />
              </div>
            )}

            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Active Optimization Proposals
              </h4>

              {proposals.map((proposal) => {
                const isApplied = proposal.applied;
                return (
                  <div
                    key={proposal.id}
                    className={`p-4 rounded-xl border text-xs space-y-2 transition-all ${
                      isApplied
                        ? 'bg-slate-50 border-slate-200 opacity-80'
                        : 'bg-white border-slate-200 shadow-2xs hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-semibold text-slate-900 text-xs">
                        {proposal.title}
                      </div>
                      <span className="text-[11px] font-mono font-bold text-emerald-700 shrink-0">
                        -{proposal.estimatedSavingsGb} GB
                      </span>
                    </div>

                    <p className="text-slate-600 text-[11px] leading-relaxed">
                      {proposal.rationale}
                    </p>

                    <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                      <span className="text-[11px] text-slate-500 font-mono">
                        {proposal.mutation.description}
                      </span>

                      {isApplied ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-emerald-700 font-semibold flex items-center gap-1 text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Applied
                          </span>
                          <button
                            onClick={() => onRollbackProposal(proposal.id)}
                            className="text-[11px] text-slate-500 hover:text-slate-800 underline ml-2"
                          >
                            Rollback
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => onApplyProposal(proposal)}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md font-semibold text-xs transition-colors shadow-2xs whitespace-nowrap"
                        >
                          Apply Proposal
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Applied History & Governance Audit */}
            {appliedHistory.length > 0 && (
              <div className="pt-4 border-t border-slate-200 space-y-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Applied Optimizations History ({appliedHistory.length})
                </h4>
                <div className="space-y-1.5">
                  {appliedHistory.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs flex items-center justify-between"
                    >
                      <div>
                        <span className="font-medium text-slate-800 block">{item.title}</span>
                        <span className="text-[10px] text-slate-500">
                          Savings: ~{item.estimatedSavingsGb} GB
                        </span>
                      </div>
                      <button
                        onClick={() => onRollbackProposal(item.id)}
                        className="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-800 font-medium"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Rollback</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: AI Sizing Architect Chat */}
        {activeTab === 'chat' && (
          <div className="flex-1 flex flex-col justify-between overflow-hidden">
            {/* Messages area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatMessages.map((msg, idx) => {
                const isUser = msg.role === 'user';
                return (
                  <div
                    key={idx}
                    className={`flex items-start gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    {!isUser && (
                      <div className="w-6 h-6 rounded-md bg-emerald-600 flex items-center justify-center text-white shrink-0 mt-0.5">
                        <Bot className="w-3.5 h-3.5" />
                      </div>
                    )}
                    <div
                      className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-xs leading-relaxed whitespace-pre-wrap ${
                        isUser
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-800 border border-slate-200'
                      }`}
                    >
                      {msg.text}
                    </div>
                    {isUser && (
                      <div className="w-6 h-6 rounded-md bg-slate-800 flex items-center justify-center text-white shrink-0 mt-0.5">
                        <User className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                );
              })}

              {sending && (
                <div className="flex items-center gap-2 text-xs text-slate-500 italic p-2">
                  <Sparkles className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                  <span>Sizing Architect is evaluating instance metrics...</span>
                </div>
              )}
            </div>

            {/* Quick prompts */}
            <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/50 flex flex-wrap gap-1.5">
              {quickPrompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(p)}
                  className="px-2 py-1 text-[11px] text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 rounded-md transition-colors truncate max-w-full"
                >
                  {p}
                </button>
              ))}
            </div>

            {/* Input area */}
            <div className="p-3 border-t border-slate-200 bg-white">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Ask a ServiceNow storage architecture question..."
                  className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
                <button
                  type="submit"
                  disabled={!inputMessage.trim() || sending}
                  className="p-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white rounded-lg transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Drawer Footer */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 text-[11px] text-slate-400 flex items-center justify-between">
          <span>ServiceNow Kingston–Xanadu Architecture Standards</span>
          <span className="font-mono">v1.0 Engine</span>
        </div>
      </div>
    </div>
  );
};
