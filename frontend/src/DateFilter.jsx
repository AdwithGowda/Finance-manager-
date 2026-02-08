import React, { useState } from 'react';

const DateFilter = ({ onFilterChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState('All Time');

  const isFilterActive = selectedLabel !== 'All Time';

  const options = [
    { label: 'All Time', value: 'all' },
    { label: 'Last 7 Days', value: 7 },
    { label: 'Last 30 Days', value: 30 },
    { label: 'This Month', value: 'thisMonth' },
    { label: 'This Year', value: 'thisYear' },
  ];

  const handleSelect = (option) => {
    setSelectedLabel(option.label);
    onFilterChange(option.value);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-2 px-1">
        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
          Timeline
        </label>
        {isFilterActive && (
          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
            Active
          </span>
        )}
      </div>
      
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full group flex items-center justify-between px-4 py-3 rounded-2xl transition-all duration-300 border ${
          isFilterActive 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm' 
            : 'bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className={`p-1.5 rounded-lg transition-colors ${
            isFilterActive ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'
          }`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <span className="font-bold text-sm tracking-tight">{selectedLabel}</span>
        </div>
        
        <svg 
          className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''} ${isFilterActive ? 'text-emerald-500' : 'text-slate-400'}`} 
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setIsOpen(false)}></div>
          
          <div className="absolute z-30 w-full mt-2 p-1.5 bg-white border border-slate-100 rounded-2xl shadow-xl shadow-slate-200/60 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
            {options.map((option) => {
              const isSelected = selectedLabel === option.label;
              return (
                <button
                  key={option.label}
                  onClick={() => handleSelect(option)}
                  className={`w-full flex items-center justify-between px-4 py-2.5 text-sm font-semibold rounded-xl transition-all mb-0.5 last:mb-0 ${
                    isSelected 
                      ? 'bg-emerald-50 text-emerald-700' 
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  {option.label}
                  {isSelected && (
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default DateFilter;
