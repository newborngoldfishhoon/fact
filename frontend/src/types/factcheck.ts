export type FactCheckSource = {
  title: string
  url: string
  snippet: string
  score: number
}

export type FactCheckResult = {
  claim: string
  status: 'analyzed'
  verdict: 'Likely true' | 'Likely false' | 'Mixed evidence' | 'Unclear'
  confidence: 'Low' | 'Medium' | 'High'
  supporting_evidence: string[]
  contradicting_evidence: string[]
  limitations: string
  sources: FactCheckSource[]
  message: string
}

export function isFactCheckResult(value: unknown): value is FactCheckResult {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  return (
    'claim' in value &&
    typeof value.claim === 'string' &&
    'status' in value &&
    value.status === 'analyzed' &&
    'verdict' in value &&
    ['Likely true', 'Likely false', 'Mixed evidence', 'Unclear'].includes(
      String(value.verdict),
    ) &&
    'confidence' in value &&
    ['Low', 'Medium', 'High'].includes(String(value.confidence)) &&
    'supporting_evidence' in value &&
    Array.isArray(value.supporting_evidence) &&
    value.supporting_evidence.every((item) => typeof item === 'string') &&
    'contradicting_evidence' in value &&
    Array.isArray(value.contradicting_evidence) &&
    value.contradicting_evidence.every((item) => typeof item === 'string') &&
    'limitations' in value &&
    typeof value.limitations === 'string' &&
    'message' in value &&
    typeof value.message === 'string' &&
    'sources' in value &&
    Array.isArray(value.sources) &&
    value.sources.every(
      (source) =>
        typeof source === 'object' &&
        source !== null &&
        'title' in source &&
        typeof source.title === 'string' &&
        'url' in source &&
        typeof source.url === 'string' &&
        'snippet' in source &&
        typeof source.snippet === 'string' &&
        'score' in source &&
        typeof source.score === 'number',
    )
  )
}
