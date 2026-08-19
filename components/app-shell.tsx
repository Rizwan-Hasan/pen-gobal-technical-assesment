"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  ClipboardList,
  FileUp,
  House,
  LayoutDashboard,
  Menu,
  Receipt,
  ScrollText,
  Users,
  X,
} from "lucide-react";
import { setActingStudent, switchToStaff, switchToStudent } from "@/app/actions/role";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import type { SessionContext } from "@/lib/role";
import { cn } from "@/lib/utils";

type NavLink = {
  href: string;
  label: string;
  Icon: typeof House;
  exact?: boolean;
};

const staffLinks: NavLink[] = [
  { href: "/dashboard", label: "Dashboard", Icon: LayoutDashboard, exact: true },
  { href: "/students", label: "Students", Icon: Users },
  { href: "/programmes", label: "Programmes", Icon: BookOpen },
  { href: "/assessments", label: "Assessments", Icon: ClipboardList },
];

const studentLinks: NavLink[] = [
  { href: "/student", label: "Overview", Icon: House, exact: true },
  { href: "/student/fees", label: "Fees", Icon: Receipt },
  { href: "/student/assessments", label: "Assessments", Icon: FileUp },
  { href: "/student/marksheet", label: "Marksheet", Icon: ScrollText },
];

function Wordmark({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span className="record grid size-8 place-items-center rounded-md bg-brand font-semibold text-on-brand">
        SMS
      </span>
      <span className="leading-tight">
        <span className="block font-[family-name:var(--font-display)] text-lg text-ink">
          Registry
        </span>
        <span className="eyebrow block text-[0.625rem]">Student records</span>
      </span>
    </div>
  );
}

function RoleSwitch({ role }: { role: SessionContext["role"] }) {
  const pill =
    "w-full rounded-md px-2 py-1.5 text-xs font-medium transition-colors";
  return (
    <div>
      <p className="eyebrow">Viewing as</p>
      <div className="mt-2 grid grid-cols-2 gap-1 rounded-lg border border-line bg-elevated p-1">
        <form action={switchToStaff}>
          <button
            type="submit"
            aria-pressed={role === "STAFF"}
            className={cn(
              pill,
              role === "STAFF"
                ? "bg-surface text-ink shadow-card"
                : "text-ink-muted hover:text-ink",
            )}
          >
            Registry staff
          </button>
        </form>
        <form action={switchToStudent}>
          <button
            type="submit"
            aria-pressed={role === "STUDENT"}
            className={cn(
              pill,
              role === "STUDENT"
                ? "bg-surface text-ink shadow-card"
                : "text-ink-muted hover:text-ink",
            )}
          >
            Student
          </button>
        </form>
      </div>
    </div>
  );
}

function SidebarBody({
  session,
  students,
  pathname,
}: {
  session: SessionContext;
  students: Array<{ id: string; studentId: string; fullName: string }>;
  pathname: string;
}) {
  const staff = session.role === "STAFF";
  const links = staff ? staffLinks : studentLinks;

  return (
    <>
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <p className="eyebrow px-2 pb-2">{staff ? "Registry" : "My records"}</p>
        <ul className="space-y-0.5">
          {links.map(({ href, label, Icon, exact }) => {
            const active = exact
              ? pathname === href
              : pathname === href || pathname.startsWith(`${href}/`);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
                    active
                      ? "bg-brand-soft font-medium text-brand-ink before:absolute before:inset-y-1.5 before:left-0 before:w-0.5 before:rounded-full before:bg-brand"
                      : "text-ink-muted hover:bg-elevated hover:text-ink",
                  )}
                >
                  <Icon className="size-4 shrink-0" aria-hidden />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="space-y-4 border-t border-line px-4 py-4">
        <RoleSwitch role={session.role} />

        {session.role === "STUDENT" && (
          <form action={setActingStudent} className="space-y-2">
            <label className="eyebrow block" htmlFor="acting-student">
              Acting as
            </label>
            <Select
              id="acting-student"
              name="studentId"
              defaultValue={session.actingStudentId ?? undefined}
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.studentId} — {s.fullName}
                </option>
              ))}
            </Select>
            <Button type="submit" variant="secondary" size="sm" className="w-full">
              Switch student
            </Button>
          </form>
        )}

        <div className="flex items-center justify-between gap-2">
          <span className="eyebrow">Appearance</span>
          <ThemeToggle />
        </div>
      </div>
    </>
  );
}

export function AppShell({
  session,
  students,
  children,
}: {
  session: SessionContext;
  students: Array<{ id: string; studentId: string; fullName: string }>;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [navigatedFrom, setNavigatedFrom] = useState(pathname);

  // Navigating closes the drawer — adjusted during render, not in an effect.
  if (navigatedFrom !== pathname) {
    setNavigatedFrom(pathname);
    setMenuOpen(false);
  }

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[17rem_minmax(0,1fr)]">
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-line bg-surface/90 px-4 py-2.5 backdrop-blur lg:hidden">
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-label="Open navigation"
          aria-expanded={menuOpen}
          className="grid size-9 place-items-center rounded-lg border border-line text-ink-muted hover:bg-elevated hover:text-ink"
        >
          <Menu className="size-4" aria-hidden />
        </button>
        <Wordmark />
        <ThemeToggle className="ml-auto" />
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setMenuOpen(false)}
            className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]"
          />
          <div className="absolute inset-y-0 left-0 flex w-[17rem] max-w-[85%] flex-col border-r border-line bg-surface shadow-float">
            <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-3">
              <Wordmark />
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label="Close navigation"
                className="grid size-8 place-items-center rounded-lg text-ink-faint hover:bg-elevated hover:text-ink"
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>
            <SidebarBody
              session={session}
              students={students}
              pathname={pathname}
            />
          </div>
        </div>
      )}

      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-line bg-surface lg:flex">
        <div className="border-b border-line px-4 py-4">
          <Wordmark />
        </div>
        <SidebarBody session={session} students={students} pathname={pathname} />
      </aside>

      <main className="min-w-0 px-4 py-8 sm:px-6 lg:px-10 lg:py-12">
        <div className="mx-auto w-full max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
