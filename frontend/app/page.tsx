'use client';

import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { TaskManager } from '@/components/TaskManager';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Task Manager</h1>
              <p className="text-sm text-gray-600">Decentralized task management on Solana</p>
            </div>
            <WalletMultiButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <TaskManager />
      </main>

      {/* Footer */}
      <footer className="bg-white mt-12 border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-gray-600">
            <p className="mb-2">Built on Solana Devnet</p>
            <p className="text-sm">
              Program ID:{' '}
              <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                13AyfsUmh9iow5qF83SV5hv9imBdAFFgvSbjdBQUceuk
              </code>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
