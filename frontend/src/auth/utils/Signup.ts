export const validateForm = (fullName: string, email: string, password: string, confirmPassword: string, setErrors: (errors: {
    fullName?: string
    email?: string
    password?: string
    confirmPassword?: string
}) => void) => {
    const newErrors: {
        fullName?: string
        email?: string
        password?: string
        confirmPassword?: string
    } = {}

    if (!fullName.trim()) {
        newErrors.fullName = "El nombre completo es obligatorio"
    } else if (fullName.trim().length < 2) {
        newErrors.fullName = "El nombre debe tener al menos 2 caracteres"
    }

    if (!email) {
        newErrors.email = "El correo electrónico es obligatorio"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        newErrors.email = "Por favor ingresa un correo electrónico válido"
    }

    if (!password) {
        newErrors.password = "La contraseña es obligatoria"
    } else if (password.length < 8) {
        newErrors.password = "La contraseña debe tener al menos 8 caracteres"
    }

    if (!confirmPassword) {
        newErrors.confirmPassword = "Por favor confirma tu contraseña"
    } else if (password !== confirmPassword) {
        newErrors.confirmPassword = "Las contraseñas no coinciden"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
}