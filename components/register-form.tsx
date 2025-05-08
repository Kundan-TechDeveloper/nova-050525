"use client"

import type React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useFormStatus } from "react-dom"
import Image from "next/image"
import Link from "next/link"

export function RegisterForm({
  action,
  children,
}: {
  action: any
  children: React.ReactNode
}) {
  const { pending } = useFormStatus()

  return (
    <div className="flex flex-col gap-6 w-[460px]">
      <Card className="overflow-hidden border border-zinc-800 bg-black rounded-2xl">
        <CardContent className="p-0">
          <form action={action} className="p-8">
            <div className="flex flex-col gap-6">
              {/* Logo */}
              <div className="flex justify-center mb-2">
                <Image src="/images/logo_white.png" alt="Company Logo" width={260} height={55} className="mt-4" />
              </div>

              <div className="flex flex-col items-center text-center">
                <h1 className="text-2xl font-semibold text-white">Create account</h1>
                <p className="text-sm text-zinc-400 mt-1">Join our chat community today</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="firstName" className="text-zinc-300">
                    First Name
                  </Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    type="text"
                    placeholder="John"
                    required
                    disabled={pending}
                    className="bg-transparent border-zinc-800 text-white placeholder:text-zinc-500 focus:border-white focus-visible:ring-0 focus-visible:ring-offset-0 rounded-lg"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="lastName" className="text-zinc-300">
                    Last Name
                  </Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    type="text"
                    placeholder="Doe"
                    required
                    disabled={pending}
                    className="bg-transparent border-zinc-800 text-white placeholder:text-zinc-500 focus:border-white focus-visible:ring-0 focus-visible:ring-offset-0 rounded-lg"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-zinc-300">
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  required
                  disabled={pending}
                  className="bg-transparent border-zinc-800 text-white placeholder:text-zinc-500 focus:border-white focus-visible:ring-0 focus-visible:ring-offset-0 rounded-lg"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-zinc-300">
                  Password
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="********"
                  required
                  disabled={pending}
                  className="bg-transparent border-zinc-800 text-white placeholder:text-zinc-500 focus:border-white focus-visible:ring-0 focus-visible:ring-offset-0 rounded-lg"
                />
              </div>

              {children}

              <div className="text-center text-sm text-zinc-400">
                Already have an account?{" "}
                <Link href="/login" className="text-white hover:underline">
                  Sign in
                </Link>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
      <div className="text-center text-xs text-zinc-500">
        By clicking continue, you agree to our{" "}
        <Link href="#" className="text-zinc-400 hover:text-white">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link href="#" className="text-zinc-400 hover:text-white">
          Privacy Policy
        </Link>
        .
      </div>
    </div>
  )
}
