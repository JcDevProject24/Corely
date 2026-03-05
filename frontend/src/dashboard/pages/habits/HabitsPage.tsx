import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Flame, CheckCircle2, Target, Pencil, Trash2, Loader2 } from "lucide-react";

interface Habit {
  id: number;
  id_user: number;
  name: string;
  goal: number;
  streak: number;
  last_completed_date: string | null;
  color: string | null;
  created_at: string;
}

const COLORS = [
  { label: "Naranja", value: "orange", hex: "#f97316", bg: "bg-orange-500", border: "border-l-orange-500" },
  { label: "Verde",   value: "green",  hex: "#22c55e", bg: "bg-green-500",  border: "border-l-green-500"  },
  { label: "Azul",    value: "blue",   hex: "#3b82f6", bg: "bg-blue-500",   border: "border-l-blue-500"   },
  { label: "Morado",  value: "purple", hex: "#a855f7", bg: "bg-purple-500", border: "border-l-purple-500" },
  { label: "Rosa",    value: "pink",   hex: "#ec4899", bg: "bg-pink-500",   border: "border-l-pink-500"   },
  { label: "Rojo",    value: "red",    hex: "#ef4444", bg: "bg-red-500",    border: "border-l-red-500"    },
];

const DEFAULT_BLUE = "#3b82f6";

const getColorEntry = (color: string | null) => COLORS.find((c) => c.value === color);
const getColorBorder = (color: string | null) => getColorEntry(color)?.border ?? "border-l-muted";
const getProgressColor = (color: string | null) => getColorEntry(color)?.hex ?? DEFAULT_BLUE;

// ─── Fechas ──────────────────────────────────────────────────────────────────

const toLocalDateString = (d: Date) => d.toISOString().split("T")[0];
const getTodayString      = () => toLocalDateString(new Date());
const getYesterdayString  = () => { const d = new Date(); d.setDate(d.getDate() - 1); return toLocalDateString(d); };
const getTwoDaysAgoString = () => { const d = new Date(); d.setDate(d.getDate() - 2); return toLocalDateString(d); };

