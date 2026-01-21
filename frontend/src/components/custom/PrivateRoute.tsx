import { userAuth } from "@/context/AuthContext"
import { Navigate } from "react-router";
import type { ReactNode } from "react";

interface PrivateRouteProps {
    children: ReactNode;
}

export const PrivateRoute = ({ children }: PrivateRouteProps) => {

    const { user, loading } = userAuth();


    if (loading) return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
    ); // O un componente de spinner

    return user ? <>{children}</> : <Navigate to="/login" replace />;
}
