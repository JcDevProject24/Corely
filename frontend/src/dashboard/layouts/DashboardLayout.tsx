import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { SidebarApp } from "@/components/custom/SidebarApp";
import { userAuth } from "@/context/AuthContext";

export const DashboardLayout = () => {

    const { user } = userAuth();

    return (
        <SidebarProvider>
            <div className="min-h-screen flex w-full">
                <SidebarApp />

                <div className="flex-1 flex flex-col">
                    {/* Header */}
                    <header className="h-16 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 sticky top-0 z-10">
                        <div className="flex h-full items-center px-4 gap-4">
                            <SidebarTrigger className="h-8 w-8" />
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center">
                                    <img src="/favicon.svg" alt="FlowHub logo" />
                                </div>
                                <h1 className="text-xl font-bold bg-linear-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                    Corely
                                </h1>
                            </div>
                        </div>
                    </header>

                    {/* Main content */}
                    <main className="flex-1 p-6 overflow-auto">
                        <h2 className="text-2xl font-semibold mb-4">Bienvenido {user?.full_name}!</h2>
                        <Outlet />
                    </main>
                </div>
            </div>
        </SidebarProvider>
    );
}

