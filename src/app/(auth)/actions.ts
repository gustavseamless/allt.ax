"use server";

import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { signIn, signOut } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

const loginSchema = z.object({
  email: z.string().email("Ogiltig e-postadress"),
  password: z.string().min(6, "Lösenordet är minst 6 tecken"),
});

const registerSchema = loginSchema.extend({
  name: z.string().min(2, "Ange ditt namn").max(100),
});

export async function loginAction(_prev: { error?: string } | undefined, formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  const rl = rateLimit(`login:${parsed.data.email.toLowerCase()}`, { limit: 10, windowMs: 60_000 });
  if (!rl.ok) return { error: "För många inloggningsförsök – vänta en stund." };

  try {
    await signIn("credentials", {
      email: parsed.data.email.toLowerCase(),
      password: parsed.data.password,
      redirect: false,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Fel e-postadress eller lösenord." };
    }
    throw error;
  }
  redirect("/panel");
}

export async function registerAction(_prev: { error?: string } | undefined, formData: FormData) {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  const rl = rateLimit("register", { limit: 20, windowMs: 60_000 });
  if (!rl.ok) return { error: "För många registreringar just nu – försök igen om en stund." };

  const email = parsed.data.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "Det finns redan ett konto med den e-postadressen." };
  }

  await prisma.user.create({
    data: {
      name: parsed.data.name.trim(),
      email,
      passwordHash: await bcrypt.hash(parsed.data.password, 10),
      role: "USER",
    },
  });

  try {
    await signIn("credentials", { email, password: parsed.data.password, redirect: false });
  } catch {
    redirect("/logga-in");
  }
  redirect("/panel");
}

export async function logoutAction() {
  await signOut({ redirectTo: "/" });
}

/** GDPR: users can delete their own account and associated claims. */
export async function deleteAccountAction() {
  const { getSessionUser } = await import("@/lib/auth");
  const user = await getSessionUser();
  if (!user) redirect("/logga-in");
  await prisma.$transaction([
    prisma.business.updateMany({
      where: { claimedByUserId: user.id },
      data: { claimedByUserId: null },
    }),
    prisma.user.delete({ where: { id: user.id } }),
  ]);
  await signOut({ redirectTo: "/" });
}
