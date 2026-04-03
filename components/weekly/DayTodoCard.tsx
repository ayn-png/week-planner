'use client';

import { useState, useRef } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';
import type { DayTodo } from '@/types/planner';

interface DayTodoCardProps {
  dayLabel: string;
  bgColor: string;
  todos: DayTodo[];
  onChange: (todos: DayTodo[]) => void;
}

export function DayTodoCard({ dayLabel, bgColor, todos, onChange }: DayTodoCardProps) {
  const [newText, setNewText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  function addTodo() {
    const text = newText.trim();
    if (!text) return;
    onChange([...todos, { id: uuidv4(), text, completed: false }]);
    setNewText('');
    inputRef.current?.focus();
  }

  function toggleTodo(id: string) {
    onChange(todos.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
  }

  function deleteTodo(id: string) {
    onChange(todos.filter((t) => t.id !== id));
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') addTodo();
  }

  return (
    <div
      className="rounded-xl overflow-hidden flex flex-col"
      style={{ backgroundColor: bgColor + '33', border: `1px solid ${bgColor}44` }}
    >
      {/* Day header */}
      <div
        className="px-4 py-2.5"
        style={{ backgroundColor: bgColor + '88' }}
      >
        <h3 className="font-bold text-sm text-white" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>
          {dayLabel}
        </h3>
      </div>

      {/* Todo list */}
      <div className="flex-1 px-3 py-2 space-y-1.5 min-h-[80px]">
        <AnimatePresence initial={false}>
          {todos.map((todo) => (
            <motion.div
              key={todo.id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.15 }}
              className="flex items-start gap-2 group"
            >
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={() => toggleTodo(todo.id)}
                className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 cursor-pointer rounded-sm accent-white"
              />
              <span
                className={`text-xs flex-1 leading-snug break-words ${
                  todo.completed ? 'line-through opacity-40 text-muted-foreground' : 'text-foreground'
                }`}
              >
                {todo.text}
              </span>
              <button
                onClick={() => deleteTodo(todo.id)}
                className="opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity text-muted-foreground flex-shrink-0 mt-0.5"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        {todos.length === 0 && (
          <p className="text-[11px] text-muted-foreground opacity-50 italic">No tasks yet</p>
        )}
      </div>

      {/* Add task input */}
      <div className="px-3 pb-3">
        <div className="flex items-center gap-1.5">
          <input
            ref={inputRef}
            type="text"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add task…"
            className="flex-1 bg-transparent text-xs placeholder:text-muted-foreground/50 focus:outline-none border-b border-border/30 focus:border-border/60 py-0.5 transition-colors"
          />
          <button
            onClick={addTodo}
            disabled={!newText.trim()}
            className="flex items-center gap-0.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
