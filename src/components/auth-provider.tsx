"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";

type AdminUser = {
  id: string;
  email: string;
  username: string;
  role: string;
};

type AuthContextType = {
  adminUser: AdminUser | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  adminUser: null,
  isLoading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    async function checkAuth() {
      try {
        // 获取当前会话
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          setAdminUser(null);
          setIsLoading(false);
          
          // 如果尝试访问管理页面但未登录，重定向到登录页面
          if (pathname.startsWith('/admin') && pathname !== '/login') {
            router.push('/login');
          }
          return;
        }
        
        // 查询admin_users表获取管理员信息
        const { data, error } = await supabase
          .from('admin_users')
          .select('*')
          .eq('auth_user_id', session.user.id)
          .eq('is_active', true)
          .single();
        
        if (error || !data) {
          setAdminUser(null);
          // 如果不是管理员，登出
          await supabase.auth.signOut();
          
          if (pathname.startsWith('/admin')) {
            toast.error("您没有管理员权限");
            router.push('/login');
          }
        } else {
          setAdminUser({
            id: data.id,
            email: data.email,
            username: data.username,
            role: data.role,
          });
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setAdminUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    checkAuth();

    // 设置auth状态监听
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN") {
          checkAuth();
        } else if (event === "SIGNED_OUT") {
          setAdminUser(null);
          if (pathname.startsWith('/admin')) {
            router.push('/login');
          }
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [pathname, router]);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("已成功登出");
      router.push('/login');
    } catch (error) {
      toast.error("登出失败");
      console.error("Logout error:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ adminUser, isLoading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);