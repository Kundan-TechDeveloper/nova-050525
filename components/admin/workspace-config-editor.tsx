"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "react-hot-toast"
import { useRouter } from "next/navigation"

interface WorkspaceConfigEditorProps {
  workspaceId: string
  initialConfig: any
}

export function WorkspaceConfigEditor({ workspaceId, initialConfig }: WorkspaceConfigEditorProps) {
  const router = useRouter()
  const [config, setConfig] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (initialConfig) {
      setConfig(JSON.stringify(initialConfig, null, 2))
    } else {
      // Set default template if no config exists
      setConfig(
        JSON.stringify(
          {
            workspace: "",
            fields: [
              {
                name: "example_field",
                type: "text",
              },
            ],
          },
          null,
          2,
        ),
      )
    }
  }, [initialConfig])

  const validateConfig = (configStr: string) => {
    try {
      const parsed = JSON.parse(configStr)

      // Check if it has the required structure
      if (!parsed.workspace || !Array.isArray(parsed.fields)) {
        return "Configuration must include 'workspace' and 'fields' array"
      }

      // Check each field
      for (const field of parsed.fields) {
        if (!field.name || !field.type) {
          return "Each field must have 'name' and 'type' properties"
        }

        if (!["text", "textarea", "dropdown", "multi-line"].includes(field.type)) {
          return `Invalid field type: ${field.type}. Must be one of: text, textarea, dropdown, multi-line`
        }

        if (
          field.type === "dropdown" &&
          (!field.options || !Array.isArray(field.options) || field.options.length === 0)
        ) {
          return `Dropdown field '${field.name}' must have an 'options' array with at least one option`
        }
      }

      return null
    } catch (e) {
      return "Invalid JSON format"
    }
  }

  const handleSubmit = async () => {
    const validationError = validateConfig(config)
    if (validationError) {
      setError(validationError)
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch("/api/workspace-config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          workspaceId,
          config: JSON.parse(config),
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to update configuration")
      }

      toast.success("Workspace configuration updated successfully")
      router.refresh()
      router.push(`/admin/workspaces/${workspaceId}`)
    } catch (error: any) {
      console.error("Error updating workspace configuration:", error)
      setError(error.message || "An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-zinc-800 p-4 rounded-md">
        <h2 className="text-lg font-medium mb-2">Configuration Guidelines</h2>
        <ul className="list-disc pl-5 space-y-1 text-sm text-zinc-300">
          <li>Configuration must be valid JSON</li>
          <li>
            Must include a <code className="bg-zinc-700 px-1 rounded">workspace</code> name and{" "}
            <code className="bg-zinc-700 px-1 rounded">fields</code> array
          </li>
          <li>
            Each field must have <code className="bg-zinc-700 px-1 rounded">name</code> and{" "}
            <code className="bg-zinc-700 px-1 rounded">type</code> properties
          </li>
          <li>
            Supported field types: <code className="bg-zinc-700 px-1 rounded">text</code>,{" "}
            <code className="bg-zinc-700 px-1 rounded">textarea</code>,{" "}
            <code className="bg-zinc-700 px-1 rounded">dropdown</code>,{" "}
            <code className="bg-zinc-700 px-1 rounded">multi-line</code>
          </li>
          <li>
            Dropdown fields require an <code className="bg-zinc-700 px-1 rounded">options</code> array
          </li>
          <li>
            Optional: Add a <code className="bg-zinc-700 px-1 rounded">default</code> value for any field
          </li>
        </ul>
      </div>

      <div className="space-y-2">
        <Textarea
          value={config}
          onChange={(e) => setConfig(e.target.value)}
          className="font-mono h-[400px] bg-zinc-900 border-zinc-700"
        />
        {error && <div className="text-red-500 text-sm">{error}</div>}
      </div>

      <div className="flex justify-end space-x-4">
        <Button variant="outline" onClick={() => router.push(`/admin/workspaces/${workspaceId}`)}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save Configuration"}
        </Button>
      </div>
    </div>
  )
}
