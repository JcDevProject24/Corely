"use client"

import { Outlet } from "react-router"

export const AuthLayout = () => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-linear-to-r from-blue-100 via-purple-50 to-purple-200 p-4">
            <div className="w-full max-w-md relative z-10">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-14 h-14 mb-2">
                        <img src="@/../public/favicon.svg" alt="Logo Corely" className="w-14 h-14" />
                    </div>
                    <h1 className="text-4xl font-bold bg-linear-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb- overflow-visible leading-normal mb-2">
                        Corely
                    </h1>
                    <p className="text-gray-600 text-sm">Gestión de flujos simplificada</p>
                </div>

                {/* Form Container */}
                <div className="relative">
                    <Outlet />
                </div>
            </div>
        </div>
    )
}
