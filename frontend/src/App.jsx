import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:8000';

function App() {
  const [expenses, setExpenses] = useState([]);
  const [form, setForm] = useState({ title: '', amount: '', category: 'Food' });
  const [search, setSearch] = useState('');
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null); // TRACK EDITING STATE

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await axios.get(`${API_URL}/expenses`);
      setExpenses(res.data);
      setError(null);
    } catch (err) {
      setError("Backend connection failed.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        // IF EDITING, USE PUT
        await axios.put(`${API_URL}/expenses/${editingId}`, form);
        setEditingId(null);
      } else {
        // IF NOT EDITING, USE POST
        await axios.post(`${API_URL}/expenses`, form);
      }
      setForm({ title: '', amount: '', category: 'Food' });
      fetchData();
    } catch (err) {
      alert("Error saving transaction.");
    }
  };

  // NEW EDIT FUNCTION
  const handleEdit = (exp) => {
    setEditingId(exp.id);
    setForm({ title: exp.title, amount: exp.amount, category: exp.category });
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll up to form
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

  const getCategoryStyle = (cat) => {
    const styles = {
      Food: "bg-green-100 text-green-700",
      Rent: "bg-blue-100 text-blue-700",
      Shopping: "bg-purple-100 text-purple-700",
      Bills: "bg-yellow-100 text-yellow-700"
    };
    return styles[cat] || "bg-gray-100 text-gray-700";
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 font-sans">
      <div className="max-w-5xl mx-auto">
        
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-800">MyWallet <span className="text-indigo-600">Pro</span></h1>
            <p className="text-slate-500 text-sm">Track every penny, live better.</p>
          </div>
          <div className="bg-white px-6 py-3 rounded-2xl shadow-sm border border-slate-200 text-right">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">Total Outflow</span>
            <p className="text-3xl font-black text-indigo-600">₹{total.toFixed(2)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-1 space-y-6">
            <div className={`bg-white p-6 rounded-2xl shadow-sm border transition-all ${editingId ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-slate-200'}`}>
              <h2 className="font-bold text-slate-700 mb-4">{editingId ? 'Edit Transaction' : 'Add Transaction'}</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <input 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  placeholder="Item name..." 
                  value={form.title} 
                  onChange={e => setForm({...form, title: e.target.value})} 
                  required 
                />
                <input 
                  type="number" step="0.01"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  placeholder="0.00" 
                  value={form.amount} 
                  onChange={e => setForm({...form, amount: parseFloat(e.target.value) || ''})} 
                  required 
                />
                <select 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  value={form.category} 
                  onChange={e => setForm({...form, category: e.target.value})}
                >
                  <option value="Food">Food</option>
                  <option value="Rent">Rent</option>
                  <option value="Shopping">Shopping</option>
                  <option value="Bills">Bills</option>
                </select>
                <button className={`w-full text-white font-bold py-3 rounded-xl transition-all shadow-lg ${editingId ? 'bg-orange-500 hover:bg-orange-600 shadow-orange-100' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100'}`}>
                  {editingId ? 'Update Changes' : 'Save Transaction'}
                </button>
                {editingId && (
                  <button 
                    type="button"
                    onClick={() => {setEditingId(null); setForm({ title: '', amount: '', category: 'Food' });}}
                    className="w-full text-slate-400 text-sm font-semibold hover:text-slate-600"
                  >
                    Cancel Edit
                  </button>
                )}
              </form>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h2 className="font-bold text-slate-700 mb-4">By Category</h2>
              <div className="space-y-3">
                {Object.entries(categoryTotals).map(([cat, val]) => (
                  <div key={cat} className="flex justify-between items-center">
                    <span className={`text-xs font-bold px-2 py-1 rounded-md ${getCategoryStyle(cat)}`}>{cat}</span>
                    <span className="font-mono font-bold text-slate-600">₹{val.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <div className="relative">
              <input 
                type="text"
                placeholder="Search transactions..."
                className="w-full p-4 pl-12 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <span className="absolute left-4 top-4 grayscale opacity-50">🔍</span>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 border-bottom border-slate-100">
                    <tr>
                      <th className="p-4 text-xs font-bold text-slate-400 uppercase">Item</th>
                      <th className="p-4 text-xs font-bold text-slate-400 uppercase">Category</th>
                      <th className="p-4 text-xs font-bold text-slate-400 uppercase text-right">Amount</th>
                      <th className="p-4 text-xs font-bold text-slate-400 uppercase text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredExpenses.map(exp => (
                      <tr key={exp.id} className="hover:bg-indigo-50/30 transition-colors group">
                        <td className="p-4 font-semibold text-slate-700">{exp.title}</td>
                        <td className="p-4">
                          <span className={`text-[10px] uppercase tracking-widest font-black px-2 py-1 rounded-full ${getCategoryStyle(exp.category)}`}>
                            {exp.category}
                          </span>
                        </td>
                        <td className="p-4 text-right font-mono font-bold text-slate-900">₹{exp.amount.toFixed(2)}</td>
                        <td className="p-4 text-center space-x-3">
                          <button 
                            onClick={() => handleEdit(exp)}
                            className="text-indigo-600 hover:text-indigo-800 transition-colors font-bold text-sm"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => handleDelete(exp.id)}
                            className="text-slate-500 hover:text-red-500 transition-colors font-bold text-sm "
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredExpenses.length === 0 && (
                <div className="p-10 text-center text-slate-400 italic">
                  No matches found for "{search}"
                </div>
              )}
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}

export default App;