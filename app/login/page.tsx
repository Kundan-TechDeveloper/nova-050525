"use client"

import { Form } from "@/components/login-form"
import { SubmitButton } from "@/components/login-submit-button"
import { useRouter } from "next/navigation"
import toast, { Toaster } from "react-hot-toast"
import { validateCredentials } from "../../lib/actions"
import { signIn } from "next-auth/react"

export default function LoginPage() {
  const router = useRouter()

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-900 p-4">
      <Toaster position="top-center" />
      <Form
        action={async (formData: FormData) => {
          const loadingToast = toast.loading("Signing in...")
          try {
            const email = formData.get("email") as string
            const password = formData.get("password") as string

            // First validate credentials on server
            const validationResult = await validateCredentials(email, password)

            if (validationResult.error) {
              toast.error(validationResult.error, { id: loadingToast })
              return { error: validationResult.error }
            }

            // If credentials are valid, sign in with NextAuth
            const result = await signIn("credentials", {
              email,
              password,
              callbackUrl: "/chat",
              redirect: true,
            })

            // The code below won't run since we're using redirect: true
            if (result?.error) {
              toast.error("Failed to sign in", { id: loadingToast })
              return { error: "Authentication failed" }
            }

            // toast.success('Signed in successfully!', { id: loadingToast });
          } catch (error) {
            toast.error("Something went wrong", { id: loadingToast })
            return { error: "Failed to sign in" }
          }
        }}
      >
        <SubmitButton>Login</SubmitButton>
      </Form>
    </div>
  )
}
