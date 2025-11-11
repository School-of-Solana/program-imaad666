'use client';

import { FC, useState, useEffect } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Program, AnchorProvider, web3, BN } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import { TaskManager as TaskManagerProgram } from '../types/task_manager';
import idl from '../idl/task_manager.json';

const PROGRAM_ID = new PublicKey('13AyfsUmh9iow5qF83SV5hv9imBdAFFgvSbjdBQUceuk');

interface Task {
  owner: PublicKey;
  title: string;
  description: string;
  priority: any;
  completed: boolean;
  createdAt: BN;
  taskId: BN;
  bump: number;
}

interface UserAccount {
  owner: PublicKey;
  taskCount: BN;
  completedCount: BN;
  bump: number;
}

export const TaskManager: FC = () => {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [tasks, setTasks] = useState<{ pubkey: PublicKey; account: Task }[]>([]);
  const [userAccount, setUserAccount] = useState<UserAccount | null>(null);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  const getProvider = () => {
    if (!wallet.publicKey) return null;
    const provider = new AnchorProvider(
      connection,
      wallet as any,
      AnchorProvider.defaultOptions()
    );
    return provider;
  };

  const getProgram = () => {
    const provider = getProvider();
    if (!provider) return null;
    return new Program<TaskManagerProgram>(idl as TaskManagerProgram, provider);
  };

  const getUserAccountPDA = () => {
    if (!wallet.publicKey) return null;
    const [pda] = PublicKey.findProgramAddressSync(
      [Buffer.from('user'), wallet.publicKey.toBuffer()],
      PROGRAM_ID
    );
    return pda;
  };

  const getTaskPDA = (taskId: number) => {
    if (!wallet.publicKey) return null;
    const [pda] = PublicKey.findProgramAddressSync(
      [Buffer.from('task'), wallet.publicKey.toBuffer(), new BN(taskId).toArrayLike(Buffer, 'le', 8)],
      PROGRAM_ID
    );
    return pda;
  };

  const initializeUser = async () => {
    const program = getProgram();
    const userAccountPDA = getUserAccountPDA();
    if (!program || !userAccountPDA || !wallet.publicKey) return;

    try {
      setLoading(true);
      await program.methods
        .initializeUser()
        .accounts({
          user: wallet.publicKey,
        } as any)
        .rpc();
      
      await fetchUserAccount();
      alert('User account initialized!');
    } catch (error: any) {
      console.error('Error initializing user:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserAccount = async () => {
    const program = getProgram();
    const userAccountPDA = getUserAccountPDA();
    if (!program || !userAccountPDA) return;

    try {
      const account = await program.account.userAccount.fetch(userAccountPDA);
      setUserAccount(account as UserAccount);
    } catch (error) {
      console.log('User account not initialized yet');
      setUserAccount(null);
    }
  };

  const fetchTasks = async () => {
    const program = getProgram();
    if (!program || !wallet.publicKey || !userAccount) return;

    try {
      const taskAccounts = [];
      for (let i = 0; i < userAccount.taskCount.toNumber(); i++) {
        const taskPDA = getTaskPDA(i);
        if (!taskPDA) continue;
        
        try {
          const taskAccount = await program.account.task.fetch(taskPDA);
          taskAccounts.push({ pubkey: taskPDA, account: taskAccount as Task });
        } catch (error) {
          // Task might be deleted
          continue;
        }
      }
      setTasks(taskAccounts);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const createTask = async () => {
    const program = getProgram();
    const userAccountPDA = getUserAccountPDA();
    if (!program || !userAccountPDA || !wallet.publicKey || !userAccount) return;

    if (!title.trim()) {
      alert('Please enter a title');
      return;
    }

    try {
      setLoading(true);
      const taskPDA = getTaskPDA(userAccount.taskCount.toNumber());
      if (!taskPDA) return;

      const priorityEnum = { [priority]: {} };

      await program.methods
        .createTask(title, description, priorityEnum)
        .accounts({
          user: wallet.publicKey,
          owner: wallet.publicKey,
        } as any)
        .rpc();

      setTitle('');
      setDescription('');
      setPriority('medium');
      await fetchUserAccount();
      await fetchTasks();
      alert('Task created!');
    } catch (error: any) {
      console.error('Error creating task:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const toggleTask = async (taskId: number) => {
    const program = getProgram();
    const userAccountPDA = getUserAccountPDA();
    const taskPDA = getTaskPDA(taskId);
    if (!program || !userAccountPDA || !taskPDA || !wallet.publicKey) return;

    try {
      setLoading(true);
      await program.methods
        .toggleTask(new BN(taskId))
        .accounts({
          user: wallet.publicKey,
          owner: wallet.publicKey,
        } as any)
        .rpc();

      await fetchUserAccount();
      await fetchTasks();
    } catch (error: any) {
      console.error('Error toggling task:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const deleteTask = async (taskId: number) => {
    const program = getProgram();
    const userAccountPDA = getUserAccountPDA();
    const taskPDA = getTaskPDA(taskId);
    if (!program || !userAccountPDA || !taskPDA || !wallet.publicKey) return;

    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      setLoading(true);
      await program.methods
        .deleteTask(new BN(taskId))
        .accounts({
          user: wallet.publicKey,
          owner: wallet.publicKey,
        } as any)
        .rpc();

      await fetchUserAccount();
      await fetchTasks();
      alert('Task deleted!');
    } catch (error: any) {
      console.error('Error deleting task:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (wallet.publicKey) {
      fetchUserAccount();
    }
  }, [wallet.publicKey]);

  useEffect(() => {
    if (userAccount) {
      fetchTasks();
    }
  }, [userAccount]);

  if (!wallet.connected) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Welcome to Task Manager</h2>
        <p className="text-gray-600">Please connect your wallet to get started</p>
      </div>
    );
  }

  if (!userAccount) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Initialize Your Account</h2>
        <p className="text-gray-600 mb-6">You need to initialize your account before creating tasks</p>
        <button
          onClick={initializeUser}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-lg disabled:opacity-50"
        >
          {loading ? 'Initializing...' : 'Initialize Account'}
        </button>
      </div>
    );
  }

  const filteredTasks = tasks.filter(task => {
    if (filter === 'active') return !task.account.completed;
    if (filter === 'completed') return task.account.completed;
    return true;
  });

  const getPriorityColor = (priority: any) => {
    if (priority.low) return 'bg-green-100 text-green-800';
    if (priority.medium) return 'bg-yellow-100 text-yellow-800';
    if (priority.high) return 'bg-orange-100 text-orange-800';
    if (priority.urgent) return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getPriorityLabel = (priority: any) => {
    if (priority.low) return 'Low';
    if (priority.medium) return 'Medium';
    if (priority.high) return 'High';
    if (priority.urgent) return 'Urgent';
    return 'Unknown';
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-3xl font-bold text-blue-600">{userAccount.taskCount.toNumber()}</div>
          <div className="text-gray-600">Total Tasks</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-3xl font-bold text-green-600">{userAccount.completedCount.toNumber()}</div>
          <div className="text-gray-600">Completed</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-3xl font-bold text-orange-600">
            {userAccount.taskCount.toNumber() - userAccount.completedCount.toNumber()}
          </div>
          <div className="text-gray-600">Active</div>
        </div>
      </div>

      {/* Create Task Form */}
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h2 className="text-xl font-bold mb-4">Create New Task</h2>
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Task title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            maxLength={100}
          />
          <textarea
            placeholder="Task description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            maxLength={500}
          />
          <div className="flex gap-4">
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as any)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
              <option value="urgent">Urgent</option>
            </select>
            <button
              onClick={createTask}
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-lg disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium ${
            filter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter('active')}
          className={`px-4 py-2 rounded-lg font-medium ${
            filter === 'active' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
          }`}
        >
          Active
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`px-4 py-2 rounded-lg font-medium ${
            filter === 'completed' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
          }`}
        >
          Completed
        </button>
      </div>

      {/* Tasks List */}
      <div className="space-y-4">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500">No tasks found. Create your first task!</p>
          </div>
        ) : (
          filteredTasks.map((task) => (
            <div
              key={task.pubkey.toString()}
              className={`bg-white p-6 rounded-lg shadow ${
                task.account.completed ? 'opacity-75' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <input
                      type="checkbox"
                      checked={task.account.completed}
                      onChange={() => toggleTask(task.account.taskId.toNumber())}
                      className="w-5 h-5 cursor-pointer"
                    />
                    <h3
                      className={`text-lg font-semibold ${
                        task.account.completed ? 'line-through text-gray-500' : ''
                      }`}
                    >
                      {task.account.title}
                    </h3>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(
                        task.account.priority
                      )}`}
                    >
                      {getPriorityLabel(task.account.priority)}
                    </span>
                  </div>
                  {task.account.description && (
                    <p className="text-gray-600 ml-8">{task.account.description}</p>
                  )}
                  <p className="text-xs text-gray-400 ml-8 mt-2">
                    Task ID: {task.account.taskId.toString()}
                  </p>
                </div>
                <button
                  onClick={() => deleteTask(task.account.taskId.toNumber())}
                  disabled={loading}
                  className="text-red-500 hover:text-red-700 font-medium disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

