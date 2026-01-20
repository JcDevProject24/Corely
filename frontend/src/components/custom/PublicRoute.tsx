// import { userAuth } from "@/context/AuthContext"
// import { Navigate } from "react-router";
// import type { ReactNode } from "react";

// interface PublicRouteProps {
//     children: ReactNode;
// }

// export const PublicRoute = ({ children }: PublicRouteProps) => {

//     const { session, loading } = userAuth();

//     console.log(session)


//     if (loading) return (
//         <div className="flex items-center justify-center min-h-screen">
//             <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
//         </div>)

//     return !session ? <>{children}</> : <Navigate to="/" replace />;
// }
