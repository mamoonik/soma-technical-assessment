"use client"
import { Todo } from '@prisma/client';
import { useState, useEffect } from 'react';
import DependencyGraphModal from "./components/DependencyGraphModal";

export default function Home() {
  const [newTodo, setNewTodo] = useState('');
  const [dueDate, setDueDate] = useState(''); //added line t so dueDate is  connected to React state, so  I can read its value + send it to the API.
  // const [todos, setTodos] = useState([]);
  const [todos, setTodos] = useState<Todo[]>([]); //Prisma’s Todo type now includes dueDate (since we added it), so we should type our state properly.

  const [edges, setEdges] = useState<{ from: number; to: number }[]>([]);
  const [schedule, setSchedule] = useState<any>(null);

  const [dependencyIds, setDependencyIds] = useState<number[]>([]);
  const [durationMinutes, setDurationMinutes] = useState(60);

  const [isGraphOpen, setIsGraphOpen] = useState(false);
  const [focusTodoId, setFocusTodoId] = useState<number | null>(null);
  const [selectedTodoId, setSelectedTodoId] = useState<number | null>(null);


  
  useEffect(() => {
    fetchTodos();
  }, []);

  const openGraphFor = (todoId: number) => {
    setFocusTodoId(todoId);
    setIsGraphOpen(true);
  };


  // const fetchTodos = async () => {
  //   try {
  //     const res = await fetch("/api/todos");
  //     const data = await res.json();
  
  //     setTodos(Array.isArray(data.todos) ? data.todos : []);
  //     setEdges(Array.isArray(data.edges) ? data.edges : []);
  //     setSchedule(data.schedule ?? null);
  //   } catch (error) {
  //     console.error("Failed to fetch todos:", error);
  //     setTodos([]);     // keep UI safe
  //     setEdges([]);
  //     setSchedule(null);
  //   }
  // };
  const fetchTodos = async () => {
    try {
      const res = await fetch("/api/todos");
      const data = await res.json();
  
      const incomingTodos = Array.isArray(data.todos) ? data.todos : [];
      setTodos(incomingTodos);
  
      setEdges(Array.isArray(data.edges) ? data.edges : []);
      setSchedule(data.schedule ?? null);
  
      if (incomingTodos.length > 0) {
        setSelectedTodoId((prev) => prev ?? incomingTodos[0].id);
      }
    } catch (error) {
      console.error("Failed to fetch todos:", error);
      setTodos([]);
      setEdges([]);
      setSchedule(null);
    }
  };
  // const handleAddTodo = async () => {
  //   if (!newTodo.trim()) return;
  //   try {
  //     await fetch('/api/todos', {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       // body: JSON.stringify({ title: newTodo }), // API expects something new Date(...) can parse well. The safest is to convert to an ISO string before sending
  //       body: JSON.stringify({
  //         title: newTodo,
  //         dueDate: dueDate ? new Date(dueDate).toISOString() : null,
  //         dependencyIds,
  //         durationMinutes
  //       }),
  //     });
  //     setNewTodo('');
  //     setDueDate(''); //added 
  //     fetchTodos();
  //   } catch (error) {
  //     console.error('Failed to add todo:', error);
  //   }
  // };
  const handleAddTodo = async () => {
    if (!newTodo.trim()) return;
  
    await fetch("/api/todos", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: newTodo,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        dependencyIds,
        durationMinutes
      }),
    });
  
    // Clear form fields
    setNewTodo("");
    setDueDate("");
  
    // ⭐ Reset dependency selections
    setDependencyIds([]);
  
    // ⭐ Reset duration to default
    setDurationMinutes(60);
  
    fetchTodos();
  };

  // const handleDeleteTodo = async (id:any) => {
    const handleDeleteTodo = async (id: number) => {
    try {
      await fetch(`/api/todos/${id}`, {
        method: 'DELETE',
      });
      fetchTodos();
    } catch (error) {
      console.error('Failed to delete todo:', error);
    }
  };
  const selectedTodo = todos.find((t) => t.id === selectedTodoId) ?? null;

