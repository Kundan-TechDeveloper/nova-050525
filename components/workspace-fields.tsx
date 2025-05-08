"use client"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface WorkspaceField {
  name: string
  type: "text" | "textarea" | "dropdown" | "multi-line"
  options?: string[]
  default?: string
}

interface WorkspaceFieldsProps {
  fields: WorkspaceField[]
  values: Record<string, string>
  onChange: (name: string, value: string) => void
}

export function WorkspaceFields({ fields, values, onChange }: WorkspaceFieldsProps) {
  return (
    <div className="space-y-4">
      {fields.map((field) => (
        <div key={field.name} className="space-y-2">
          <Label htmlFor={field.name} className="capitalize">
            {field.name.replace(/_/g, " ")}
          </Label>

          {field.type === "text" && (
            <Input
              id={field.name}
              value={values[field.name] || ""}
              onChange={(e) => onChange(field.name, e.target.value)}
              placeholder={`Enter ${field.name.replace(/_/g, " ")}`}
              className="bg-zinc-900 border-zinc-700"
            />
          )}

          {field.type === "textarea" || field.type === "multi-line" ? (
            <Textarea
              id={field.name}
              value={values[field.name] || ""}
              onChange={(e) => onChange(field.name, e.target.value)}
              placeholder={`Enter ${field.name.replace(/_/g, " ")}`}
              className="min-h-[100px] bg-zinc-900 border-zinc-700"
            />
          ) : null}

          {field.type === "dropdown" && field.options && (
            <Select value={values[field.name] || ""} onValueChange={(value) => onChange(field.name, value)}>
              <SelectTrigger className="w-full bg-zinc-900 border-zinc-700">
                <SelectValue placeholder={`Select ${field.name.replace(/_/g, " ")}`} />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-700">
                {field.options.map((option) => (
                  <SelectItem key={option} value={option} className="capitalize">
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      ))}
    </div>
  )
}
