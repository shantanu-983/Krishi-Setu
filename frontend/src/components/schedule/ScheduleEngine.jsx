import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../api/client';

export default function ScheduleEngine() {
  const { t } = useLanguage();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('ALL'); // 'ALL' | 'PENDING' | 'COMPLETED'

  // Modal / Add Task state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState('');
  const [cropName, setCropName] = useState('Wheat');
  const [category, setCategory] = useState('Irrigation');
  const [priority, setPriority] = useState('HIGH');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadTasks();
  }, []);

  async function loadTasks() {
    setLoading(true);
    setError('');
    try {
      const res = await api.getTasks();
      if (res.ok && Array.isArray(res.data)) {
        setTasks(res.data);
      } else {
        setError(res.error || 'Failed to load farm schedule.');
      }
    } catch {
      setError('Network connection error while fetching tasks.');
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleComplete(task) {
    const updatedStatus = !task.completed;
    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) => (t._id === task._id ? { ...t, completed: updatedStatus } : t))
    );

    const res = await api.updateTask(task._id, { completed: updatedStatus });
    if (!res.ok) {
      // Revert if failed
      setTasks((prev) =>
        prev.map((t) => (t._id === task._id ? { ...t, completed: task.completed } : t))
      );
      alert('Failed to update task status.');
    }
  }

  async function handleDeleteTask(taskId) {
    if (!confirm('Are you sure you want to delete this farming task?')) return;

    setTasks((prev) => prev.filter((t) => t._id !== taskId));
    const res = await api.deleteTask(taskId);
    if (!res.ok) {
      loadTasks();
      alert('Failed to delete task.');
    }
  }

  async function handleCreateTask(e) {
    e.preventDefault();
    if (!title.trim()) return;

    setSubmitting(true);
    const payload = {
      title,
      cropName,
      category,
      priority,
      dueDate: dueDate || undefined,
      notes: notes || undefined,
    };

    const res = await api.createTask(payload);
    setSubmitting(false);

    if (res.ok && res.data) {
      setTasks((prev) => [res.data, ...prev]);
      setIsModalOpen(false);
      setTitle('');
      setNotes('');
      setDueDate('');
    } else {
      alert(res.error || 'Failed to create task.');
    }
  }

  const filteredTasks = tasks.filter((task) => {
    if (filter === 'PENDING') return !task.completed;
    if (filter === 'COMPLETED') return task.completed;
    return true;
  });

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.completed).length;
  const pendingTasks = totalTasks - completedTasks;

  return (
    <div className="space-y-6 pb-12">
      {/* Sample Farm Top Notice Banner */}
      <div className="text-[11px] font-semibold tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5 uppercase">
        <span className="text-[#d97736]">●</span>
        <span>SAMPLE FARM • Weather, prices and advice are illustrative</span>
      </div>

      {/* Category Tag */}
      <div className="text-[10px] font-bold tracking-widest text-[#d97736] uppercase">
        FARMING SCHEDULE & OPERATIONS
      </div>

      {/* Engine Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-2">
          <h1 className="font-serif font-semibold text-3xl sm:text-4xl text-slate-900 dark:text-white leading-tight">
            Stay ahead of critical crop milestones.
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm leading-relaxed max-w-xl">
            {t('scheduleSub')}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="bg-[#143d35] hover:bg-[#0f3029] text-white px-6 py-2.5 rounded-full text-xs font-semibold shadow-xs transition flex items-center justify-center gap-2 shrink-0 self-start sm:self-auto"
        >
          <i className="ri-add-line text-sm text-emerald-300"></i>
          <span>{t('scheduleAddTask') || 'Add Field Task'}</span>
        </button>
      </div>

      {/* Stats Counter & Filter Pills */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#111927] border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
              {t('totalOperations') || 'Total Operations'}
            </span>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5">
              {totalTasks}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center text-lg">
            <i className="ri-list-check-2"></i>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#111927] border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase text-amber-600 dark:text-amber-400 tracking-wider">
              {t('pendingOperations') || 'Pending Operations'}
            </span>
            <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-0.5">
              {pendingTasks}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-300 flex items-center justify-center text-lg">
            <i className="ri-time-line"></i>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#111927] border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400 tracking-wider">
              {t('completedOperations') || 'Completed'}
            </span>
            <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
              {completedTasks}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-300 flex items-center justify-center text-lg">
            <i className="ri-checkbox-circle-line"></i>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          type="button"
          onClick={() => setFilter('ALL')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            filter === 'ALL'
              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          All ({totalTasks})
        </button>
        <button
          type="button"
          onClick={() => setFilter('PENDING')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            filter === 'PENDING'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Pending ({pendingTasks})
        </button>
        <button
          type="button"
          onClick={() => setFilter('COMPLETED')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            filter === 'COMPLETED'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Completed ({completedTasks})
        </button>
      </div>

      {/* Task List Container */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Loading field schedule and agronomic milestones...
          </p>
        </div>
      ) : error ? (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-300 text-xs flex items-center justify-between">
          <span>{error}</span>
          <button
            type="button"
            onClick={loadTasks}
            className="font-bold underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="py-16 text-center space-y-3 bg-white dark:bg-[#111927] rounded-3xl border border-slate-200/80 dark:border-slate-800 p-8">
          <div className="w-14 h-14 rounded-3xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center text-3xl mx-auto">
            <i className="ri-calendar-event-line"></i>
          </div>
          <h4 className="text-base font-bold text-slate-900 dark:text-white">
            No tasks found in this view
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            You have no operations matching the selected filter. Add a new task or switch filters.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => {
            const isHigh = task.priority === 'HIGH';
            const isMed = task.priority === 'MEDIUM';

            return (
              <div
                key={task._id}
                className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  task.completed
                    ? 'bg-slate-50/70 dark:bg-slate-800/30 border-slate-200/60 dark:border-slate-800 opacity-75'
                    : 'bg-white dark:bg-[#111927] border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <button
                    type="button"
                    onClick={() => handleToggleComplete(task)}
                    className={`mt-0.5 w-6 h-6 rounded-lg border flex items-center justify-center transition-colors shrink-0 ${
                      task.completed
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'border-slate-300 dark:border-slate-600 hover:border-emerald-500 bg-slate-50 dark:bg-slate-800 text-transparent'
                    }`}
                    title={task.completed ? 'Mark as incomplete' : 'Mark as complete'}
                  >
                    <i className="ri-check-line text-sm font-bold"></i>
                  </button>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-sm font-bold text-slate-900 dark:text-white ${
                          task.completed ? 'line-through text-slate-400 dark:text-slate-500' : ''
                        }`}
                      >
                        {task.title}
                      </span>

                      {task.cropName && (
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          {task.cropName}
                        </span>
                      )}

                      {task.category && (
                        <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {task.category}
                        </span>
                      )}

                      <span
                        className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                          isHigh
                            ? 'bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300'
                            : isMed
                            ? 'bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300'
                            : 'bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300'
                        }`}
                      >
                        {task.priority || 'NORMAL'}
                      </span>
                    </div>

                    {task.notes && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        {task.notes}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right controls: Due date & delete button */}
                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                  {task.dueDate && (
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <i className="ri-calendar-line text-xs"></i>
                      <span>
                        {new Date(task.dueDate).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => handleDeleteTask(task._id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    title="Delete task"
                  >
                    <i className="ri-delete-bin-line text-base"></i>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Agronomic Calendar Reference Section */}
      <div className="p-6 rounded-3xl bg-slate-50 dark:bg-[#111927] border border-slate-200/80 dark:border-slate-800">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
          <i className="ri-book-read-line text-emerald-600"></i>
          <span>ICAR Critical Growth Stages Reference (Rabi Cereals & Pulses)</span>
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-600 dark:text-slate-400">
          <div className="p-3 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
            <span className="font-bold text-slate-900 dark:text-white block">1. CRI Stage (Wheat)</span>
            <span className="text-[11px] text-slate-500 block mt-0.5">20–25 DAS (Days After Sowing)</span>
            <p className="text-[11px] mt-1 text-slate-600 dark:text-slate-300">
              Crown root initiation is the most moisture-critical stage. Delaying irrigation here causes irreversible yield reduction.
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
            <span className="font-bold text-slate-900 dark:text-white block">2. Branching & Flowering (Gram)</span>
            <span className="text-[11px] text-slate-500 block mt-0.5">40–45 DAS & 60–65 DAS</span>
            <p className="text-[11px] mt-1 text-slate-600 dark:text-slate-300">
              Avoid excess water at active flowering to prevent flower drop. One light irrigation at branching and one at pod formation is optimal.
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
            <span className="font-bold text-slate-900 dark:text-white block">3. Grain Filling & Dough (Wheat)</span>
            <span className="text-[11px] text-slate-500 block mt-0.5">85–95 DAS</span>
            <p className="text-[11px] mt-1 text-slate-600 dark:text-slate-300">
              Last irrigation should be gentle to avoid crop lodging from seasonal wind gusts (Open-Meteo wind forecast should be monitored).
            </p>
          </div>
        </div>
      </div>

      {/* Add Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#111927] rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 relative">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <i className="ri-close-line text-xl"></i>
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 flex items-center justify-center text-xl">
                <i className="ri-calendar-check-line"></i>
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                  Add Farm Operation Task
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Record irrigation schedule, fertilizer split, or pest inspection.
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apply First Urea Top-Dressing"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-2xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    Crop
                  </label>
                  <select
                    value={cropName}
                    onChange={(e) => setCropName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-2xl px-3 py-2 text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="Wheat">Wheat (गेहूं)</option>
                    <option value="Gram">Gram (चना)</option>
                    <option value="Soybean">Soybean (सोयाबीन)</option>
                    <option value="Mustard">Mustard (सरसों)</option>
                    <option value="General">General Farm / Plot</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-2xl px-3 py-2 text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="Irrigation">Irrigation (सिंचाई)</option>
                    <option value="Fertilizer">Fertilizer (उर्वरक)</option>
                    <option value="Pest Control">Pest Control (कीट नियंत्रण)</option>
                    <option value="Sowing">Sowing (बुवाई)</option>
                    <option value="Harvesting">Harvesting (कटाई)</option>
                    <option value="Field Prep">Field Prep (खेत तैयारी)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-2xl px-3 py-2 text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="HIGH">High (Urgent)</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-2xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Agronomic Notes & Quantity
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Apply 45 kg Urea per acre before secondary irrigation. Inspect for termite signs."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-2xl px-4 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                ></textarea>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-2xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs uppercase tracking-wider rounded-2xl shadow-md transition disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Add Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
