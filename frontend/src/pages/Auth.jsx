import { useState } from "react";
import axios from "axios";
import Toast from "../Toast";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function Auth({ onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [toastConfig, setToastConfig] = useState({ isOpen: false, message: "" });

  const showToast = (msg) => {
    setToastConfig({ isOpen: true, message: msg });
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const url = isLogin ? "/login" : "/register";
      const payload = isLogin ? { email, password } : { email, password, username };
      
      const res = await axios.post(`${API_URL}${url}`, payload);

      if (isLogin) {
        localStorage.setItem("token", res.data.access_token);
        setTimeout(() => {
          onAuthSuccess();
        }, 800);
      } else {
        setIsLoading(false);
        showToast("Registered successfully. Please login.");
        setIsLogin(true);
        setEmail("");
        setPassword("");
        setUsername("");
      }
    } catch (err) {
      setIsLoading(false);
      if (err.response?.status === 401) {
        setError("Invalid email or password. Please try again.");
      } else {
        setError(err.response?.data?.detail || "Auth failed");
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] text-slate-900 font-sans antialiased p-6">
      {/* KEYFRAME ANIMATION FOR THE BORDER */}
      <style>
        {`
          @keyframes rotate-border {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          .animate-border {
            animation: rotate-border 4s linear infinite;
          }
        `}
      </style>

      {/* ANIMATED BORDER WRAPPER */}
      <div className="relative w-full max-w-md p-0.5 overflow-hidden rounded-[26px] shadow-2xl">
        
        {/* MOVING LIGHT BEAM */}
        <div 
          className="absolute inset-[-1000%] animate-border"
          style={{
            background: "conic-gradient(from 0deg, transparent 0deg, transparent 300deg, #6366f1 330deg, #818cf8 345deg, transparent 360deg)"
          }}
        />

        {/* AUTH FORM CARD */}
        <form
          onSubmit={submit}
          className="relative z-10 bg-white p-8 rounded-3xl w-full space-y-5"
        >
          {/* LOGO AND TITLE SECTION */}
          <div className="text-center mb-2">
            <div className="flex justify-center mb-4">
              <div className="bg-indigo-600 p-3 rounded-2xl shadow-lg shadow-indigo-100 flex items-center justify-center">
                <img src="/agw2.png" alt="Logo" className="w-8 h-8 object-contain" />
              </div>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-indigo-600">
              MyWallet<span className="text-indigo-400">Pro</span>
            </h1>
            <p className="text-slate-500 font-medium mt-2 text-sm">
              {isLogin ? "Welcome back" : "Create your account"}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm animate-shake flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          {!isLogin && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
              <label className="text-xs font-bold text-slate-500 ml-1 mb-2 block uppercase tracking-wider">Username</label>
              <input
                type="text"
                placeholder="John Doe"
                className="w-full px-4 py-3 border border-slate-200 bg-slate-50/50 rounded-xl focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required={!isLogin}
                disabled={isLoading}
              />
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-slate-500 ml-1 mb-2 block uppercase tracking-wider">Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              className="w-full px-4 py-3 border border-slate-200 bg-slate-50/50 rounded-xl focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 ml-1 mb-2 block uppercase tracking-wider">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full px-4 py-3 border border-slate-200 bg-slate-50/50 rounded-xl focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <button
            disabled={isLoading}
            className={`w-full font-bold py-4 rounded-xl shadow-lg transition-all duration-300 flex items-center justify-center gap-2 active:scale-[0.98] 
              ${isLoading
                ? "bg-emerald-500 shadow-emerald-200 text-white"
                : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200 text-white"
              }`}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Authenticating...</span>
              </>
            ) : (
              <span>{isLogin ? "Login" : "Create Account"}</span>
            )}
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-white text-slate-500 font-medium">or continue with</span>
            </div>
          </div>

          <p className="text-center text-slate-600">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-indigo-600 font-bold hover:text-indigo-700 transition-colors cursor-pointer"
              disabled={isLoading}
            >
              {isLogin ? "Register" : "Login"}
            </button>
          </p>
        </form>
      </div>

      <Toast
        isOpen={toastConfig.isOpen}
        message={toastConfig.message}
        onClose={() => setToastConfig({ ...toastConfig, isOpen: false })}
      />
    </div>
  );
}
