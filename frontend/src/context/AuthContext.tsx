// import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
// // import type { Session } from "@supabase/supabase-js";
// // import { supabase } from "@/supabase/SupabaseClient";


// //  Tipo del contexto (puedes ampliarlo según tus necesidades)
// type AuthContextType = {
//     session: Session | null;
//     loading: boolean;
//     signUpNewUser: (email: string, password: string, name: string) => Promise<{ success: boolean; data?: any; error?: any }>;
//     lognInUser: (email: string, password: string) => Promise<{ success: boolean; data?: any; error?: any }>;
//     logOut: () => void;
// };
// //  Tipo de las props del provider
// type AuthProviderProps = {
//     children: ReactNode;
// };

// //  Crear el contexto con tipo
// const AuthContext = createContext<AuthContextType | undefined>(undefined);





// //  Componente provider
// export const AuthContextProvider = ({ children }: AuthProviderProps) => {
//     const [session, setSession] = useState<Session | null>(null);
//     const [loading, setLoading] = useState(true);

//     //Sign Up
//     const signUpNewUser = async (email: string, password: string, name: string) => {
//         const { data, error } = await supabase.auth.signUp({
//             email: email,
//             password: password,
//             options: {
//                 data: {
//                     display_name: name,
//                 }
//             }
//         })

//         if (error) {
//             console.error("Error signing up:", error.message);
//             return { success: false, error };
//         }
//         return { success: true, data };
//     }
//     //Log In
//     const lognInUser = async (email: string, password: string) => {

//         try {
//             const { data, error } = await supabase.auth.signInWithPassword({
//                 email,
//                 password
//             })


//             if (error) {
//                 console.error("Error logging in:", error.message);
//                 return { success: false, error };
//             }
//             console.log('login succes', data)
//             return { success: true, data };

//         } catch (error) {
//             console.error('Ocurrio un error: ', error)
//             return { success: false, error };
//         }
//     }

//     const logOut = async () => {
//         const { error } = await supabase.auth.signOut();
//         if (error) {
//             console.error("Error signing out:", error.message);
//         }
//     }


//     useEffect(() => {
//         // Obtener la sesión actual
//         supabase.auth.getSession().then(({ data: { session } }) => {
//             setSession(session);
//             setLoading(false);
//         });

//         const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
//             setSession(session);
//             setLoading(false);
//         });

//         return () => listener.subscription.unsubscribe();
//     }, []);



//     return (
//         <AuthContext.Provider value={{ session, loading, signUpNewUser, lognInUser, logOut }}>
//             {children}
//         </AuthContext.Provider>
//     );
// };

// //  Hook personalizado para usar el contexto
// export const userAuth = (): AuthContextType => {
//     const context = useContext(AuthContext);
//     if (!context) {
//         throw new Error("useAuth must be used within an AuthContextProvider");
//     }
//     return context;
// };

