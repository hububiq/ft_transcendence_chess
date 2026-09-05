import { useRef, useState, useEffect } from "react";
import { Upload, Mail, Lock, User, ArrowRight } from "lucide-react";
import { useRegister } from "../../features/auth/hooks/useRegister";
import gitHubLogo from "../../assets/github.svg";
import { USER_REGEX, PWD_REGEX } from "../../utils/constants";
import { useOAuth } from "../../features/auth/hooks/useOAuth";
import { Link } from "react-router";
import { FloatingPawns } from "../../components/FloatingPawns";

function GitHubIcon() {
  return <img width="7%" src={gitHubLogo} alt="GitHub Logo" />;
}

export function Register() {
  const userRef = useRef<HTMLInputElement | null>(null);
  const errRef = useRef<HTMLParagraphElement | null>(null);

  const [user, setUser] = useState("");
  const [email, setEmail] = useState("");
  const [pwd, setPassword] = useState("");
  const [matchPwd, setMatchPwd] = useState("");
  const [localErr, setLocalErr] = useState("");

  const { errMsg, executeRegister } = useRegister();
  const { oauthLoading, handleGitHubLogin } = useOAuth();

  const userValid = USER_REGEX.test(user);
  const pwdValid = PWD_REGEX.test(pwd);

  const formValid = userValid && pwdValid;

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();

    if (pwd !== matchPwd) {
      setLocalErr("Passwords do not match");
      return;
    }

    const payload = {
      username: user,
      email: email,
      password: pwd,
    };

    await executeRegister(payload);
  };

  useEffect(() => {
    if (userRef.current !== null) {
      userRef.current.focus();
    }
  }, []);

  // Display either the local validation error or the server error
  const displayError = localErr || errMsg;

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
      <FloatingPawns />
      <div className="w-full max-w-md bg-[#050505] border border-neutral-900 rounded-2xl shadow-2xl relative z-10 overflow-hidden">
        <div className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold tracking-wider text-white flex items-center justify-center gap-2 mb-2">
              Chess42
            </h1>
            <p className="text-neutral-500 text-sm">
              Begin your journey to Grand Master.
            </p>
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
              Sign up with GitHub
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
            {displayError && (
              <div
                ref={errRef}
                className="p-3 bg-red-950/50 border border-red-800 rounded-lg text-red-400 text-sm text-center"
              >
                {displayError}
              </div>
            )}
            {/* Username */}
            <div className="relative">
              <div className="absolute left-3 top-3 flex items-center pointer-events-none">
                <User className="w-5 h-5 text-neutral-600" />
              </div>
              <input
                type="text"
                id="username"
                ref={userRef}
                autoComplete="off"
                value={user}
                onChange={(e) => setUser(e.target.value)}
                required
                placeholder="Username"
                aria-describedby="usernameHelp usernameStatus"
                className="w-full bg-black border border-neutral-800 rounded-lg py-3 pl-10 pr-4 text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all text-sm"
              />
              <p id="usernameHelp" className="text-xs text-neutral-500 mt-1">
                Username: 4–24 characters, allowed: letters, numbers, _ and -, must contain at least one letter.
              </p>
              {user.length > 0 && (
                <p
                  id="usernameStatus"
                  role="status"
                  aria-live="polite"
                  className={`text-xs mt-1 ${userValid ? "text-green-400" : "text-red-400"}`}
                >
                  {userValid
                    ? "Username looks good"
                    : "Invalid username: must start with a letter and be 4–24 chars, no special characters."}
                </p>
              )}
            </div>

            {/* Email */}
            <div className="relative">
              <div className="absolute left-3 top-3 flex items-center pointer-events-none">
                <Mail className="w-5 h-5 text-neutral-600" />
              </div>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Email address"
                className="w-full bg-black border border-neutral-800 rounded-lg py-3 pl-10 pr-4 text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all text-sm"
              />
            </div>

            {/* Password */}
            <div className="relative">
              <div className="absolute left-3 top-3 flex items-center pointer-events-none">
                <Lock className="w-5 h-5 text-neutral-600" />
              </div>
              <input
                type="password"
                id="password"
                value={pwd}
                required
                autoComplete="off"
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                aria-describedby="passwordHelp passwordStatus"
                className="w-full bg-black border border-neutral-800 rounded-lg py-3 pl-10 pr-4 text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all text-sm"
              />
              <p id="passwordHelp" className="text-xs text-neutral-500 mt-1">
                Password: 8–24 characters, must include lowercase, uppercase and a number.
              </p>
              {pwd.length > 0 && (
                <p
                  id="passwordStatus"
                  role="status"
                  aria-live="polite"
                  className={`text-xs mt-1 ${pwdValid ? "text-green-400" : "text-red-400"}`}
                >
                  {pwdValid
                    ? "Password meets requirements"
                    : "Password does not meet requirements."}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="relative">
              <div className="absolute left-3 top-3 flex items-center pointer-events-none">
                <Lock className="w-5 h-5 text-neutral-600" />
              </div>
              <input
                type="password"
                id="confirm_pwd"
                value={matchPwd}
                required
                autoComplete="off"
                onChange={(e) => setMatchPwd(e.target.value)}
                placeholder="Confirm password"
                className="w-full bg-black border border-neutral-800 rounded-lg py-3 pl-10 pr-4 text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={!formValid}
              className={`w-full mt-6 font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all ${
                formValid
                  ? "bg-blue-600 hover:bg-blue-500 text-white"
                  : "bg-neutral-800 text-neutral-500 cursor-not-allowed"
              }`}
            >
              Create Account
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="text-sm font-medium text-neutral-500 hover:text-white transition-colors"
            >
              Already have an account? Log in
            </Link>
          </div>
		   <div className="mt-6 text-xs text-neutral-500 text-center">
					By continuing to use our services, you agree to our{" "}
					<Link to="/terms" className="text-blue-500 hover:underline">
					  Terms of Service
					</Link>{" "}
					and{" "}
					<Link to="/privacy" className="text-blue-500 hover:underline">
					  Privacy Policy
					</Link>
					.
				  </div>
        </div>
      </div>
    </div>
  );
}
