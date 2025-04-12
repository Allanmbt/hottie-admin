// app/admin/layout.tsx
"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { adminUser, isLoading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !adminUser) {
      router.push("/login");
    }
  }, [adminUser, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
          <p className="mt-2">加载中...</p>
        </div>
      </div>
    );
  }

  if (!adminUser) {
    return null; // 将由useEffect重定向
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* 侧边栏 */}
      <div className="w-64 bg-gray-900 text-white">
        <div className="p-4">
          <h2 className="text-xl font-bold">管理员面板</h2>
        </div>
        <div className="mt-4 space-y-1 px-2">
          <NavItem href="/admin/dashboard" current={pathname === "/admin/dashboard"}>
            仪表板
          </NavItem>
          <NavItem href="/admin/girls" current={pathname.startsWith("/admin/girls")}>
            技师管理
          </NavItem>
          <NavItem href="/admin/categories" current={pathname.startsWith("/admin/categories")}>
            分类管理
          </NavItem>
          <NavItem href="/admin/users" current={pathname.startsWith("/admin/users")}>
            用户管理
          </NavItem>
          <NavItem href="/admin/settings" current={pathname.startsWith("/admin/settings")}>
            系统设置
          </NavItem>
        </div>
        {/* <div className="absolute bottom-4 left-4 right-4">
          <div className="mb-2 flex items-center space-x-2 rounded-md bg-gray-800 p-2">
            <div className="h-8 w-8 rounded-full bg-primary text-center">
              {adminUser.username?.charAt(0).toUpperCase() || "A"}
            </div>
            <div className="flex-1 truncate">
              <p className="text-sm font-medium">{adminUser.username}</p>
              <p className="text-xs text-gray-400">{adminUser.email}</p>
            </div>
          </div>
        </div> */}
      </div>

      {/* 主内容区 */}
      <div className="flex-1">
        <header className="border-b bg-white px-6 py-3 shadow-sm">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">{getPageTitle(pathname)}</h1>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">
                欢迎, {adminUser.username}
              </span>
              <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center mr-3">
                {adminUser.username?.charAt(0).toUpperCase() || "A"}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={signOut}
                className="flex items-center gap-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
                退出
              </Button>
            </div>
          </div>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}

function NavItem({
  href,
  current,
  children,
}: {
  href: string;
  current: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`block rounded-md px-3 py-2 text-sm ${current
        ? "bg-gray-700 text-white"
        : "text-gray-300 hover:bg-gray-700 hover:text-white"
        }`}
    >
      {children}
    </Link>
  );
}

function getPageTitle(pathname: string): string {
  if (pathname === "/admin/dashboard") return "仪表板";
  if (pathname.startsWith("/admin/users")) return "用户管理";
  if (pathname.startsWith("/admin/content")) return "内容管理";
  if (pathname.startsWith("/admin/settings")) return "系统设置";
  return "管理系统";
}