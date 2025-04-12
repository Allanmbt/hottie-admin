// app/admin/users/page.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/components/auth-provider";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type AdminUser = {
  id: string;
  email: string;
  username: string;
  created_at: string;
  last_login: string | null;
  is_active: boolean;
  role: string;
};

export default function UsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { adminUser } = useAuth(); // 获取当前登录用户信息
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);

  useEffect(() => {
   // 获取当前用户角色
   async function getCurrentUserRole() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) return null;
      
      const { data, error } = await supabase
        .from('admin_users')
        .select('role')
        .eq('auth_user_id', session.user.id)
        .single();
        
      if (error || !data) return null;
      
      setCurrentUserRole(data.role);
    } catch (error) {
      console.error("获取用户角色失败:", error);
      return null;
    }
  }
  
  getCurrentUserRole();
  fetchUsers();
}, []);

  async function fetchUsers() {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("admin_users")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      let filteredUsers = data || [];
       // 如果是普通管理员，过滤掉超级管理员
       if (currentUserRole === 'admin') {
        // 普通管理员只能看到普通管理员
        filteredUsers = filteredUsers.filter(user => user.role !== 'super_admin');
      }

      setUsers(data || []);
    } catch (error: any) {
      toast.error("获取用户列表失败: " + error.message);
    } finally {
      setIsLoading(false);
    }
  }

   // 当角色变化时重新获取用户列表
   useEffect(() => {
    if (currentUserRole) {
      fetchUsers();
    }
  }, [currentUserRole]);

  async function toggleUserStatus(id: string, currentStatus: boolean) {
    try {
      const { error } = await supabase
        .from("admin_users")
        .update({ is_active: !currentStatus })
        .eq("id", id);

      if (error) throw error;
      
      setUsers(users.map(user => 
        user.id === id ? {...user, is_active: !currentStatus} : user
      ));
      
      toast.success(`用户状态已${!currentStatus ? '启用' : '禁用'}`);
    } catch (error: any) {
      toast.error("更新用户状态失败: " + error.message);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <h2 className="text-xl font-bold">管理员用户列表</h2>
        <Button variant="outline" onClick={fetchUsers} disabled={isLoading}>
          刷新
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>用户名</TableHead>
              <TableHead>邮箱</TableHead>
              <TableHead>角色</TableHead>
              <TableHead>创建时间</TableHead>
              <TableHead>最后登录</TableHead>
              <TableHead>状态</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  加载中...
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  暂无用户数据
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.username}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.role}</TableCell>
                  <TableCell>
                    {new Date(user.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {user.last_login
                      ? new Date(user.last_login).toLocaleString()
                      : "从未登录"}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                        user.is_active
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {user.is_active ? "活跃" : "禁用"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    {/* 如果当前用户是admin且目标用户是super_admin，禁用操作 */}
                    {currentUserRole === 'admin' && user.role === 'super_admin' ? (
                      <Button variant="outline" size="sm" disabled>
                        无权限
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleUserStatus(user.id, user.is_active)}
                      >
                        {user.is_active ? "禁用" : "启用"}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}