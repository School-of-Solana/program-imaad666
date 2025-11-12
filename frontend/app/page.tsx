'use client';

import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { TaskManager } from '@/components/TaskManager';

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Task Manager</h1>
              <p className="text-sm text-gray-500 mt-1">Decentralized task management on Solana</p>
            </div>
            <WalletMultiButton className="!bg-gray-900 hover:!bg-gray-800" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 py-12">
        <TaskManager />
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-20">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="text-center text-gray-500 text-sm">
            <p className="mb-2">Built on Solana Devnet</p>
            <p className="font-mono text-xs text-gray-400">
              13AyfsUmh9iow5qF83SV5hv9imBdAFFgvSbjdBQUceuk
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
