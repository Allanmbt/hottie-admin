// app/admin/dashboard/page.tsx
"use client";

import { useAuth } from "@/components/auth-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function DashboardPage() {
  const { adminUser } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalContent: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // 这里可以根据你的实际数据表进行调整
        // 获取用户总数
        const { count: totalUsers } = await supabase
          .from("admin_users")
          .select("*", { count: "exact", head: true });

        // 获取活跃用户数
        const { count: activeUsers } = await supabase
          .from("admin_users")
          .select("*", { count: "exact", head: true })
          .eq("is_active", true);

        setStats({
          totalUsers: totalUsers || 0,
          activeUsers: activeUsers || 0,
          totalContent: 0, // 这里可以添加你的内容统计
        });
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (!adminUser) return null;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总用户数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? "加载中..." : stats.totalUsers}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">活跃用户</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? "加载中..." : stats.activeUsers}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总内容数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? "加载中..." : stats.totalContent}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>最近活动</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>加载中...</p>
          ) : (
            <p>暂无最近活动</p>
            // 这里可以添加你的活动列表
          )}
        </CardContent>
      </Card>
    </div>
  );
}