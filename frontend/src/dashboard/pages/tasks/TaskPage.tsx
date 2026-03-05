import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Circle, Clock, AlertCircle, Trash2, X, ChevronDown, Pencil } from "lucide-react";
import { useState, useEffect } from "react";

const API_URL = "http://localhost:8000";

interface Task {
    id: number;
    id_user: number;
    name: string;
    priority: "low" | "medium" | "high";
    status: string;
    due_date: string;
    created_at: string;
    description?: string;
}

type SortBy = "date" | "priority";

const PRIORITY_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 };

export const TaskPage = () => {
    // Server state — last saved version
    const [serverTasks, setServerTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);

    // Pending status changes: taskId -> new status (not yet saved)
    const [localChanges, setLocalChanges] = useState<Map<number, string>>(new Map());
    const [saving, setSaving] = useState(false);

    const [sortBy, setSortBy] = useState<SortBy>("date");
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form state
    const [newName, setNewName] = useState("");
    const [newPriority, setNewPriority] = useState<"low" | "medium" | "high">("medium");
    const [newDueDate, setNewDueDate] = useState("");
    const [newDescription, setNewDescription] = useState("");
    const [creating, setCreating] = useState(false);

    // Edit modal state
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [editName, setEditName] = useState("");
    const [editDescription, setEditDescription] = useState("");
    const [editPriority, setEditPriority] = useState<"low" | "medium" | "high">("medium");
    const [editDueDate, setEditDueDate] = useState("");
    const [editDueTime, setEditDueTime] = useState("");   // "" = sin hora límite
    const [updating, setUpdating] = useState(false);

    const [newDueTime, setNewDueTime] = useState("");     // "" = sin hora límite

    // Display tasks = server tasks with pending changes applied
    const tasks: Task[] = serverTasks.map(t =>
        localChanges.has(t.id) ? { ...t, status: localChanges.get(t.id)! } : t
    );

    const hasChanges = localChanges.size > 0;

    // ── Auth helper ────────────────────────────────────────────────
    const getAuthHeaders = () => ({
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
    });

    // ── Fetch ──────────────────────────────────────────────────────
    const fetchTasks = async () => {
        try {
            const res = await fetch(`${API_URL}/tasks`, { headers: getAuthHeaders() });
            if (res.ok) setServerTasks(await res.json());
        } catch (err) {
            console.error("Error fetching tasks:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchTasks(); }, []);

    // ── Toggle status (local only, not saved yet) ──────────────────
    const handleToggleStatus = (task: Task) => {
        const current = localChanges.get(task.id) ?? task.status;
        const next = current === "completed" ? "pending" : "completed";

        setLocalChanges(prev => {
            const map = new Map(prev);
            // If reverting to original server state, drop from pending
            if (task.status === next) {
                map.delete(task.id);
            } else {
                map.set(task.id, next);
            }
            return map;
        });
    };

    // ── Save all pending changes ───────────────────────────────────
    const handleConfirmChanges = async () => {
        setSaving(true);
        try {
            await Promise.all(
                Array.from(localChanges.entries()).map(([id, status]) =>
                    fetch(`${API_URL}/tasks/${id}`, {
                        method: "PUT",
                        headers: getAuthHeaders(),
                        body: JSON.stringify({ status }),
                    })
                )
            );
            setServerTasks(tasks);  // commit display state as new server state
            setLocalChanges(new Map());
        } catch (err) {
            console.error("Error saving changes:", err);
        } finally {
            setSaving(false);
        }
    };

    const handleDiscardChanges = () => setLocalChanges(new Map());

    // ── Create task (immediate) ────────────────────────────────────
    const handleCreateTask = async () => {
        if (!newName.trim() || !newDueDate) return;
        setCreating(true);
        try {
            const res = await fetch(`${API_URL}/tasks`, {
                method: "POST",
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    name: newName.trim(),
                    priority: newPriority,
                    status: "pending",
                    due_date: newDueTime
                        ? new Date(`${newDueDate}T${newDueTime}:00`).toISOString()
                        : new Date(newDueDate).toISOString(),
                    description: newDescription.trim() || null,
                }),
            });
            if (res.ok) {
                const created: Task = await res.json();
                setServerTasks(prev => [...prev, created]);
                setIsModalOpen(false);
                setNewName("");
                setNewDueDate("");
                setNewDueTime("");
                setNewPriority("medium");
                setNewDescription("");
            }
        } catch (err) {
            console.error("Error creating task:", err);
        } finally {
            setCreating(false);
        }
    };

    // ── Delete task (immediate) ────────────────────────────────────
    const handleDeleteTask = async (taskId: number) => {
        try {
            const res = await fetch(`${API_URL}/tasks/${taskId}`, {
                method: "DELETE",
                headers: getAuthHeaders(),
            });
            if (res.status === 204) {
                setServerTasks(prev => prev.filter(t => t.id !== taskId));
                setLocalChanges(prev => {
                    const map = new Map(prev);
                    map.delete(taskId);
                    return map;
                });
            }
        } catch (err) {
            console.error("Error deleting task:", err);
        }
    };

    // ── Open edit modal pre-filled ────────────────────────────────
    const handleOpenEdit = (task: Task) => {
        setEditingTask(task);
        setEditName(task.name);
        setEditDescription(task.description ?? "");
        setEditPriority(task.priority);
        setEditDueDate(parseDueDate(task.due_date).toISOString().slice(0, 10));
        const due = parseDueDate(task.due_date);
        const dateOnly = due.getUTCHours() === 0 && due.getUTCMinutes() === 0;
        setEditDueTime(dateOnly ? "" : `${String(due.getHours()).padStart(2,"0")}:${String(due.getMinutes()).padStart(2,"0")}`);
    };

    // ── Save edited task (immediate) ──────────────────────────────
    const handleSaveEdit = async () => {
        if (!editingTask || !editName.trim() || !editDueDate) return;
        setUpdating(true);
        try {
            const res = await fetch(`${API_URL}/tasks/${editingTask.id}`, {
                method: "PUT",
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    name: editName.trim(),
                    description: editDescription.trim() || null,
                    priority: editPriority,
                    due_date: editDueTime
                        ? new Date(`${editDueDate}T${editDueTime}:00`).toISOString()
                        : new Date(editDueDate).toISOString(),
                }),
            });
            if (res.ok) {
                const updated: Task = await res.json();
                setServerTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
                setLocalChanges(prev => { const m = new Map(prev); m.delete(updated.id); return m; });
                setEditingTask(null);
            }
        } catch (err) {
            console.error("Error updating task:", err);
        } finally {
            setUpdating(false);
        }
    };

    // ── Helpers ────────────────────────────────────────────────────
    // FastAPI devuelve UTC sin "Z" → JS lo trataría como hora local sin esta corrección
    const parseDueDate = (dateStr: string) =>
        new Date(dateStr.endsWith("Z") || dateStr.includes("+") ? dateStr : dateStr + "Z");

    const toLocalDateStr = (d: Date) =>
        `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;

    // Tarea guardada sin hora = medianoche UTC (sentinel "solo fecha")
    const isDateOnly = (task: Task) => {
        const d = parseDueDate(task.due_date);
        return d.getUTCHours() === 0 && d.getUTCMinutes() === 0;
    };

    // Rojo: fecha anterior a hoy, o tiene hora y ya pasó
    const isOverdue = (task: Task) => {
        if (task.status === "completed") return false;
        const due = parseDueDate(task.due_date);
        if (isDateOnly(task)) return toLocalDateStr(due) < toLocalDateStr(new Date());
        return due < new Date();
    };

    // Amarillo: vence hoy (y la hora aún no ha pasado si tiene hora)
    const isUrgent = (task: Task) => {
        if (task.status === "completed") return false;
        const due = parseDueDate(task.due_date);
        const now = new Date();
        if (isDateOnly(task)) return toLocalDateStr(due) === toLocalDateStr(now);
        const sameDay = due.getDate() === now.getDate() &&
            due.getMonth() === now.getMonth() &&
            due.getFullYear() === now.getFullYear();
        return sameDay && due >= now;
    };

    const sortFn = (a: Task, b: Task) =>
        sortBy === "priority"
            ? (PRIORITY_ORDER[a.priority] ?? 99) - (PRIORITY_ORDER[b.priority] ?? 99)
            : parseDueDate(a.due_date).getTime() - parseDueDate(b.due_date).getTime();

    const pendingTasks = tasks.filter(t => t.status !== "completed").sort(sortFn);
    const completedTasks = tasks.filter(t => t.status === "completed").sort(sortFn);

    const getPriorityColor = (p: string) =>
        p === "high" ? "text-red-500" : p === "medium" ? "text-yellow-500" : "text-green-500";

    const getPriorityIcon = (p: string) =>
        p === "high" ? <AlertCircle className="h-4 w-4" /> :
        p === "medium" ? <Clock className="h-4 w-4" /> :
        <Circle className="h-4 w-4" />;

    const today = new Date();
    const todayPending = pendingTasks.filter(t => {
        const d = parseDueDate(t.due_date);
        return d.getFullYear() === today.getFullYear() &&
            d.getMonth() === today.getMonth() &&
            d.getDate() === today.getDate();
    });

    // ── Task row component ─────────────────────────────────────────
    const TaskRow = ({ task }: { task: Task }) => {
        const overdue = isOverdue(task);
        const urgent  = isUrgent(task);
        const completed = task.status === "completed";
        const isPending = localChanges.has(task.id);
        const withTime  = !isDateOnly(task);

        return (
            <div className={`flex items-start gap-4 p-4 rounded-lg border transition-colors
                ${completed
                    ? "bg-muted/50 opacity-60"
                    : overdue
                        ? "border-red-500/50 bg-red-500/5 hover:bg-red-500/10"
                        : urgent
                            ? "border-yellow-500/50 bg-yellow-500/5 hover:bg-yellow-500/10"
                            : "bg-card hover:bg-muted/50"
                }
                ${isPending ? "ring-2 ring-blue-500/40" : ""}`}
            >
                <Checkbox
                    checked={completed}
                    onCheckedChange={() => handleToggleStatus(task)}
                    className="h-5 w-5 mt-0.5 shrink-0"
                />
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <p className={`font-medium ${completed ? "line-through text-muted-foreground" : overdue ? "text-red-600" : urgent ? "text-yellow-600" : ""}`}>
                            {task.name}
                        </p>
                        {isPending && (
                            <span className="text-[10px] font-medium bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full">
                                sin guardar
                            </span>
                        )}
                    </div>
                    {task.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{task.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1">
                        <span className={`text-xs flex items-center gap-1 ${getPriorityColor(task.priority)}`}>
                            {getPriorityIcon(task.priority)}
                            {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                        </span>
                        <span className={`text-xs font-medium ${overdue ? "text-red-500" : urgent ? "text-yellow-500" : "text-muted-foreground font-normal"}`}>
                            {overdue ? "Vencida · " : urgent ? "Urgente · " : ""}
                            {parseDueDate(task.due_date).toLocaleDateString("es-ES")}
                            {withTime && ` · ${parseDueDate(task.due_date).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}`}
                        </span>
                    </div>
                </div>
                <button
                    onClick={() => handleOpenEdit(task)}
                    className="text-muted-foreground hover:text-blue-500 transition-colors p-1 rounded shrink-0"
                >
                    <Pencil className="h-4 w-4" />
                </button>
                <button
                    onClick={() => handleDeleteTask(task.id)}
                    className="text-muted-foreground hover:text-red-500 transition-colors p-1 rounded shrink-0"
                >
                    <Trash2 className="h-4 w-4" />
                </button>
            </div>
        );
    };

    // ── Render ─────────────────────────────────────────────────────
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Tareas</h2>
                    <p className="text-muted-foreground">Gestiona tus tareas y mantente organizado</p>
                </div>
                <Button onClick={() => setIsModalOpen(true)} className="gap-2 bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4" />
                    Nueva Tarea
                </Button>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader><CardTitle className="text-sm font-medium">Total de Tareas</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold">{tasks.length}</div></CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle className="text-sm font-medium">Completadas</CardTitle></CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{completedTasks.length}</div>
                        <p className="text-xs text-muted-foreground">
                            {tasks.length > 0
                                ? `${Math.round((completedTasks.length / tasks.length) * 100)}% de todas las tareas`
                                : "0% de todas las tareas"}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle className="text-sm font-medium">Pendientes Hoy</CardTitle></CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{todayPending.length}</div>
                        <p className="text-xs text-muted-foreground">
                            {todayPending.filter(t => t.priority === "high").length} de alta prioridad
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Task List */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Lista de Tareas</CardTitle>
                            <CardDescription>Organiza y prioriza tu trabajo diario</CardDescription>
                        </div>
                        <div className="relative">
                            <select
                                value={sortBy}
                                onChange={e => setSortBy(e.target.value as SortBy)}
                                className="appearance-none pl-3 pr-8 py-1.5 text-sm rounded-md border border-border bg-background text-foreground cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="date">Ordenar por fecha</option>
                                <option value="priority">Ordenar por prioridad</option>
                            </select>
                            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <p className="text-sm text-muted-foreground">Cargando tareas...</p>
                    ) : tasks.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No tienes tareas todavía. ¡Crea una!</p>
                    ) : (
                        <div className="space-y-3">
                            {pendingTasks.length > 0 && (
                                <>
                                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
                                        Pendientes · {pendingTasks.length}
                                    </p>
                                    {pendingTasks.map(t => <TaskRow key={t.id} task={t} />)}
                                </>
                            )}

                            {pendingTasks.length > 0 && completedTasks.length > 0 && (
                                <div className="border-t border-dashed pt-3" />
                            )}

                            {completedTasks.length > 0 && (
                                <>
                                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
                                        Completadas · {completedTasks.length}
                                    </p>
                                    {completedTasks.map(t => <TaskRow key={t.id} task={t} />)}
                                </>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Floating save bar */}
            {hasChanges && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 bg-background border border-border shadow-xl rounded-xl px-5 py-3">
                    <span className="text-sm text-muted-foreground">
                        {localChanges.size} cambio{localChanges.size > 1 ? "s" : ""} sin guardar
                    </span>
                    <Button variant="outline" size="sm" onClick={handleDiscardChanges}>
                        Descartar
                    </Button>
                    <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700"
                        onClick={handleConfirmChanges}
                        disabled={saving}
                    >
                        {saving ? "Guardando..." : "Guardar cambios"}
                    </Button>
                </div>
            )}

            {/* Edit Task Modal */}
            {editingTask && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
                    onClick={() => setEditingTask(null)}
                >
                    <div
                        className="bg-background rounded-xl shadow-xl w-full max-w-md mx-4 p-6 space-y-5"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold">Editar Tarea</h2>
                            <button
                                onClick={() => setEditingTask(null)}
                                className="text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="edit-name">Nombre <span className="text-red-500">*</span></Label>
                            <Input
                                id="edit-name"
                                value={editName}
                                onChange={e => setEditName(e.target.value)}
                                autoFocus
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="edit-desc">
                                Descripción <span className="text-muted-foreground text-xs">(opcional)</span>
                            </Label>
                            <textarea
                                id="edit-desc"
                                value={editDescription}
                                onChange={e => setEditDescription(e.target.value)}
                                rows={3}
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label>Prioridad</Label>
                            <div className="flex gap-2">
                                {(["low", "medium", "high"] as const).map(p => (
                                    <button
                                        key={p}
                                        onClick={() => setEditPriority(p)}
                                        className={`flex-1 py-2 rounded-md text-sm font-medium border transition-colors ${
                                            editPriority === p
                                                ? p === "high"
                                                    ? "bg-red-500 text-white border-red-500"
                                                    : p === "medium"
                                                        ? "bg-yellow-500 text-white border-yellow-500"
                                                        : "bg-green-500 text-white border-green-500"
                                                : "bg-card text-muted-foreground border-border hover:bg-muted"
                                        }`}
                                    >
                                        {p === "low" ? "Baja" : p === "medium" ? "Media" : "Alta"}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="edit-due">Fecha límite <span className="text-red-500">*</span></Label>
                            <Input
                                id="edit-due"
                                type="date"
                                value={editDueDate}
                                onChange={e => setEditDueDate(e.target.value)}
                            />
                            {editDueTime === "" ? (
                                <button
                                    type="button"
                                    onClick={() => setEditDueTime("12:00")}
                                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mt-1"
                                >
                                    <Clock className="h-3.5 w-3.5" />
                                    + Hora límite
                                </button>
                            ) : (
                                <div className="flex items-center gap-2 mt-1">
                                    <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                    <input
                                        type="time"
                                        value={editDueTime}
                                        onChange={e => setEditDueTime(e.target.value)}
                                        className="rounded-md border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <button type="button" onClick={() => setEditDueTime("")} className="text-muted-foreground hover:text-foreground">
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3 pt-1">
                            <Button variant="outline" className="flex-1" onClick={() => setEditingTask(null)}>
                                Cancelar
                            </Button>
                            <Button
                                className="flex-1 bg-blue-600 hover:bg-blue-700"
                                onClick={handleSaveEdit}
                                disabled={!editName.trim() || !editDueDate || updating}
                            >
                                {updating ? "Guardando..." : "Guardar"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Task Modal */}
            {isModalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
                    onClick={() => setIsModalOpen(false)}
                >
                    <div
                        className="bg-background rounded-xl shadow-xl w-full max-w-md mx-4 p-6 space-y-5"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold">Nueva Tarea</h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="task-name">Nombre <span className="text-red-500">*</span></Label>
                            <Input
                                id="task-name"
                                placeholder="¿Qué hay que hacer?"
                                value={newName}
                                onChange={e => setNewName(e.target.value)}
                                onKeyDown={e => e.key === "Enter" && handleCreateTask()}
                                autoFocus
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="task-desc">
                                Descripción <span className="text-muted-foreground text-xs">(opcional)</span>
                            </Label>
                            <textarea
                                id="task-desc"
                                placeholder="Añade más detalles..."
                                value={newDescription}
                                onChange={e => setNewDescription(e.target.value)}
                                rows={3}
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label>Prioridad</Label>
                            <div className="flex gap-2">
                                {(["low", "medium", "high"] as const).map(p => (
                                    <button
                                        key={p}
                                        onClick={() => setNewPriority(p)}
                                        className={`flex-1 py-2 rounded-md text-sm font-medium border transition-colors ${
                                            newPriority === p
                                                ? p === "high"
                                                    ? "bg-red-500 text-white border-red-500"
                                                    : p === "medium"
                                                        ? "bg-yellow-500 text-white border-yellow-500"
                                                        : "bg-green-500 text-white border-green-500"
                                                : "bg-card text-muted-foreground border-border hover:bg-muted"
                                        }`}
                                    >
                                        {p === "low" ? "Baja" : p === "medium" ? "Media" : "Alta"}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="task-due">Fecha límite <span className="text-red-500">*</span></Label>
                            <Input
                                id="task-due"
                                type="date"
                                value={newDueDate}
                                onChange={e => setNewDueDate(e.target.value)}
                            />
                            {newDueTime === "" ? (
                                <button
                                    type="button"
                                    onClick={() => setNewDueTime("12:00")}
                                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mt-1"
                                >
                                    <Clock className="h-3.5 w-3.5" />
                                    + Hora límite
                                </button>
                            ) : (
                                <div className="flex items-center gap-2 mt-1">
                                    <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                    <input
                                        type="time"
                                        value={newDueTime}
                                        onChange={e => setNewDueTime(e.target.value)}
                                        className="rounded-md border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <button type="button" onClick={() => setNewDueTime("")} className="text-muted-foreground hover:text-foreground">
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3 pt-1">
                            <Button variant="outline" className="flex-1" onClick={() => setIsModalOpen(false)}>
                                Cancelar
                            </Button>
                            <Button
                                className="flex-1 bg-blue-600 hover:bg-blue-700"
                                onClick={handleCreateTask}
                                disabled={!newName.trim() || !newDueDate || creating}
                            >
                                {creating ? "Creando..." : "Crear Tarea"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
