import { Link } from "react-router";

export function PrivacyPage() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="max-w-3xl bg-[#050505] border border-neutral-900 rounded-2xl p-8 text-neutral-200">
        <h1 className="text-2xl font-bold mb-4">Privacy Policy</h1>
        <p className="text-sm mb-4">
          <h3>Welcome to Chest42!</h3>
		  <p className="text-sm mb-4 text-justify">This Privacy Policy (“Policy“) describes how Chest42 collects, uses, protects, and discloses personal information, including about anyone who uses our Services (“Users“), anyone who creates an account on the Chest42 website or mobile application, makes a purchase from us, interacts with any related content, features, mobile and web applications and other services (collectively the “Services“).</p>
        </p>
        <Link to="/login" className="text-blue-500 hover:underline text-sm">
          Back to Login
        </Link>
      </div>
    </div>
  );
}