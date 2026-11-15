import { useEffect, useState, type FormEvent } from 'react'
import type { Session } from '@supabase/supabase-js'
import SignInModal from './components/SignInModal'
import type { ClaimHistoryItem } from './lib/database.types'
import { supabase, supabaseConfigMissing } from './lib/supabase'
import {
  isFactCheckResult,
  type FactCheckResult,
  type FactCheckSource,
} from './types/factcheck'

const API_BASE_URL = (
  import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'
).replace(/\/+$/, '')

const sampleSources = [
  { number: 1, title: 'Sample source title', domain: 'example.com' },
  { number: 2, title: 'Sample source title', domain: 'example.org' },
  { number: 3, title: 'Sample source title', domain: 'example.net' },
  { number: 4, title: 'Sample source title', domain: 'example.edu' },
]

const sampleSupportingEvidence = [
  'Tools can scaffold working apps from a prompt in minutes. [1]',
  'Routine, well-specified tasks are increasingly automated. [3]',
]

const sampleContradictingEvidence = [
  'Requirements, security review and long-term maintenance still need people. [2]',
  'Generated apps are often prototypes, not production systems. [4]',
]

const suggestions = [
  'Steelman the other side',
  'What would change this verdict?',
  'Show me the weakest source',
]

function App() {
  const [claim, setClaim] = useState('')
  const [submittedClaim, setSubmittedClaim] = useState('')
  const [claimResult, setClaimResult] = useState<FactCheckResult | null>(null)
  const [apiMessage, setApiMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [session, setSession] = useState<Session | null>(null)
  const [isSignInOpen, setIsSignInOpen] = useState(false)
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [authError, setAuthError] = useState('')
  const [claimHistory, setClaimHistory] = useState<ClaimHistoryItem[]>([])
  const [isHistoryLoading, setIsHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState('')
  const userId = session?.user.id
  const displayedSources: Array<FactCheckSource | (typeof sampleSources)[number]> =
    claimResult?.sources ?? sampleSources
  const supportingEvidence =
    claimResult?.supporting_evidence ?? sampleSupportingEvidence
  const contradictingEvidence =
    claimResult?.contradicting_evidence ?? sampleContradictingEvidence

  useEffect(() => {
    if (!supabase) {
      return
    }

    let isMounted = true
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      if (nextSession) {
        setAuthError('')
      }
      setClaimHistory([])
      setHistoryError('')
      setIsHistoryLoading(Boolean(nextSession))
    })

    supabase.auth.getSession().then(({ data, error }) => {
      if (!isMounted) {
        return
      }

      if (error) {
        setAuthError(`Could not restore your sign-in: ${error.message}`)
      }

      setSession(data.session)
      setClaimHistory([])
      setHistoryError('')
      setIsHistoryLoading(Boolean(data.session))
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    const supabaseClient = supabase
    if (!userId || !supabaseClient) {
      return
    }

    const client = supabaseClient
    const currentUserId = userId
    let isCurrent = true
    async function loadHistory() {
      const { data, error } = await client
        .from('claim_history')
        .select('id, user_id, claim, created_at')
        .eq('user_id', currentUserId)
        .order('created_at', { ascending: false })
        .limit(20)

      if (!isCurrent) {
        return
      }

      if (error) {
        setHistoryError(`Could not load your saved history: ${error.message}`)
      } else {
        setClaimHistory(data)
      }
      setIsHistoryLoading(false)
    }

    void loadHistory()

    return () => {
      isCurrent = false
    }
  }, [userId])

  async function handleGoogleSignIn() {
    if (!supabase) {
      setAuthError('Add your Supabase URL and public anon key to frontend/.env.local first.')
      return
    }

    setAuthError('')
    setIsSigningIn(true)

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin },
      })

      if (error) {
        throw error
      }
    } catch (error) {
      setAuthError(
        error instanceof Error
          ? error.message
          : 'Could not start Google sign-in.',
      )
      setIsSigningIn(false)
    }
  }

  async function handleSignOut() {
    if (!supabase) {
      return
    }

    const { error } = await supabase.auth.signOut()
    if (error) {
      setErrorMessage(`Could not sign out: ${error.message}`)
      return
    }

    setErrorMessage('')
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmedClaim = claim.trim()

    if (!trimmedClaim || isSubmitting) {
      return
    }

    setErrorMessage('')
    setApiMessage('')
    setClaimResult(null)
    setIsSubmitting(true)

    try {
      const response = await fetch(`${API_BASE_URL}/api/claims`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ claim: trimmedClaim }),
      })
      const result: unknown = await response.json()

      if (!response.ok) {
        const detail =
          typeof result === 'object' &&
          result !== null &&
          'detail' in result &&
          typeof result.detail === 'string'
            ? result.detail
            : 'The API rejected this claim. Check that it is 3 to 500 characters.'
        throw new Error(detail)
      }

      if (!isFactCheckResult(result)) {
        throw new Error('The API returned an unexpected fact-check response.')
      }

      setSubmittedClaim(trimmedClaim)
      setApiMessage(result.message)
      setClaimResult(result)
      setClaim('')

      if (session && supabase) {
        const { data: savedClaim, error: saveError } = await supabase
          .from('claim_history')
          .insert({ user_id: session.user.id, claim: trimmedClaim })
          .select('id, user_id, claim, created_at')
          .single()

        if (saveError) {
          setHistoryError(
            `The claim reached the API, but history could not be saved: ${saveError.message}`,
          )
        } else {
          setClaimHistory((history) => [savedClaim, ...history].slice(0, 20))
          setHistoryError('')
        }
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'An unexpected error occurred while sending the claim.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 shrink-0 flex-col gap-3 border-r border-[#1f2a4d] bg-[#050711] px-3 py-5 md:flex">
        <div className="flex items-center gap-2.5 px-1.5 text-lg font-bold text-white">
          <span className="grid size-7 place-items-center rounded-lg bg-gradient-to-br from-[#6a8dff] to-[#a58bff] text-sm text-[#080c1a]">
            ✓
          </span>
          FactCheck AI
        </div>
        <button
          className="rounded-xl border border-dashed border-[#3a4a82] px-3 py-2 text-sm text-[#9db4ff] hover:bg-[#111a38]"
          onClick={() => {
            setSubmittedClaim('')
            setClaimResult(null)
            setApiMessage('')
            setErrorMessage('')
            setClaim('')
          }}
          type="button"
        >
          + New chat
        </button>
        <p className="px-2 pt-2 text-xs text-[#7f8bad]">Recent searches</p>
        {session ? (
          <>
            {isHistoryLoading && (
              <p className="px-2 text-sm text-[#7f8bad]">Loading saved history…</p>
            )}
            {historyError && (
              <p className="px-2 text-xs text-[#ffb2b7]" role="alert">
                {historyError}
              </p>
            )}
            {!isHistoryLoading && claimHistory.length === 0 && !historyError && (
              <p className="px-2 text-sm text-[#7f8bad]">
                Your submitted claims will appear here.
              </p>
            )}
            {claimHistory.map((item) => (
              <button
                className="truncate rounded-lg px-2.5 py-2 text-left text-sm text-[#c9d2e6] hover:bg-[#111a38]"
                key={item.id}
                onClick={() => setClaim(item.claim)}
                type="button"
              >
                {item.claim}
              </button>
            ))}
          </>
        ) : (
          <p className="px-2 text-sm text-[#7f8bad]">
            Sign in to sync history. Guest claims are not saved.
          </p>
        )}
        <div className="mt-auto border-t border-[#1f2a4d] pt-3">
          {session ? (
            <>
              <p className="truncate px-1.5 text-xs text-[#7f8bad]">
                {session.user.email}
              </p>
              <button
                className="mt-2 w-full rounded-lg px-2 py-2 text-left text-sm text-[#9db4ff] hover:bg-[#111a38]"
                onClick={handleSignOut}
                type="button"
              >
                Sign out
              </button>
            </>
          ) : (
            <button
              className="w-full rounded-lg border border-[#33427d] px-3 py-2 text-sm text-[#9db4ff] hover:bg-[#111a38]"
              onClick={() => setIsSignInOpen(true)}
              type="button"
            >
              Sign in
            </button>
          )}
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-[#1f2a4d]/70 px-4 py-4 text-sm text-[#7f8bad] sm:px-7">
          <h1 className="text-base font-medium text-white">AI and developer jobs</h1>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs sm:inline sm:text-sm">
              Fact-check preview
            </span>
            {session ? (
              <button
                className="max-w-40 truncate rounded-lg border border-[#33427d] px-2.5 py-1.5 text-xs text-[#9db4ff] hover:bg-[#151e42]"
                onClick={handleSignOut}
                type="button"
              >
                Sign out · {session.user.email}
              </button>
            ) : (
              <button
                className="rounded-lg border border-[#33427d] px-2.5 py-1.5 text-xs text-[#9db4ff] hover:bg-[#151e42]"
                onClick={() => setIsSignInOpen(true)}
                type="button"
              >
                Sign in
              </button>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-7">
          <div className="mx-auto grid max-w-3xl gap-5">
            <div className="justify-self-end rounded-2xl rounded-br-sm border border-[#1f2a4d] bg-[#151e42] px-4 py-2.5 text-sm text-[#e8edff]">
              But AI can already generate complete applications.
            </div>

            {submittedClaim && (
              <>
                <div className="justify-self-end rounded-2xl rounded-br-sm border border-[#1f2a4d] bg-[#151e42] px-4 py-2.5 text-sm text-[#e8edff]">
                  {submittedClaim}
                </div>
                <div
                  aria-live="polite"
                  className="rounded-xl border border-[#3a4a82] bg-[#101937] p-4 text-sm text-[#c9d2e6]"
                >
                  <strong className="text-[#9db4ff]">Claim received.</strong>{' '}
                  {apiMessage}
                </div>
              </>
            )}

            {errorMessage && (
              <div
                aria-live="assertive"
                className="rounded-xl border border-[#8b4655] bg-[#2b1420] p-4 text-sm text-[#ffb2b7]"
                role="alert"
              >
                {errorMessage}
              </div>
            )}

            {authError && !isSignInOpen && (
              <div
                aria-live="assertive"
                className="rounded-xl border border-[#8b4655] bg-[#2b1420] p-4 text-sm text-[#ffb2b7]"
                role="alert"
              >
                {authError}
              </div>
            )}

            {historyError && session && (
              <div
                aria-live="polite"
                className="rounded-xl border border-[#786538] bg-[#282212] p-4 text-sm text-[#f4d98d]"
                role="status"
              >
                {historyError}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#7f8bad] sm:text-sm">
              <span className="text-[#5eead4]">●</span>
              {claimResult ? 'Tavily search complete' : 'Preview only'}
              <span aria-hidden="true" className="text-[#3b4670]">→</span>
              {claimResult ? 'Gemini analysis' : 'Sample result'}
              <span aria-hidden="true" className="text-[#3b4670]">→</span>
              {claimResult ? 'AI assessment · review sources' : 'Not a real fact-check'}
            </div>

            <section
              aria-labelledby="sample-claim"
              className="overflow-hidden rounded-[20px] border border-[#1f2a4d] bg-gradient-to-b from-[#101937] to-[#0b1128]"
            >
              <div className="px-5 pb-2 pt-5 sm:px-7 sm:pt-6">
                <p className="text-sm text-[#7f8bad]">
                  {claimResult ? 'Claim being checked' : 'Sample claim being checked'}
                </p>
                <h2
                  id="sample-claim"
                  className="mt-1 text-2xl font-extrabold leading-tight text-white sm:text-[27px]"
                >
                  {claimResult?.claim ?? '“AI can already replace software developers.”'}
                </h2>
              </div>

              <div className="px-5 pb-6 pt-3 sm:px-7">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <h3 className="text-xl font-extrabold text-[#ff9b85]">
                    {claimResult?.verdict ?? 'Mostly overstated'}
                  </h3>
                  <span className="text-sm text-[#7f8bad]">
                    {claimResult
                      ? `${claimResult.confidence} confidence · ${claimResult.sources.length} sources`
                      : 'Sample verdict · 4 placeholder sources'}
                  </span>
                </div>
                <div
                  aria-label="Sample evidence balance"
                  className="relative my-4 h-2.5 rounded-full bg-gradient-to-r from-[#5eead4] via-[#3b4670] to-[#ff9b85]"
                >
                  <span className="absolute left-[71%] top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-[#080c1a] bg-white shadow-[0_0_0_2px_#6a8dff]" />
                </div>
                <div className="flex justify-between text-xs text-[#7f8bad]">
                  <span>Evidence supports</span>
                  <span>Evidence contradicts</span>
                </div>
              </div>

              <div className="grid border-t border-[#1f2a4d] md:grid-cols-2">
                <div className="p-5 sm:px-7">
                  <h3 className="mb-2 font-semibold text-[#5eead4]">What supports it</h3>
                  {supportingEvidence.length > 0 ? (
                    <ul className="list-disc space-y-2 pl-5 text-sm">
                      {supportingEvidence.map((item, index) => (
                        <li key={`${index}-${item}`}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-[#7f8bad]">
                      No strong supporting evidence was found.
                    </p>
                  )}
                </div>
                <div className="border-t border-[#1f2a4d] p-5 sm:px-7 md:border-l md:border-t-0">
                  <h3 className="mb-2 font-semibold text-[#ff9b85]">
                    What contradicts it
                  </h3>
                  {contradictingEvidence.length > 0 ? (
                    <ul className="list-disc space-y-2 pl-5 text-sm">
                      {contradictingEvidence.map((item, index) => (
                        <li key={`${index}-${item}`}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-[#7f8bad]">
                      No strong contradicting evidence was found.
                    </p>
                  )}
                </div>
              </div>
              <p className="border-t border-[#1f2a4d] px-5 py-4 text-sm text-[#7f8bad] sm:px-7">
                {claimResult
                  ? `Limitations: ${claimResult.limitations} ${claimResult.message}`
                  : 'Sample limitation: these placeholder sources are not real evidence. The AI and web-search services have not been connected.'}
              </p>
            </section>

            <section aria-label="Sources" className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {displayedSources.map((source, index) => (
                <div
                  className="rounded-xl border border-[#1f2a4d] bg-[#0b1128] p-3 text-xs"
                  key={'url' in source ? source.url : source.number}
                >
                  <strong className="mr-1 text-[#9db4ff]">{index + 1}</strong>
                  {'url' in source ? (
                    <a
                      className="text-[#c9d2e6] underline decoration-[#52659b] underline-offset-2 hover:text-white"
                      href={source.url}
                      rel="noreferrer"
                      target="_blank"
                    >
                      {source.title}
                    </a>
                  ) : (
                    <span>{source.title}</span>
                  )}
                  <span className="mt-1 block text-[#7f8bad]">
                    {'url' in source
                      ? source.url.replace(/^https?:\/\//, '').split('/')[0]
                      : source.domain}
                  </span>
                  {'snippet' in source && (
                    <p className="mt-2 line-clamp-3 text-[#9aa8c8]">
                      {source.snippet}
                    </p>
                  )}
                </div>
              ))}
            </section>

            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion) => (
                <button
                  className="rounded-full border border-[#33427d] px-3.5 py-1.5 text-xs text-[#9db4ff] hover:bg-[#151e42]"
                  key={suggestion}
                  onClick={() => setClaim(suggestion)}
                  type="button"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </div>

        <form className="mx-auto w-full max-w-3xl px-4 pb-5 sm:px-7" onSubmit={handleSubmit}>
          <label className="sr-only" htmlFor="claim-input">
            Enter a claim to check
          </label>
          <div className="rounded-2xl border border-[#2c3a74] bg-[#0e1530] p-3 shadow-[0_10px_40px_#0007]">
            <textarea
              className="min-h-12 w-full resize-y bg-transparent px-1 py-1 text-sm text-white outline-none placeholder:text-[#64708f]"
              id="claim-input"
              maxLength={500}
              onChange={(event) => setClaim(event.target.value)}
              placeholder="Ask a question or paste a claim to verify..."
              rows={2}
              value={claim}
            />
            <div className="flex items-center gap-2 text-xs text-[#7f8bad]">
              <span className="rounded-lg border border-[#1f2a4d] px-2.5 py-1.5">
                Verify claim
              </span>
              <span className="hidden rounded-lg border border-[#1f2a4d] px-2.5 py-1.5 sm:inline">
                Search the web
              </span>
              <span className="hidden rounded-lg border border-[#1f2a4d] px-2.5 py-1.5 sm:inline">
                Gemini
              </span>
              <button
                aria-label="Submit claim"
                className="ml-auto grid size-9 place-items-center rounded-xl bg-gradient-to-br from-[#6a8dff] to-[#a58bff] text-lg text-white disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!claim.trim() || isSubmitting}
                type="submit"
              >
                {isSubmitting ? '…' : '↑'}
              </button>
            </div>
          </div>
          <p className="mt-2 text-center text-xs text-[#64708f]">
            {session
              ? 'Claims are saved to your account; AI and web search are not connected.'
              : 'Guest mode: claims are not saved. AI and web search are not connected.'}
          </p>
        </form>
      </main>
      {isSignInOpen && !session && (
        <SignInModal
          errorMessage={authError}
          isConfigured={!supabaseConfigMissing}
          isSigningIn={isSigningIn}
          onClose={() => setIsSignInOpen(false)}
          onGoogleSignIn={handleGoogleSignIn}
        />
      )}
    </div>
  )
}

export default App
