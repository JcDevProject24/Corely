
import { Home, CheckSquare, Target, Calendar, Settings, Newspaper, Dumbbell, Wallet } from "lucide-react";
import { NavLink } from "@/components/custom/NavLink";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const menuItems = [
  { title: "Inicio", url: "/", icon: Home },
  { title: "Tareas", url: "/tareas", icon: CheckSquare },
  { title: "Hábitos", url: "/habitos", icon: Target },
  { title: "Calendario", url: "/calendario", icon: Calendar },
  { title: "Noticias", url: "/noticias", icon: Newspaper },
  { title: "Fitness", url: "/fitness", icon: Dumbbell },
  { title: "Finanzas", url: "/finanzas", icon: Wallet },
  { title: "Ajustes", url: "/ajustes", icon: Settings },
];

export const SidebarApp = () => {
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";



  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menú Principal</SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="flex items-center gap-3 transition-colors"
                      activeClassName="bg-primary/20 text-primary font-semibold ring-2 ring-primary/40 rounded-md aria-[current=page]:hover:bg-primary/20 aria-[current=page]:hover:text-primary aria-[current=page]:hover:ring-primary/40"
                      pendingClassName="opacity-80"
                      onClick={() => {
                        if (window.innerWidth < 768) toggleSidebar(); // ejemplo, cerrar en pantallas < md
                      }}
                    >
                      <item.icon className="h-4 w-4" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

