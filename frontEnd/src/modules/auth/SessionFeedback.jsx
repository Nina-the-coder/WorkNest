const SessionFeedback = ({ error, onRetry, onLogout }) => (
  <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-bg text-text p-6">
    {error ? (
      <>
        <p role="alert">{error}</p>
        <button onClick={() => void onRetry()} className="rounded-lg bg-cta px-5 py-2 text-white">Try again</button>
        <button onClick={onLogout} className="underline">Back to login</button>
      </>
    ) : <p role="status">Checking your session…</p>}
  </div>
);

export default SessionFeedback;
