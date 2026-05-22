# CLAUDE.md — PastorAI

> This file provides full context for Claude Code when working on the PastorAI codebase. Read this before making any changes to the project.

---

## What is PastorAI?

PastorAI is a Nigerian veterinary AI platform that gives farmers, field workers, and animal health professionals instant access to evidence-based livestock disease diagnosis, treatment protocols, and husbandry guidance — in plain language, with image recognition, and grounded in a curated corpus of licensed veterinary knowledge.

It is the veterinary equivalent of OpenEvidence, built specifically for the Nigerian context: Nigerian livestock breeds, NAFDAC-registered drugs only, Nigeria-prevalent diseases, and open access (no credential gating — farmers in rural areas are primary users).

**The core product promise**: A farmer sees a sick animal, takes a photo, asks a question (in English, Pidgin, or local language), and gets a plain-language answer with a severity flag and a NAFDAC-approved treatment recommendation — all grounded in cited veterinary literature.

---

## Product Principles

1. **Open access** — no gating, no login required to query. The platform is for farmers, field workers, and vets equally.
2. **Nigeria-first** — all drug recommendations reference NAFDAC-registered products only. Disease prevalence weighting reflects Nigerian livestock realities, not Western companion animal medicine.
3. **Citation-grounded** — every answer must cite its source. The model must never answer from general training knowledge; it must answer only from retrieved corpus context.
4. **Hallucination is a patient safety issue** — if the corpus does not contain sufficient information to answer a query, the system must say so explicitly. Do not fabricate dosages, drug names, or treatment protocols.
5. **Plain language first** — responses are written for a farmer, not a veterinarian. Clinical detail is available on demand (toggle), but the default response is simple and actionable.
6. **Severity triage on every response** — every answer must include a severity flag: 🟢 Monitor / 🟡 Treat / 🔴 Urgent (get a vet).
7. **Online only** — no offline mode in the current version. Do not build or suggest offline caching features.

---

## Target Users

| User | Context | Primary Need |
|---|---|---|
| Smallholder farmer | Rural, mobile-first, may use Pidgin or Yoruba/Hausa | "What is wrong with my animal and what do I give it?" |
| Animal health worker (VAHW) | Field-based, some training | Diagnosis confirmation, drug dosing |
| Veterinarian (VCNV registered) | Clinic or farm visit | Evidence lookup, protocol reference |
| Poultry farm manager | Commercial operation | Outbreak identification, vaccination schedule |

---

## Livestock Scope

PastorAI covers all major Nigerian livestock categories:

- **Poultry** — broilers, layers, indigenous chickens, turkeys, ducks
- **Cattle** — Zebu (White Fulani, Red Bororo), Bunaji, Muturu, crossbreeds
- **Small ruminants** — West African Dwarf Goat, Sahel Goat, Yankasa sheep, Uda sheep
- **Pigs** — indigenous black hairy pig, Duroc, Large White, Hampshire, Landrace crossbreeds

---

## Priority Diseases by Species

These diseases must be well-represented in the corpus and should be prioritised in RAG retrieval weighting:

**Poultry**
- Newcastle Disease (ND) — highest priority; most prevalent poultry disease in Nigeria
- Infectious Bursal Disease / Gumboro (IBD)
- Marek's Disease
- Highly Pathogenic Avian Influenza (HPAI)
- Fowl Typhoid (*Salmonella gallinarum*)
- Coccidiosis (*Eimeria* spp.)
- Avian Infectious Bronchitis (IB)
- Fowl Cholera (*Pasteurella multocida*)
- Mycoplasmosis

**Cattle**
- Foot and Mouth Disease (FMD)
- Trypanosomiasis (Nagana)
- Contagious Bovine Pleuropneumonia (CBPP)
- Brucellosis
- Lumpy Skin Disease (LSD)
- Anthrax
- Tick-borne diseases (East Coast Fever, Babesiosis, Anaplasmosis)
- Dermatophilosis

