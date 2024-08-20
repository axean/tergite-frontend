import {
  Home as HomeIcon,
  Cpu,
  PanelLeftClose,
  PanelRightClose,
} from "lucide-react";
import { NavItem } from "../../../ui/nav-item";
import { Logo } from "../../../ui/logo";
import { IconButton } from "@/components/ui/button";

export function Sidebar({ isExpanded, onIsExpandedChange }: Props) {
  const widthClass = isExpanded ? "w-48" : "w-18";

  return (
    <aside
      data-testid="sidebar"
      className={`fixed inset-y-0 left-0 z-10 hidden sm:pt-1 ${widthClass} flex-col border-r bg-background sm:flex`}
    >
      <Logo isExpanded={isExpanded} />
      <nav className="flex flex-col gap-4 px-6 sm:py-4">
        <NavItem
          to="/"
          Icon={HomeIcon}
          isExpanded={isExpanded}
          text="Dashboard"
        />
        <NavItem
          to="/devices"
          Icon={Cpu}
          isExpanded={isExpanded}
          text="Devices"
        />
      </nav>

      <div className="mx-auto mt-auto py-4">
        {isExpanded && (
          <IconButton
            variant="outline"
            Icon={PanelLeftClose}
            onClick={() => onIsExpandedChange()}
          />
        )}
        {!isExpanded && (
          <IconButton
            variant="outline"
            Icon={PanelRightClose}
            onClick={() => onIsExpandedChange()}
          />
        )}
      </div>
    </aside>
  );
}

interface Props {
  isExpanded: boolean;
  onIsExpandedChange: () => void;
}
