import {
  Home as HomeIcon,
  Cpu,
  PanelLeftClose,
  PanelRightClose,
  Settings2,
  HardHat,
  HelpingHand,
} from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { Button, IconButton } from "@/components/ui/button";
import { useState } from "react";
import { Collapsible, CollapsibleTrigger } from "@/components/ui/collapsible";
import { CollapsibleContent } from "@radix-ui/react-collapsible";
import { NavItem } from "@/components/ui/nav-item";
import { Badge } from "@/components/ui/badge";

export function Sidebar({
  isExpanded,
  onIsExpandedChange,
  isUserAdmin,
  pendingRequestsCount,
}: Props) {
  const widthClass = isExpanded ? "w-48" : "w-18";
  const [isAdminOpen, setIsAdminOpen] = useState(true);

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
        {isUserAdmin && (
          <Collapsible
            open={isAdminOpen}
            onOpenChange={setIsAdminOpen}
            className="w-full"
          >
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className={`flex text-sm gap-2 h-9 px-2 justify-start rounded-sm  transition-colors text-muted-foreground active:text-accent-foreground hover:text-foreground w-full`}
              >
                <Settings2 className="h-4 w-4" />
                {isExpanded ? "Admin" : null}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="flex flex-col gap-4 my-4 ml-4 -mr-4">
              <NavItem
                Icon={HelpingHand}
                to="/admin-requests"
                isExpanded={isExpanded}
                text="Requests"
              >
                {" "}
                {!!pendingRequestsCount && (
                  <Badge variant="default">{pendingRequestsCount}</Badge>
                )}
              </NavItem>
              <NavItem
                Icon={HardHat}
                to="/admin-projects"
                isExpanded={isExpanded}
                text="Projects"
              />
            </CollapsibleContent>
          </Collapsible>
        )}
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
  pendingRequestsCount: number;
  isUserAdmin: boolean;
}