**Goats & Sheep**
- Peste des Petits Ruminants (PPR)
- Foot and Mouth Disease (FMD)
- Contagious Caprine Pleuropneumonia (CCPP)
- Helminthosis (GI worms)
- Mange
- Caseous Lymphadenitis (CLA)
- Orf (Contagious Ecthyma)

**Pigs**
- African Swine Fever (ASF)
- Classical Swine Fever (CSF)
- Porcine Reproductive and Respiratory Syndrome (PRRS)
- Swine Erysipelas
- Porcine Cysticercosis

---

## System Architecture

### Overview

PastorAI is a RAG (Retrieval-Augmented Generation) application. The core pipeline is:

```
User Input (text + optional image)
        ↓
Language Detection → Translation to English (if needed)
        ↓
Query Classification (species / symptom / drug / husbandry)
        ↓
Semantic Search → Vector DB → Top 6–8 chunks retrieved
        ↓
Reranking (Cohere Rerank)
        ↓
LLM Generation (Claude) — answer ONLY from retrieved context
        ↓
Response: Plain language answer + citations + severity flag + drug recommendation
```

For image inputs, an additional vision path runs in parallel:

```
Image Upload
        ↓
Vision LLM Analysis (Claude vision) — extract visible symptoms
        ↓
Symptom keywords fed into RAG pipeline (merges with text path)
        ↓
Combined: visual findings + evidence-backed protocol
```

### Key Architectural Rules

- **The LLM must never answer from general training knowledge.** The system prompt must explicitly instruct the model to answer only from the provided context chunks. If context is insufficient, the model must respond: *"I don't have sufficient information in my knowledge base to answer this query reliably. Please consult a veterinarian."*
- **Every response must include source citations** referencing the specific corpus document and section.
- **Drug recommendations must be NAFDAC-validated** — cross-reference against the NAFDAC drug formulary layer before surfacing any drug name.
- **Severity flags are mandatory** on every diagnostic response.

---

## Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Frontend | React Native (Expo) | iOS + Android; mobile-first design |
| Backend | FastAPI | Python; deployed on Railway or Render |
| Vector DB | Supabase pgvector | Managed Postgres; handles embeddings |
| Embeddings | OpenAI `text-embedding-3-small` | 1536 dimensions |
| Reranking | Cohere Rerank API | Improves retrieval precision significantly |
| LLM | Claude (via Anthropic API) | claude-sonnet-4-20250514 for generation; claude-sonnet-4-20250514 for vision |
| Translation | Google Translate API | Handles Yoruba, Hausa, Igbo → English → back |
| Voice input | OpenAI Whisper API | Transcription for audio queries |
| Auth | Supabase Auth | Optional login; not required for queries |
| File storage | Supabase Storage | Image uploads |

---

## Corpus

### Sources

The knowledge base is built from the following licensed and open-access sources:

| Source | Type | Access |
|---|---|---|
| NAFDAC GreenBook (veterinary category) | Drug formulary | Public — greenbook.nafdac.gov.ng |
| NAFDAC List of Registered Animal Health Products | Drug formulary | Public PDF — nafdac.gov.ng |
| WOAH Terrestrial Animal Health Code (current edition) | Disease standards | Free PDF — woah.org |
| WOAH Manual of Diagnostic Tests and Vaccines for Terrestrial Animals | Diagnostic protocols | Free PDF — woah.org |
| FAO Animal Production and Health manuals | Husbandry / disease | Free PDF — fao.org/publications |
| FAO Manual on Livestock Disease Surveillance | Surveillance protocols | Free PDF — fao.org |
| ILRI Nigeria publications | Research, West Africa context | Free — ilri.org/knowledge |
| Nigeria Livestock Master Plan 2026–2040 | Policy / sector context | Free — cgspace.cgiar.org |
| Nigeria Livestock Roadmap | Species-specific strategy | Free — faolex.fao.org |
| PubMed Central — Nigeria disease papers | Peer-reviewed research | Free full-text — ncbi.nlm.nih.gov/pmc |
| Journal of Veterinary and Biomedical Sciences (JVBS) | Nigerian research, CC BY | Free — jvbs.net |
| Frontiers in Veterinary Science (Nigeria-relevant papers) | Open access research | Free — frontiersin.org |
| NVRI Vom Journal of Veterinary Science | Nigeria-specific research | Partnership with NVRI, Vom |
| Licensed veterinary textbooks and journals | Clinical reference | Licensed — confirm with Ope before ingesting |

