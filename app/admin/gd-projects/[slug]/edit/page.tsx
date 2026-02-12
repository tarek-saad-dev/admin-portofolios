"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { ProjectForm } from "@/components/gd-projects/project-form"
import { getGDProject } from "@/services/gd-project-service"
import { GDProject } from "@/types/gd-project"
import { Card, CardContent } from "@/components/ui/card"

export default function EditGDProjectPage() {
  const params = useParams()
  const slug = params.slug as string
  const [project, setProject] = useState<GDProject | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProject = async () => {
      try {
        setLoading(true)
        const data = await getGDProject(slug, true)
        setProject(data)
      } catch (err) {
        console.error("Error fetching project:", err)
        setError(err instanceof Error ? err.message : "Failed to load project")
      } finally {
        setLoading(false)
      }
    }

    if (slug) {
      fetchProject()
    }
  }, [slug])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-12">
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-red-500">{error || "Project not found"}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <ProjectForm mode="edit" project={project} />
}
