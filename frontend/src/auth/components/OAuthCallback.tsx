import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { userAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const OAuthCallback = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { handleOAuthCallback } = userAuth();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const processCallback = async () => {
            const token = searchParams.get("token");
            const errorParam = searchParams.get("error");
            const isNew = searchParams.get("is_new") === "true";

            if (errorParam) {
                setError(decodeURIComponent(errorParam));
                return;
            }

            if (token) {
                try {
                    const result = await handleOAuthCallback(token);
                    if (result.success) {
                        // Redirigir al dashboard
                        navigate("/", { replace: true });
                    } else {
                        setError(result.error?.message || "Error al procesar la autenticacion");
                    }
                } catch (err) {
                    setError("Error inesperado al procesar la autenticacion");
                }
            } else {
                setError("No se recibio token de autenticacion");
            }
        };

        processCallback();
    }, [searchParams, handleOAuthCallback, navigate]);

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <Card className="w-full max-w-md bg-white border-gray-200 shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-red-600 text-center">Error de autenticacion</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                        <p className="text-gray-600 mb-4">{error}</p>
                        <button
                            onClick={() => navigate("/login")}
                            className="text-blue-600 hover:text-blue-700 font-medium"
                        >
                            Volver al login
                        </button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <Card className="w-full max-w-md bg-white border-gray-200 shadow-lg">
                <CardContent className="pt-6">
                    <div className="flex flex-col items-center space-y-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <p className="text-gray-600">Procesando autenticacion...</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
