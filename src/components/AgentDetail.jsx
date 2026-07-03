import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { agentAPI } from "../services/api";

const emptyStructuredConfig = () => ({
  businessName: "",
  industry: "",
  agentRole: "receptionist",
  tone: "friendly and professional",
  greeting: "",
  services: "",
  hours: "",
  location: "",
  escalation: "",
  faqs: [],
});

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "prompt", label: "Prompt" },
  { key: "knowledge", label: "Knowledge Base" },
];

function useToast() {
  const [toast, setToast] = useState(null);
  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);
  return [toast, (message, variant = "success") => setToast({ message, variant })];
}

function AgentDetail() {
  const { agentId } = useParams();
  const [tab, setTab] = useState("overview");
  const [toast, showToast] = useToast();

  const { data, isLoading, error } = useQuery({
    queryKey: ["agent-config", agentId],
    queryFn: async () => {
      const response = await agentAPI.getConfig(agentId);
      return response.data;
    },
  });

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed top-4 right-4 z-50">
          <div
            className={`rounded-lg px-4 py-3 shadow-lg text-sm font-medium ${
              toast.variant === "success"
                ? "bg-emerald-600 text-white"
                : "bg-rose-600 text-white"
            }`}
          >
            {toast.message}
          </div>
        </div>
      )}

      <div>
        <Link to="/dashboard/agents" className="text-sm text-accent-700 hover:text-accent-800">
          ← Back to agents
        </Link>
        <h1 className="mt-2 text-3xl font-semibold text-navy-900">
          {data?.agentName || "Agent"}
        </h1>
        <p className="text-ink-600 mt-1">Configure how this AI agent talks and what it knows.</p>
      </div>

      <div className="flex gap-1 border-b border-navy-100">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition ${
              tab === t.key
                ? "border-accent-600 text-accent-700"
                : "border-transparent text-ink-500 hover:text-ink-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="card-surface rounded-lg p-8 text-center text-ink-500">Loading…</div>
      ) : error ? (
        <div className="card-surface rounded-lg p-6 text-accent-700">
          {error.message || "Failed to load agent."}
        </div>
      ) : (
        <>
          {tab === "overview" && <OverviewTab data={data} />}
          {tab === "prompt" && (
            <PromptTab agentId={agentId} data={data} showToast={showToast} />
          )}
          {tab === "knowledge" && (
            <KnowledgeTab agentId={agentId} data={data} showToast={showToast} />
          )}
        </>
      )}
    </div>
  );
}

function OverviewTab({ data }) {
  const rows = [
    ["Status", data.status],
    ["Response engine", data.responseEngineType || "—"],
    ["Voice", data.voiceId || "—"],
    ["Language", data.language || "—"],
    ["Prompt editable", data.editable ? "Yes" : "No"],
    [
      "Last published",
      data.lastPublishedAt
        ? new Date(data.lastPublishedAt).toLocaleString()
        : "—",
    ],
  ];
  return (
    <div className="card-surface rounded-lg p-6 max-w-2xl">
      <dl className="divide-y divide-navy-100">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between py-3 text-sm">
            <dt className="text-ink-500">{label}</dt>
            <dd className="font-medium text-navy-900 capitalize">{value}</dd>
          </div>
        ))}
      </dl>
      {!data.editable && data.editableReason && (
        <p className="mt-4 rounded-lg bg-navy-50 border border-navy-100 px-4 py-3 text-sm text-ink-600">
          {data.editableReason}
        </p>
      )}
    </div>
  );
}

