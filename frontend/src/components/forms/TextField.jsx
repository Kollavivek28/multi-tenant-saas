const TextField = ({ label, error, ...rest }) => (
  <div className="field">
    <label htmlFor={rest.id}>{label}</label>
    <input className="input" {...rest} />
    {error && <span className="field-error">{error}</span>}
  </div>
)

export default TextField
