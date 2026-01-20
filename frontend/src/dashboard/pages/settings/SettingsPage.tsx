import { Button } from "@/components/ui/button";
// import { userAuth } from "@/context/AuthContext"
import { useNavigate } from "react-router";

export const SettingsPage = () => {

    // const { logOut } = userAuth();
    const navigate = useNavigate();

    // const handleLogOut = async () => {
    //     try {
    //         await logOut();
    //         navigate('/login')
    //     } catch (error) {
    //         console.log(error)
    //     }
    // }

    return (
        <div>
            <h2>Settings Page</h2>
            {/* <Button
                onClick={handleLogOut}
                variant={"destructive"}
            >Cerrar sesión</Button> */}
        </div>

    )
}
