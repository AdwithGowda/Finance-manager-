import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Auth from "./pages/Auth";
import Alert from "./Alert";
import Toast from "./Toast";
import DateFilter from "./DateFilter"; // The new component

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

/* -------------------- AXIOS AUTH INTERCEPTOR -------------------- */
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem("token"));
  const [expenses, setExpenses] = useState([]);
  const [dateRange, setDateRange] = useState('all'); // New State for Date Filter

  const [form, setForm] = useState({
    title: '',
    amount: '',
    category: 'Food',
    date: new Date().toISOString().split('T')[0]
  });

  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [isOtherSpend, setIsOtherSpend] = useState(false);
  const [filterMode, setFilterMode] = useState('main');
  const [categorySummaryFilter, setCategorySummaryFilter] = useState('main');
  const [alertConfig, setAlertConfig] = useState({ isOpen: false, id: null });
  const [toastConfig, setToastConfig] = useState({ isOpen: false, message: '' });

  useEffect(() => {
    if (isAuthenticated) fetchData();
  }, [isAuthenticated]);

  const fetchData = async () => {
    try {
      const res = await axios.get(`${API_URL}/expenses`);
      setExpenses(res.data);
    } catch (error) {
      showToast(error.response?.data?.detail || 'Failed to fetch expenses');
    }
  };

  const showToast = (msg) => {
    setToastConfig({ isOpen: true, message: msg });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = {
        ...form,
        category: isOtherSpend ? `${form.category}:OtherSpend` : form.category
      };

      if (editingId) {
        await axios.put(`${API_URL}/expenses/${editingId}`, submitData);
        setEditingId(null);
        showToast("Transaction updated successfully!");
      } else {
        await axios.post(`${API_URL}/expenses`, submitData);
        showToast("Transaction added successfully!");
      }

      setForm({
        title: '',
        amount: '',
        category: 'Food',
        date: new Date().toISOString().split('T')[0]
      });
      setIsOtherSpend(false);
      fetchData();
    } catch (error) {
      showToast(error.response?.data?.detail || 'Error saving transaction');
    }
  };

  const handleEdit = (exp) => {
    setEditingId(exp.id);
    const isOther = exp.category.includes(':OtherSpend');
    const displayCategory = isOther ? exp.category.split(':')[0] : exp.category;
    setForm({
      title: exp.title,
      amount: exp.amount,
      category: displayCategory,
      date: exp.date || new Date().toISOString().split('T')[0]
    });
    setIsOtherSpend(isOther);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteTrigger = (id) => {
    setAlertConfig({ isOpen: true, id });
  };

  const confirmDelete = async () => {
    try {
      if (alertConfig.id) {
        await axios.delete(`${API_URL}/expenses/${alertConfig.id}`);
        setAlertConfig({ isOpen: false, id: null });
        fetchData();
        showToast("Transaction deleted successfully!");
      }
    } catch (error) {
      showToast(error.response?.data?.detail || 'Error deleting transaction');
    }
  };

  /* -------------------- FILTER LOGIC -------------------- */
  
  // 1. Filter by Date First (Applies to both Summary and Table)
  const dateFilteredExpenses = expenses.filter(exp => {
    if (dateRange === 'all') return true;
    
    const expDate = new Date(exp.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (typeof dateRange === 'number') {
      const diffTime = Math.abs(today - expDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= dateRange;
    }
    if (dateRange === 'thisMonth') {
      return expDate.getMonth() === today.getMonth() && expDate.getFullYear() === today.getFullYear();
    }
    if (dateRange === 'thisYear') {
      return expDate.getFullYear() === today.getFullYear();
    }
    return true;
  });

  // 2. Further filter for the Table (Search + Main/Other Toggles)
  const filteredExpenses = dateFilteredExpenses.filter(exp => {
    const matchesSearch = exp.title.toLowerCase().includes(search.toLowerCase());
    const isOther = exp.category.includes('OtherSpend');
    const matchesFilter = filterMode === 'other' ? isOther : !isOther;
    return matchesSearch && matchesFilter;
  });

  // 3. Category Summary Logic (Uses date-filtered data)
  const categoryTotals = dateFilteredExpenses.reduce((acc, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
    return acc;
  }, {});

  const filteredCategoryTotals = Object.entries(categoryTotals).filter(([cat]) => {
    const isOther = cat.includes('OtherSpend');
    return categorySummaryFilter === 'main' ? !isOther : isOther;
  }).reduce((acc, [cat, val]) => {
    acc[cat] = val;
    return acc;
  }, {});

  const mainTotal = expenses.filter(exp => !exp.category.includes('OtherSpend')).reduce((sum, exp) => sum + exp.amount, 0);
  const otherTotal = expenses.filter(exp => exp.category.includes('OtherSpend')).reduce((sum, exp) => sum + exp.amount, 0);

  const getCategoryStyle = (cat) => {
    const displayCategory = cat.includes(':OtherSpend') ? cat.split(':')[0] : cat;
    return ({
      Food: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200",
      Rent: "bg-blue-100 text-blue-700 ring-1 ring-blue-200",
      Shopping: "bg-fuchsia-100 text-fuchsia-700 ring-1 ring-fuchsia-200",
      Bills: "bg-amber-100 text-amber-700 ring-1 ring-amber-200"
    }[displayCategory] || "bg-slate-100 text-slate-700 ring-1 ring-slate-200");
  };

  if (!isAuthenticated) {
    return <Auth onAuthSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans antialiased selection:bg-indigo-100 selection:text-indigo-900">
      <div className="max-w-6xl mx-auto px-4 py-8 md:px-6 lg:py-12 space-y-10">

        {/* HEADER */}
        <header className="relative overflow-hidden bg-indigo-600 rounded-3xl shadow-xl border border-indigo-500/30 p-6 md:p-8">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-24 h-24 bg-indigo-400/20 rounded-full blur-2xl"></div>

          <div className="relative flex flex-col lg:flex-row justify-between items-center gap-8">
            <div className="text-center lg:text-left">
              <div className="flex items-center gap-4 mb-2">
                <div className="relative w-12 h-12 shrink-0 flex items-center justify-center">
                  <div className="absolute inset-0 border-2 border-dashed border-indigo-300/60 rounded-full animate-[spin_8s_linear_infinite]"></div>
                  <div className="relative bg-indigo-600 w-8 h-8 rounded-full shadow-sm flex items-center justify-center">
                    <img src="/agw2.png" alt="Logo" className="w-5 h-5 object-contain" />
                  </div>
                </div>
                <h1 className="text-3xl font-black tracking-tight text-white leading-tight">
                  MyWallet<span className="text-indigo-200">Pro</span>
                </h1>
              </div>
              <p className="text-indigo-100/80 text-sm font-medium tracking-wide">Financial Intelligence Dashboard</p>
            </div>

            <div className="flex flex-col sm:flex-row items-center w-full lg:w-auto gap-6 sm:gap-8">
              <div className="flex items-center gap-6 bg-white/10 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/10 shadow-inner w-full sm:w-auto justify-around">
                <div className="text-center sm:text-left">
                  <p className="text-[10px] uppercase font-bold tracking-[0.15em] text-indigo-200 mb-1">Main</p>
                  <p className="text-xl md:text-2xl font-black text-white tabular-nums">
                    ₹{mainTotal.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
                  </p>
                </div>
                <div className="h-8 w-px bg-white/20"></div>
                <div className="text-center sm:text-left">
                  <p className="text-[10px] uppercase font-bold tracking-[0.15em] text-indigo-200 mb-1">Other</p>
                  <p className="text-xl md:text-2xl font-black text-white tabular-nums">
                    ₹{otherTotal.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
                  </p>
                </div>
              </div>

              <button
                onClick={() => { localStorage.removeItem("token"); setIsAuthenticated(false); }}
                className="group relative flex items-center gap-2 bg-white text-indigo-600 hover:bg-indigo-50 px-6 py-3 rounded-2xl font-bold transition-all duration-300 active:scale-95 shadow-lg shadow-black/10 w-full sm:w-auto justify-center"
              >
                <span className="text-sm">Logout</span>
                <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* SIDEBAR */}
          <aside className="lg:col-span-4 space-y-6">
            <section className={`bg-white p-6 rounded-3xl shadow-sm border transition-all duration-300 ${editingId ? 'border-orange-500 shadow-lg shadow-orange-100' : 'border-slate-200/60'}`}>
              <h2 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${editingId ? 'bg-orange-500 animate-pulse' : 'bg-indigo-500'}`}></span>
                {editingId ? "Edit Transaction" : "New Transaction"}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 ml-1 mb-1 block uppercase">Name</label>
                  <input
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                    placeholder="e.g. Ram"
                    value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 ml-1 mb-1 block uppercase">Amount</label>
                    <input
                      type="number" step="0.01"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                      placeholder="0.00"
                      value={form.amount}
                      onChange={e => setForm({ ...form, amount: parseFloat(e.target.value) || '' })}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 ml-1 mb-1 block uppercase">Category</label>
                    <div className="relative">
                      <select
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all appearance-none cursor-pointer pr-10"
                        value={form.category}
                        onChange={e => setForm({ ...form, category: e.target.value })}
                      >
                        <option>Food</option>
                        <option>Rent</option>
                        <option>Shopping</option>
                        <option>Bills</option>
                      </select>
                      <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 ml-1 mb-1 block uppercase">Date</label>
                  <input
                    type="date"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all cursor-pointer"
                    value={form.date}
                    onChange={e => setForm({ ...form, date: e.target.value })}
                    required
                  />
                </div>

                <div
                  onClick={() => setIsOtherSpend(!isOtherSpend)}
                  className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 cursor-pointer ${isOtherSpend ? 'bg-indigo-50 border-indigo-200 shadow-sm' : 'bg-white border-slate-200 hover:border-slate-300'}`}
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-700">Other Spend</span>
                    <span className="text-[10px] text-slate-500 uppercase tracking-tight">Separate from main balance</span>
                  </div>
                  <div className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${isOtherSpend ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                    <div className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform duration-300 ${isOtherSpend ? 'translate-x-6' : 'translate-x-0'}`} />
                  </div>
                </div>

                <button className={`w-full py-4 rounded-xl text-white font-bold text-lg shadow-lg transition-all active:scale-[0.98] mt-2 ${editingId ? 'bg-orange-500 hover:bg-orange-600 shadow-orange-200' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'}`}>
                  {editingId ? "Save Changes" : "Add Expense"}
                </button>
                {editingId && (
                  <button type="button" onClick={() => { setEditingId(null); setForm({ title: '', amount: '', category: 'Food', date: new Date().toISOString().split('T')[0] }); setIsOtherSpend(false); }} className="w-full text-slate-500 font-semibold text-sm hover:underline">
                    Cancel Edit
                  </button>
                )}
              </form>
            </section>

            <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200/60">
              <h2 className="text-lg font-bold text-slate-800 mb-5">Category Summary</h2>
              
              {/* DATE FILTER COMPONENT */}
              <div className="mb-6">
                <DateFilter onFilterChange={(val) => setDateRange(val)} />
              </div>

              <div className="flex gap-3 mb-5">
                <button onClick={() => setCategorySummaryFilter('main')} className={`flex-1 py-2.5 px-3 rounded-lg font-semibold text-xs transition-all duration-200 border-2 ${categorySummaryFilter === 'main' ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200' : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300'}`}>Main</button>
                <button onClick={() => setCategorySummaryFilter('other')} className={`flex-1 py-2.5 px-3 rounded-lg font-semibold text-xs transition-all duration-200 border-2 ${categorySummaryFilter === 'other' ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200' : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300'}`}>Other</button>
              </div>
              
              <div className="space-y-3">
                {Object.entries(filteredCategoryTotals).length > 0 ? (
                  Object.entries(filteredCategoryTotals).map(([cat, val]) => (
                    <div key={cat} className="group flex justify-between items-center p-3 rounded-2xl hover:bg-slate-50 transition-colors">
                      <span className={`text-[11px] px-3 py-1.5 rounded-lg font-bold uppercase tracking-wider ${getCategoryStyle(cat)}`}>
                        {cat.includes(':OtherSpend') ? cat.split(':')[0] : cat}
                      </span>
                      <span className="font-bold text-slate-700 tabular-nums">₹{val.toLocaleString('en-IN')}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-400 text-center py-4 italic">No data for selected period</p>
                )}
              </div>
            </section>
          </aside>

          {/* MAIN TABLE SECTION */}
          <div className="lg:col-span-8 space-y-6">
            <div className="space-y-4">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
                <input
                  className="w-full pl-12 pr-6 py-4 rounded-2xl border border-slate-200 bg-white shadow-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-lg"
                  placeholder="Search by transaction name..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>

              <div className="flex gap-3">
                <button onClick={() => setFilterMode('main')} className={`flex-1 py-3 px-4 rounded-2xl font-semibold text-sm transition-all duration-200 border-2 ${filterMode === 'main' ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-200' : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300'}`}>Main</button>
                <button onClick={() => setFilterMode('other')} className={`flex-1 py-3 px-4 rounded-2xl font-semibold text-sm transition-all duration-200 border-2 ${filterMode === 'other' ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-200' : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300'}`}>Other Spend</button>
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-slate-200/60 overflow-hidden">
              <div className="overflow-x-auto">
                <div className="max-h-[410px] overflow-y-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 z-10 bg-slate-50 shadow-[0_1px_0_0_rgba(0,0,0,0.05)]">
                      <tr>
                        <th className="px-6 py-5 text-xs font-bold uppercase tracking-wider text-slate-500">Date</th>
                        <th className="px-6 py-5 text-xs font-bold uppercase tracking-wider text-slate-500">Name</th>
                        <th className="px-6 py-5 text-xs font-bold uppercase tracking-wider text-slate-500">Category</th>
                        <th className="px-6 py-5 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Amount</th>
                        <th className="px-6 py-5 text-xs font-bold uppercase tracking-wider text-slate-500 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {filteredExpenses.map(exp => (
                        <tr key={exp.id} className="hover:bg-indigo-50/30 transition-colors group">
                          <td className="px-6 py-5">
                            <p className="text-xs font-bold text-slate-500">{new Date(exp.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                          </td>
                          <td className="px-6 py-5">
                            <p className="font-semibold text-slate-700">{exp.title}</p>
                          </td>
                          <td className="px-6 py-5">
                            <span className={`text-[10px] px-2.5 py-1 rounded-md font-bold uppercase ${getCategoryStyle(exp.category)}`}>
                              {exp.category.includes(':OtherSpend') ? exp.category.split(':')[0] : exp.category}
                            </span>
                          </td>
                          <td className="px-6 py-5 text-right">
                            <p className="font-bold text-slate-900 tabular-nums">₹{exp.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                          </td>
                          <td className="px-6 py-5 text-center">
                            <div className="flex justify-center gap-3">
                              <button onClick={() => handleEdit(exp)} className="p-2 text-indigo-500 hover:bg-indigo-100 rounded-lg transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                              </button>
                              <button onClick={() => handleDeleteTrigger(exp.id)} className="p-2 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {filteredExpenses.length === 0 && (
                <div className="py-20 text-center">
                  <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
                  </div>
                  <h3 className="text-slate-900 font-bold">No entries found for this period</h3>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      <Toast isOpen={toastConfig.isOpen} message={toastConfig.message} onClose={() => setToastConfig({ ...toastConfig, isOpen: false })} />
      <Alert isOpen={alertConfig.isOpen} onClose={() => setAlertConfig({ isOpen: false, id: null })} onConfirm={confirmDelete} title="Confirm Delete" message="Are you sure you want to remove this entry? This action cannot be undone." />
    </div>
  );
}

export default App;