// Edges are {from: todoId, to: dependsOnId}
const selectedDeps = selectedTodo
  ? edges
      .filter((e) => e.from === selectedTodo.id)
      .map((e) => {
        const depTodo = todos.find((t) => t.id === e.to);
        return depTodo ? { id: depTodo.id, title: depTodo.title } : null;
      })
      .filter(Boolean) as { id: number; title: string }[]
  : [];
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-500 to-red-500 flex flex-col items-center p-4">
      {/* <div className="w-full max-w-md"> */}
      {/* <div className="w-full max-w-xl"> */}
      <div className="w-full max-w-6xl">
        <h1 className="text-4xl font-bold text-center text-white mb-8">Things To Do App</h1>
        <div className="mb-6">
          <div className="flex items-center gap-3">
            {/* Title */}
            <div className="flex-1">
              <input
                type="text"
                className="w-full h-12 px-4 rounded-2xl bg-white/95 text-gray-800 placeholder:text-gray-400
                          shadow-sm border border-white/40
                          focus:outline-none focus:ring-2 focus:ring-white/70 focus:border-white"
                placeholder="Add a new todo"
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
              />
            </div>

            {/* Due date */}
            <div className="w-[210px]">
              <input
                type="datetime-local"
                className="w-full h-12 px-4 rounded-2xl bg-white/95 text-gray-800
                          shadow-sm border border-white/40
                          focus:outline-none focus:ring-2 focus:ring-white/70 focus:border-white"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            {/* Add button */}
            <button
              onClick={handleAddTodo}
              className="h-12 px-5 rounded-2xl bg-white text-orange-600 font-semibold
                        shadow-sm border border-white/40
                        hover:bg-white/90 active:scale-[0.99]
                        transition"
            >
              Add
            </button>
          </div>

          {/* Optional helper text */}
          <div className="mt-2 text-xs text-white/80">
            Tip: add a due date only when needed.
          </div>
        </div>
        
        {/* Part 3 controls */}
        <div className="mt-3 space-y-3">
          {/* Duration */}
          <div>
            <label className="block text-white text-sm mb-1">Duration (minutes)</label>
            <input
              type="number"
              min={1}
              className="w-full p-3 rounded-lg text-gray-700"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(Number(e.target.value))}
            />
          </div>

          {/* Dependencies */}
          <div>
            <label className="block text-white text-sm mb-1">Depends on (select one or more)</label>
            <select
              multiple
              className="w-full p-3 rounded-lg text-gray-700 h-40"
              value={dependencyIds.map(String)}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions).map((o) => Number(o.value));
                setDependencyIds(selected);
              }}
            >
              {todos.map((t) => (
                <option key={t.id} value={t.id}>
                  #{t.id} — {t.title}
                </option>
              ))}
            </select>

            <div className="text-white text-xs mt-1 opacity-80">
              Tip: hold ⌘ (Mac) / Ctrl (Windows) to multi-select.
            </div>
          </div>
        </div>

        {/* <div className="grid grid-cols-1 lg:grid-cols-[520px_1fr] gap-6 mt-6"> */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(420px,520px)_1fr] gap-6 mt-6">
          {/* LEFT: cards column */}
          {/* <div> */}
          <div className="max-h-[70vh] overflow-y-auto pr-2 scroll-smooth">
            <ul>
              {todos.map((todo: Todo) => {
                const isSelected = todo.id === selectedTodoId;

                return (
                  <li
                    key={todo.id}
                    className={
                      "flex justify-between items-start bg-white bg-opacity-90 p-4 mb-4 rounded-lg shadow-lg border transition " +
                      (isSelected
                        ? "border-blue-500 ring-2 ring-blue-200"
                        : "border-transparent hover:border-gray-200")
                    }
                    onClick={() => setSelectedTodoId(todo.id)}
                    style={{ cursor: "pointer" }}
                  >
                    <div className="flex flex-col gap-2">
                      <span className="text-gray-800 font-semibold">{todo.title}</span>

                      {todo.dueDate ? (
                        <span
                          className={
                            new Date(todo.dueDate).getTime() < Date.now()
                              ? "text-red-600 text-sm"
                              : "text-gray-500 text-sm"
                          }
                        >
                          Due: {new Date(todo.dueDate).toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-sm">No due date</span>
                      )}

                      {/* Image preview */}
                      {todo.imageUrl ? (
                        <img
                          src={todo.imageUrl}
                          alt={`Preview for ${todo.title}`}
                          className="w-56 h-32 object-cover rounded-md border border-gray-200"
                        />
                      ) : (
                        <div className="text-gray-400 text-sm">No image</div>
                      )}

                      {schedule?.scheduleById?.[todo.id] && (
                        <div className="text-xs text-gray-500 mt-1">
                          <div>
                            Earliest start:{" "}
                            {new Date(schedule.scheduleById[todo.id].earliestStart).toLocaleString()}
                          </div>

                          <div>
                            Earliest finish:{" "}
                            {new Date(schedule.scheduleById[todo.id].earliestFinish).toLocaleString()}
                          </div>

                          {schedule.scheduleById[todo.id].isCritical && (
                            <div className="text-red-600 font-semibold">Critical Path</div>
                          )}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTodo(todo.id);
                      }}
                      className="text-red-500 hover:text-red-700 transition duration-300 p-1"
                      title="Delete"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* RIGHT: dependency panel */}
          {/* <div className="bg-white/90 rounded-2xl shadow-lg p-5 h-fit lg:sticky lg:top-6"> */}
          <div className="bg-white/80 backdrop-blur rounded-2xl shadow-lg p-5 h-fit lg:sticky lg:top-6">
            {!selectedTodo ? (
              <div className="text-gray-600">Select a todo to see its dependencies.</div>
            ) : (
              <>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-lg font-bold text-gray-900">{selectedTodo.title}</div>
                    <div className="text-sm text-gray-500">#{selectedTodo.id}</div>
                  </div>

                  <button
                    onClick={() => openGraphFor(selectedTodo.id)}
                    className="bg-white border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 transition"
                  >
                    Visualize DAG
                  </button>
                </div>

                <div className="mt-4">
                  <div className="font-semibold text-gray-900 mb-2">Dependencies</div>

                  {selectedDeps.length === 0 ? (
                    <div className="text-sm text-gray-500">No dependencies.</div>
                  ) : (
                    <ul className="space-y-2">
                      {selectedDeps.map((d) => (
                        <li key={d.id} className="text-sm text-gray-700 flex items-center gap-2">
                          <span className="inline-block w-2 h-2 rounded-full bg-gray-400" />
                          <span>
                            Depends on <span className="font-medium">#{d.id}</span> — {d.title}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="mt-5 pt-4 border-t text-xs text-gray-500">
                  Tip: click a card on the left to switch the context here.
                </div>
              </>
            )}
          </div>
        </div>






      </div>
      <DependencyGraphModal
        isOpen={isGraphOpen}
        onClose={() => setIsGraphOpen(false)}
        todos={todos.map((t) => ({ id: t.id, title: t.title }))}
        apiEdges={edges}
        schedule={schedule}
        focusTodoId={focusTodoId}
      />
    </div>
  );
}
