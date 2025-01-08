import { BallPhysicsTools } from "@/components/BallPhysicsTools";

export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Top Navigation Bar */}
      <nav className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700">
        <div className="container mx-auto px-2 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <svg
                className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400"
                fill="none"
                strokeWidth="2"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0"
                />
              </svg>
              <h1 className="text-xl sm:text-2xl font-bold text-white">
                Golf Physics Tools
              </h1>
            </div>
            <div className="text-blue-300 text-xs sm:text-sm">v1.0.0</div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto py-4 sm:py-8 px-2 sm:px-4">
        <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-xl border border-white/10 overflow-hidden">
          <BallPhysicsTools />
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-2 sm:px-4 py-4 sm:py-6 text-center text-slate-400 text-xs sm:text-sm">
        © 2024 Golf Physics Tools. All rights reserved.
      </footer>
    </div>
  );
}
