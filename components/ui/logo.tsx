"use client"

import Image from "next/image"
import Link from "next/link"

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2">
      <div className="relative ">
        <Image
          src="/images/logo_white.png"
          alt="ChatAI Logo"
          width={250}
          height={250}
          className="object-contain"
          priority
        />
      </div>
    </Link>
  )
}
