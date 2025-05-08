"use client"

import { formatDistanceToNow } from "date-fns"

interface RecentActivityProps {
  items: {
    id: string
    name: string
    status: string
    timestamp: string
    description: string
  }[]
}

export function RecentActivity({ items }: RecentActivityProps) {
  return (
    <div className="space-y-8">
      {items.slice(0, 5).map((item) => (
        <div key={item.id} className="flex items-start">
          <div className="ml-4 space-y-1">
            <p className="text-sm font-medium leading-none">{item.name}</p>
            <p className="text-sm text-muted-foreground">{item.description}</p>
            <p className="text-xs text-muted-foreground">
              Status: {item.status} • {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
