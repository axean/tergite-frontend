import { Cpu, HomeIcon, PanelLeft, UserRound } from "lucide-react";
import { Logo } from "../../../ui/logo";
import { NavItem } from "../../../ui/nav-item";
import { Button, IconButton } from "@/components/ui/button";
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
import { Link, useLocation } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Fragment, MouseEvent, useCallback, useContext, useMemo } from "react";
import { logout } from "@/lib/api-client";
import { useQueryClient } from "@tanstack/react-query";
import { AppStateContext } from "@/lib/app-state";

export function Topbar({
  currentProject = "",
  onProjectChange,
  projects,
}: TopbarProps) {
  const queryClient = useQueryClient();
  const appState = useContext(AppStateContext);

  const handleLogout = useCallback(
    (ev: MouseEvent) => {
      ev.preventDefault();
      logout(queryClient, appState);
    },
    [queryClient, appState]
  );
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
      <MobileMenu />

      <TopbarBreadcrumb />

      <Select value={currentProject} onValueChange={onProjectChange}>
        <SelectTrigger className="ml-auto w-fit">
          <span className="hidden sm:inline text-muted-foreground pr-1">
            Project:{" "}
          </span>
          <SelectValue placeholder="Select project" />
        </SelectTrigger>
        <SelectContent>
          {projects.map((project) => (
            <SelectItem value={project.ext_id} key={project.ext_id}>
              {project.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <IconButton
            variant="outline"
            className="rounded-full overflow-hidden focus:mr-[1px]"
            Icon={UserRound}
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Projects</DropdownMenuItem>
          <DropdownMenuItem>Tokens</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
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

function MobileMenu() {
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
        </nav>
      </SheetContent>
    </Sheet>
  );
}

function TopbarBreadcrumb() {
  const location = useLocation();
  const pathParts = useMemo(
    () => location.pathname.split("/").filter((v) => v !== ""),
    [location.pathname]
  );
  return (
    <Breadcrumb className="hidden md:flex mr-auto">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/">Dashboard</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {pathParts.map((part, idx, allParts) => (
          <Fragment key={idx}>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to={`/${allParts.slice(0, idx + 1).join("/")}`}>
                  {part}
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
