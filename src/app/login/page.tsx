"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

// 登录表单验证schema
const loginFormSchema = z.object({
  email: z.string().email({
    message: "请输入有效的邮箱地址",
  }),
  password: z.string().min(6, {
    message: "密码至少需要6个字符",
  }),
});

// 此页面完全为客户端组件，避免混合渲染
export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof loginFormSchema>>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof loginFormSchema>) {
    setIsLoading(true);

    try {
      // 1. 使用Supabase Auth进行登录
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (authError) {
        console.error("Auth登录错误:", authError);
        toast.error(authError.message);
        setIsLoading(false);
        return;
      }

      if (!authData.user) {
        console.error("未返回用户信息");
        toast.error("登录失败，未返回用户信息");
        setIsLoading(false);
        return;
      }

      console.log("登录成功，用户ID:", authData.user.id);

      // 使用简化查询以绕过可能的RLS问题
      try {
        const { data, error } = await supabase
          .from('admin_users')
          .select('id, role')
          .eq('auth_user_id', authData.user.id);

        console.log("管理员查询结果:", data);

        if (error) {
          console.error("查询管理员表出错:", error);
          toast.error("验证权限失败: " + error.message);
          await supabase.auth.signOut();
          setIsLoading(false);
          return;
        }

        if (!data || data.length === 0) {
          console.error("用户不是管理员");
          toast.error("您没有管理员权限");
          await supabase.auth.signOut();
          setIsLoading(false);
          return;
        }

        // 通过URL参数传递一个时间戳，强制客户端完全刷新页面
        const timestamp = new Date().getTime();
        toast.success("登录成功");

        // 使用直接跳转而不是router.push
        window.location.href = `/admin/dashboard?t=${timestamp}`;
      } catch (queryError) {
        console.error("验证管理员身份时出错:", queryError);
        toast.error("验证权限时出错");
        await supabase.auth.signOut();
        setIsLoading(false);
      }
    } catch (error: any) {
      console.error("登录过程中出错:", error);
      toast.error("登录失败: " + (error.message || "未知错误"));
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">管理员登录</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>邮箱</FormLabel>
                    <FormControl>
                      <Input placeholder="admin@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>密码</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="输入密码" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "登录中..." : "登录"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}