"use client"
import { ArrowLeft, Plus, Star, Share2, BookOpen, TrendingUp } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"

export default function SkillCluster() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-8">
        <Button variant="ghost" size="icon" asChild className="mr-4">
          <Link href="/">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Skill Cluster</h1>
          <p className="text-muted-foreground">Manage, share, and improve your skills</p>
        </div>
      </div>

      <Tabs defaultValue="current" className="w-full">
        <TabsList className="grid grid-cols-3 mb-8">
          <TabsTrigger value="current">Current Skills</TabsTrigger>
          <TabsTrigger value="learning">Learning</TabsTrigger>
          <TabsTrigger value="share">Share Skills</TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">Current Skills</h2>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Skill
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <SkillCard title="React Development" level="Advanced" progress={85} lastUpdated="2 weeks ago" />
            <SkillCard title="UI/UX Design" level="Intermediate" progress={65} lastUpdated="1 month ago" />
            <SkillCard title="Node.js" level="Advanced" progress={80} lastUpdated="3 weeks ago" />
            <SkillCard title="TypeScript" level="Intermediate" progress={60} lastUpdated="2 months ago" />
            <SkillCard title="Database Design" level="Advanced" progress={75} lastUpdated="1 month ago" />
            <SkillCard title="DevOps" level="Beginner" progress={30} lastUpdated="3 months ago" />
          </div>
        </TabsContent>

        <TabsContent value="learning">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">Learning New Skills</h2>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Start Learning
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <LearningCard title="Machine Learning" progress={25} startDate="Jan 15, 2023" resources={3} />
            <LearningCard title="Cloud Architecture" progress={40} startDate="Mar 5, 2023" resources={5} />
            <LearningCard title="Blockchain Development" progress={10} startDate="Apr 20, 2023" resources={2} />
          </div>
        </TabsContent>

        <TabsContent value="share">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">Share Your Skills</h2>
            <Button>
              <Share2 className="h-4 w-4 mr-2" />
              Create New Share
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Share as Portfolio</CardTitle>
                <CardDescription>Create a public profile of your skills for employers and clients</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Generate a public URL that showcases your skills, experience, and projects in a professional format.
                </p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">
                  Generate Portfolio
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Export as Resume</CardTitle>
                <CardDescription>Create a resume based on your skills and experience</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Generate a downloadable resume in PDF format that highlights your skills and experience.
                </p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">
                  Generate Resume
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function SkillCard({ title, level, progress, lastUpdated }: {
  title: string;
  level: string;
  progress: number;
  lastUpdated: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle>{title}</CardTitle>
          <div className="flex">
            {[...Array(getLevelStars(level))].map((_, i) => (
              <Star key={i} className="h-4 w-4 fill-primary text-primary" />
            ))}
          </div>
        </div>
        <CardDescription>{level}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Proficiency</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground">Last updated: {lastUpdated}</p>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" size="sm">
          <TrendingUp className="h-4 w-4 mr-2" />
          Improve
        </Button>
        <Button variant="outline" size="sm">
          <Share2 className="h-4 w-4 mr-2" />
          Share
        </Button>
      </CardFooter>
    </Card>
  )
}

function LearningCard({ title, progress, startDate, resources }: {
  title: string;
  progress: number;
  startDate: string;
  resources: number;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>Started on {startDate}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
          <p className="text-sm mt-4">
            <BookOpen className="h-4 w-4 inline mr-2" />
            {resources} learning resources
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" size="sm">
          <BookOpen className="h-4 w-4 mr-2" />
          Continue Learning
        </Button>
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Resource
        </Button>
      </CardFooter>
    </Card>
  )
}

function getLevelStars(level: string): number {
  switch (level.toLowerCase()) {
    case "beginner":
      return 1
    case "intermediate":
      return 2
    case "advanced":
      return 3
    case "expert":
      return 4
    default:
      return 1
  }
}
