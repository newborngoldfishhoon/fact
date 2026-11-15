import { useState, type FormEvent } from 'react'

const sources = [
  { number: 1, title: 'Sample source title', domain: 'example.com' },
  { number: 2, title: 'Sample source title', domain: 'example.org' },
  { number: 3, title: 'Sample source title', domain: 'example.net' },
  { number: 4, title: 'Sample source title', domain: 'example.edu' },
]

const suggestions = [
  'Steelman the other side',
  'What would change this verdict?',
  'Show me the weakest source',
]

function App() {
  const [claim, setClaim] = useState('')
  const [submittedClaim, setSubmittedClaim] = useState('')
  const [apiMessage, setApiMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmedClaim = claim.trim()

    if (!trimmedClaim || isSubmitting) {
      return
    }

    setErrorMessage('')
    setApiMessage('')
    setIsSubmitting(true)

    try {
      const response = await fetch('http://127.0.0.1:8000/api/claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ claim: trimmedClaim }),
      })
      const result = await response.json()

      if (!response.ok) {
        const detail =
          typeof result.detail === 'string'
            ? result.detail
            : 'The API rejected this claim. Check that it is 3 to 500 characters.'
        throw new Error(detail)
      }

      setSubmittedClaim(trimmedClaim)
      setApiMessage(result.message)
      setClaim('')
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
            setApiMessage('')
            setErrorMessage('')
            setClaim('')
          }}
          type="button"
        >
          + New chat
        </button>
        <p className="px-2 pt-2 text-xs text-[#7f8bad]">Today</p>
        <div className="rounded-lg bg-[#151e42] px-2.5 py-2 text-sm text-white shadow-[inset_2px_0_#6a8dff]">
          AI and developer jobs
        </div>
        <div className="truncate rounded-lg px-2.5 py-2 text-sm text-[#c9d2e6]">
          The 10% brain myth
        </div>
        <p className="px-2 pt-2 text-xs text-[#7f8bad]">Earlier</p>
        <div className="truncate rounded-lg px-2.5 py-2 text-sm text-[#c9d2e6]">
          Nuclear energy, both sides
        </div>
        <div className="truncate rounded-lg px-2.5 py-2 text-sm text-[#c9d2e6]">
          Fusion power latest
        </div>
        <p className="mt-auto px-1.5 text-xs text-[#7f8bad]">Your account · Settings</p>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-[#1f2a4d]/70 px-4 py-4 text-sm text-[#7f8bad] sm:px-7">
          <h1 className="text-base font-medium text-white">AI and developer jobs</h1>
          <span className="text-xs sm:text-sm">Fact-check preview</span>
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

            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#7f8bad] sm:text-sm">
              <span className="text-[#5eead4]">●</span>
              Preview only
              <span aria-hidden="true" className="text-[#3b4670]">→</span>
              Sample result
              <span aria-hidden="true" className="text-[#3b4670]">→</span>
              Not a real fact-check
            </div>

            <section
              aria-labelledby="sample-claim"
              className="overflow-hidden rounded-[20px] border border-[#1f2a4d] bg-gradient-to-b from-[#101937] to-[#0b1128]"
            >
              <div className="px-5 pb-2 pt-5 sm:px-7 sm:pt-6">
                <p className="text-sm text-[#7f8bad]">Sample claim being checked</p>
                <h2
                  id="sample-claim"
                  className="mt-1 text-2xl font-extrabold leading-tight text-white sm:text-[27px]"
                >
                  “AI can already replace software developers.”
                </h2>
              </div>

              <div className="px-5 pb-6 pt-3 sm:px-7">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <h3 className="text-xl font-extrabold text-[#ff9b85]">
                    Mostly overstated
                  </h3>
                  <span className="text-sm text-[#7f8bad]">
                    Sample verdict · 4 placeholder sources
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
                  <p className="mb-2 text-sm">
                    Tools can scaffold working apps from a prompt in minutes.
                    <span className="ml-1 rounded-md border border-[#2c3a74] bg-[#1a2550] px-1.5 text-xs text-[#9db4ff]">
                      1
                    </span>
                  </p>
                  <p className="text-sm">
                    Routine, well-specified tasks are increasingly automated.
                    <span className="ml-1 rounded-md border border-[#2c3a74] bg-[#1a2550] px-1.5 text-xs text-[#9db4ff]">
                      3
                    </span>
                  </p>
                </div>
                <div className="border-t border-[#1f2a4d] p-5 sm:px-7 md:border-l md:border-t-0">
                  <h3 className="mb-2 font-semibold text-[#ff9b85]">
                    What contradicts it
                  </h3>
                  <p className="mb-2 text-sm">
                    Requirements, security review and long-term maintenance still
                    need people.
                    <span className="ml-1 rounded-md border border-[#2c3a74] bg-[#1a2550] px-1.5 text-xs text-[#9db4ff]">
                      2
                    </span>
                  </p>
                  <p className="text-sm">
                    Generated apps are often prototypes, not production systems.
                    <span className="ml-1 rounded-md border border-[#2c3a74] bg-[#1a2550] px-1.5 text-xs text-[#9db4ff]">
                      4
                    </span>
                  </p>
                </div>
              </div>
              <p className="border-t border-[#1f2a4d] px-5 py-4 text-sm text-[#7f8bad] sm:px-7">
                Sample limitation: these placeholder sources are not real
                evidence. The AI and web-search services have not been connected.
              </p>
            </section>

            <section aria-label="Sample sources" className="grid grid-cols-2 gap-2 md:grid-cols-4">
              {sources.map((source) => (
                <div
                  className="rounded-xl border border-[#1f2a4d] bg-[#0b1128] p-3 text-xs"
                  key={source.number}
                >
                  <strong className="mr-1 text-[#9db4ff]">{source.number}</strong>
                  {source.title}
                  <span className="mt-1 block text-[#7f8bad]">{source.domain}</span>
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
            Sent to the local API only; AI and web search are not connected.
          </p>
        </form>
      </main>
    </div>
  )
}

export default App
