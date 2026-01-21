"use client"

import type React from "react"
import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { userAuth } from "@/context/AuthContext"
import { validateForm } from "../utils/Signup"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"



export const SignupPage = () => {

    const [fullName, setFullName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [errors, setErrors] = useState<{
        fullName?: string
        email?: string
        password?: string
        confirmPassword?: string
    }>({})
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    const { signUpNewUser } = userAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validateForm(fullName, email, password, confirmPassword, setErrors)) return

        setIsLoading(true)
        try {
            const result = await signUpNewUser(email, password, fullName)

            if (result.success) {
                navigate("/")
            }
            if (!result.success) {
                setError(result.error?.message || "Error al registrar usuario. Inténtalo de nuevo.");
            }

            // Reset form on success
            setFullName("")
            setEmail("")
            setPassword("")
            setConfirmPassword("")
        } catch {
            setError('Ocurrio un error')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
            <CardHeader className="pb-4">
                <CardTitle className="text-gray-900 text-2xl font-bold text-center">Crear cuenta</CardTitle>
                <CardDescription className="text-gray-600 text-sm text-center">Completa los datos para registrarte</CardDescription>
            </CardHeader>

            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Full Name Input */}
                    <div className="space-y-2">
                        <label htmlFor="fullName" className="text-sm font-medium text-gray-700">
                            Nombre completo
                        </label>
                        <Input
                            id="fullName"
                            type="text"
                            placeholder="Juan Pérez"
                            value={fullName}
                            onChange={(e) => {
                                setFullName(e.target.value)
                                if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: undefined }))
                            }}
                            className={`bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 transition-colors ${errors.fullName ? "border-red-500 focus:border-red-500" : "focus:border-blue-500 focus:ring-blue-500"
                                }`}
                        />
                        {errors.fullName && <p className="text-xs text-red-500 mt-1">{errors.fullName}</p>}
                    </div>

                    {/* Email Input */}
                    <div className="space-y-2">
                        <label htmlFor="email" className="text-sm font-medium text-gray-700">
                            Correo electrónico
                        </label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="tu@email.com"
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value)
                                if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }))
                            }}
                            className={`bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 transition-colors ${errors.email ? "border-red-500 focus:border-red-500" : "focus:border-blue-500 focus:ring-blue-500"
                                }`}
                        />
                        {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
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

                    {/* Confirm Password Input */}
                    <div className="space-y-2">
                        <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                            Confirmar contraseña
                        </label>
                        <Input
                            id="confirmPassword"
                            type="password"
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => {
                                setConfirmPassword(e.target.value)
                                if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: undefined }))
                            }}
                            className={`bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 transition-colors ${errors.confirmPassword ? "border-red-500 focus:border-red-500" : "focus:border-blue-500 focus:ring-blue-500"
                                }`}
                        />
                        {errors.confirmPassword && <p className="text-xs text-red-500 mt-1">{errors.confirmPassword}</p>}
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
                                Creando cuenta...
                            </>
                        ) : (
                            "Crear cuenta"
                        )}
                    </Button>
                </form>

                {/* Switch Mode Link */}
                <div className="mt-6 text-center">
                    <p className="text-gray-600 text-sm">
                        ¿Ya tienes cuenta?{" "}
                        <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium transition-colors">
                            Iniciar sesión
                        </Link>
                    </p>
                </div>
            </CardContent>
        </Card>
    )
}
