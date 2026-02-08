import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const CategoryChart = ({ data }) => {
  const COLORS = {
    shopping: '#e879f9', 
    rent: '#60a5fa',     
    bills: '#fb923c',    
    food: '#f87171',     
    travel: '#4ade80',   
    other: '#94a3b8'     
  };

  const chartData = Object.entries(data)
    .filter(([_, value]) => value > 0)
    .map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value: value,
      key: name.toLowerCase()
    }));

  // Calculate the total for the center display
  const totalAmount = chartData.reduce((sum, item) => sum + item.value, 0);

  if (chartData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-300 font-bold uppercase tracking-widest text-xs border-2 border-dashed border-slate-100 rounded-3xl mt-4">
        No Data for Chart
      </div>
    );
  }

  return (
    <div className="h-64 w-full mt-4 relative">
      {/* Container for the Chart */}
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={65} // Slightly larger inner radius for more text space
            outerRadius={85}
            paddingAngle={8}
            dataKey="value"
            stroke="none"
          >
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={COLORS[entry.key] || COLORS.other} 
                className="outline-none focus:outline-none cursor-pointer"
              />
            ))}
          </Pie>
          <Tooltip 
            cursor={{ fill: 'transparent' }}
            contentStyle={{ 
              borderRadius: '16px', 
              border: 'none', 
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
              fontSize: '12px',
              fontWeight: 'bold'
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Central Total Overlay */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Total</p>
        <p className="text-lg font-black text-slate-800 leading-tight">
          ₹{totalAmount.toLocaleString('en-IN')}
        </p>
      </div>
    </div>
  );
};

export default CategoryChart;
