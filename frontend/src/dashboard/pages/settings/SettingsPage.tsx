import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { userAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { LogOut, User, Settings } from "lucide-react";

export const SettingsPage = () => {
    const { logOut, user } = userAuth();
    const navigate = useNavigate();

    const handleLogOut = async () => {
        try {
            await logOut();
            navigate("/login");
        } catch (error) {
            console.error("Error al cerrar sesión:", error);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <Settings className="h-8 w-8 text-blue-600" />
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Configuración</h1>
                    <p className="text-gray-600">Administra tu cuenta y preferencias</p>
                </div>
            </div>

            {/* Información de usuario */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Información de la cuenta
                    </CardTitle>
                    <CardDescription>
                        Detalles de tu cuenta y perfil
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-gray-700">
                                Nombre de usuario
                            </label>
                            <p className="text-gray-900 mt-1">{user?.username}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700">
                                Correo electrónico
                            </label>
                            <p className="text-gray-900 mt-1">{user?.email}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Sesión */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <LogOut className="h-5 w-5" />
                        Sesión
                    </CardTitle>
                    <CardDescription>
                        Cierra tu sesión en este dispositivo
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button
                        onClick={handleLogOut}
                        variant="destructive"
                        className="w-full sm:w-auto"
                    >
                        <LogOut className="h-4 w-4 mr-2" />
                        Cerrar sesión
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
};