function PromptTab({ agentId, data, showToast }) {
  const queryClient = useQueryClient();
  const [config, setConfig] = useState(() => ({
    ...emptyStructuredConfig(),
    ...(data.structuredConfig || {}),
  }));
  const [rawMode, setRawMode] = useState(false);
  const [rawPrompt, setRawPrompt] = useState(data.prompt || "");
  const [saving, setSaving] = useState(false);

  const setField = (field, value) =>
    setConfig((prev) => ({ ...prev, [field]: value }));

  const faqs = useMemo(() => config.faqs || [], [config.faqs]);
  const setFaqs = (next) => setConfig((prev) => ({ ...prev, faqs: next }));

  if (!data.editable) {
    return (
      <div className="card-surface rounded-lg p-6">
        <p className="text-sm text-ink-600 mb-3">{data.editableReason}</p>
        <pre className="whitespace-pre-wrap rounded-lg bg-navy-50 p-4 text-sm text-ink-700">
          {data.prompt || "No prompt available."}
        </pre>
      </div>
    );
  }

  const save = async (publish) => {
    setSaving(true);
    try {
      const payload = rawMode
        ? { rawPrompt, publish }
        : { structuredConfig: config, publish };
      await agentAPI.updateConfig(agentId, payload);
      showToast(publish ? "Published to your live agent." : "Draft saved.");
      queryClient.invalidateQueries({ queryKey: ["agent-config", agentId] });
    } catch (err) {
      showToast(err.message || "Failed to save.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {data.canEditRaw && (
        <div className="flex items-center justify-end gap-2">
          <label className="text-sm text-ink-600">Advanced: edit raw prompt</label>
          <input
            type="checkbox"
            checked={rawMode}
            onChange={(e) => setRawMode(e.target.checked)}
            className="h-4 w-4 accent-accent-600"
          />
        </div>
      )}

      {rawMode ? (
        <div className="card-surface rounded-lg p-6">
          <label className="block text-sm font-medium text-ink-700 mb-2">
            Raw system prompt
          </label>
          <textarea
            value={rawPrompt}
            onChange={(e) => setRawPrompt(e.target.value)}
            rows={18}
            className="w-full rounded-lg border border-navy-200 px-4 py-3 text-sm font-mono focus:border-accent-600 focus:outline-none focus:ring-2 focus:ring-accent-600/20"
          />
        </div>
      ) : (
        <div className="card-surface rounded-lg p-6 space-y-5">
          <div className="grid gap-5 md:grid-cols-2">
            <TextField label="Business name" value={config.businessName} onChange={(v) => setField("businessName", v)} />
            <TextField label="Industry" value={config.industry} onChange={(v) => setField("industry", v)} placeholder="e.g. dental clinic" />
            <TextField label="Agent role" value={config.agentRole} onChange={(v) => setField("agentRole", v)} />
            <TextField label="Tone" value={config.tone} onChange={(v) => setField("tone", v)} />
          </div>
          <TextField label="Greeting" value={config.greeting} onChange={(v) => setField("greeting", v)} placeholder="Thanks for calling Acme, how can I help?" />
          <TextArea label="Services offered" value={config.services} onChange={(v) => setField("services", v)} />
          <div className="grid gap-5 md:grid-cols-2">
            <TextField label="Hours" value={config.hours} onChange={(v) => setField("hours", v)} placeholder="Mon–Fri 9am–5pm" />
            <TextField label="Location" value={config.location} onChange={(v) => setField("location", v)} />
          </div>
          <TextArea label="When to escalate / transfer" value={config.escalation} onChange={(v) => setField("escalation", v)} />

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-ink-700">FAQs</label>
              <button
                type="button"
                onClick={() => setFaqs([...faqs, { question: "", answer: "" }])}
                className="text-xs font-semibold text-accent-700 hover:text-accent-800"
              >
                + Add FAQ
              </button>
            </div>
            <div className="space-y-3">
              {faqs.length === 0 && (
                <p className="text-sm text-ink-400">No FAQs yet.</p>
              )}
              {faqs.map((faq, i) => (
                <div key={i} className="rounded-lg border border-navy-100 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wide text-ink-400">
                      FAQ {i + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => setFaqs(faqs.filter((_, idx) => idx !== i))}
                      className="text-xs text-accent-700 hover:text-accent-800"
                    >
                      Remove
                    </button>
                  </div>
                  <input
                    value={faq.question}
                    onChange={(e) =>
                      setFaqs(faqs.map((f, idx) => (idx === i ? { ...f, question: e.target.value } : f)))
                    }
                    placeholder="Question"
                    className="w-full rounded-lg border border-navy-200 px-3 py-2 text-sm focus:border-accent-600 focus:outline-none focus:ring-2 focus:ring-accent-600/20"
                  />
                  <textarea
                    value={faq.answer}
                    onChange={(e) =>
                      setFaqs(faqs.map((f, idx) => (idx === i ? { ...f, answer: e.target.value } : f)))
                    }
                    placeholder="Answer"
                    rows={2}
                    className="w-full rounded-lg border border-navy-200 px-3 py-2 text-sm focus:border-accent-600 focus:outline-none focus:ring-2 focus:ring-accent-600/20"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="rounded-lg bg-gold-500/10 border border-gold-500/30 px-4 py-3 text-sm text-ink-700">
        💡 Save a draft, then call your agent's number to test it before publishing. Publishing updates your live phone agent immediately.
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => save(false)}
          disabled={saving}
          className="rounded-lg border border-navy-200 px-4 py-2 text-sm font-semibold text-ink-700 hover:bg-navy-50 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save draft"}
        </button>
        <button
          type="button"
          onClick={() => save(true)}
          disabled={saving}
          className="rounded-lg bg-accent-600 px-4 py-2 text-sm font-semibold text-white hover:bg-accent-700 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save & publish"}
        </button>
      </div>
    </div>
  );
}

function KnowledgeTab({ agentId, data, showToast }) {
  const queryClient = useQueryClient();
  const [text, setText] = useState({ title: "", body: "" });
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);

  const { data: kb, isLoading } = useQuery({
    queryKey: ["agent-kb", agentId],
    queryFn: async () => {
      const response = await agentAPI.getKnowledgeBase(agentId);
      return response.data;
    },
    enabled: data.editable,
  });

  if (!data.editable) {
    return (
      <div className="card-surface rounded-lg p-6 text-sm text-ink-600">
        {data.editableReason}
      </div>
    );
  }

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["agent-kb", agentId] });

  const buildPayload = () => {
    const texts = text.body.trim()
      ? [{ title: text.title.trim() || "Untitled", text: text.body.trim() }]
      : [];
    const urls = url.trim() ? [url.trim()] : [];
    return { texts, urls };
  };

  const handleAdd = async () => {
    const payload = buildPayload();
    if (payload.texts.length === 0 && payload.urls.length === 0) {
      showToast("Add some text or a URL first.", "error");
      return;
    }
    setBusy(true);
    try {
      if (!kb) {
        await agentAPI.createKnowledgeBase(agentId, payload);
        showToast("Knowledge base created and attached.");
      } else {
        await agentAPI.addKnowledgeBaseSources(agentId, payload);
        showToast("Source added.");
      }
      setText({ title: "", body: "" });
      setUrl("");
      refresh();
    } catch (err) {
      showToast(err.message || "Failed to add source.", "error");
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteSource = async (sourceId) => {
    if (!window.confirm("Remove this source?")) return;
    setBusy(true);
    try {
      await agentAPI.deleteKnowledgeBaseSource(agentId, sourceId);
      showToast("Source removed.");
      refresh();
    } catch (err) {
      showToast(err.message || "Failed to remove source.", "error");
    } finally {
      setBusy(false);
    }
  };

  const sources = kb?.knowledge_base_sources || kb?.sources || [];

  return (
    <div className="space-y-6">
      <div className="card-surface rounded-lg p-6">
        <h3 className="text-base font-semibold text-navy-900">
          {kb ? "Add a source" : "Create a knowledge base"}
        </h3>
        <p className="text-sm text-ink-500 mt-1">
          Give your agent facts to answer from — paste text or link a page. Retell indexes it automatically.
        </p>
        <div className="mt-4 space-y-4">
          <TextField label="Title (optional)" value={text.title} onChange={(v) => setText((p) => ({ ...p, title: v }))} />
          <TextArea label="Text content" value={text.body} onChange={(v) => setText((p) => ({ ...p, body: v }))} />
          <TextField label="Or a URL to scrape" value={url} onChange={setUrl} placeholder="https://…" />
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleAdd}
              disabled={busy}
              className="rounded-lg bg-accent-600 px-4 py-2 text-sm font-semibold text-white hover:bg-accent-700 disabled:opacity-50"
            >
              {busy ? "Working…" : kb ? "Add source" : "Create knowledge base"}
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="card-surface rounded-lg p-6 text-ink-500 text-sm">Loading knowledge base…</div>
      ) : kb ? (
        <div className="card-surface rounded-lg p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-navy-900">Sources</h3>
            {kb.status && (
              <span className="text-xs font-semibold text-ink-500 capitalize">
                Status: {kb.status}
              </span>
            )}
          </div>
          <div className="mt-4 divide-y divide-navy-100">
            {sources.length === 0 ? (
              <p className="text-sm text-ink-400 py-2">No sources yet.</p>
            ) : (
              sources.map((source) => (
                <div
                  key={source.source_id || source.id}
                  className="flex items-center justify-between py-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-navy-900 truncate">
                      {source.filename || source.title || source.url || source.type || "Source"}
                    </p>
                    {source.type && (
                      <p className="text-xs text-ink-400 uppercase tracking-wide">{source.type}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteSource(source.source_id || source.id)}
                    disabled={busy}
                    className="rounded-lg border border-accent-600/30 px-3 py-1.5 text-xs font-semibold text-accent-700 hover:bg-accent-600/10 disabled:opacity-50"
                  >
                    Remove
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function TextField({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label className="block text-sm font-medium text-ink-700 mb-1.5">{label}</label>
      <input
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-navy-200 px-3 py-2 text-sm focus:border-accent-600 focus:outline-none focus:ring-2 focus:ring-accent-600/20"
      />
    </div>
  );
}

function TextArea({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label className="block text-sm font-medium text-ink-700 mb-1.5">{label}</label>
      <textarea
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="w-full rounded-lg border border-navy-200 px-3 py-2 text-sm focus:border-accent-600 focus:outline-none focus:ring-2 focus:ring-accent-600/20"
      />
    </div>
  );
}

export default AgentDetail;
