import * as React from "react";
import { LucideProps } from "lucide-react";
import { Link } from "react-router-dom";

export function NavItem({
  to,
  isActive = false,
  isBig = false,
  Icon,
  text,
}: Props) {
  const colorsClass = React.useMemo(
    () =>
      isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground",
    [isActive]
  );

  const sizeClass = React.useMemo(() => {
    return isBig
      ? {
          icon: "font-medium h-5 w-5",
          text: "text-lg font-medium",
          gap: "gap-4",
        }
      : { icon: "h-4 w-4", text: "text-sm", gap: "gap-2" };
  }, [isBig]);

  return (
    <Link
      to={to}
      className={`flex h-9 px-2 items-center ${colorsClass} rounded-md  transition-colors hover:text-foreground`}
    >
      <div className={`flex ${sizeClass.gap} items-center`}>
        <Icon className={sizeClass.icon} />
        <span className={sizeClass.text}>{text}</span>
        <span className="sr-only">{text}</span>
      </div>
    </Link>
  );
}

interface Props {
  to: string;
  text: string;
  isActive?: boolean;
  isBig?: boolean;
  Icon: React.ForwardRefExoticComponent<
    Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>
  >;
}