### Corpus Metadata Schema

Every ingested chunk must carry the following metadata for filtered retrieval:

```json
{
  "source_title": "string",
  "source_type": "journal_article | textbook | regulatory | government | manual",
  "publisher": "string",
  "publication_year": "integer",
  "species": ["poultry", "cattle", "goat", "sheep", "pig", "all"],
  "disease_tags": ["newcastle_disease", "fmd", "ppr", ...],
  "content_type": "diagnosis | treatment | husbandry | drug | surveillance | epidemiology",
  "nigeria_specific": "boolean",
  "nafdac_validated": "boolean",
  "chunk_index": "integer",
  "source_url": "string"
}
```

### Chunking Strategy

- Target chunk size: **600–800 tokens**
- Overlap: **100 tokens** between adjacent chunks
- Preserve section headers in each chunk for context
- Drug name entities must never be split across chunk boundaries
- Tables (e.g., dosing tables) must be kept as single chunks

---

## API Design

### Core Endpoints

#### `POST /query`
Main query endpoint. Accepts text + optional image.

```json
// Request
{
  "query": "string",
  "species": "poultry | cattle | goat | sheep | pig | unknown",
  "image_base64": "string | null",
  "language": "en | pcm | yo | ha | ig | auto",
  "session_id": "string | null"
}

// Response
{
  "answer": "string",                    // Plain language answer
  "answer_clinical": "string | null",   // Clinical detail (on request)
  "severity": "monitor | treat | urgent",
  "severity_reason": "string",
  "drug_recommendations": [
    {
      "drug_name": "string",
      "nafdac_reg_no": "string",
      "dosage": "string",
      "route": "string",
      "withdrawal_period": "string | null"
    }
  ],
  "citations": [
    {
      "source_title": "string",
      "publisher": "string",
      "year": "integer",
      "url": "string | null"
    }
  ],
  "image_findings": "string | null",    // Visual analysis summary if image provided
  "insufficient_context": "boolean",    // True if corpus lacked sufficient info
  "query_language_detected": "string"
}
```

#### `GET /health`
Standard health check.

#### `POST /feedback`
Submit query feedback (thumbs up/down + optional note). Used for corpus quality improvement.

---

## Response Format Rules

When generating responses, Claude must follow these rules without exception:

1. **Answer only from retrieved context.** Never use general veterinary training knowledge to fill gaps.
2. **If context is insufficient**, set `insufficient_context: true` and respond: *"I don't have enough reliable information in my knowledge base for this. Please consult a registered veterinarian."*
3. **Plain language default.** Write as if explaining to a farmer with no formal education. Avoid Latin disease names in the primary answer (use them in the clinical detail toggle only).
4. **Always include a severity flag** with a one-sentence reason.
5. **Drug names must match NAFDAC registry.** Never recommend a drug not in the NAFDAC veterinary formulary. If no NAFDAC-registered drug is available for a condition, say so explicitly.
6. **Cite every factual claim.** Minimum one citation per diagnostic statement, one per treatment recommendation.
7. **Zoonotic risk must be flagged.** If a disease has human health implications (brucellosis, avian influenza, anthrax, etc.), include a zoonotic risk warning in plain language.
8. **Never diagnose definitively from an image alone.** Image findings feed the RAG pipeline; the model must state that visual findings are preliminary and confirmation may require lab tests.

---

## Language Handling

| Input Language | Handling |
|---|---|
| English | Direct to pipeline |
| Nigerian Pidgin (pcm) | Google Translate API → English → pipeline → translate response back |
| Yoruba | Google Translate API → English → pipeline → translate response back |
| Hausa | Google Translate API → English → pipeline → translate response back |
| Igbo | Google Translate API → English → pipeline → translate response back |
| Voice (any language) | Whisper API transcription → language detection → above flow |

