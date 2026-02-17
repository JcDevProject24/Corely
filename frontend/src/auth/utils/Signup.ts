export const validateForm = (fullName: string, username: string, email: string, password: string, confirmPassword: string, setErrors: (errors: {
    fullName?: string
    username?: string
    email?: string
    password?: string
    confirmPassword?: string
}) => void) => {
    const newErrors: {
        fullName?: string
        username?: string
        email?: string
        password?: string
        confirmPassword?: string
    } = {}

    if (!fullName.trim()) {
        newErrors.fullName = "El nombre completo es obligatorio"
    } else if (fullName.trim().length < 2) {
        newErrors.fullName = "El nombre debe tener al menos 2 caracteres"
    }

    if (!username.trim()) {
        newErrors.username = "El usuario es obligatorio"
    } else if (username.length < 3) {
        newErrors.username = "El usuario debe tener al menos 3 caracteres"
    } else if (!/^[a-z0-9_]+$/.test(username)) {
        newErrors.username = "Solo letras minusculas, numeros y guion bajo"
    }

    if (!email) {
        newErrors.email = "El correo electronico es obligatorio"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        newErrors.email = "Por favor ingresa un correo electronico valido"
    }

    if (!password) {
        newErrors.password = "La contrasena es obligatoria"
    } else if (password.length < 8) {
        newErrors.password = "La contrasena debe tener al menos 8 caracteres"
    }

    if (!confirmPassword) {
        newErrors.confirmPassword = "Por favor confirma tu contrasena"
    } else if (password !== confirmPassword) {
        newErrors.confirmPassword = "Las contrasenas no coinciden"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
}
