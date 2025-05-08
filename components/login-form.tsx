"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useFormStatus } from "react-dom"
import Image from "next/image"
import Link from "next/link"

export function Form({
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
                <Image src="/images/Nova_logo1.png" alt="Company Logo" width={260} height={55} className="mt-4" />
              </div>

              <div className="flex flex-col items-center text-center">
                <h1 className="text-2xl font-semibold text-white">Welcome to Lumin AI Lab</h1>
                <p className="text-sm text-zinc-400 mt-1">Sign in to continue to your chat</p>
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
                <div className="flex items-center">
                  <Label htmlFor="password" className="text-zinc-300">
                    Password
                  </Label>
                  <Link href="#" className="ml-auto text-sm text-zinc-400 hover:text-white transition-colors">
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  disabled={pending}
                  className="bg-transparent border-zinc-800 text-white placeholder:text-zinc-500 focus:border-white focus-visible:ring-0 focus-visible:ring-offset-0 rounded-lg"
                />
              </div>

              {children}

              <div className="relative text-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-zinc-800"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-black px-2 text-zinc-400">Or continue with</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <Button
                  variant="outline"
                  className="bg-transparent border-zinc-800 hover:bg-zinc-800/50 hover:text-white transition-colors rounded-lg"
                  type="button"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09z" />
                  </svg>
                </Button>
                <Button
                  variant="outline"
                  className="bg-transparent border-zinc-800 hover:bg-zinc-800/50 hover:text-white transition-colors rounded-lg"
                  type="button"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
                  </svg>
                </Button>
                <Button
                  variant="outline"
                  className="bg-transparent border-zinc-800 hover:bg-zinc-800/50 hover:text-white transition-colors rounded-lg"
                  type="button"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                  </svg>
                </Button>
              </div>

              <div className="text-center text-sm text-zinc-400">
                Don&apos;t have an account? <span className="text-zinc-600 cursor-not-allowed">Sign up</span>
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
