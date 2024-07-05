import { Cpu, FlaskRound, HomeIcon } from "lucide-react";
import { Logo } from "../ui/logo";
import { NavItem } from "../ui/nav-item";
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
import { ProjectDetail } from "@/lib/types";

export function Topbar({
  currentProject = "",
  onProjectChange,
  pageTitle,
  projects,
}: TopbarProps) {
  return (
    <>
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
    </>
  );
}

export interface TopbarProps {
  currentProject?: string;
  pageTitle: string;
  projects: ProjectDetail[];
  onProjectChange: (projectExtId: string) => void;
}

export function TopbarMenu({}: TopbarMenuProps) {
  return (
    <aside className="fixed inset-y-0 left-0 z-10 hidden w-48 flex-col border-r bg-background sm:flex">
      <Logo />
      <nav className="flex flex-col gap-4 px-6 sm:py-4">
        <NavItem to="/" Icon={HomeIcon} text="Dashboard" />
        <NavItem to="/devices" isActive={true} Icon={Cpu} text="Devices" />
        <NavItem to="/jobs" Icon={FlaskRound} text="Jobs" />
      </nav>
    </aside>
  );
}

interface TopbarMenuProps {}
