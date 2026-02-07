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
          <span className="text-[10px] font-bold text-orange-500 bg-orange-100 px-2 py-0.5 rounded-full animate-pulse">
            Filtered
          </span>
        )}
      </div>
      
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full group flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all duration-300 ${
          isFilterActive 
            ? 'bg-orange-400 text-white shadow-lg shadow-orange-200 ring-2 ring-orange-400/20' 
            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className={`p-1.5 rounded-lg transition-colors ${isFilterActive ? 'bg-white/20' : 'bg-slate-200'}`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <span className="font-bold text-sm tracking-tight">{selectedLabel}</span>
        </div>
        
        <svg 
          className={`w-5 h-5 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''} ${isFilterActive ? 'text-white/70' : 'text-slate-400'}`} 
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setIsOpen(false)}></div>
          
          <div className="absolute z-30 w-full mt-3 p-2 bg-white/95 backdrop-blur-md border border-slate-100 rounded-3xl shadow-2xl shadow-slate-200/50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            {options.map((option) => {
              const isSelected = selectedLabel === option.label;
              return (
                <button
                  key={option.label}
                  onClick={() => handleSelect(option)}
                  className={`w-full flex items-center justify-between px-4 py-3 text-sm font-bold rounded-xl transition-all mb-1 last:mb-0 ${
                    isSelected 
                      ? 'bg-orange-50 text-orange-600' 
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  {option.label}
                  {isSelected && (
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
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
