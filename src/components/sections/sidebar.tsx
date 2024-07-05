import { Home as HomeIcon, PanelLeft, Cpu, FlaskRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { NavItem } from "../ui/nav-item";
import { Logo } from "../ui/logo";

export function Sidebar({}: Props) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button size="icon" variant="outline" className="sm:hidden">
          <PanelLeft className="h-5 w-5" />
          <span className="sr-only">Toggle Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="sm:max-w-xs">
        <Logo />
        <nav className="grid gap-6 text-lg font-medium">
          <NavItem to="/" Icon={HomeIcon} text="Dashboard" isBig={true} />
          <NavItem
            to="/devices"
            isActive={true}
            Icon={Cpu}
            text="Devices"
            isBig={true}
          />
          <NavItem to="/jobs" Icon={FlaskRound} text="Jobs" isBig={true} />
        </nav>
      </SheetContent>
    </Sheet>
  );
}
interface Props {}
