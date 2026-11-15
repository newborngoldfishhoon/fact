type SignInModalProps = {
  isConfigured: boolean
  isSigningIn: boolean
  errorMessage: string
  onClose: () => void
  onGoogleSignIn: () => void
}

function SignInModal({
  isConfigured,
  isSigningIn,
  errorMessage,
  onClose,
  onGoogleSignIn,
}: SignInModalProps) {
  return (
    <div className="fixed inset-0 z-10 grid place-items-center bg-black/70 p-4">
      <section
        aria-labelledby="sign-in-title"
        aria-modal="true"
        className="w-full max-w-md rounded-2xl border border-[#2c3a74] bg-[#0e1530] p-6 shadow-2xl"
        role="dialog"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-[#9db4ff]">FactCheck AI</p>
            <h2 className="mt-1 text-2xl font-bold text-white" id="sign-in-title">
              Sign in to save your history
            </h2>
          </div>
          <button
            aria-label="Close sign-in panel"
            className="rounded-lg px-2 py-1 text-xl text-[#7f8bad] hover:bg-[#151e42] hover:text-white"
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </div>

        <p className="mt-3 text-sm text-[#9aa8c8]">
          Sign in with Google to keep your submitted claims in your account.
          Guest claims are not saved.
        </p>

        {!isConfigured && (
          <p
            className="mt-4 rounded-xl border border-[#786538] bg-[#282212] p-3 text-sm text-[#f4d98d]"
            role="status"
          >
            Google sign-in needs Supabase setup first. Follow the Supabase
            setup steps in the project README.
          </p>
        )}

        {errorMessage && (
          <p
            className="mt-4 rounded-xl border border-[#8b4655] bg-[#2b1420] p-3 text-sm text-[#ffb2b7]"
            role="alert"
          >
            {errorMessage}
          </p>
        )}

        <button
          className="mt-5 flex w-full items-center justify-center gap-3 rounded-xl bg-white px-4 py-3 font-semibold text-[#202124] hover:bg-[#e8eaf0] disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!isConfigured || isSigningIn}
          onClick={onGoogleSignIn}
          type="button"
        >
          <span aria-hidden="true" className="text-lg font-bold text-[#4285f4]">
            G
          </span>
          {isSigningIn ? 'Connecting to Google…' : 'Continue with Google'}
        </button>

        <button
          className="mt-3 w-full rounded-xl border border-[#33427d] px-4 py-3 text-sm text-[#c9d2e6] hover:bg-[#151e42]"
          onClick={onClose}
          type="button"
        >
          Continue as guest
        </button>
        <p className="mt-4 text-center text-xs text-[#7f8bad]">
          Guest claims stay in this session only and are not saved to an account.
        </p>
      </section>
    </div>
  )
}

export default SignInModal
