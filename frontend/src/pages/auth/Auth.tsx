// import { Upload, Mail, Lock, User, ArrowRight } from "lucide-react";
// import git_logo from "../assets/github.svg";
// import { useAuth } from "../../features/auth/hooks/useAuth";

// function GitHubIcon() {
//   return <img width="7%" src={git_logo} alt="GitHub Logo" />;
// }

// export function Auth() {
//   const {
//     username,
//     setUsername,
//     email,
//     setEmail,
//     password,
//     setPassword,
//     isLogin,
//     setIsLogin,
//     errorMessage,
//     handleAuthSubmit,
//     handleGitHubLogin,
//     oauthLoading,
//   } = useAuth();

//   return (
//     <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
//       <div className="w-full max-w-md bg-[#050505] border border-neutral-900 rounded-2xl shadow-2xl relative z-10 overflow-hidden">
//         <div className="p-8">
//           <div className="text-center mb-8">
//             <h1 className="text-3xl font-bold tracking-wider text-white flex items-center justify-center gap-2 mb-2">
//               <span className="text-blue-500">Chess</span>42
//             </h1>
//             <p className="text-neutral-500 text-sm">
//               {isLogin
//                 ? "Welcome back, master."
//                 : "Begin your journey to Grand Master."}
//             </p>
//           </div>

//           {/*OAuth - GitHub*/}
//           <div className="space-y-3 mb-6">
//             <button
//               onClick={() => handleGitHubLogin("github")}
//               disabled={oauthLoading !== null}
//               className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-white text-sm font-medium transition-all disabled:opacity-60 disabled:cursor-not-allowed"
//             >
//               {oauthLoading === "github" ? (
//                 <span className="w-5 h-5 border-2 border-neutral-600 border-t-white rounded-full animate-spin" />
//               ) : (
//                 <GitHubIcon />
//               )}
//               {isLogin ? "Continue with GitHub" : "Sign up with GitHub"}
//             </button>
//           </div>

//           {/* Divider */}
//           <div className="flex items-center gap-4 mb-6">
//             <div className="flex-1 h-px bg-neutral-900" />
//             <span className="text-[11px] font-medium text-neutral-600 uppercase tracking-widest">
//               or
//             </span>
//             <div className="flex-1 h-px bg-neutral-900" />
//           </div>

//           <form className="space-y-4" onSubmit={handleAuthSubmit}>
//             {errorMessage && (
//               <div className="p-3 bg-red-950/50 border border-red-800 rounded-lg text-red-400 text-sm text-center">
//                 {errorMessage}
//               </div>
//             )}

//             {/* Avatar */}
//             {!isLogin && (
//               <div className="flex justify-center mb-6">
//                 <div className="relative group cursor-pointer">
//                   <div className="w-20 h-20 rounded-full border border-dashed border-neutral-700 flex items-center justify-center bg-black group-hover:border-blue-500 transition-colors">
//                     <Upload className="w-6 h-6 text-neutral-600 group-hover:text-blue-500 transition-colors" />
//                   </div>
//                   <div className="absolute -bottom-2 bg-[#050505] text-[10px] uppercase font-bold tracking-wider text-neutral-400 px-2 py-0.5 rounded-full border border-neutral-800 left-1/2 -translate-x-1/2">
//                     Avatar
//                   </div>
//                 </div>
//               </div>
//             )}

//             {/* Username */}
//             {!isLogin && (
//               <div className="relative">
//                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//                   <User className="w-5 h-5 text-neutral-600" />
//                 </div>
//                 <input
//                   value={username}
//                   onChange={(e) => setUsername(e.target.value)}
//                   type="text"
//                   placeholder="Username"
//                   className="w-full bg-black border border-neutral-800 rounded-lg py-3 pl-10 pr-4 text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all text-sm"
//                 />
//               </div>
//             )}

//             {/* Email */}
//             <div className="relative">
//               <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//                 <Mail className="w-5 h-5 text-neutral-600" />
//               </div>
//               <input
//                 value={email} //<-- Prop A: "Look at my React state to know what to draw"
//                 onChange={(e) => setEmail(e.target.value)} // <-- Prop B: "When typed in, update my state"
//                 type="email"
//                 placeholder="Email address"
//                 className="w-full bg-black border border-neutral-800 rounded-lg py-3 pl-10 pr-4 text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all text-sm"
//               />
//             </div>

//             {/* Password */}
//             <div className="relative">
//               <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//                 <Lock className="w-5 h-5 text-neutral-600" />
//               </div>
//               <input
//                 value={password}
//                 onChange={(e) => setPassword(e.target.value)}
//                 type="password"
//                 placeholder="Password"
//                 className="w-full bg-black border border-neutral-800 rounded-lg py-3 pl-10 pr-4 text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all text-sm"
//               />
//             </div>

//             <button
//               type="submit"
//               className="w-full mt-6 bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all"
//             >
//               {isLogin ? "Enter Arena" : "Create Account"}
//               <ArrowRight className="w-4 h-4" />
//             </button>
//           </form>

//           <div className="mt-6 text-center">
//             <button
//               onClick={() => setIsLogin(!isLogin)}
//               className="text-sm font-medium text-neutral-500 hover:text-white transition-colors"
//             >
//               {isLogin
//                 ? "New here? Create an account"
//                 : "Already have an account? Log in"}
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
