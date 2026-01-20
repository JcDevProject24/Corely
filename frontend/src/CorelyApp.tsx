import { RouterProvider } from "react-router"
import { AppRouter } from "./router/app.routes"
// import { AuthContextProvider } from "./context/AuthContext"


export const CorelyApp = () => {
  return (
    // <AuthContextProvider>
    <RouterProvider router={AppRouter} />
    // </AuthContextProvider>
  )
}
