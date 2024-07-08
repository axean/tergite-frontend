import { Cpu, FlaskRound, HomeIcon, PanelLeft } from "lucide-react";
import { Logo } from "../../../ui/logo";
import { NavItem } from "../../../ui/nav-item";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Project } from "@/lib/types";
import { Sheet, SheetContent, SheetTrigger } from "../../../ui/sheet";
import { useLocation } from "react-router-dom";

export function Topbar({
  currentProject = "",
  onProjectChange,
  projects,
}: TopbarProps) {
  const location = useLocation();
  const pageTitle = location.pathname.slice(1) || "Dashboard";

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
      <MobileMenu />

      <div className="mr-auto capitalize">{pageTitle}</div>

      <Select value={currentProject} onValueChange={onProjectChange}>
        <SelectTrigger className="w-fit">
          <span className="hidden sm:inline text-muted-foreground pr-1">
            Project:{" "}
          </span>
          <SelectValue placeholder="Select project" />
        </SelectTrigger>
        <SelectContent>
          {projects.map((project) => (
            <SelectItem value={project.extId} key={project.extId}>
              {project.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="overflow-hidden rounded-full"
          >
            <img
              src="/placeholder-user.jpg"
              width={36}
              height={36}
              alt="Avatar"
              className="overflow-hidden rounded-full"
            />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Projects</DropdownMenuItem>
          <DropdownMenuItem>Tokens</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Logout</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}

interface TopbarProps {
  currentProject?: string;
  projects: Project[];
  onProjectChange: (projectExtId: string) => void;
}

function MobileMenu({}: MobileMenuProps) {
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
          <NavItem to="/devices" Icon={Cpu} text="Devices" isBig={true} />
          <NavItem to="/jobs" Icon={FlaskRound} text="Jobs" isBig={true} />
        </nav>
      </SheetContent>
    </Sheet>
  );
}

interface MobileMenuProps {}
