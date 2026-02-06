import Link from "next/link"
import { ArrowRight, Briefcase, Lightbulb, Wrench, Settings, BarChart, GraduationCap } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function Dashboard() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight">Portfolio Management System</h1>
        <p className="mt-2 text-muted-foreground">Manage your portfolios, ideas, skills, and features in one place</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <ClusterCard
          title="Portfolio Cluster"
          description="Manage your portfolios, projects, certifications, and experience"
          icon={<Briefcase className="h-8 w-8" />}
          href="/portfolio"
        />

        <ClusterCard
          title="Idea Cluster"
          description="Capture and organize your ideas with voice notes, images, and videos"
          icon={<Lightbulb className="h-8 w-8" />}
          href="/ideas"
        />

        <ClusterCard
          title="Skill Cluster"
          description="Track, improve, and share your skills and learning progress"
          icon={<Wrench className="h-8 w-8" />}
          href="/skills"
        />

        <ClusterCard
          title="Feature Management"
          description="Add and track features for your projects and portfolios"
          icon={<BarChart className="h-8 w-8" />}
          href="/features"
        />

        <ClusterCard
          title="Admin Dashboard"
          description="Administrative tools for managing all aspects of the system"
          icon={<Settings className="h-8 w-8" />}
          href="/admin"
        />

        <ClusterCard
          title="LMS Admin"
          description="Manage courses, units, lessons, challenges, and user progress"
          icon={<GraduationCap className="h-8 w-8" />}
          href="/lms"
        />
      </div>
    </div>
  )
}

// function ClusterCard({ title, description, icon, href }) {

function ClusterCard({
  title,
  description,
  icon,
  href
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
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
      <CardContent className="flex-grow">{/* Content can be added here if needed */}</CardContent>
      <CardFooter>
        <Button asChild className="w-full">
          <Link href={href} className="flex items-center justify-between">
            <span>Enter Cluster</span>
            <ArrowRight className="h-4 w-4 ml-2" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
