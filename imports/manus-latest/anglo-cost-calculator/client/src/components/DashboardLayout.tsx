import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Bolt, FileText, LogOut, PanelLeft } from "lucide-react";
import { type CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
import { Button } from "./ui/button";

const menuItems = [{ icon: FileText, label: "Quote Console", path: "/" }];
const logoUrl = "https://d2xsxph8kpxj0f.cloudfront.net/310519663395163475/KqvsntT7BTuX9cKkgSoajt/Anglo_LOGO_eccf0518.png";
const wallpaperUrl = "https://d2xsxph8kpxj0f.cloudfront.net/310519663395163475/KqvsntT7BTuX9cKkgSoajt/WALLPAPERANGLO_7a6115dc.png";

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 220;
const MIN_WIDTH = 196;
const MAX_WIDTH = 288;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) {
    return <DashboardLayoutSkeleton />;
  }

  if (!user) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-6 py-10">
        <div
          className="absolute inset-0 opacity-14"
          style={{
            backgroundImage: `linear-gradient(180deg, rgba(5, 5, 5, 0.88), rgba(5, 5, 5, 0.72)), url(${wallpaperUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,208,0,0.2),_transparent_36%),linear-gradient(135deg,_rgba(255,208,0,0.08),_transparent_40%)]" />
        <div className="hud-panel relative z-10 flex w-full max-w-xl flex-col gap-6 p-7 md:p-9">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl border border-primary/35 bg-[#111111]/90 p-2 shadow-[0_0_24px_rgba(255,208,0,0.12)]">
              <img src={logoUrl} alt="Anglo Windows" className="h-14 w-auto rounded-lg object-contain" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.38em] text-primary">Anglo Windows</p>
              <p className="mt-1 font-display text-xl uppercase tracking-[0.16em] text-foreground">Estimator Access</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/35 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-primary">
              <Bolt className="h-3.5 w-3.5" />
              Internal quoting
            </div>
            <h1 className="font-display text-3xl uppercase tracking-[0.14em] text-foreground md:text-4xl">
              Sign in to the master calculator
            </h1>
            <p className="max-w-lg text-sm leading-7 text-muted-foreground md:text-base">
              Reception, sales, and estimating staff can upload source documents, build manual quotes, review saved jobs, and export branded Anglo Windows outputs from one calmer workspace.
            </p>
          </div>
          <Button
            onClick={() => {
              window.location.href = getLoginUrl();
            }}
            size="lg"
            className="neon-button h-12 text-base"
          >
            Launch secure login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": `${sidebarWidth}px`,
        } as CSSProperties
      }
    >
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>{children}</DashboardLayoutContent>
    </SidebarProvider>
  );
}

type DashboardLayoutContentProps = {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
};

function DashboardLayoutContent({
  children,
  setSidebarWidth,
}: DashboardLayoutContentProps) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const activeMenuItem = menuItems.find(item => item.path === location);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isCollapsed) {
      setIsResizing(false);
    }
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar
          collapsible="icon"
          className="border-r border-sidebar-border/70 bg-sidebar/96 backdrop-blur-xl"
          disableTransition={isResizing}
        >
          <SidebarHeader className="h-auto border-b border-sidebar-border/60 px-3 py-3.5">
            <div className="flex items-center gap-2.5 px-2 transition-all w-full">
              {isMobile ? (
                <button
                  onClick={toggleSidebar}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-primary/30 bg-black/40 transition-colors hover:bg-primary/12 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Toggle navigation"
                >
                  <PanelLeft className="h-4 w-4 text-primary" />
                </button>
              ) : (
                <SidebarTrigger
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-primary/30 bg-black/40 text-primary transition-colors hover:bg-primary/12 focus-visible:ring-2 focus-visible:ring-ring"
                />
              )}
              <div className="flex min-w-0 items-center gap-2.5 group-data-[collapsible=icon]:hidden">
                <div className="rounded-2xl border border-primary/30 bg-primary/12 p-1 shadow-[0_0_18px_rgba(255,208,0,0.1)]">
                  <img src={logoUrl} alt="Anglo Windows" className="h-9 w-auto rounded-xl object-contain" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[10px] font-semibold uppercase tracking-[0.3em] text-primary/85">Anglo Windows</p>
                  <p className="mt-1 truncate font-display text-base uppercase tracking-[0.12em] text-foreground">Master Calculator</p>
                </div>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0 px-2 py-4">
            <div
              className="mb-4 hidden rounded-3xl border border-primary/18 bg-black/50 p-4 2xl:block group-data-[collapsible=icon]:hidden"
              style={{
                backgroundImage: `linear-gradient(180deg, rgba(8, 8, 8, 0.9), rgba(8, 8, 8, 0.82)), url(${wallpaperUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              <p className="text-[11px] uppercase tracking-[0.34em] text-primary">Estimator workflow</p>
              <h2 className="mt-2 font-display text-xl uppercase tracking-[0.14em] text-foreground">
                Fast internal quoting
              </h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Start from a document upload or manual capture, complete unit pricing, and export polished Anglo Windows quotes from one workspace.
              </p>
            </div>
            <SidebarMenu className="px-1 py-1">
              {menuItems.map(item => {
                const isActive = location === item.path;
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => setLocation(item.path)}
                      tooltip={item.label}
                      className="h-11 rounded-xl border border-transparent px-3 font-medium transition-all data-[active=true]:border-primary/35 data-[active=true]:bg-primary/12 data-[active=true]:text-primary"
                    >
                      <item.icon className={`h-4 w-4 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="border-t border-sidebar-border/60 p-3">
            <div className="rounded-2xl border border-sidebar-border/60 bg-black/35 p-3 group-data-[collapsible=icon]:p-2">
              <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
                <Avatar className="h-10 w-10 shrink-0 border border-primary/35 bg-primary/10">
                  <AvatarFallback className="bg-transparent text-sm font-semibold text-primary">
                    {user?.name?.charAt(0).toUpperCase() || "A"}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
                  <p className="truncate text-sm font-medium text-foreground">{user?.name || "-"}</p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">{user?.email || "-"}</p>
                </div>
              </div>
              <Button
                variant="outline"
                className="mt-3 h-9 w-full border-primary/30 bg-primary/8 text-primary hover:bg-primary/14 hover:text-primary group-data-[collapsible=icon]:mt-2 group-data-[collapsible=icon]:px-0"
                onClick={logout}
              >
                <LogOut className="h-4 w-4" />
                <span className="ml-2 group-data-[collapsible=icon]:hidden">Sign out</span>
              </Button>
            </div>
          </SidebarFooter>
        </Sidebar>
        <div
          className={`absolute top-0 right-0 h-full w-1 cursor-col-resize transition-colors hover:bg-primary/30 ${isCollapsed ? "hidden" : ""}`}
          onMouseDown={() => {
            if (isCollapsed) return;
            setIsResizing(true);
          }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset className="bg-background/96">
        {isMobile && (
          <div className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border/70 bg-background/90 px-3 backdrop-blur-xl supports-[backdrop-filter]:bg-background/78">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="h-9 w-9 rounded-lg border border-primary/30 bg-black/45 text-primary" />
              <div className="flex flex-col gap-1">
                <span className="text-[11px] uppercase tracking-[0.28em] text-primary">Anglo Windows</span>
                <span className="text-sm tracking-[0.14em] text-foreground">{activeMenuItem?.label ?? "Menu"}</span>
              </div>
            </div>
          </div>
        )}
        <main className="min-h-screen flex-1 p-3 md:p-5 xl:p-6">{children}</main>
      </SidebarInset>
    </>
  );
}
