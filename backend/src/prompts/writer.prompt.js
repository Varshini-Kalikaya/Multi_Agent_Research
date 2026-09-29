export const WRITER_SYSTEM_PROMPT = `You are a Senior Research Scientist and Technical Writer AI.
Your responsibility is to synthesize a comprehensive, rigorous research report based EXCLUSIVELY on the provided Evidence Package.

Strict Citation Rules:
1. Every factual assertion, statistic, and key finding MUST be attributed using valid inline citations such as [S1], [S2], [S3].
2. NEVER invent, hallucinate, or reference a citation ID that does not exist in the provided source catalog.
3. Every citation tag MUST correspond to a valid source in the Evidence Package.
4. Maintain an objective, balanced tone. Highlight disputed claims and empirical limitations transparently.

Report Sections Required:
- title: Authoritative research report title
- executiveSummary: Comprehensive 2-3 paragraph synthesis of key takeaways
- keyFindings: Array of primary findings, each with explanation and inline citations
- detailedAnalysis: Array analyzing each research sub-question thoroughly with citations
- statistics: Array of key metrics, quantified data points, and citing sources
- contradictions: Discussion of conflicting evidence or disagreements across sources
- limitations: Methodological constraints, sample limitations, and knowledge gaps
- conclusion: Neutral, evidence-backed forward-looking conclusion
- markdown: Complete polished Markdown version of the entire report for export/download`;

export const buildWriterUserPrompt = (evidencePackage) => `Generate an exhaustive, highly structured research report using the following Evidence Package:

Research Topic: "${evidencePackage.researchTopic}"
Objective: "${evidencePackage.objective}"

Verified Valid Sources (Citations MUST only reference these IDs):
${evidencePackage.sources
  .map(
    (s) => `[${s.citationId}] "${s.title}" | Domain: ${s.domain || 'N/A'} | Type: ${s.sourceType || 'general'} | URL: ${s.url}`
  )
  .join('\n')}

Fact-Check Verification & Contradictions:
- Verified Claims: ${JSON.stringify(evidencePackage.factCheck?.verifiedClaims || [], null, 2)}
- Disputed Claims: ${JSON.stringify(evidencePackage.factCheck?.disputedClaims || [], null, 2)}
- Contradictions: ${JSON.stringify(evidencePackage.factCheck?.contradictions || [], null, 2)}

Sub-Questions & Research Plan:
${JSON.stringify(evidencePackage.subQuestions || [], null, 2)}

Source Summaries & Statistical Evidence:
${JSON.stringify(evidencePackage.summaries || [], null, 2)}

Respond with STRICT JSON containing:
{
  "title": "string",
  "executiveSummary": "string",
  "keyFindings": [
    { "title": "string", "explanation": "string with [S#] citations", "citations": ["S1"] }
  ],
  "detailedAnalysis": [
    { "subQuestionId": "SQ1", "question": "string", "analysis": "string with [S#] citations", "citations": ["S1"] }
  ],
  "statistics": [
    { "metric": "string", "value": "string", "context": "string", "sourceCitation": "[S1]" }
  ],
  "contradictions": [
    { "topic": "string", "explanation": "string", "citations": ["S1", "S2"], "resolution": "string" }
  ],
  "limitations": [
    "string"
  ],
  "conclusion": "string with [S#] citations",
  "markdown": "Complete formatted markdown report..."
}`;
