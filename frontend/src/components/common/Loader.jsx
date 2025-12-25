const Loader = ({ label = 'Loading' }) => (
  <div className="empty-state">
    <p style={{ marginBottom: 8 }}>{label}</p>
    <div style={{ width: 120, height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 999 }}>
      <div style={{ width: '60%', height: '100%', background: 'var(--accent)', borderRadius: 999, animation: 'pulse 1.2s ease-in-out infinite' }} />
    </div>
  </div>
)

export default Loader
