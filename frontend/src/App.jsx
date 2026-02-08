import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Auth from "./pages/Auth";
import Alert from "./Alert";
import Toast from "./Toast";
import DateFilter from "./DateFilter";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

/* -------------------- AXIOS AUTH INTERCEPTOR -------------------- */
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
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
  const [dateRange, setDateRange] = useState('all');

  const [form, setForm] = useState({
    title: '',
    amount: '',
    category: 'Food',
    date: new Date().toISOString().split('T')[0]
  });

  const [spendType, setSpendType] = useState('Expenses');
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [filterMode, setFilterMode] = useState('Expenses');
  const [summaryFilter, setSummaryFilter] = useState('Expenses');
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
      showToast('Failed to fetch data');
    }
  };

  const showToast = (msg) => {
    setToastConfig({ isOpen: true, message: msg });
    setTimeout(() => setToastConfig({ isOpen: false, message: '' }), 3000);
  };

  const resetForm = () => {
    setForm({ title: '', amount: '', category: 'Food', date: new Date().toISOString().split('T')[0] });
    setSpendType('Expenses');
    setEditingId(null);
  };

  const handleCancelEdit = () => {
    resetForm();
    showToast("Edit cancelled");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = {
        ...form,
        category: `${form.category}:${spendType}`
      };

      if (editingId) {
        await axios.put(`${API_URL}/expenses/${editingId}`, submitData);
        showToast("Transaction updated successfully!");
      } else {
        await axios.post(`${API_URL}/expenses`, submitData);
        showToast("New transaction added!");
      }

      resetForm();
      fetchData();
    } catch (error) {
      showToast('Error saving transaction');
    }
  };

  const handleEdit = (exp) => {
    setEditingId(exp.id);
    const [catName, type] = exp.category.split(':');
    setForm({ title: exp.title, amount: exp.amount, category: catName || exp.category, date: exp.date });
    setSpendType(type || 'Expenses');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast("Editing mode active");
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(`${API_URL}/expenses/${alertConfig.id}`);
      setAlertConfig({ isOpen: false, id: null });
      fetchData();
      showToast("Transaction deleted permanently");
    } catch (error) { showToast('Delete failed'); }
  };

  /* -------------------- FILTER LOGIC -------------------- */
  const dateFiltered = expenses.filter(exp => {
    if (dateRange === 'all') return true;
    const expDate = new Date(exp.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (typeof dateRange === 'number') {
      return Math.ceil(Math.abs(today - expDate) / (1000 * 60 * 60 * 24)) <= dateRange;
    }
    if (dateRange === 'thisMonth') return expDate.getMonth() === today.getMonth() && expDate.getFullYear() === today.getFullYear();
    if (dateRange === 'thisYear') return expDate.getFullYear() === today.getFullYear();
    return true;
  });

  const filteredTable = dateFiltered.filter(exp => {
    const matchesSearch = exp.title.toLowerCase().includes(search.toLowerCase());
    const type = exp.category.split(':')[1] || 'Expenses';
    return matchesSearch && type === filterMode;
  });

  const categoryTotals = dateFiltered.reduce((acc, exp) => {
    const [name, type] = exp.category.split(':');
    const finalType = type || 'Expenses';
    if (finalType === summaryFilter) {
      acc[name] = (acc[name] || 0) + exp.amount;
    }
    return acc;
  }, {});

  const getBalance = (type) => expenses
    .filter(exp => (exp.category.split(':')[1] || 'Expenses') === type)
    .reduce((sum, exp) => sum + exp.amount, 0);

  const getCategoryStyle = (cat) => {
    const name = cat.split(':')[0].toLowerCase();
    const styles = {
      shopping: "bg-fuchsia-50 text-fuchsia-400 border border-fuchsia-100",
      rent: "bg-blue-50 text-blue-400 border border-blue-100",
      bills: "bg-orange-50 text-orange-400 border border-orange-100",
      food: "bg-red-50 text-red-400 border border-red-100",
      travel: "bg-green-50 text-green-400 border border-green-100",
    };
    return styles[name] || "bg-slate-50 text-slate-400 border border-slate-100";
  };

  if (!isAuthenticated) return <Auth onAuthSuccess={() => setIsAuthenticated(true)} />;

  return (
    <div className="min-h-screen bg-[#fcfdfe] text-slate-900 font-sans antialiased">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-10">

        {/* HEADER */}
        <header className="relative overflow-hidden bg-indigo-600 rounded-3xl shadow-xl border border-indigo-500/30 p-6 md:p-8">
          {/* Decorative Background Elements */}
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-24 h-24 bg-indigo-400/20 rounded-full blur-2xl pointer-events-none"></div>

          <div className="relative flex flex-col lg:flex-row justify-between items-center gap-8">
            {/* LOGO & BRAND SECTION */}
            <div className="text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start gap-4 mb-2">
                <div className="relative w-12 h-12 shrink-0 flex items-center justify-center">
                  {/* Rotating dashed border */}
                  <div className="absolute inset-0 border-2 border-dashed border-indigo-300/60 rounded-full animate-[spin_8s_linear_infinite]"></div>
                  <div className="relative bg-indigo-600 w-8 h-8 rounded-full shadow-sm flex items-center justify-center">
                    <img src="/agw2.png" alt="Logo" className="w-5 h-5 object-contain" />
                  </div>
                </div>
                <h1 className="text-3xl font-black tracking-tight text-white leading-tight">
                  MyWallet<span className="text-indigo-200">Pro</span>
                </h1>
              </div>
              <p className="text-indigo-100/80 text-sm font-medium tracking-wide">Multi-Account Dashboard</p>
            </div>

            {/* BALANCES & LOGOUT SECTION */}
            <div className="flex flex-col sm:flex-row items-center w-full lg:w-auto gap-6 sm:gap-8">

              {/* Dynamic Balance Display */}
              <div className="flex flex-wrap justify-center gap-2 bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/10 shadow-inner w-full sm:w-auto">
                {[
                  { l: 'Expenses', v: getBalance('Expenses') },
                  { l: 'Receivables', v: getBalance('Receivables') },
                  { l: 'Payables', v: getBalance('Payables') }
                ].map((item, index, array) => (
                  <div key={item.l} className="flex items-center">
                    <div className="px-5 text-center sm:text-left">
                      <p className="text-[10px] uppercase font-bold tracking-[0.15em] text-indigo-200 mb-1">{item.l}</p>
                      <p className="text-xl md:text-2xl font-black text-white tabular-nums">
                        ₹{item.v.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
                      </p>
                    </div>
                    {/* Divider (Hidden after last item) */}
                    {index !== array.length - 1 && (
                      <div className="hidden sm:block h-8 w-px bg-white/20"></div>
                    )}
                  </div>
                ))}
              </div>

              {/* LOGOUT BUTTON */}
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

          <aside className="lg:col-span-4 space-y-6">

            <section className={`bg-white p-6 rounded-3xl shadow-sm transition-all duration-500 border ${
  editingId 
    ? 'border-orange-400 ring-4 ring-orange-500/10 shadow-md' 
    : 'border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200'
}`}>
  <h2 className="text-lg font-bold mb-5 flex items-center gap-2">
    <span className={`w-2 h-2 rounded-full ${editingId ? 'bg-orange-500 animate-pulse' : 'bg-indigo-500'}`}></span>
    {editingId ? "Edit Transaction" : "New Transaction"}
  </h2>

  <form onSubmit={handleSubmit} className="space-y-4">
    <input 
      className="w-full px-4 py-3 rounded-xl border border-slate-100 bg-slate-50/50 outline-none focus:bg-white focus:ring-2 ring-indigo-50 hover:border-slate-200 transition-all" 
      placeholder="Transaction Name" 
      value={form.title} 
      onChange={e => setForm({ ...form, title: e.target.value })} 
      required 
    />

    <div className="grid grid-cols-2 gap-4">
      <input 
        type="number" 
        className="w-full px-4 py-3 rounded-xl border border-slate-100 bg-slate-50/50 outline-none focus:bg-white hover:border-slate-200 transition-all" 
        placeholder="0.00" 
        value={form.amount} 
        onChange={e => setForm({ ...form, amount: parseFloat(e.target.value) || '' })} 
        required 
      />
      <select 
        className="w-full px-4 py-3 rounded-xl border border-slate-100 bg-slate-50/50 outline-none cursor-pointer hover:border-slate-200 transition-all" 
        value={form.category} 
        onChange={e => setForm({ ...form, category: e.target.value })}
      >
        <option>Food</option>
        <option>Rent</option>
        <option>Shopping</option>
        <option>Bills</option>
        <option>Travel</option>
      </select>
    </div>

    <input 
      type="date" 
      className="w-full px-4 py-3 rounded-xl border border-slate-100 bg-slate-50/50 outline-none hover:border-slate-200 transition-all" 
      value={form.date} 
      onChange={e => setForm({ ...form, date: e.target.value })} 
    />

    <div className="space-y-2">
      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Account Type</label>
      <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1">
        {['Expenses', 'Receivables', 'Payables'].map((type) => (
          <button 
            key={type} 
            type="button" 
            onClick={() => setSpendType(type)} 
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              spendType === type 
                ? 'bg-white text-indigo-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            {type}
          </button>
        ))}
      </div>
    </div>

    <div className="space-y-3">
      <button className={`w-full py-4 rounded-xl text-white font-bold shadow-lg transition-all active:scale-[0.98] hover:shadow-xl ${
        editingId ? 'bg-orange-500 hover:bg-orange-600' : 'bg-indigo-600 hover:bg-indigo-700'
      }`}>
        {editingId ? "Save Changes" : "Add Entry"}
      </button>
      
      {editingId && (
        <button 
          type="button" 
          onClick={handleCancelEdit} 
          className="w-full py-2 text-sm font-semibold text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
        >
          Cancel Editing
        </button>
      )}
    </div>
  </form>
</section>

            {/* SUMMARY SECTION */}
            <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
              <h2 className="text-lg font-bold text-slate-800 mb-5">Summary</h2>
              <DateFilter onFilterChange={setDateRange} />
              <div className="flex bg-slate-50 p-1 rounded-xl gap-1 my-5">
                {['Expenses', 'Receivables', 'Payables'].map(t => (
                  <button key={t} onClick={() => setSummaryFilter(t)} className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${summaryFilter === t ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>{t}</button>
                ))}
              </div>
              <div className="space-y-3">
                {Object.entries(categoryTotals).map(([cat, val]) => (
                  <div key={cat} className="flex justify-between items-center p-3 bg-slate-50/30 rounded-2xl">
                    <span className={`text-[10px] px-3 py-1 rounded-md font-bold uppercase ${getCategoryStyle(cat)}`}>{cat}</span>
                    <span className="font-bold text-slate-700">₹{val.toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>
            </section>
          </aside>

          {/* TABLE SECTION */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex flex-col gap-4">
              <input className="w-full px-6 py-4 rounded-2xl border border-slate-100 bg-white shadow-sm outline-none focus:border-indigo-500 transition-all" placeholder="Search entries..." value={search} onChange={e => setSearch(e.target.value)} />
              <div className="flex bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm gap-1 w-full ">
                {['Expenses', 'Receivables', 'Payables'].map(t => (
                  <button key={t} onClick={() => setFilterMode(t)} className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${filterMode === t ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>{t}</button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
              {/* STICKY HEADER WRAPPER */}
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="sticky top-0 bg-white z-10">
                    <tr className="border-b border-slate-50">
                      <th className="px-8 py-5 text-[11px] font-bold uppercase text-slate-400 tracking-wider">Date</th>
                      <th className="px-8 py-5 text-[11px] font-bold uppercase text-slate-400 tracking-wider">Name</th>
                      <th className="px-8 py-5 text-[11px] font-bold uppercase text-slate-400 tracking-wider text-center">Category</th>
                      <th className="px-8 py-5 text-[11px] font-bold uppercase text-slate-400 tracking-wider text-right">Amount</th>
                      <th className="px-8 py-5 text-[11px] font-bold uppercase text-slate-400 tracking-wider text-center">Actions</th>
                    </tr>
                  </thead>
                </table>
                {/* SCROLLABLE BODY RESTRICTED TO ~5 DATA ROWS */}
                <div className="max-h-110 overflow-y-auto custom-scrollbar">
                  <table className="w-full text-left">
                    <tbody className="divide-y divide-slate-50">
                      {filteredTable.map(exp => (
                        <tr key={exp.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-8 py-6 text-sm text-slate-500 font-medium w-1/5">
                            {new Date(exp.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="px-8 py-6 text-[15px] font-semibold text-slate-700 w-1/4">
                            {exp.title}
                          </td>
                          <td className="px-8 py-6 text-center w-1/5">
                            <span className={`inline-block px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-tight ${getCategoryStyle(exp.category)}`}>
                              {exp.category.split(':')[0]}
                            </span>
                          </td>
                          <td className="px-8 py-6 text-right font-bold text-slate-900 text-[15px] w-1/5">
                            ₹{exp.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-8 py-6 w-1/5">
                            <div className="flex justify-center gap-5">
                              <button onClick={() => handleEdit(exp)} className="text-indigo-600 cursor-pointer hover:text-indigo-900 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                              </button>
                              <button onClick={() => setAlertConfig({ isOpen: true, id: exp.id })} className="text-red-500 cursor-pointer hover:text-red-900 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredTable.length === 0 && (
                    <div className="py-20 text-center font-bold text-slate-300 uppercase tracking-widest">No entries found</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      <Toast isOpen={toastConfig.isOpen} message={toastConfig.message} onClose={() => setToastConfig({ ...toastConfig, isOpen: false })} />
      <Alert isOpen={alertConfig.isOpen} onClose={() => setAlertConfig({ isOpen: false, id: null })} onConfirm={confirmDelete} title="Delete Record" message="Are you sure you want to remove this transaction?" />
    </div>
  );
}

export default App;