Translation quality note: Google Translate handles Hausa and Yoruba at functional but imperfect quality. Flag translated responses with a banner: *"This response was translated. For critical decisions, please verify with a veterinarian."*

---

## Image Recognition

### Current Approach (v1)
Vision analysis is handled by Claude's vision API. Images are:
1. Compressed client-side before upload (max 1MB)
2. Sent to Claude vision with a structured prompt extracting: visible symptoms, affected body part, estimated severity, possible differentials
3. Extracted symptom keywords are merged with the text query and fed into the RAG pipeline
4. The combined context (vision output + retrieved chunks) is used for final generation

### Vision Prompt Template

```
You are a veterinary diagnostic assistant reviewing an image of a [species].

Identify and list:
1. Visible clinical signs (be specific: location on body, appearance, extent)
2. Affected body systems (respiratory, skin, GI, neurological, musculoskeletal, eye/ear)
3. Estimated severity (mild / moderate / severe / critical)
4. Top 3 differential diagnoses based on visual findings alone

Important:
- Be conservative. Do not over-diagnose from visual alone.
- Flag if image quality is insufficient for reliable visual assessment.
- Note any zoonotic risk indicators visible in the image.

Respond in structured JSON only.
```

### Future (v2)
Fine-tuned classification model on Nigerian livestock disease images, trained on labeled data from NVRI and veterinary university partners. This runs in parallel with vision LLM and outputs confidence-scored differentials.

---

## Data & Privacy

- **No PII is required** for core queries — farmers can query anonymously
- If a user creates an optional account, store only: email, optional name, query history
- **Image data**: uploaded images are processed and may be stored for corpus improvement and model training. This must be disclosed in the app onboarding and privacy policy
- Aggregated, anonymised query data (disease type, species, LGA approximation) may be shared with partners (NVRI, NAFDAC, insurance companies, development organisations) for epidemiological purposes. Individual queries are never shared.
- No data is sold to third parties

---

## Monetisation Context

PastorAI is free to all users. Revenue comes from the ecosystem, not the farmer:

1. **Animal pharma sponsorship** — NAFDAC-registered drug companies (Elanco Nigeria, MSD Animal Health, Coopers) sponsor relevant drug recommendations (clearly labelled as "Sponsored")
2. **Anonymised disease data licensing** — aggregated outbreak signals by species and LGA, sold to livestock insurers (NIRSAL, AXA Mansard Agriculture) and development organisations
3. **Vet referral network** — directory of verified VCNV-registered vets; referral fee when farmer books via 🔴 Urgent flow
4. **Government / NGO programme integration** — USAID, Gates Foundation, FAO use PastorAI as delivery infrastructure for livestock health programmes
5. **Input supplier partnerships** — feed, vaccine, and supplement suppliers

---

## Development Guidelines

### Environment Variables

```env
ANTHROPIC_API_KEY=
OPENAI_API_KEY=           # For embeddings (text-embedding-3-small) and Whisper
COHERE_API_KEY=           # For reranking
GOOGLE_TRANSLATE_API_KEY=
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=
```

### Key Commands

```bash
# Install dependencies
pip install -r requirements.txt

# Run backend locally
uvicorn main:app --reload --port 8000

# Run corpus ingestion pipeline
python scripts/ingest.py --source [source_name] --chunk-size 700

# Run embedding generation
python scripts/embed.py --input data/chunks/ --output supabase

# Run reindex (after corpus update)
python scripts/reindex.py
```

### Project Structure

