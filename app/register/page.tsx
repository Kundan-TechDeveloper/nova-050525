"use client"

import { RegisterForm } from "@/components/register-form"
import { useRouter } from "next/navigation"
import { SubmitButton } from "@/components/login-submit-button"
import toast, { Toaster } from "react-hot-toast"
import { registerUser } from "../../lib/actions"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"

function RegisterContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const organizationId = searchParams.get("organizationId")

  async function register(formData: FormData) {
    const loadingToast = toast.loading("Creating your account...")
    try {
      const email = formData.get("email") as string
      const password = formData.get("password") as string
      const firstName = formData.get("firstName") as string
      const lastName = formData.get("lastName") as string

      const result = await registerUser(email, password, firstName, lastName, organizationId || undefined)

      if (result.error) {
        toast.error(result.error, { id: loadingToast })
        return result.error
      }

      toast.success("Account created successfully!", { id: loadingToast })
      router.push("/login")
    } catch (error) {
      toast.error("Something went wrong", { id: loadingToast })
      return "Failed to create account"
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-900 p-4">
      <Toaster position="top-center" />
      <RegisterForm action={register}>
        <SubmitButton>Create Account</SubmitButton>
      </RegisterForm>
    </div>
  )
}

export default function Register() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-zinc-900 p-4">
          <div className="text-white">Loading...</div>
        </div>
      }
    >
      <RegisterContent />
    </Suspense>
  )
}
