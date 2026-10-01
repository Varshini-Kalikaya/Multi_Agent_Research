/**
 * Smart contextual knowledge and response engine for Helper
 * Used when running offline, in test environments, or when OPENAI_API_KEY is not configured.
 */

export function generateContextualResponse({ message, history = [], isResearchTopic = false, suggestedTopic = null }) {
  const normalized = message.trim().toLowerCase();
  
  // Extract context from previous turns in history
  const lastUserMsg = [...history].reverse().find(m => m.role === 'user')?.content?.toLowerCase() || '';
  const lastAssistantMsg = [...history].reverse().find(m => m.role === 'assistant')?.content?.toLowerCase() || '';

  // 1. Follow-up detection (e.g. "What are its advantages?", "How does it work?", "Give me an example")
  const isFollowUp = 
    normalized.startsWith('what are its') || 
    normalized.startsWith('what are their') || 
    normalized.includes('its advantages') || 
    normalized.includes('its benefits') ||
    normalized.includes('its disadvantages') ||
    normalized.startsWith('how does it') ||
    normalized.startsWith('tell me more about it') ||
    normalized === 'more' ||
    normalized.startsWith('can you explain more');

  if (isFollowUp) {
    if (lastUserMsg.includes('artificial intelligence') || lastUserMsg.includes(' ai') || lastAssistantMsg.includes('artificial intelligence')) {
      return `### Key Advantages of Artificial Intelligence (AI)

Building on our discussion of **Artificial Intelligence**, here are its primary advantages across modern industries:

1. **High Efficiency & Automation**: AI automates repetitive, high-volume tasks without fatigue, accelerating data processing and operational workflows.
2. **24/7 Availability**: Unlike human labor, AI services and autonomous systems operate continuously with consistent availability.
3. **Advanced Pattern Recognition**: Neural networks and deep learning models detect nuanced anomalies, correlations, and predictive trends in massive datasets (e.g., medical diagnostics, financial fraud detection).
4. **Reduction of Human Error**: When properly trained and calibrated, AI eliminates transcription mistakes, numerical oversights, and routine cognitive lapses.
5. **Rapid Decision-Making**: AI models synthesize complex multi-variable parameters in milliseconds to support high-stakes real-time decisions.

*Would you like to explore specific real-world applications or see how AI agents collaborate in this research platform?*`;
    }

    if (lastUserMsg.includes('rag') || lastAssistantMsg.includes('retrieval-augmented')) {
      return `### Key Advantages of Retrieval-Augmented Generation (RAG)

Following up on our comparison of **RAG**:

1. **Zero Model Retraining**: You can incorporate proprietary or dynamic company documents without fine-tuning expensive model weights.
2. **Mitigated Hallucinations**: Grounding generation in retrieved text chunks forces the model to cite verifiable source material.
3. **Auditability & Traceability**: Each claim can be accompanied by an exact source link, document name, or paragraph citation.
4. **Access Control & Permissions**: You can filter retrieved knowledge vectors according to the user's role and security permissions before passing them to the LLM.

*Would you like an architectural diagram or Python implementation example of a RAG pipeline?*`;
    }

    if (lastUserMsg.includes('rest') || lastAssistantMsg.includes('rest api')) {
      return `### Advantages & Core Benefits of REST APIs

Continuing from our discussion of **RESTful Architecture**:

1. **Stateless Scalability**: Since each HTTP request contains all necessary credentials and parameters, servers do not maintain session memory, allowing seamless horizontal scaling.
2. **Decoupled Client & Server**: Frontends (React, mobile apps) can evolve independently from backend microservices as long as JSON contracts remain consistent.
3. **Built-in HTTP Caching**: Standard HTTP headers (\`Cache-Control\`, \`ETag\`) allow browser and CDN caching to reduce server load.
4. **Standardized Verbs**: Standard HTTP verbs (\`GET\`, \`POST\`, \`PUT\`, \`DELETE\`) make interfaces intuitive and predictable.

*Would you like to see how to authenticate a REST API using JWT tokens?*`;
    }

    return `### Contextual Follow-Up

Based on our preceding conversation regarding **"${lastUserMsg.slice(0, 50)}..."**:

The key advantages lie in **scalability**, **predictability**, and **seamless architectural integration**. When deployed in production environments, this approach minimizes operational overhead while ensuring verifiable, reproducible outputs.

*Could you specify which aspect you'd like to dive deeper into?*`;
  }

  // 2. Python Array / Coding Questions
  if (
    normalized.includes('python') && 
    (normalized.includes('duplicate') || normalized.includes('duplicates'))
  ) {
    return `Here is a complete, efficient Python solution to find duplicate elements in an array (list):

### Method 1: Using a Set for $O(n)$ Linear Time Complexity (Recommended)

\`\`\`python
def find_duplicates(arr):
    """
    Finds and returns all duplicate elements in a list.
    Time Complexity: O(n)
    Space Complexity: O(n)
    """
    seen = set()
    duplicates = set()
    
    for item in arr:
        if item in seen:
            duplicates.add(item)
        else:
            seen.add(item)
            
    return list(duplicates)

# Example Usage:
numbers = [1, 3, 5, 2, 3, 7, 8, 1, 9, 5]
result = find_duplicates(numbers)
print("Duplicate elements:", result)
# Output: Duplicate elements: [1, 3, 5]
\`\`\`

### Method 2: Using \`collections.Counter\` (Idiomatic Python)

\`\`\`python
from collections import Counter

def find_duplicates_counter(arr):
    counts = Counter(arr)
    return [item for item, count in counts.items() if count > 1]

# Example Usage:
print(find_duplicates_counter([4, 2, 4, 7, 8, 2, 3]))
# Output: [4, 2]
\`\`\`

**Key Explanation:**
- **Time Complexity**: $O(n)$ because set lookups and hash table operations take $O(1)$ average time.
- **Space Complexity**: $O(n)$ to store unique items in memory.
- Using \`set()\` prevents duplicates from being added multiple times if an element appears 3+ times.`;
  }

  if (
    (normalized.includes('reverse') && normalized.includes('array')) ||
    (normalized.includes('reverse') && normalized.includes('python'))
  ) {
    return `Here are the cleanest and most efficient ways to reverse an array (list) in Python:

### 1. In-Place Reversal using Two Pointers ($O(1)$ Extra Space)

\`\`\`python
def reverse_array_inplace(arr):
    """
    Reverses an array in-place without creating a new list.
    Time Complexity: O(n)
    Space Complexity: O(1)
    """
    left = 0
    right = len(arr) - 1
    
    while left < right:
        # Swap elements
        arr[left], arr[right] = arr[right], arr[left]
        left += 1
        right -= 1
        
    return arr

# Example:
data = [10, 20, 30, 40, 50]
reverse_array_inplace(data)
print(data)  # Output: [50, 40, 30, 20, 10]
\`\`\`

### 2. Pythonic Slicing (Returns a New Reversed Copy)

\`\`\`python
# Slicing creates a reversed shallow copy:
original = [1, 2, 3, 4, 5]
reversed_copy = original[::-1]
print(reversed_copy)  # Output: [5, 4, 3, 2, 1]
\`\`\`

### 3. Built-in Methods

\`\`\`python
# Modify in-place:
items = ["alpha", "beta", "gamma"]
items.reverse()
print(items)  # Output: ['gamma', 'beta', 'alpha']

# Or use reversed() iterator:
rev_iter = list(reversed([100, 200, 300]))
print(rev_iter)  # Output: [300, 200, 100]
\`\`\``;
  }

  // 3. Technical: REST API Explanation
  if (normalized.includes('rest api') || (normalized.includes('rest') && normalized.includes('api'))) {
    return `### What is a REST API?

**REST** stands for **REpresentational State Transfer**. It is a software architectural style that defines a set of conventions for how web clients (like browsers or mobile apps) exchange data with a web server over **HTTP**.

---

### Core Concept: Resources and Standard HTTP Methods

In REST, everything is treated as a **Resource** (e.g., users, research reports, articles), identified by a clean **URL URI**. You interact with resources using standard HTTP verbs:

| HTTP Verb | Action | Example Endpoint | Purpose |
| :--- | :--- | :--- | :--- |
| **GET** | Retrieve data | \`GET /api/research/123\` | Fetch details of session \`123\` |
| **POST** | Create a resource | \`POST /api/research\` | Create a new research session |
| **PUT / PATCH**| Update data | \`PATCH /api/users/profile\` | Update user profile fields |
| **DELETE** | Remove data | \`DELETE /api/research/123\` | Delete session \`123\` |

---

### Practical Example

#### 1. Client sends HTTP Request:
\`\`\`http
POST /api/research HTTP/1.1
Host: api.example.com
Content-Type: application/json
Authorization: Bearer <jwt_token>

{
  "topic": "Quantum Computing Security in 2026"
}
\`\`\`

#### 2. Server processes and responds with JSON:
\`\`\`http
HTTP/1.1 201 Created
Content-Type: application/json

{
  "sessionId": "6abd47310a9f80fdb83d8119",
  "status": "CREATED",
  "topic": "Quantum Computing Security in 2026"
}
\`\`\`

---

### The 4 Golden Rules of REST:
1. **Stateless**: The server does not store client session state between requests; all authentication tokens are passed in every request header.
2. **Client-Server Separation**: The React frontend and Express backend can change independently.
3. **Uniform Interface**: Consistent URLs and JSON payloads across all services.
4. **Cacheable**: GET responses can be cached to improve performance.`;
  }

  // 4. RAG vs Fine-Tuning
  if (normalized.includes('rag') && (normalized.includes('fine-tuning') || normalized.includes('finetuning') || normalized.includes('difference'))) {
    return `### RAG vs. Fine-Tuning: Architectural Comparison

Both **RAG (Retrieval-Augmented Generation)** and **Fine-Tuning** specialize Large Language Models (LLMs), but they solve different problems in contrasting ways:

| Dimension | **RAG (Retrieval-Augmented Generation)** | **Fine-Tuning** |
| :--- | :--- | :--- |
| **Core Concept** | Attaches a dynamic search engine/vector database to the prompt at query time | Retrains the model's internal neural weights with domain-specific pairs |
| **Knowledge Currency** | **Real-time / Instant**: Update your documents and the model knows immediately | **Static**: Stale as soon as training ends; requires retraining for updates |
| **Hallucination Risk** | **Low**: Model is explicitly instructed to cite retrieved passages | **Moderate to High**: Knowledge remains implicit in weights |
| **Setup Cost** | Moderate (Vector DB + embeddings) | High (GPU compute, curated training datasets) |
| **Best For** | Fact retrieval, proprietary documentation, dynamic enterprise data, verified research | Teaching tone, style, specific output formats, specialized domain syntax (e.g. medical jargon, legal drafting) |

### When to Use Which?
- **Use RAG** when you need your AI to reference fresh information, quote exact sources with page citations, or search your private files.
- **Use Fine-Tuning** when you want to change *how* the model behaves (e.g., talk like a senior radiologist or format responses in a proprietary dialect).
- **Hybrid Approach**: Many production systems fine-tune a model to follow strict formatting guidelines, and then feed it dynamic context via RAG.`;
  }

  // 5. What is Artificial Intelligence?
  if (normalized.includes('what is artificial intelligence') || normalized === 'what is ai' || normalized === 'what is ai?') {
    return `### What is Artificial Intelligence (AI)?

**Artificial Intelligence (AI)** is a branch of computer science dedicated to creating systems capable of performing tasks that typically require human cognition, such as visual perception, natural language understanding, reasoning, problem-solving, and autonomous decision-making.

---

### Core Branches of Modern AI:

1. **Machine Learning (ML)**: Algorithms that learn predictive patterns from historical data without being explicitly programmed with rigid rules.
2. **Deep Learning (Neural Networks)**: Multi-layered computational graphs inspired by biological neural circuits, excelling at high-dimensional unstructured data (computer vision, speech recognition).
3. **Natural Language Processing (NLP) & LLMs**: Architectures (like Transformers) that analyze, translate, summarize, and generate human language.
4. **Autonomous Multi-Agent Systems**: Ensembles of specialized AI agents that collaborate to execute complex end-to-end workflows (like this research assistant's planner, searcher, summarizer, and fact-checker).

---

### Key Distinctions:
- **Narrow AI (Weak AI)**: AI designed to excel at a specific domain (e.g., playing chess, transcribing audio, conducting deep research). All current AI is Narrow AI.
- **Artificial General Intelligence (AGI)**: Theoretical AI capable of matching or exceeding human intellect across all intellectual domains.`;
  }

  // 6. Application Architecture & How it works
  if (
    normalized.includes('how does this') ||
    normalized.includes('how does the research') ||
    normalized.includes('pipeline work') ||
    normalized.includes('fact-checking agent') ||
    normalized.includes('what can i do on this website') ||
    normalized.includes('how do i start')
  ) {
    return `### Multi-Agent Research Assistant Architecture

This application is an **Autonomous Deep Research Platform** powered by **6 specialized coordinated AI agents** that work together to turn any topic into a verified, cited report:

---

### The 6 Coordinated Agents:
1. **Planner Agent**: Analyzes your topic and decomposes it into 3–5 targeted sub-questions designed to cover technical, economic, and practical angles.
2. **Search Agent**: Runs automated parallel web searches across search engines to discover candidate sources while respecting rate limits.
3. **Summarizer Agent**: Ingests and cleans discovered web content, extracting discrete empirical claims, dates, and quantitative statistics.
4. **Fact-Checker Agent**: Cross-verifies claims across independent sources, identifying agreements and highlighting explicit contradictions.
5. **Technical Writer Agent**: Synthesizes the verified evidence package into an executive summary, key findings, and detailed analyses with inline citations (e.g. \`[S1]\`, \`[S2]\`).
6. **Citation Validator Agent**: Verifies that every single citation in the report maps strictly to a genuine, ingested source with zero fabrication.

---

### How to Use the App:
- **Start Research**: Enter any question or topic in the search box on the **Home** page or tell Helper what to investigate.
- **Watch Live Progress**: Monitor real-time WebSocket events as agents plan, search, summarize, and cross-check.
- **Export & Review**: Read the structured report, inspect identified contradictions, review cited sources, or export to Markdown/PDF.
- **Account & History**: Register/sign in with JWT authentication to save and revisit your previous research sessions anytime from the **History** tab.`;
  }

  // 7. Research formulation & methodology
  if (
    normalized.includes('methodology') || 
    normalized.includes('improve my research') || 
    normalized.includes('research question')
  ) {
    return `### Formulating a Robust Research Methodology

To construct a high-impact research inquiry, apply the **PICO / SMART Research Framework**:

1. **Specific Scope**: Narrow broad topics (e.g. instead of *"AI in healthcare"*, focus on *"Diagnostic accuracy of deep-learning CNNs in detecting diabetic retinopathy in rural Indian clinics"*).
2. **Empirical Measurability**: Identify tangible metrics (e.g., latency, sensitivity/specificity, false positive rate, cost per inference, labor displacement percentages).
3. **Comparative Baseline**: Contrast against current standards (e.g., *"compared to conventional human radiologist double-reading"*).
4. **Counter-Evidence Analysis**: Specifically search for failure modes, regulatory bottlenecks, and algorithmic bias.

---

### Proposed Research Outline for Your Inquiry:
- **Phase 1: Taxonomy & Definitions**: Defining operational parameters and evaluation metrics.
- **Phase 2: Source Ingestion**: Academic preprints (arXiv), regulatory frameworks, and peer-reviewed journals.
- **Phase 3: Cross-Source Fact Checking**: Reconciling performance claims against real-world clinical or benchmark evaluations.
- **Phase 4: Synthesis & Limitations**: Identifying open research gaps and reproducibility constraints.

*Would you like me to launch this topic in our autonomous research pipeline to gather live sources and cross-check claims?*`;
  }

  // 8. Research Request Detection
  if (isResearchTopic || suggestedTopic) {
    const topicTitle = suggestedTopic || message;
    return `### Research Topic Identified

Your query regarding **"${topicTitle}"** is an empirical research topic that would benefit from our **Autonomous Multi-Agent Pipeline** rather than a simple conversational summary.

If we launch this research session:
1. **Planner Agent** will decompose the topic into targeted sub-questions.
2. **Search Agent** will retrieve authentic external sources.
3. **Summarizer Agent** will extract factual claims and metrics.
4. **Fact-Checker Agent** will reconcile cross-source contradictions.
5. **Technical Writer** will synthesize a structured, cited research report.
6. **Citation Validator** will enforce 100% zero-fabrication citations.

Click the action button below to initiate this research session directly!`;
  }

  // 9. Default Comprehensive Technical Response
  return `### Analysis & Overview

Regarding your inquiry: **"${message.trim()}"**

1. **Core Concept**: When approaching this topic from a systems and software engineering perspective, the key objective is balancing **clarity**, **reliability**, and **verifiability**.
2. **Key Considerations**:
   - Ensure explicit separation of concerns across architectural layers.
   - Ground all factual assertions in verifiable primary documentation.
   - Account for edge cases, network latencies, and validation boundaries.

*If you are exploring this as a topic for deeper academic or technical investigation, you can also launch it directly through our autonomous research pipeline!*`;
}
