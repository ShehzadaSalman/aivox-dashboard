# PRD — Agent Configuration (Sync, Prompt, Knowledge Base)

**Owner:** Product
**Status:** In progress
**Last updated:** 2026-07-02
**Primary persona:** End client (`USER`) editing their own agents; agency (`ADMIN`/`SUPERADMIN`) with full access.

---

## 1. Problem

The Agents module is a read-only mirror of Retell. Agents only land in the DB when
someone manually calls `POST /sync-agents`, and the stored record is thin
(`agent_id`, `agent_name`, `status`). Clients can't see or change how their AI behaves —
the prompt and knowledge base live only in Retell and require the agency to edit them by
hand. This makes the product feel broken and non-self-serve.

## 2. Goals

1. **Automate sync** so agents stay current without manual action.
2. **Let clients configure their agent's behavior** via safe, structured fields; give
   admins raw prompt access.
3. **Let clients manage a knowledge base** (text/URLs) that grounds their agent.

### Non-goals (this iteration)
- In-browser test calls (Retell web SDK) — clients test by calling the agent's number.
- Editing voice, phone numbers, or conversation-flow agents (prompt editing applies to
  Retell-LLM agents only).
- Building our own RAG — Retell's Knowledge Base handles chunking/embedding/retrieval.

## 3. Key technical facts (verified against installed retell-sdk)

- The prompt is **not on the agent**. `agent.response_engine` is one of
  `RetellLM | CustomLM | ConversationFlow`. For Retell-LLM agents the prompt is
  `llm.general_prompt`, edited via `llm.update(llm_id, { general_prompt })`.
- Agents support draft + publish: `agent.publish(agentId)`, `agent.getVersions()`.
- Knowledge base is native: `knowledgeBase.create / addSources / deleteSource / list`,
  attached to an LLM via `llm.knowledge_base_ids`.
- Deploy target is **Netlify Functions**; auto-sync uses a **Netlify Scheduled Function**.

## 4. Requirements

### 4.1 Automated sync (Phase 1)
- A scheduled function runs the agent sync every 15 minutes.
- Sync upserts `llm_id`, `response_engine_type`, and `knowledge_base_id` alongside
  name/status so the config surface has what it needs.
- A manual **"Sync now"** button remains for admins (immediate refresh).
- Agents referenced by synced calls are upserted opportunistically (self-heal).

### 4.2 Agent detail + read-only config (Phase 1)
- New agent detail page with tabs: **Overview**, **Prompt**, **Knowledge Base**.
- Config is fetched live from Retell (prompt, voice, response-engine type, KB).
- `USER` sees only agents assigned to them (scoped); everyone can view.

### 4.3 Prompt editing (Phase 2)
- **Clients (`USER`)** edit **structured fields** (business name, services, hours,
  greeting, tone, escalation, FAQs) that compile into `general_prompt`.
- **Admins** additionally get a **raw prompt** editor.
- Flow is **Save draft → (test by calling the number) → Publish**. Publishing calls
  `agent.publish`. Structured field values are stored locally so the form is re-editable.
- Non-Retell-LLM agents show the prompt read-only with an explanation.

### 4.4 Knowledge base (Phase 3)
- Clients can create a KB (if none), add **text** and **URL** sources, and remove
  sources. New KB is attached to the agent's LLM via `knowledge_base_ids`.
- KB processing status is surfaced (Retell processes async).

## 5. Permissions
- `USER`: view + edit **their assigned** agents' structured prompt and KB.
- `ADMIN`/`SUPERADMIN`: all agents, plus raw prompt editing and "Sync now".

## 6. Data model (additive)
`Agent` gains: `response_engine_type`, `llm_id`, `knowledge_base_id`, `config` (Json —
structured fields), `last_published_at`.

## 7. Risks & guardrails
- Writes hit **production** voice agents. Mitigations: draft→publish (never write live
  directly), structured-over-raw for clients, scope checks on every write, and clear
  "test before publish" messaging.
- A shared LLM across agents means an edit can affect multiple agents — surface a
  warning when detected.

## 8. Rollout
Phase 1 (sync + read-only) → Phase 2 (prompt) → Phase 3 (KB). Additive migration; no
backfill required.