const getTimeUntilMidnight = () => {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const diff = midnight.getTime() - now.getTime();
  const h = Math.floor(diff / (1000 * 60 * 60));
  const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

const isCompletedToday = (last_completed_date: string | null) =>
  last_completed_date === getTodayString();

type RiskStatus = "safe" | "grace_warning" | "grace_used" | "lost";

const getHabitRisk = (habit: Habit): RiskStatus => {
  if (isCompletedToday(habit.last_completed_date)) return "safe";
  if (habit.streak === 0) return "safe"; // Sin racha que perder
  if (habit.last_completed_date === getYesterdayString())  return "grace_warning"; // Debe completar hoy
  if (habit.last_completed_date === getTwoDaysAgoString()) return "grace_used";    // Usando día de cortesía
  return "lost";
};

const getProgress = (streak: number, goal: number) =>
  Math.min(100, Math.round((streak / goal) * 100));

const getAuthHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("access_token")}`,
});

type FilterType = "all" | "pending" | "completed";

export const HabitsPage = () => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");

  // Racha global
  const [globalStreak, setGlobalStreak] = useState(0);

  // Modal crear
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createGoal, setCreateGoal] = useState("30");
  const [createColor, setCreateColor] = useState<string | null>(null);
  const [createLoading, setCreateLoading] = useState(false);

  // Modal editar
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [editName, setEditName] = useState("");
  const [editGoal, setEditGoal] = useState("30");
  const [editColor, setEditColor] = useState<string | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Toggles en curso
  const [togglingIds, setTogglingIds] = useState<Set<number>>(new Set());

  // ─── API ────────────────────────────────────────────────────────────────────

  const fetchStats = async () => {
    try {
      const res = await fetch("http://localhost:8000/habits/stats", { headers: getAuthHeaders() });
      if (!res.ok) return;
      const data = await res.json();
      setGlobalStreak(data.global_streak);
    } catch {
      console.error("Error al cargar estadísticas");
    }
  };

  const fetchHabits = async () => {
    setLoading(true);
    try {
      const [habitsRes, statsRes] = await Promise.all([
        fetch("http://localhost:8000/habits",       { headers: getAuthHeaders() }),
        fetch("http://localhost:8000/habits/stats", { headers: getAuthHeaders() }),
      ]);
      if (habitsRes.ok) setHabits(await habitsRes.json());
      if (statsRes.ok) {
        const stats = await statsRes.json();
        setGlobalStreak(stats.global_streak);
      }
    } catch {
      console.error("Error al cargar hábitos");
    } finally {
      setLoading(false);
    }
  };

  const createHabit = async () => {
    if (!createName.trim() || !createGoal) return;
    setCreateLoading(true);
    try {
      const res = await fetch("http://localhost:8000/habits", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ name: createName.trim(), goal: parseInt(createGoal), color: createColor }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.detail ?? "Error al crear hábito");
        return;
      }
      const newHabit = await res.json();
      setHabits((prev) => [...prev, newHabit]);
      closeCreateModal();
    } catch {
      console.error("Error al crear hábito");
    } finally {
      setCreateLoading(false);
    }
  };

  const updateHabit = async () => {
    if (!editingHabit || !editName.trim() || !editGoal) return;
    setEditLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/habits/${editingHabit.id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ name: editName.trim(), goal: parseInt(editGoal), color: editColor }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.detail ?? "Error al editar hábito");
        return;
      }
      const updated = await res.json();
      setHabits((prev) => prev.map((h) => (h.id === updated.id ? updated : h)));
      closeEditModal();
    } catch {
      console.error("Error al editar hábito");
    } finally {
      setEditLoading(false);
    }
  };

  const deleteHabit = async () => {
    if (!editingHabit) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/habits/${editingHabit.id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error();
      setHabits((prev) => prev.filter((h) => h.id !== editingHabit.id));
      closeEditModal();
    } catch {
      console.error("Error al eliminar hábito");
    } finally {
      setDeleteLoading(false);
    }
  };

  const toggleHabit = async (id: number) => {
    setTogglingIds((prev) => new Set(prev).add(id));
    try {
      const res = await fetch(`http://localhost:8000/habits/${id}/toggle`, {
        method: "POST",
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setHabits((prev) => prev.map((h) => (h.id === updated.id ? updated : h)));
      fetchStats(); // Actualizar racha global
    } catch {
      console.error("Error al marcar hábito");
    } finally {
      setTogglingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  // ─── Modales ────────────────────────────────────────────────────────────────

  const openCreateModal = () => {
    setCreateName(""); setCreateGoal("30"); setCreateColor(null);
    setShowCreateModal(true);
  };
  const closeCreateModal = () => setShowCreateModal(false);

  const openEditModal = (habit: Habit) => {
    setEditingHabit(habit);
    setEditName(habit.name);
    setEditGoal(String(habit.goal));
    setEditColor(habit.color);
    setShowEditModal(true);
  };
  const closeEditModal = () => { setShowEditModal(false); setEditingHabit(null); };

  useEffect(() => { fetchHabits(); }, []);

  // ─── Stats ──────────────────────────────────────────────────────────────────

  const completedTodayCount = habits.filter((h) => isCompletedToday(h.last_completed_date)).length;
  const completionRate = habits.length > 0 ? Math.round((completedTodayCount / habits.length) * 100) : 0;
  const allCompletedToday = habits.length > 0 && completedTodayCount === habits.length;

  // ─── Filtro ─────────────────────────────────────────────────────────────────

  const filteredHabits = habits.filter((h) => {
    if (filter === "completed") return isCompletedToday(h.last_completed_date);
    if (filter === "pending")   return !isCompletedToday(h.last_completed_date);
    return true;
  });

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Hábitos</h2>
          <p className="text-muted-foreground">Construye rutinas que transformen tu vida</p>
        </div>
        <Button className="gap-2 bg-blue-600 hover:bg-blue-700 text-white" onClick={openCreateModal}>
          <Plus className="h-4 w-4" />
          Nuevo Hábito
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Racha global */}
        <Card className="bg-linear-to-br from-orange-500/10 to-orange-600/10 border-orange-500/20">
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Flame className="h-4 w-4 text-orange-500" />
              Racha Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{globalStreak} días</div>
            {allCompletedToday ? (
              <p className="text-xs text-green-600 font-medium">¡Racha activa hoy!</p>
            ) : habits.length > 0 ? (
              <p className="text-xs text-muted-foreground">
                Te quedan {getTimeUntilMidnight()} para completar
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">Días consecutivos al 100%</p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-linear-to-br from-green-500/10 to-green-600/10 border-green-500/20">
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Completados Hoy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {completedTodayCount}/{habits.length}
            </div>
            <p className="text-xs text-muted-foreground">Tasa de {completionRate}%</p>
          </CardContent>
        </Card>

        <Card className="bg-linear-to-br from-purple-500/10 to-purple-600/10 border-purple-500/20">
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4 text-purple-500" />
              Hábitos Activos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{habits.length}</div>
            <p className="text-xs text-muted-foreground">En seguimiento</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Tus Hábitos Diarios</CardTitle>
              <CardDescription>Marca los hábitos que completes hoy</CardDescription>
            </div>
            <div className="flex gap-1">
              {(["all", "pending", "completed"] as FilterType[]).map((f) => (
                <Button
                  key={f}
                  variant={filter === f ? "default" : "outline"}
                  size="sm"
                  className={filter === f ? "bg-blue-600 hover:bg-blue-700 text-white" : ""}
                  onClick={() => setFilter(f)}
                >
                  {f === "all" ? "Todos" : f === "pending" ? "Pendientes" : "Completados"}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Cargando hábitos...
            </div>
          ) : filteredHabits.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {habits.length === 0
                ? "No tienes hábitos todavía. ¡Crea uno!"
                : "No hay hábitos en esta categoría."}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredHabits.map((habit) => {
                const completed   = isCompletedToday(habit.last_completed_date);
                const progress    = getProgress(habit.streak, habit.goal);
                const toggling    = togglingIds.has(habit.id);
                const risk        = getHabitRisk(habit);
                const goalReached = habit.streak >= habit.goal;

                return (
                  <div
                    key={habit.id}
                    className={`p-4 rounded-lg border border-l-4 ${goalReached ? "border-l-yellow-500" : getColorBorder(habit.color)} bg-card hover:bg-muted/50 transition-colors`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h3 className="font-semibold">{habit.name}</h3>
                          {completed && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                          {goalReached && (
                            <span className="text-xs bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 px-2 py-0.5 rounded-full font-medium">
                              🏆 ¡Meta alcanzada!
                            </span>
                          )}
                          {/* Avisos de racha */}
                          {risk === "grace_warning" && (
                            <span className="text-xs bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 px-2 py-0.5 rounded-full font-medium">
                              ⚠ Completa hoy · {getTimeUntilMidnight()} restantes
                            </span>
                          )}
                          {risk === "grace_used" && (
                            <span className="text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 px-2 py-0.5 rounded-full font-medium">
                              🛡 Usando día de cortesía
                            </span>
                          )}
                          {risk === "lost" && (
                            <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                              Racha interrumpida
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Flame className="h-4 w-4 text-orange-500" />
                            {habit.streak} días de racha
                          </span>
                          <span className="flex items-center gap-1">
                            <Target className="h-4 w-4 text-purple-500" />
                            Meta: {habit.goal} días
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          disabled={toggling}
                          onClick={() => toggleHabit(habit.id)}
                          variant={completed ? "secondary" : "default"}
                          className={!completed ? "bg-blue-600 hover:bg-blue-700 text-white" : ""}
                        >
                          {toggling ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : completed ? (
                            "Completado"
                          ) : (
                            "Marcar"
                          )}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openEditModal(habit)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Barra de progreso con color del hábito */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Progreso hacia la meta</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${progress}%`,
                            backgroundColor: goalReached ? "#eab308" : getProgressColor(habit.color),
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Modal Crear ─────────────────────────────────────────────────────── */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg p-6 w-full max-w-md shadow-xl space-y-4">
            <h3 className="text-lg font-bold">Nuevo Hábito</h3>

            <div className="space-y-2">
              <label className="text-sm font-medium">Nombre</label>
              <input
                type="text"
                placeholder="Ej: Ejercicio matutino"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                maxLength={50}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Meta (días)</label>
              <input
                type="number"
                min="1"
                max="3650"
                value={createGoal}
                onChange={(e) => setCreateGoal(e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Color</label>
              <div className="flex gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setCreateColor(c.value === createColor ? null : c.value)}
                    className={`w-7 h-7 rounded-full ${c.bg} ring-offset-2 transition-all ${
                      createColor === c.value ? "ring-2 ring-foreground scale-110" : "opacity-70 hover:opacity-100"
                    }`}
                    title={c.label}
                  />
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={closeCreateModal} disabled={createLoading}>
                Cancelar
              </Button>
              <Button
                onClick={createHabit}
                disabled={createLoading || !createName.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {createLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Crear"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Editar ─────────────────────────────────────────────────────── */}
      {showEditModal && editingHabit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg p-6 w-full max-w-md shadow-xl space-y-4">
            <h3 className="text-lg font-bold">Editar Hábito</h3>

            <div className="space-y-2">
              <label className="text-sm font-medium">Nombre</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                maxLength={50}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Meta (días)</label>
              <input
                type="number"
                min="1"
                max="3650"
                value={editGoal}
                onChange={(e) => setEditGoal(e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Color</label>
              <div className="flex gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setEditColor(c.value === editColor ? null : c.value)}
                    className={`w-7 h-7 rounded-full ${c.bg} ring-offset-2 transition-all ${
                      editColor === c.value ? "ring-2 ring-foreground scale-110" : "opacity-70 hover:opacity-100"
                    }`}
                    title={c.label}
                  />
                ))}
              </div>
            </div>

            <div className="flex justify-between pt-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={deleteHabit}
                disabled={deleteLoading || editLoading}
              >
                {deleteLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <><Trash2 className="h-4 w-4 mr-1" /> Eliminar</>
                )}
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={closeEditModal} disabled={editLoading || deleteLoading}>
                  Cancelar
                </Button>
                <Button
                  onClick={updateHabit}
                  disabled={editLoading || deleteLoading || !editName.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {editLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
