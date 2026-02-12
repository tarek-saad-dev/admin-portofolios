"use client"

import Link from "next/link"
import { ArrowLeft, Video, Palette } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function AdminDashboardPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="mt-2 text-muted-foreground">Manage your portfolio projects and content</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <AdminModuleCard
          title="Video Projects"
          description="Manage video portfolio projects with thumbnails, categories, and tools"
          icon={<Video className="h-8 w-8" />}
          href="/admin"
        />

        <AdminModuleCard
          title="Graphic Design Projects"
          description="Manage Behance-style GD projects with galleries, mockups, and sliders"
          icon={<Palette className="h-8 w-8" />}
          href="/admin/gd-projects"
        />
      </div>
    </div>
  )
}

function AdminModuleCard({
  title,
  description,
  icon,
  href,
}: {
  title: string
  description: string
  icon: React.ReactNode
  href: string
}) {
  return (
    <Card className="transition-all hover:shadow-md">
      <CardHeader>
        <div className="flex items-center gap-2">
          {icon}
          <CardTitle>{title}</CardTitle>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow"></CardContent>
      <CardFooter>
        <Button asChild className="w-full">
          <Link href={href}>
            Manage
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
