import { Mail, Lock, ArrowRight } from "lucide-react";
import gitHubLogo from "../../assets/github.svg";
import React, { useState, useRef, useEffect } from "react";
import { useLogin } from "../../features/auth/hooks/useLogin";
import { useOAuth } from "../../features/auth/hooks/useOAuth";
import { Link } from "react-router";

function GitHubIcon() {
  return <img width="7%" src={gitHubLogo} alt="GitHub Logo" />;
}

const Login = () => {
  const userRef = useRef<HTMLInputElement | null>(null);
  const errRef = useRef<HTMLParagraphElement | null>(null);

  const [email, setEmail] = useState("");
  const [emailFocus, setEmailFocus] = useState(false);

  const [pwd, setPassword] = useState("");
  const { errMsg, success, executeLogin } = useLogin();
  const { oauthLoading, handleGitHubLogin } = useOAuth();

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();

    const payload = {
      email: email,
      password: pwd,
    };

    await executeLogin(payload);
  };

  useEffect(() => {
    if (userRef.current !== null) {
      userRef.current.focus();
    }
  }, []);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
      <div className="w-full max-w-md bg-[#050505] border border-neutral-900 rounded-2xl shadow-2xl relative z-10 overflow-hidden">
        <div className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold tracking-wider text-white flex items-center justify-center gap-2 mb-2">
              Chess42
            </h1>
            <p className="text-neutral-500 text-sm">Welcome back, master.</p>
          </div>

          {/*OAuth - GitHub*/}
          <div className="space-y-3 mb-6">
            <button
              onClick={() => handleGitHubLogin("github")}
              disabled={oauthLoading !== null}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-white text-sm font-medium transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {oauthLoading === "github" ? (
                <span className="w-5 h-5 border-2 border-neutral-600 border-t-white rounded-full animate-spin" />
              ) : (
                <GitHubIcon />
              )}
              Continue with GitHub
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-neutral-900" />
            <span className="text-[11px] font-medium text-neutral-600 uppercase tracking-widest">
              or
            </span>
            <div className="flex-1 h-px bg-neutral-900" />
          </div>

          {/* Registration */}
          <form className="space-y-4" onSubmit={handleSubmit}>
            {errMsg && (
              <div
                ref={errRef}
                className="p-3 bg-red-950/50 border border-red-800 rounded-lg text-red-400 text-sm text-center"
              >
                {errMsg}
              </div>
            )}

            {/* Email */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="w-5 h-5 text-neutral-600" />
              </div>
              <input
                type="email"
                id="email"
                ref={userRef}
                onChange={(e) => setEmail(e.target.value)}
                required
                onFocus={() => setEmailFocus(true)}
                onBlur={() => setEmailFocus(false)}
                placeholder="Email address"
                className="w-full bg-black border border-neutral-800 rounded-lg py-3 pl-10 pr-4 text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all text-sm"
              />
            </div>

            {/* Password */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="w-5 h-5 text-neutral-600" />
              </div>
              <input
                type="password"
                id="password"
                required
                autoComplete="off"
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full bg-black border border-neutral-800 rounded-lg py-3 pl-10 pr-4 text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all text-sm"
              />
            </div>

            <button
              type="submit"
              className="w-full mt-6 bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all"
            >
              Login
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
          <div className="mt-6 text-center">
            <button className="text-sm font-medium text-neutral-500 hover:text-white transition-colors">
              <Link
                to="/register"
                className="text-sm font-medium text-neutral-500 hover:text-white transition-colors"
              >
                New here? Create an account
              </Link>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