```
pastorAI/
├── CLAUDE.md                  # This file
├── README.md
├── main.py                    # FastAPI app entry point
├── api/
│   ├── routes/
│   │   ├── query.py           # POST /query
│   │   ├── feedback.py        # POST /feedback
│   │   └── health.py          # GET /health
│   └── middleware/
│       └── translation.py     # Language detection + translation
├── rag/
│   ├── retriever.py           # Vector search + reranking
│   ├── generator.py           # Claude generation with strict context instructions
│   └── vision.py              # Image analysis pipeline
├── corpus/
│   ├── ingest/
│   │   ├── pdf_parser.py      # PDF chunking
│   │   ├── web_scraper.py     # NAFDAC GreenBook scraper
│   │   └── metadata.py        # Metadata tagging
│   ├── embed.py               # Embedding generation
│   └── reindex.py             # Supabase pgvector upsert
├── models/
│   ├── query.py               # Pydantic request/response models
│   └── corpus.py              # Corpus chunk models
├── scripts/
│   └── ingest.py              # CLI for corpus ingestion
├── data/
│   ├── raw/                   # Source documents (not committed)
│   ├── chunks/                # Processed chunks (not committed)
│   └── nafdac_formulary.json  # NAFDAC drug registry snapshot
├── mobile/                    # React Native (Expo) app
│   ├── app/
│   ├── components/
│   └── package.json
├── tests/
│   ├── test_retrieval.py
│   ├── test_generation.py
│   └── test_vision.py
└── requirements.txt
```

### Code Style

- Python backend: follow PEP 8; use type hints throughout
- Use Pydantic models for all request/response validation
- All RAG pipeline functions must be independently testable
- Never hardcode API keys; always use environment variables
- Log all queries (anonymised) for quality monitoring
- Every generation call must include the strict context instruction in the system prompt — never remove or weaken this constraint

### Testing Priorities

1. **Retrieval quality** — for a set of benchmark queries (one per priority disease), assert that the correct source documents are in the top 5 retrieved chunks
2. **Hallucination guard** — assert that when no relevant context exists, `insufficient_context` is returned, not a fabricated answer
3. **NAFDAC filter** — assert that no drug recommendation surfaces a drug not in `nafdac_formulary.json`
4. **Severity flag** — assert that every diagnostic response includes a severity field with a valid value
5. **Vision pipeline** — assert that image + query produces a richer retrieval result than query alone

---

## Corpus Build Status

Track ingestion progress here. Update as sources are added.

| Source | Status | Chunks | Last Updated |
|---|---|---|---|
| NAFDAC GreenBook (veterinary) | ⬜ Pending | — | — |
| NAFDAC Registered Animal Health Products PDF | ⬜ Pending | — | — |
| WOAH Terrestrial Code (current) | ⬜ Pending | — | — |
| WOAH Diagnostic Manual | ⬜ Pending | — | — |
| FAO Disease & Husbandry Manuals | ⬜ Pending | — | — |
| ILRI Nigeria publications | ⬜ Pending | — | — |
| Nigeria Livestock Master Plan 2026–2040 | ⬜ Pending | — | — |
| PubMed Central — Nigeria disease papers | ⬜ Pending | — | — |
| JVBS (University of Abuja journal) | ⬜ Pending | — | — |
| NVRI Vom Journal | ⬜ Pending | — | — |
| Licensed sources | ⬜ Pending | — | — |

---

## Key Contacts & Partners

| Organisation | Role | Contact |
|---|---|---|
| NVRI, Vom | Primary Nigerian research partner; Vom Journal access | Director General, nvri.gov.ng |
| NAFDAC | Drug registry data source | Veterinary directorate |
| VCNV | Vet credential reference (optional future feature) | Veterinary Council of Nigeria |
| ILRI Nigeria | Research partner | ilri.org/where-we-work/west-africa/nigeria |
| FAO Nigeria | Programme integration potential | fao.org/nigeria |

---

## What This Project Is Not

- Not a telemedicine platform (we do not connect farmers to vets in real-time — that is a referral, not a consult)
- Not a replacement for a veterinarian in urgent cases — the 🔴 flag exists specifically to direct people to professional care
- Not a human medical platform — all content is animal health only
- Not offline-capable in v1 — do not build offline features without explicit instruction

---

*Last updated: May 2026. Maintained by Fast Forward Venture Studio.*
