const ErrorState = ({ message, onRetry }) => (
  <div className="empty-state">
    <p style={{ color: 'var(--danger)', fontWeight: 600 }}>{message}</p>
    {onRetry && (
      <button className="btn btn-ghost" type="button" onClick={onRetry}>
        Try again
      </button>
    )}
  </div>
)

export default ErrorState
