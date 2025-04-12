// src/app/page.tsx
"use client";

import { redirect } from "next/navigation";

export default async function Home() {
  redirect("/admin/dashboard");

}
