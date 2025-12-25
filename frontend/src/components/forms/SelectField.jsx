const SelectField = ({ label, options = [], error, ...rest }) => (
  <div className="field">
    <label htmlFor={rest.id}>{label}</label>
    <select className="select" {...rest}>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
    {error && <span className="field-error">{error}</span>}
  </div>
)

export default SelectField
