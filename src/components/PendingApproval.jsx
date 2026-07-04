function PendingApproval({ email, onBack }) {
  return (
    <div className="relative flex items-center justify-center min-h-screen px-4 py-12 overflow-hidden bg-surface-50">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(13,31,53,0.08),_transparent_55%),radial-gradient(circle_at_bottom,_rgba(214,45,32,0.1),_transparent_50%),radial-gradient(circle_at_left,_rgba(240,165,0,0.08),_transparent_45%)]" />
      <div className="relative w-full max-w-md p-8 card-surface rounded-2xl text-center">
        <img
          src="/candibly-vertical-logo.png"
          alt="Candibly"
          className="h-16 mx-auto mb-6"
        />

        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-gold-500/15 text-3xl">
          ⏳
        </div>

        <h1 className="text-2xl font-semibold text-navy-900">
          Your account is under review
        </h1>
        <p className="mt-3 text-ink-600">
          Thanks for signing up
          {email ? (
            <>
              {" "}with <span className="font-semibold text-navy-900">{email}</span>
            </>
          ) : null}
          . A team member is reviewing your account — this usually happens within
          one business day.
        </p>

        <div className="mt-6 rounded-xl border border-navy-100 bg-navy-50/70 p-4 text-left">
          <p className="text-sm font-semibold text-navy-900">What happens next</p>
          <ul className="mt-2 space-y-2 text-sm text-ink-600">
            <li className="flex gap-2">
              <span className="text-accent-600">1.</span>
              We verify your details and connect your voice agent.
            </li>
            <li className="flex gap-2">
              <span className="text-accent-600">2.</span>
              You'll get an email and text the moment you're approved.
            </li>
            <li className="flex gap-2">
              <span className="text-accent-600">3.</span>
              Sign back in here and your dashboard will be ready.
            </li>
          </ul>
        </div>

        <p className="mt-6 text-sm text-ink-500">
          Need it sooner? Reach us at{" "}
          <a
            href="mailto:support@candibly.online"
            className="font-semibold text-navy-900 underline decoration-accent-600/40 hover:text-accent-600"
          >
            support@candibly.online
          </a>
          .
        </p>

        <button
          type="button"
          onClick={onBack}
          className="mt-6 text-sm font-semibold text-navy-900 underline decoration-accent-600/40 hover:text-accent-600"
        >
          Back to sign in
        </button>
      </div>
    </div>
  );
}

export default PendingApproval;
