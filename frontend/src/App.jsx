import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Auth from "./pages/Auth";

const API_URL = 'http://localhost:8000';

/* -------------------- AXIOS AUTH INTERCEPTOR -------------------- */
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem("token")
  );

  const [expenses, setExpenses] = useState([]);
  const [form, setForm] = useState({ title: '', amount: '', category: 'Food' });
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    if (isAuthenticated) fetchData();
  }, [isAuthenticated]);

  const fetchData = async () => {
    const res = await axios.get(`${API_URL}/expenses`);
    setExpenses(res.data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingId) {
      await axios.put(`${API_URL}/expenses/${editingId}`, form);
      setEditingId(null);
    } else {
      await axios.post(`${API_URL}/expenses`, form);
    }
    setForm({ title: '', amount: '', category: 'Food' });
    fetchData();
  };

  const handleEdit = (exp) => {
    setEditingId(exp.id);
    setForm({ title: exp.title, amount: exp.amount, category: exp.category });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this entry?")) {
      await axios.delete(`${API_URL}/expenses/${id}`);
      fetchData();
    }
  };

  const filteredExpenses = expenses.filter(exp =>
    exp.title.toLowerCase().includes(search.toLowerCase())
  );

  const categoryTotals = expenses.reduce((acc, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
    return acc;
  }, {});

  const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  const getCategoryStyle = (cat) => ({
    Food: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200",
    Rent: "bg-blue-100 text-blue-700 ring-1 ring-blue-200",
    Shopping: "bg-fuchsia-100 text-fuchsia-700 ring-1 ring-fuchsia-200",
    Bills: "bg-amber-100 text-amber-700 ring-1 ring-amber-200"
  }[cat] || "bg-slate-100 text-slate-700 ring-1 ring-slate-200");

  /* -------------------- AUTH GUARD -------------------- */
  if (!isAuthenticated) {
    return <Auth onAuthSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans antialiased selection:bg-indigo-100 selection:text-indigo-900">
      <div className="max-w-6xl mx-auto px-4 py-8 md:px-6 lg:py-12 space-y-10">

        
          <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 bg-linear-to-r from-indigo-600 to-indigo-700 p-8 rounded-3xl shadow-lg border-0">
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight text-white">
                MyWallet<span className="text-indigo-200">Pro</span>
              </h1>
              <p className="text-indigo-100 font-medium mt-1">Simplify your financial life</p>
            </div>

            <div className="flex items-center w-full sm:w-auto gap-6">
              <div className="flex-1 sm:flex-none text-right">
                <p className="text-xs uppercase font-bold tracking-widest text-indigo-200 mb-2">
            Total Balance
                </p>
                <p className="text-4xl font-black text-white tabular-nums">
            ₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
              </div>
              
              <div className="h-12 w-px bg-indigo-400/30 hidden sm:block mx-2"></div>
              
              <button
                onClick={() => {
            localStorage.removeItem("token");
            setIsAuthenticated(false);
                }}
                className="bg-white/20 text-white hover:bg-white/30 px-5 py-2.5 rounded-xl font-semibold transition-all duration-200 border border-white/30 active:scale-95 backdrop-blur-sm"
              >
                Logout
              </button>
            </div>
          </header>

          {/* MAIN LAYOUT */}
        <main className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* SIDEBAR: Form & Summary */}
          <aside className="lg:col-span-4 space-y-6">
            
            
                  <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200/60">
                    <h2 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
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
                        type="number"
                        step="0.01"
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
                        <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                      </div>
                      </div>
                    </div>

                    <button className="w-full py-4 rounded-xl bg-indigo-600 text-white font-bold text-lg hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-[0.98] mt-2">
                      {editingId ? "Save Changes" : "Add Expense"}
                    </button>
                    {editingId && (
                      <button 
                      type="button"
                      onClick={() => {setEditingId(null); setForm({title:'', amount:'', category:'Food'})}}
                    className="w-full text-slate-500 font-semibold text-sm hover:underline"
                  >
                    Cancel Edit
                  </button>
                )}
              </form>
            </section>

            {/* CATEGORY BREAKDOWN */}
            <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200/60">
              <h2 className="text-lg font-bold text-slate-800 mb-5">Category Summary</h2>
              <div className="space-y-3">
                {Object.entries(categoryTotals).length > 0 ? (
                  Object.entries(categoryTotals).map(([cat, val]) => (
                    <div key={cat} className="group flex justify-between items-center p-3 rounded-2xl hover:bg-slate-50 transition-colors">
                      <span className={`text-[11px] px-3 py-1.5 rounded-lg font-bold uppercase tracking-wider ${getCategoryStyle(cat)}`}>
                        {cat}
                      </span>
                      <span className="font-bold text-slate-700 tabular-nums">
                        ₹{val.toLocaleString('en-IN')}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-400 text-center py-4 italic">No data yet</p>
                )}
              </div>
            </section>
          </aside>

          {/* MAIN CONTENT: Search & Table */}
          <div className="lg:col-span-8 space-y-6">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                className="w-full pl-12 pr-6 py-4 rounded-2xl border border-slate-200 bg-white shadow-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-lg"
                placeholder="Search by transaction name..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-slate-200/60 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100">
                      <th className="px-6 py-5 text-xs font-bold uppercase tracking-wider text-slate-500"> Name</th>
                      <th className="px-6 py-5 text-xs font-bold uppercase tracking-wider text-slate-500">Category</th>
                      <th className="px-6 py-5 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Amount</th>
                      <th className="px-6 py-5 text-xs font-bold uppercase tracking-wider text-slate-500 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredExpenses.map(exp => (
                      <tr key={exp.id} className="hover:bg-indigo-50/30 transition-colors group">
                        <td className="px-6 py-5">
                          <p className="font-semibold text-slate-700">{exp.title}</p>
                        </td>
                        <td className="px-6 py-5">
                          <span className={`text-[10px] px-2.5 py-1 rounded-md font-bold uppercase ${getCategoryStyle(exp.category)}`}>
                            {exp.category}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <p className="font-bold text-slate-900 tabular-nums">
                            ₹{exp.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </p>
                        </td>
                        <td className="px-6 py-5 text-center">
                          <div className="flex justify-center gap-3">
                            <button
                              onClick={() => handleEdit(exp)}
                              className="p-2 text-indigo-500 hover:bg-indigo-100 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            </button>
                            <button
                              onClick={() => handleDelete(exp.id)}
                              className="p-2 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredExpenses.length === 0 && (
                <div className="py-20 text-center">
                  <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
                  </div>
                  <h3 className="text-slate-900 font-bold">No entries found</h3>
                  <p className="text-slate-500 text-sm">Try adjusting your search or add a new expense.</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;