export const validateForm = (email: string, password: string, setErrors: (errors: {
    email?: string
    password?: string
}) => void) => {
    const newErrors: {
        email?: string
        password?: string
    } = {}

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


    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
}