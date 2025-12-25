const MetricCard = ({ label, value, helper }) => (
  <div className="metric">
    <div className="metric__label">{label}</div>
    <div className="metric__value">{value}</div>
    {helper && <div className="metric__trend">{helper}</div>}
  </div>
)

export default MetricCard
