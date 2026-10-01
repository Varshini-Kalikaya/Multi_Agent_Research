/**
 * Comprehensive Smart Contextual Knowledge & Response Engine for Helper
 * Used as a dependable baseline, offline engine, and resilient fallback.
 */

export function generateContextualResponse({ message, history = [], isResearchTopic = false, suggestedTopic = null }) {
  if (!message || typeof message !== 'string') {
    return "Hello! I'm Helper, your AI research companion. How can I help you today?";
  }

  const trimmed = message.trim();
  const normalized = trimmed.toLowerCase();
  
  // Extract context from previous turns in history
  const lastUserMsg = [...history].reverse().find(m => m.role === 'user')?.content?.toLowerCase() || '';
  const lastAssistantMsg = [...history].reverse().find(m => m.role === 'assistant')?.content?.toLowerCase() || '';

  // -------------------------------------------------------------------------
  // 1. Greetings, Introductions & Identity
  // -------------------------------------------------------------------------
  const isGreeting = 
    /^(hi|hello|hey|greetings|good\s+(morning|afternoon|evening)|howdy|sup|yo|hola)\b/i.test(trimmed) ||
    normalized === 'hi' || normalized === 'hello' || normalized === 'hey';

  if (isGreeting && !normalized.includes('what is') && !normalized.includes('how to')) {
    return `### Hello! I'm Helper ✨

I'm your intelligent AI assistant built into the **Multi-Agent Research Assistant** platform. Here is how I can assist you today:

- 🔬 **Autonomous Research**: Propose any topic, and I will route it into our 6-agent deep research pipeline (Planning → Search → Summarization → Fact-Checking → Academic Synthesis → Citation Verification).
- 💻 **Code & Debugging**: Ask for code snippets in Python, JavaScript, React, SQL, or help troubleshooting architectural bugs.
- 💡 **Concepts & Tech**: Ask me to explain complex topics like **RAG**, **REST APIs**, **LLM Fine-Tuning**, or **System Design**.
- 🧭 **Platform Navigation**: Ask about how to view session history, authenticate, or monitor live agent progress via WebSockets.

*What would you like to explore or work on right now?*`;
  }

  if (
    normalized.includes('who are you') || 
    normalized.includes('what are you') || 
    normalized.includes('what is your name') ||
    normalized.includes('tell me about yourself')
  ) {
    return `### Meet Helper ✨

I am **Helper**, an interactive AI assistant integrated into the **Multi-Agent Research Assistant** platform.

**What I do:**
1. **Answer Questions**: Explain computer science, programming, science, data analysis, and software architecture.
2. **Write & Debug Code**: Generate clean, production-ready code with explanations in Python, JavaScript, TypeScript, React, and more.
3. **Research Partner**: Help you brainstorm and formulate focused research hypotheses. When an empirical research question is identified, I can launch an autonomous multi-agent research session for you in one click.
4. **Platform Guide**: Help you navigate the 6 coordinated agents, inspect discovered sources, review fact-checking reports, and export verified syntheses.

*Feel free to ask me anything or try one of the suggestion chips!*`;
  }

  if (
    normalized.includes('what can you do') || 
    normalized.includes('how can you help') ||
    normalized === 'help' ||
    normalized === 'help me'
  ) {
    return `### How I Can Help You

Here are some of the key things you can do with me:

1. **Conduct Empirical Web Research**:
   - Ask to investigate any topic (e.g. *"Research the impact of quantum computing on cryptography"*).
   - I will detect the research scope and provide an immediate action card to launch our autonomous 6-agent pipeline.
2. **Programming & Algorithms**:
   - Write algorithms in Python, JavaScript, etc. with time and space complexity explanations.
   - Debug components, configure API routes, or design data models.
3. **Understand Technical Concepts**:
   - Clear breakdowns of RAG vs. Fine-tuning, REST vs. GraphQL, JWT auth, WebSockets, or neural architectures.
4. **App Guidance**:
   - Learn how the **Planner**, **Search Agent**, **Summarizer**, **Fact-Checker**, **Writer**, and **Citation Validator** work together to eliminate hallucinations.

*Try asking a question or typing a topic you'd like to investigate!*`;
  }

  // -------------------------------------------------------------------------
  // 2. Application Guidance & Pipeline Architecture
  // -------------------------------------------------------------------------
  if (
    normalized.includes('how does the research pipeline work') ||
    normalized.includes('pipeline work') ||
    normalized.includes('how does this app work') ||
    normalized.includes('how does the application work') ||
    normalized.includes('multi-agent') ||
    (normalized.includes('explain') && normalized.includes('agents'))
  ) {
    return `### How the Multi-Agent Research Pipeline Works

This platform uses a synchronized **6-Agent Autonomous Architecture** to research topics with high factual accuracy and zero fabricated citations:

- **1. Planner Agent**: Analyzes your initial inquiry and generates a structured research plan with 3–5 discrete sub-questions and key objectives.
- **2. Search Agent**: Runs parallel queries via search providers (e.g., Tavily API) with strict concurrency and domain deduplication.
- **3. Summarizer Agent**: Ingests discovered web content, extracting verifiable claims, methodology dates, and quantitative statistics.
- **4. Fact-Checker Agent**: Reconciles cross-source claims, identifying consensus and explicitly surfacing discrepancies or contradictions.
- **5. Technical Writer Agent**: Synthesizes verified findings into an executive summary, key findings, and detailed analyses with inline citations (e.g. \`[S1]\`, \`[S2]\`).
- **6. Citation Validator Agent**: Audits every citation tag against real ingested source URLs to ensure 100% zero hallucination.

*You can start a research session anytime by submitting a topic on the **Home** tab or asking me to research it right here!*`;
  }

  // -------------------------------------------------------------------------
  // 3. Follow-up detection (Contextual conversational memory)
  // -------------------------------------------------------------------------
  const isFollowUp = 
    normalized.startsWith('what are its') || 
    normalized.startsWith('what are their') || 
    normalized.includes('its advantages') || 
    normalized.includes('its benefits') ||
    normalized.includes('its disadvantages') ||
    normalized.includes('its limitations') ||
    normalized.startsWith('how does it') ||
    normalized.startsWith('tell me more') ||
    normalized === 'more' ||
    normalized.startsWith('can you explain more');

  if (isFollowUp) {
    if (lastUserMsg.includes('artificial intelligence') || lastUserMsg.includes(' ai') || lastAssistantMsg.includes('artificial intelligence')) {
      return `### Key Advantages of Artificial Intelligence (AI)

Building on our discussion of **Artificial Intelligence (AI)**, here are its primary advantages across modern industries:

1. **High Efficiency & Automation**: AI automates repetitive, high-volume tasks without fatigue, accelerating data processing and operational workflows.
2. **24/7 Availability**: Unlike human labor, AI services and autonomous systems operate continuously with consistent availability.
3. **Advanced Pattern Recognition**: Neural networks and deep learning models detect nuanced anomalies, correlations, and predictive trends in massive datasets (e.g., medical diagnostics, financial fraud detection).
4. **Reduction of Human Error**: When properly trained and calibrated, AI eliminates transcription mistakes, numerical oversights, and routine cognitive lapses.
5. **Rapid Decision-Making**: AI models synthesize complex multi-variable parameters in milliseconds to support high-stakes real-time decisions.

*Would you like to explore specific real-world applications or see how AI agents collaborate in this research platform?*`;
    }

    if (lastUserMsg.includes('rag') || lastAssistantMsg.includes('retrieval-augmented')) {
      return `### Key Advantages of Retrieval-Augmented Generation (RAG)

Following up on our discussion of **RAG**:

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

Building on our conversation regarding **"${lastUserMsg.slice(0, 50)}..."**:

The primary benefits focus on **efficiency**, **scalability**, and **verifiability**. When designed with modular architecture, this strategy minimizes maintenance overhead while delivering predictable, robust results.

*Which specific aspect or technical detail would you like to explore next?*`;
  }

  // -------------------------------------------------------------------------
  // 4. Core Concepts: AI, Machine Learning & RAG
  // -------------------------------------------------------------------------
  if (
    normalized.includes('what is artificial intelligence') ||
    normalized === 'what is ai' ||
    normalized.includes('define ai') ||
    normalized.includes('concept of ai')
  ) {
    return `### What is Artificial Intelligence (AI)?

**Artificial Intelligence (AI)** is a comprehensive field of computer science dedicated to creating software and systems capable of performing tasks that traditionally require human cognitive intelligence.

---

### Core Pillars of Modern AI:
1. **Machine Learning (ML)**: Statistical algorithms that learn patterns and rules directly from empirical data rather than being explicitly hardcoded.
2. **Deep Learning & Neural Networks**: Multi-layered artificial neural architectures inspired by biological cognition, powering modern computer vision, speech recognition, and Large Language Models (LLMs).
3. **Natural Language Processing (NLP)**: Technologies that enable computers to understand, parse, synthesize, and generate human languages.
4. **Autonomous Agent Systems**: Multi-agent coordinated architectures (like this research assistant) where specialized agents coordinate to plan, search, verify, and execute complex workflows.

---

### Key Applications:
- **Autonomous Systems**: Self-driving vehicles, drone navigation, and robotic process automation.
- **Healthcare & Diagnostics**: Automated radiology imaging analysis, genomic sequencing, and personalized drug discovery.
- **Enterprise Intelligence**: Automated synthesis of unstructured data, cross-source fact-checking, and fraud anomaly detection.

*Would you like to know how AI agents collaborate in our multi-agent research pipeline, or discuss a specific branch like RAG?*`;
  }

  if (
    (normalized.includes('rag') && (normalized.includes('fine-tuning') || normalized.includes('finetuning') || normalized.includes('difference'))) ||
    normalized.includes('what is rag')
  ) {
    return `### RAG (Retrieval-Augmented Generation) Explained

**RAG** is an architecture that augments Large Language Models (LLMs) with dynamic, external knowledge retrieval before generating responses.

| Dimension | **RAG (Retrieval-Augmented Generation)** | **Fine-Tuning** |
| :--- | :--- | :--- |
| **Core Mechanism** | Retrieves relevant text chunks via vector search and injects them into the prompt | Updates model weights through gradient descent on domain-specific datasets |
| **Knowledge Freshness**| **Instant**: Update your database/files and the model has immediate access | **Static**: Stale as soon as fine-tuning finishes; requires retraining |
| **Hallucination Rate** | **Low**: The model cites verbatim retrieved passages | **Moderate**: Can still hallucinate or drift |
| **Cost & Compute** | Low compute cost (standard embeddings + vector indexing) | High compute cost (GPUs, long training runs) |

*Our platform uses an autonomous RAG-inspired multi-agent architecture to search, summarize, and cross-verify claims from authentic web sources.*`;
  }

  // -------------------------------------------------------------------------
  // 5. Technical Questions: REST APIs, WebSockets & Architecture
  // -------------------------------------------------------------------------
  if (normalized.includes('rest api') || (normalized.includes('rest') && normalized.includes('api'))) {
    return `### What is a REST API?

**REST** stands for **REpresentational State Transfer**. It is a software architectural style that defines a standard set of conventions for how clients (like browsers or mobile apps) communicate with a server over **HTTP**.

---

### Core Concept: Resources & Standard HTTP Verbs

In a REST API, data entities are treated as **Resources** with clean URLs, manipulated using standard HTTP verbs:

| HTTP Verb | Operation | Example Endpoint | Description |
| :--- | :--- | :--- | :--- |
| **GET** | Read | \`GET /api/research/123\` | Fetch details of research session \`123\` |
| **POST** | Create | \`POST /api/research\` | Create a new research session |
| **PATCH / PUT**| Update | \`PATCH /api/auth/profile\` | Update existing user data |
| **DELETE** | Remove | \`DELETE /api/research/123\` | Delete research session \`123\` |

---

### Practical Example

#### 1. Client HTTP Request:
\`\`\`http
POST /api/research HTTP/1.1
Host: api.example.com
Content-Type: application/json
Authorization: Bearer <jwt_token>

{
  "topic": "Quantum Computing Impact on Cryptography"
}
\`\`\`

#### 2. Server Response (JSON):
\`\`\`http
HTTP/1.1 201 Created
Content-Type: application/json

{
  "sessionId": "6abd47310a9f80fdb83d8119",
  "status": "CREATED",
  "topic": "Quantum Computing Impact on Cryptography"
}
\`\`\`

---

### The Key Principles of REST:
1. **Stateless**: The server does not store client session states across requests; each HTTP request contains all necessary credentials.
2. **Client-Server Decoupling**: The React frontend and Express backend can evolve independently.
3. **Standardized Responses**: Uses standard HTTP status codes (200 OK, 201 Created, 400 Bad Request, 401 Unauthorized, 500 Server Error).`;
  }

  // -------------------------------------------------------------------------
  // 6. Coding Solutions: Python, JavaScript & React
  // -------------------------------------------------------------------------
  if (
    normalized.includes('python') && 
    (normalized.includes('duplicate') || normalized.includes('duplicates'))
  ) {
    return `Here is a clean, efficient Python program to find duplicate elements in an array (list):

### Method 1: Using a Set for $O(n)$ Linear Time (Recommended)

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

# Example Execution:
numbers = [1, 3, 5, 2, 3, 7, 8, 1, 9, 5]
print("Duplicate elements:", find_duplicates(numbers))
# Output: Duplicate elements: [1, 3, 5]
\`\`\`

### Method 2: Using \`collections.Counter\`

\`\`\`python
from collections import Counter

def find_duplicates_counter(arr):
    counts = Counter(arr)
    return [item for item, count in counts.items() if count > 1]

# Example:
print(find_duplicates_counter([4, 2, 4, 7, 8, 2, 3]))
# Output: [4, 2]
\`\`\`

**Why this works:**
- \`seen\` keeps track of elements encountered so far in $O(1)$ average lookup time.
- \`duplicates\` ensures each duplicate number is collected once without repetitions.`;
  }

  if (
    (normalized.includes('reverse') && normalized.includes('string')) ||
    (normalized.includes('reverse') && normalized.includes('array'))
  ) {
    return `### Reversing Sequences in Python & JavaScript

#### 1. In Python:
\`\`\`python
# Reversing a list in-place: O(n) time, O(1) space
def reverse_list(arr):
    left, right = 0, len(arr) - 1
    while left < right:
        arr[left], arr[right] = arr[right], arr[left]
        left += 1
        right -= 1
    return arr

# Slicing trick (creates a copy):
reversed_str = "hello"[::-1] # "olleh"
\`\`\`

#### 2. In JavaScript:
\`\`\`javascript
// Reversing a string:
const str = "multi-agent";
const reversed = str.split('').reverse().join('');
console.log(reversed); // "tnega-itlum"

// Reversing an array without mutating:
const arr = [1, 2, 3, 4, 5];
const reversedArr = [...arr].reverse();
console.log(reversedArr); // [5, 4, 3, 2, 1]
\`\`\``;
  }

  // -------------------------------------------------------------------------
  // 7. Research Requests & Topic Identification
  // -------------------------------------------------------------------------
  if (isResearchTopic || suggestedTopic) {
    const topicTitle = suggestedTopic || trimmed;
    return `### Research Topic Identified ✨

Your inquiry regarding **"${topicTitle}"** is a multi-dimensional research topic well-suited for our **Autonomous Multi-Agent Pipeline**.

#### What Our Agents Will Do:
1. **Planner Agent**: Decomposes "${topicTitle}" into 3 to 5 targeted sub-questions.
2. **Search Agent**: Executes parallel web queries to retrieve candidate sources with rate-limiting.
3. **Summarizer Agent**: Extracts empirical claims, dates, and quantitative statistics.
4. **Fact-Checker Agent**: Cross-references claims and flags conflicting claims or source discrepancies.
5. **Technical Writer**: Synthesizes a structured report with an executive summary and key findings.
6. **Citation Validator**: Verifies every citation against authentic sources to ensure zero hallucination.

*Click the **🚀 Launch Deep Research** button below to begin this autonomous research session!*`;
  }

  // -------------------------------------------------------------------------
  // 8. General Dynamic Technical Synthesis
  // -------------------------------------------------------------------------
  return `### Analysis & Practical Guide

Regarding your inquiry: **"${trimmed}"**

Here are the key technical concepts, architecture considerations, and recommended next steps:

1. **Core Architectural Concept**:
   - In modern software systems, tackling this requires clear separation of concerns, defensive input validation, and decoupled execution layers.
   - Ground all data processing in verifiable contracts (e.g. strict TypeScript types, JSON schemas, or normalized database constraints).

2. **Best Practices**:
   - **Performance**: Optimize critical execution paths and leverage caching where appropriate (e.g. HTTP \`Cache-Control\` or Redis).
   - **Resilience**: Implement graceful fallback mechanisms, exponential retry logic, and circuit breakers for external service dependencies.
   - **Auditability**: Maintain structured telemetry and logs to enable rapid debugging and operational observability.

*Would you like to see a specific code example, dive into one of these components, or formulate this as a research topic for our multi-agent pipeline?*`;
}
