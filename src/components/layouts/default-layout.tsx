import { TooltipProvider } from "../ui/tooltip";
import { Sidebar } from "../sections/sidebar";
import { Topbar, TopbarProps, TopbarMenu } from "../sections/topbar";
import { TopBanner } from "../sections/top-banner";

export function DefaultLayout({
  children,
  ...topbarProps
}: React.PropsWithChildren<Props>) {
  return (
    <TooltipProvider>
      <div className="flex min-h-screen w-full flex-col bg-muted/40">
        <TopbarMenu />
        <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-48">
          <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
            <Sidebar />
            <Topbar {...topbarProps} />
          </header>

          <TopBanner />
          {children}
        </div>
      </div>
    </TooltipProvider>
  );
}
interface Props extends TopbarProps {}
