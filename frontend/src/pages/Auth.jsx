import { useState } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

export default function Auth({ onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const url = isLogin ? "/login" : "/register";

      const res = await axios.post(`${API_URL}${url}`, {
        email,
        password,
      });

      if (isLogin) {
        localStorage.setItem("token", res.data.access_token);
        onAuthSuccess();
      } else {
        setIsLogin(true);
        alert("Registered successfully. Please login.");
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Auth failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] text-slate-900 font-sans antialiased">
      <form
        onSubmit={submit}
        className="bg-white p-8 rounded-3xl shadow-lg border border-slate-200/60 w-full max-w-md space-y-6"
      >
        <div className="text-center mb-2">
          <h1 className="text-4xl font-extrabold tracking-tight text-indigo-600">
            MyWallet<span className="text-indigo-400">Pro</span>
          </h1>
          <p className="text-slate-500 font-medium mt-2 text-sm">
            {isLogin ? "Welcome back" : "Create your account"}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        <div>
          <label className="text-xs font-bold text-slate-500 ml-1 mb-2 block uppercase">Email</label>
          <input
            type="email"
            placeholder="you@example.com"
            className="w-full px-4 py-3 border border-slate-200 bg-slate-50/50 rounded-xl focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-500 ml-1 mb-2 block uppercase">Password</label>
          <input
            type="password"
            placeholder="••••••••"
            className="w-full px-4 py-3 border border-slate-200 bg-slate-50/50 rounded-xl focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-[0.98]">
          {isLogin ? "Login" : "Create Account"}
        </button>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-3 bg-white text-slate-500">or</span>
          </div>
        </div>

        <p className="text-center text-slate-600">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-indigo-600 font-bold hover:text-indigo-700 transition-colors"
          >
            {isLogin ? "Register" : "Login"}
          </button>
        </p>
      </form>
    </div>
  );
}
