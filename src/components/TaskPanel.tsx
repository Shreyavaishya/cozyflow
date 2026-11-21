import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, CheckCircle2, Circle, ListTodo, Target } from 'lucide-react';
import { useStore } from '@/store/useStore';

const TaskPanel = () => {
  const { tasks, addTask, toggleTask, deleteTask, activeTaskId, setActiveTask } = useStore();
  const [input, setInput] = useState('');

  const handleAdd = () => {
    if (!input.trim()) return;
    addTask(input.trim());
    setInput('');
  };

  return (
    <div className="glass-panel rounded-2xl p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <ListTodo size={16} />
        Tasks
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          placeholder="Add a task..."
          className="flex-1 bg-muted/50 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 ring-primary/30 placeholder:text-muted-foreground"
        />
        <motion.button
          onClick={handleAdd}
          className="p-2 rounded-xl bg-primary text-primary-foreground"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Plus size={16} />
        </motion.button>
      </div>
      <div className="space-y-1 max-h-48 overflow-y-auto">
        <AnimatePresence>
          {tasks.map(task => (
            <motion.div
              key={task.id}
              layout
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="flex items-center gap-2 p-2 rounded-xl hover:bg-muted/50 group"
            >
              <button onClick={() => toggleTask(task.id)} className="text-muted-foreground hover:text-primary">
                {task.completed ? <CheckCircle2 size={16} className="text-primary" /> : <Circle size={16} />}
              </button>
              <span className={`flex-1 text-sm ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                {task.text}
                {task.pomodoros > 0 && <span className="ml-2 text-xs text-muted-foreground">🍅 {task.pomodoros}</span>}
              </span>
              {!task.completed && (
                <button
                  onClick={() => setActiveTask(task.id)}
                  title="Focus on this task"
                  className={`transition-opacity ${activeTaskId === task.id ? 'text-primary opacity-100' : 'opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-primary'}`}
                >
                  <Target size={14} />
                </button>
              )}
              <button
                onClick={() => deleteTask(task.id)}
                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
              >
                <Trash2 size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
        {tasks.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-4">No tasks yet</p>
        )}
      </div>
    </div>
  );
};

export default TaskPanel;
