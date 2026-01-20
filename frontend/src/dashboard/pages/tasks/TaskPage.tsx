import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Circle, Clock, AlertCircle } from "lucide-react";
import { useState } from "react";

export const TaskPage = () => {
    // const tasks = [
    //     { id: 1, title: "Revisar propuesta de proyecto", priority: "alta", status: "completada", dueDate: "Hoy" },
    //     { id: 2, title: "Preparar presentación mensual", priority: "alta", status: "pendiente", dueDate: "hoy" },
    //     { id: 3, title: "Responder emails importantes", priority: "media", status: "en-progreso", dueDate: "Hoy" },
    //     { id: 4, title: "Actualizar documentación técnica", priority: "baja", status: "completada", dueDate: "Esta semana" },
    //     { id: 5, title: "Reunión con el equipo de diseño", priority: "media", status: "completada", dueDate: "Ayer" },
    //     { id: 6, title: "Revisar código de nuevas funcionalidades", priority: "alta", status: "en-progreso", dueDate: "Hoy" },
    // ];


    interface Task {
        id: string; // o number si prefieres, pero con Supabase será string (uuid)
        user_id: string; // id del usuario autenticado
        name: string;
        priority: "low" | "medium" | "high"; // o string si no quieres limitarlo
        status: "pending" | "completed";
        due_date: string; // ISO string (o Date si luego lo conviertes)
    }


    const [tasks, setTasks] = useState<Task[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);



    // Cierra el modal
    const closeModal = () => {
        setIsModalOpen(false);
    };

    // Crear nueva tarea en el state
    const handleCreateTask = (newTask: Omit<Tarea, "id">) => {
        const taskWithId: Tarea = {
            ...newTask,
            id: crypto.randomUUID(), // ID temporal
        };
        setTasks(prev => [...prev, taskWithId]);
        closeModal(); // cerramos modal al crear
    };

    // Abrir modal
    const handleNewTask = () => {
        console.log('New Task');
        setIsModalOpen(true);
    };



    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case "high":
                return "text-red-500";
            case "medim":
                return "text-yellow-500";
            case "low":
                return "text-green-500";
            default:
                return "text-muted-foreground";
        }
    };

    const getPriorityIcon = (priority: string) => {
        switch (priority) {
            case "high":
                return <AlertCircle className="h-4 w-4" />;
            case "medium":
                return <Clock className="h-4 w-4" />;
            case "low":
                return <Circle className="h-4 w-4" />;
            default:
                return <Circle className="h-4 w-4" />;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Tareas</h2>
                    <p className="text-muted-foreground">
                        Gestiona tus tareas y mantente organizado
                    </p>
                </div>
                <Button
                    onClick={handleNewTask}
                    className="gap-2 bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4" />
                    Nueva Tarea
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium">Total de Tareas</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{tasks.length}</div>
                        <p className="text-xs text-muted-foreground">+3 desde la semana pasada</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium">Completadas</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {tasks.filter(task => task.status === "completed").length}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {tasks.length > 0
                                ? `${Math.round((tasks.filter(task => task.status === "completed").length / tasks.length) * 100)}% de todas las tareas`
                                : "0% de todas las tareas"}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium">Pendientes Hoy</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {
                                tasks.filter(task => {
                                    // Considerar tareas con fecha de hoy y no completadas
                                    const dueDate = new Date(task.due_date);
                                    const now = new Date();
                                    return dueDate.getFullYear() === now.getFullYear() &&
                                        dueDate.getMonth() === now.getMonth() &&
                                        dueDate.getDate() === now.getDate() &&
                                        task.status !== "completed";
                                }).length
                            }
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {
                                (() => {
                                    const highPrio = tasks.filter(task => {
                                        const dueDate = new Date(task.due_date);
                                        const now = new Date();
                                        return dueDate.getFullYear() === now.getFullYear() &&
                                            dueDate.getMonth() === now.getMonth() &&
                                            dueDate.getDate() === now.getDate() &&
                                            task.priority === "high" &&
                                            task.status !== "completed";
                                    }).length;
                                    return `${highPrio} de alta prioridad`;
                                })()
                            }
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Lista de Tareas</CardTitle>
                    <CardDescription>
                        Organiza y prioriza tu trabajo diario
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {tasks.map((task) => (
                            <div
                                key={task.id}
                                className={`flex items-center gap-4 p-4 rounded-lg border ${task.status === "completed" ? "bg-muted/50 opacity-60" : "bg-card hover:bg-muted/50"
                                    } transition-colors`}
                            >
                                <Checkbox
                                    checked={task.status === "completed"}
                                    className="h-5 w-5"
                                />
                                <div className="flex-1">
                                    <p className={`font-medium ${task.status === "completed" ? "line-through" : ""}`}>
                                        {task.name}
                                    </p>
                                    <div className="flex items-center gap-3 mt-1">
                                        <span className={`text-xs flex items-center gap-1 ${getPriorityColor(task.priority)}`}>
                                            {getPriorityIcon(task.priority)}
                                            {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            {task.due_date}
                                        </span>

                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
