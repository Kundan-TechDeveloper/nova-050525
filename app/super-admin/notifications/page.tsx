"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bell, UserPlus, Settings, Shield, Key, UserCog } from "lucide-react"

// Mock notifications data
const mockNotifications = [
  {
    id: 1,
    type: "user_added",
    title: "New User Added",
    description: "Moh Amir was added as a new user.",
    timestamp: "2 hours ago",
    icon: UserPlus,
  },
  {
    id: 2,
    type: "settings_changed",
    title: "Settings Updated",
    description: "System settings were updated by admin.",
    timestamp: "3 hours ago",
    icon: Settings,
  },
  {
    id: 3,
    type: "security_alert",
    title: "Security Alert",
    description: "Multiple failed login attempts detected.",
    timestamp: "5 hours ago",
    icon: Shield,
  },
  {
    id: 4,
    type: "password_changed",
    title: "Password Changed",
    description: "Admin user password was changed successfully.",
    timestamp: "1 day ago",
    icon: Key,
  },
  {
    id: 5,
    type: "user_updated",
    title: "User Profile Updated",
    description: "Sarah Wilson's profile information was updated.",
    timestamp: "1 day ago",
    icon: UserCog,
  },
]

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(mockNotifications)

  const clearAll = () => {
    setNotifications([])
  }

  const getIconColor = (type: string) => {
    switch (type) {
      case "user_added":
        return "text-emerald-500"
      case "settings_changed":
        return "text-blue-500"
      case "security_alert":
        return "text-red-500"
      case "password_changed":
        return "text-amber-500"
      case "user_updated":
        return "text-violet-500"
      default:
        return "text-zinc-500"
    }
  }

  const getBgColor = (type: string) => {
    switch (type) {
      case "user_added":
        return "bg-emerald-50"
      case "settings_changed":
        return "bg-blue-50"
      case "security_alert":
        return "bg-red-50"
      case "password_changed":
        return "bg-amber-50"
      case "user_updated":
        return "bg-violet-50"
      default:
        return "bg-zinc-50"
    }
  }

  return (
    <div className="flex-1 h-[calc(100vh-155px)] overflow-hidden message-scrollbar">
      <div className="h-full overflow-y-auto px-6">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-[22px] font-semibold text-zinc-900 tracking-tight">Notifications</h1>
              <p className="text-sm text-zinc-600">Stay updated with system activities and alerts.</p>
            </div>
            {notifications.length > 0 && (
              <Button
                onClick={clearAll}
                variant="outline"
                className="h-9 px-4 text-[13px] font-medium border-zinc-300 text-zinc-700 hover:bg-zinc-50"
              >
                Clear all
              </Button>
            )}
          </div>

          <Card className="border-zinc-200">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-zinc-900 flex items-center justify-center">
                  <Bell className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl font-semibold text-zinc-900">Recent Activity</CardTitle>
                  <CardDescription className="text-[15px] text-zinc-500">
                    Your latest notifications and system alerts.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {notifications.length === 0 ? (
                <div className="text-center py-8">
                  <Bell className="h-12 w-12 text-zinc-300 mx-auto mb-3" />
                  <h3 className="text-[15px] font-medium text-zinc-900 mb-1">No notifications</h3>
                  <p className="text-sm text-zinc-500">You're all caught up! Check back later for new updates.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {notifications.map((notification) => {
                    const Icon = notification.icon
                    return (
                      <div
                        key={notification.id}
                        className="flex items-start gap-4 p-4 rounded-lg border border-zinc-200 hover:bg-zinc-50/50 transition-colors"
                      >
                        <div
                          className={`h-10 w-10 rounded-full ${getBgColor(notification.type)} flex items-center justify-center flex-shrink-0`}
                        >
                          <Icon className={`h-5 w-5 ${getIconColor(notification.type)}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className="text-[15px] font-medium text-zinc-900">{notification.title}</h3>
                              <p className="text-sm text-zinc-600">{notification.description}</p>
                            </div>
                            <span className="text-[13px] text-zinc-500 whitespace-nowrap">
                              {notification.timestamp}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
