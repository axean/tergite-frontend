import { Home as HomeIcon, Cpu } from "lucide-react";
import { NavItem } from "../../../ui/nav-item";
import { Logo } from "../../../ui/logo";

export function Sidebar({}: Props) {
  return (
    <aside className="fixed inset-y-0 left-0 z-10 hidden w-48 flex-col border-r bg-background sm:flex">
      <Logo />
      <nav className="flex flex-col gap-4 px-6 sm:py-4">
        <NavItem to="/" Icon={HomeIcon} text="Dashboard" />
        <NavItem to="/devices" Icon={Cpu} text="Devices" />
      </nav>
    </aside>
  );
}

interface Props {}
