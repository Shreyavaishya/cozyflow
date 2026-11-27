import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

/** Last-7-days bar chart. Loaded on demand (see InsightsDialog) so the charting library is not part of the first download. */
const WeekChart = ({ data }: { data: { label: string; minutes: number }[] }) => (
  <ResponsiveContainer width="100%" height="100%">
    <BarChart data={data}>
      <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} />
      <YAxis hide />
      <Tooltip cursor={{ fill: 'transparent' }} formatter={(v: number) => [`${v} min`, 'Focus']} />
      <Bar dataKey="minutes" radius={[6, 6, 0, 0]} fill="hsl(var(--primary))" />
    </BarChart>
  </ResponsiveContainer>
);

export default WeekChart;
