import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

const TaskCompletionChart = ({ data = [] }) => (
  <div className="panel chart-card">
    <h3 style={{ marginTop: 0 }}>Velocity</h3>
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data}>
        <XAxis dataKey="label" stroke="#596281" tickLine={false} axisLine={false} />
        <YAxis stroke="#596281" tickLine={false} axisLine={false} width={32} />
        <Tooltip cursor={{ stroke: 'rgba(255,255,255,0.1)' }} contentStyle={{ background: '#0d1424', border: 'none', borderRadius: 12 }} />
        <Line type="monotone" dataKey="completed" stroke="#66f7d2" strokeWidth={3} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  </div>
)

export default TaskCompletionChart
