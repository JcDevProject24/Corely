export const validateForm = (username: string, password: string, setErrors: (errors: {
    username?: string
    password?: string
}) => void) => {
    const newErrors: {
        username?: string
        password?: string
    } = {}

    if (!username) {
        newErrors.username = "El usuario es obligatorio"
    } else if (username.length < 3) {
        newErrors.username = "El usuario debe tener al menos 3 caracteres"
    }

    if (!password) {
        newErrors.password = "La contraseña es obligatoria"
    } else if (password.length < 8) {
        newErrors.password = "La contraseña debe tener al menos 8 caracteres"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
}
