"use client"

import type React from "react"

import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { validateForm } from "../utils/Login"
import { userAuth } from "@/context/AuthContext"
import { SocialAuthButtons } from "../components/SocialAuthButtons"

export const LoginPage = () => {
    const lastUsername = localStorage.getItem("last_username") || ""
    const [username, setUsername] = useState(lastUsername)
    const [password, setPassword] = useState("")
    const [errors, setErrors] = useState<{ username?: string; password?: string }>({})
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    const { lognInUser } = userAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validateForm(username, password, setErrors)) return

        setIsLoading(true)
        try {
            const result = await lognInUser(username, password)

            if (result.success) {
                navigate("/")
            }
            if (!result.success) {
                setError(result.error?.message || "Credenciales incorrectas. Inténtalo de nuevo.");
            }

            // Reset form on success
            setUsername("")
            setPassword("")
        } catch {
            setError('Ocurrio un error')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
            <CardHeader className="pb-4">
                <CardTitle className="text-gray-900 text-2xl font-bold text-center">Iniciar sesión</CardTitle>
                <CardDescription className="text-gray-600 text-sm text-center">Ingresa tus credenciales para acceder</CardDescription>
            </CardHeader>

            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Username Input */}
                    <div className="space-y-2">
                        <label htmlFor="username" className="text-sm font-medium text-gray-700">
                            Usuario o email
                        </label>
                        <Input
                            id="username"
                            type="text"
                            placeholder="usuario o email"
                            value={username}
                            onChange={(e) => {
                                setUsername(e.target.value)
                                if (errors.username) setErrors((prev) => ({ ...prev, username: undefined }))
                            }}
                            className={`bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 transition-colors ${errors.username ? "border-red-500 focus:border-red-500 focus:ring-red-500" : "focus:border-blue-500 focus:ring-blue-500"
                                }`}
                        />
                        {errors.username && <p className="text-xs text-red-500 mt-1">{errors.username}</p>}
                    </div>

                    {/* Password Input */}
                    <div className="space-y-2">
                        <label htmlFor="password" className="text-sm font-medium text-gray-700">
                            Contraseña
                        </label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value)
                                if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }))
                            }}
                            className={`bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 transition-colors ${errors.password ? "border-red-500 focus:border-red-500" : "focus:border-blue-500 focus:ring-blue-500"
                                }`}
                        />
                        {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
                    </div>

                    {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
                    {/* Submit Button */}
                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition-all duration-200 mt-6"
                    >
                        {isLoading ? (
                            <>
                                <span className="mr-2 h-4 w-4 animate-spin">⏳</span>
                                Iniciando sesión...
                            </>
                        ) : (
                            "Iniciar sesión"
                        )}
                    </Button>
                </form>

                {/* Social Login Buttons */}
                <div className="mt-6">
                    <SocialAuthButtons mode="login" />
                </div>

                {/* Switch Mode Link */}
                <div className="mt-6 text-center">
                    <p className="text-gray-600 text-sm">
                        ¿No tienes cuenta?{" "}
                        <Link to="/signup" className="text-blue-600 hover:text-blue-700 font-medium transition-colors">
                            Crear cuenta
                        </Link>
                    </p>
                </div>
            </CardContent>
        </Card>
    )
}
