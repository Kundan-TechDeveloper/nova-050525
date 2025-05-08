"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { toast } from "react-hot-toast"
import { Bell, Globe, Lock } from "lucide-react"

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(false)

  const handleSaveSettings = async () => {
    setIsLoading(true)
    // Simulating API call
    await new Promise((resolve) => setTimeout(resolve, 1000))
    toast.success("Settings saved successfully")
    setIsLoading(false)
  }

  return (
    <div className="flex-1 h-[calc(100vh-155px)] overflow-hidden message-scrollbar">
      <div className="h-full overflow-y-auto px-6">
        <div className="max-w-5xl mx-auto space-y-6">
          <div>
            <h1 className="text-[22px] font-semibold text-zinc-900 tracking-tight">Settings</h1>
            <p className="text-sm text-zinc-600">Manage your account settings and preferences.</p>
          </div>

          <div className="grid gap-6">
            {/* Security Settings */}
            <Card className="border-zinc-200">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-zinc-900 flex items-center justify-center">
                    <Lock className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-semibold text-zinc-900">Security</CardTitle>
                    <CardDescription className="text-[15px] text-zinc-500">
                      Manage your security preferences and authentication methods.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium text-zinc-900">Two-Factor Authentication</Label>
                      <p className="text-[13px] text-zinc-500">Add an extra layer of security to your account.</p>
                    </div>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium text-zinc-900">Activity Logging</Label>
                      <p className="text-[13px] text-zinc-500">Log all account activities for security.</p>
                    </div>
                    <Switch checked={true} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card className="border-zinc-200">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-zinc-900 flex items-center justify-center">
                    <Bell className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-semibold text-zinc-900">Notifications</CardTitle>
                    <CardDescription className="text-[15px] text-zinc-500">
                      Configure how you receive notifications and updates.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium text-zinc-900">Email Notifications</Label>
                      <p className="text-[13px] text-zinc-500">Receive notifications via email.</p>
                    </div>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium text-zinc-900">System Notifications</Label>
                      <p className="text-[13px] text-zinc-500">Get notified about system updates.</p>
                    </div>
                    <Switch checked={true} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* System Settings */}
            <Card className="border-zinc-200">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-zinc-900 flex items-center justify-center">
                    <Globe className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-semibold text-zinc-900">System</CardTitle>
                    <CardDescription className="text-[15px] text-zinc-500">
                      Configure system-wide settings and preferences.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="language" className="text-sm font-medium text-zinc-900">
                      Language
                    </Label>
                    <Select>
                      <SelectTrigger id="language" className="h-10 bg-zinc-50/50 border-zinc-200 text-zinc-900">
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-zinc-200 shadow-md min-w-[180px] p-1.5">
                        <SelectItem
                          value="en"
                          className="text-[15px] text-zinc-700 px-3 py-2 cursor-pointer rounded-md focus:bg-transparent focus:text-zinc-700 hover:bg-zinc-50 transition-colors"
                        >
                          English
                        </SelectItem>
                        <SelectItem
                          value="es"
                          className="text-[15px] text-zinc-700 px-3 py-2 cursor-pointer rounded-md focus:bg-transparent focus:text-zinc-700 hover:bg-zinc-50 transition-colors"
                        >
                          Spanish
                        </SelectItem>
                        <SelectItem
                          value="fr"
                          className="text-[15px] text-zinc-700 px-3 py-2 cursor-pointer rounded-md focus:bg-transparent focus:text-zinc-700 hover:bg-zinc-50 transition-colors"
                        >
                          French
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timezone" className="text-sm font-medium text-zinc-900">
                      Timezone
                    </Label>
                    <Select>
                      <SelectTrigger id="timezone" className="h-10 bg-zinc-50/50 border-zinc-200 text-zinc-900">
                        <SelectValue placeholder="Select timezone" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-zinc-200 shadow-md min-w-[180px] p-1.5">
                        <SelectItem
                          value="utc"
                          className="text-[15px] text-zinc-700 px-3 py-2 cursor-pointer rounded-md focus:bg-transparent focus:text-zinc-700 hover:bg-zinc-50 transition-colors"
                        >
                          UTC
                        </SelectItem>
                        <SelectItem
                          value="est"
                          className="text-[15px] text-zinc-700 px-3 py-2 cursor-pointer rounded-md focus:bg-transparent focus:text-zinc-700 hover:bg-zinc-50 transition-colors"
                        >
                          EST
                        </SelectItem>
                        <SelectItem
                          value="pst"
                          className="text-[15px] text-zinc-700 px-3 py-2 cursor-pointer rounded-md focus:bg-transparent focus:text-zinc-700 hover:bg-zinc-50 transition-colors"
                        >
                          PST
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button
                onClick={handleSaveSettings}
                className="h-10 px-4 bg-zinc-900 hover:bg-zinc-800 text-white"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    <span>Saving...</span>
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
