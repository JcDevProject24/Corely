import { PrivateRoute } from "@/components/custom/PrivateRoute";
import { PublicRoute } from "@/components/custom/PublicRoute";
import { createBrowserRouter, Navigate } from "react-router-dom";

import { DashboardLayout } from "@/dashboard/layouts/DashboardLayout";
import { HomePage } from "@/dashboard/pages/home/HomePage";
import { TaskPage } from "@/dashboard/pages/tasks/TaskPage";
import { CalendarPage } from "@/dashboard/pages/calendar/CalendarPage";
import { HabitsPage } from "@/dashboard/pages/habits/HabitsPage";
import { SettingsPage } from "@/dashboard/pages/settings/SettingsPage";
import { AuthLayout } from "@/auth/layouts/AuthLayout";
import { LoginPage } from "@/auth/pages/LoginPage";
import { SignupPage } from "@/auth/pages/SignupPage";
import { OAuthCallback } from "@/auth/components/OAuthCallback";
import { FitnessPage } from "@/dashboard/pages/fitness/FitnessPage";
import { FinancePage } from "@/dashboard/pages/finance/FinancePage";
import { NewsPage } from "@/dashboard/pages/news/NewsPage";



export const AppRouter = createBrowserRouter([

    {
        path: "/",
        element: (
            <PrivateRoute>
                <DashboardLayout />
            </PrivateRoute>
        ),
        children: [
            {
                index: true,
                element: <HomePage />,
            },
            {
                path: "tareas",
                element: <TaskPage />,
            },
            {
                path: "calendario",
                element: <CalendarPage />,
            },
            {
                path: "habitos",
                element: <HabitsPage />,
            },
            {
                path: "ajustes",
                element: <SettingsPage />,
            },
            {
                path: "fitness",
                element: <FitnessPage />,
            },
            {
                path: "finanzas",
                element: <FinancePage />,
            },
            {
                path: "noticias",
                element: <NewsPage />,
            }
        ]
    },
    {
        path: "/login",
        element: (
            <PublicRoute>
                <AuthLayout />
            </PublicRoute>
        ),
        children: [
            {
                index: true,
                element: <LoginPage />,
            },
        ]
    },
    {
        path: "/signup",
        element: (
            <PublicRoute>
                <AuthLayout />
            </PublicRoute>
        ),
        children: [
            {
                index: true,
                element: <SignupPage />,
            },
        ]
    },
    {
        path: "/auth/callback",
        element: <OAuthCallback />,
    },
    {
        path: "*",
        element: <Navigate to="/" replace />,
    },

])