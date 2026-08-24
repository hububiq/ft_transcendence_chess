import { Link } from "react-router";

export function TermsPage() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="max-w-3xl bg-[#050505] border border-neutral-900 rounded-2xl p-8 text-neutral-200">
        <h1 className="text-2xl font-bold mb-4">Terms of Service</h1>
        <p className="text-sm mb-4">
          <h3>Welcome to Chest42!</h3>
		  <p className="text-sm mb-4 text-justify">This Terms of Service (“Agreement“) describes the terms and conditions under which you may access and use the Chest42 website or mobile application (the “Service“).</p>
        </p>
        <Link to="/login" className="text-blue-500 hover:underline text-sm">
          Back to Login
        </Link>
      </div>
    </div>
  );
}