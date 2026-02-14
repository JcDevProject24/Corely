import {
    createContext,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from "react";

// Configuración de la API
const API_URL = "http://localhost:8000";

// Tipo para cuenta social
type SocialAccount = {
    id: number;
    provider: string;
    provider_email: string | null;
    created_at: string;
};

// Tipo para el usuario
type User = {
    id: number;
    email: string;
    username: string;
    avatar_url: string | null;
    is_email_verified: boolean;
    has_password: boolean;
    created_at: string;
    social_accounts: SocialAccount[];
};

// Tipo del contexto
type AuthContextType = {
    user: User | null;
    loading: boolean;
    signUpNewUser: (
        email: string,
        password: string,
        username: string
    ) => Promise<{ success: boolean; data?: any; error?: any }>;
    lognInUser: (
        email: string,
        password: string
    ) => Promise<{ success: boolean; data?: any; error?: any }>;
    logOut: () => void;
    handleOAuthCallback: (token: string) => Promise<{ success: boolean; data?: any; error?: any }>;
    unlinkProvider: (provider: string) => Promise<{ success: boolean; error?: any }>;
    setPassword: (password: string) => Promise<{ success: boolean; error?: any }>;
};

// Tipo de las props del provider
type AuthProviderProps = {
    children: ReactNode;
};

// Crear el contexto con tipo
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Componente provider
export const AuthContextProvider = ({ children }: AuthProviderProps) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    // Función para verificar si hay un usuario autenticado
    const checkAuth = async () => {
        const token = localStorage.getItem("access_token");

        if (!token) {
            setLoading(false);
            return;
        }

        try {
            const response = await fetch(`${API_URL}/auth/me`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            if (response.ok) {
                const userData = await response.json();
                setUser(userData);
            } else {
                // Token inválido o expirado
                localStorage.removeItem("access_token");
                setUser(null);
            }
        } catch (error) {
            console.error("Error checking auth:", error);
            localStorage.removeItem("access_token");
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    // Sign Up
    const signUpNewUser = async (
        email: string,
        password: string,
        username: string
    ) => {
        try {
            const response = await fetch(`${API_URL}/auth/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, password, username }),
            });

            const data = await response.json();

            if (!response.ok) {
                return {
                    success: false,
                    error: { message: data.detail || "Error al registrar usuario" },
                };
            }

            // Después de registrar, hacer login automáticamente
            return await lognInUser(email, password);
        } catch (error) {
            console.error("Error signing up:", error);
            return {
                success: false,
                error: { message: "Error de conexión al servidor" },
            };
        }
    };

    // Log In
    const lognInUser = async (email: string, password: string) => {
        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                return {
                    success: false,
                    error: { message: data.detail || "Error al iniciar sesión" },
                };
            }

            // Guardar token en localStorage
            localStorage.setItem("access_token", data.access_token);

            // Actualizar estado del usuario
            setUser(data.user);

            console.log("Login success", data);
            return { success: true, data };
        } catch (error) {
            console.error("Error logging in:", error);
            return {
                success: false,
                error: { message: "Error de conexión al servidor" },
            };
        }
    };

    // Log Out
    const logOut = () => {
        localStorage.removeItem("access_token");
        setUser(null);
        console.log("Logout exitoso");
    };

    // Handle OAuth Callback
    const handleOAuthCallback = async (token: string) => {
        try {
            // Guardar token
            localStorage.setItem("access_token", token);

            // Obtener datos del usuario
            const response = await fetch(`${API_URL}/auth/me`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                localStorage.removeItem("access_token");
                return {
                    success: false,
                    error: { message: "Token invalido" },
                };
            }

            const userData = await response.json();
            setUser(userData);

            return { success: true, data: userData };
        } catch (error) {
            console.error("Error in OAuth callback:", error);
            localStorage.removeItem("access_token");
            return {
                success: false,
                error: { message: "Error al procesar la autenticacion" },
            };
        }
    };

    // Unlink social provider
    const unlinkProvider = async (provider: string) => {
        const token = localStorage.getItem("access_token");
        if (!token) {
            return { success: false, error: { message: "No autenticado" } };
        }

        try {
            const response = await fetch(`${API_URL}/auth/oauth/unlink/${provider}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            const data = await response.json();

            if (!response.ok) {
                return {
                    success: false,
                    error: { message: data.detail || "Error al desvincular cuenta" },
                };
            }

            // Actualizar usuario
            await checkAuth();
            return { success: true };
        } catch (error) {
            console.error("Error unlinking provider:", error);
            return {
                success: false,
                error: { message: "Error de conexion al servidor" },
            };
        }
    };

    // Set password for OAuth users
    const setPassword = async (password: string) => {
        const token = localStorage.getItem("access_token");
        if (!token) {
            return { success: false, error: { message: "No autenticado" } };
        }

        try {
            const response = await fetch(`${API_URL}/auth/set-password`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ password }),
            });

            const data = await response.json();

            if (!response.ok) {
                return {
                    success: false,
                    error: { message: data.detail || "Error al establecer contrasena" },
                };
            }

            // Actualizar usuario
            await checkAuth();
            return { success: true };
        } catch (error) {
            console.error("Error setting password:", error);
            return {
                success: false,
                error: { message: "Error de conexion al servidor" },
            };
        }
    };

    // Verificar autenticación al montar el componente
    useEffect(() => {
        checkAuth();
    }, []);

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                signUpNewUser,
                lognInUser,
                logOut,
                handleOAuthCallback,
                unlinkProvider,
                setPassword,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

// Hook personalizado para usar el contexto
export const userAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthContextProvider");
    }
    return context;
};
