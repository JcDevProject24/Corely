"use client"

import { Outlet } from "react-router"

export const AuthLayout = () => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-100 via-purple-50 to-purple-200 p-4">
            <div className="w-full max-w-md relative z-10">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 mb-4 shadow-lg">
                        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
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
