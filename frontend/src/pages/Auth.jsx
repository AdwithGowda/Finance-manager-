import { useState } from "react";
import axios from "axios";
// import Toast from "../Toast"; // Adjust path if needed

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function Auth({ onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // Toast state
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

      const res = await axios.post(`${API_URL}${url}`, {
        email,
        password,
      });

      if (isLogin) {
        localStorage.setItem("token", res.data.access_token);
        setTimeout(() => {
          onAuthSuccess();
        }, 800);
      } else {
        // Registration Success
        setIsLoading(false);
        showToast("Registered successfully. Please login."); 
        setIsLogin(true); // Switch to login view
        setEmail(""); // Optional: clear email
        setPassword(""); // Optional: clear password
      }
    } catch (err) {
      setIsLoading(false);
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
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm animate-shake">
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
            disabled={isLoading}
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
            disabled={isLoading}
          />
        </div>

        <button
          disabled={isLoading}
          className={`w-full font-bold py-4 rounded-xl shadow-lg transition-all duration-300 flex items-center justify-center gap-2 active:scale-[0.98] cursor-pointer
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
            <span className="px-3 bg-white text-slate-500">or</span>
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

      {/* Toast Component for Registration Success */}
      <Toast 
        isOpen={toastConfig.isOpen} 
        message={toastConfig.message} 
        onClose={() => setToastConfig({ ...toastConfig, isOpen: false })} 
      />
    </div>
  );
}
