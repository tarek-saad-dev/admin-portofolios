"use client"

import { useState } from "react"
import { ArrowLeft, Plus, Code, Search, Lightbulb, CheckCircle, Circle, Clock } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import PortfolioSelector from "@/components/portfolio-selector"

export default function FeatureCluster() {
  const [selectedPortfolio, setSelectedPortfolio] = useState<string>("")

  const handlePortfolioChange = (value: string) => {
    setSelectedPortfolio(value)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-8">
        <Button variant="ghost" size="icon" asChild className="mr-4">
          <Link href="/">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Feature Management</h1>
          <p className="text-muted-foreground">Add and track features for your projects</p>
        </div>
      </div>

      <div className="mb-8">
        <PortfolioSelector onChange={handlePortfolioChange} value={selectedPortfolio} />
      </div>

      {selectedPortfolio && (
        <Tabs defaultValue="all" className="w-full">
          <div className="flex justify-between items-center mb-4">
            <TabsList>
              <TabsTrigger value="all">All Features</TabsTrigger>
              <TabsTrigger value="planned">Planned</TabsTrigger>
              <TabsTrigger value="in-progress">In Progress</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Feature
            </Button>
          </div>

          <TabsContent value="all" className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold">All Features</h2>
              <Select defaultValue="newest">
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="priority">Priority</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <FeatureCard
                title="User Authentication"
                type="coding"
                status="completed"
                description="Implement user login, registration, and password reset functionality"
              />
              <FeatureCard
                title="Responsive Design"
                type="coding"
                status="in-progress"
                description="Make the application fully responsive on all device sizes"
              />
              <FeatureCard
                title="Search Functionality"
                type="search"
                status="planned"
                description="Add advanced search capabilities to the portfolio section"
              />
              <FeatureCard
                title="Dark Mode Toggle"
                type="coding"
                status="in-progress"
                description="Implement a dark mode option for better user experience"
              />
              <FeatureCard
                title="Analytics Dashboard"
                type="idea"
                status="planned"
                description="Create a dashboard to track portfolio views and interactions"
              />
              <FeatureCard
                title="Export to PDF"
                type="coding"
                status="planned"
                description="Allow users to export their portfolio as a PDF resume"
              />
            </div>
          </TabsContent>

          <TabsContent value="planned">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <FeatureCard
                title="Search Functionality"
                type="search"
                status="planned"
                description="Add advanced search capabilities to the portfolio section"
              />
              <FeatureCard
                title="Analytics Dashboard"
                type="idea"
                status="planned"
                description="Create a dashboard to track portfolio views and interactions"
              />
              <FeatureCard
                title="Export to PDF"
                type="coding"
                status="planned"
                description="Allow users to export their portfolio as a PDF resume"
              />
            </div>
          </TabsContent>

          <TabsContent value="in-progress">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <FeatureCard
                title="Responsive Design"
                type="coding"
                status="in-progress"
                description="Make the application fully responsive on all device sizes"
              />
              <FeatureCard
                title="Dark Mode Toggle"
                type="coding"
                status="in-progress"
                description="Implement a dark mode option for better user experience"
              />
            </div>
          </TabsContent>

          <TabsContent value="completed">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <FeatureCard
                title="User Authentication"
                type="coding"
                status="completed"
                description="Implement user login, registration, and password reset functionality"
              />
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}

function FeatureCard({ title, type, status, description }: { 
  title: string; 
  type: string; 
  status: string; 
  description: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-base">{title}</CardTitle>
          <StatusBadge status={status} />
        </div>
        <CardDescription>
          <TypeBadge type={type} />
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm">{description}</p>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" size="sm">
          View Details
        </Button>
        <Button variant="outline" size="sm">
          Update Status
        </Button>
      </CardFooter>
    </Card>
  )
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "planned":
      return (
        <Badge variant="outline" className="flex items-center gap-1">
          <Circle className="h-3 w-3 text-muted-foreground" />
          Planned
        </Badge>
      )
    case "in-progress":
      return (
        <Badge variant="outline" className="flex items-center gap-1 border-blue-500 text-blue-500">
          <Clock className="h-3 w-3" />
          In Progress
        </Badge>
      )
    case "completed":
      return (
        <Badge variant="outline" className="flex items-center gap-1 border-green-500 text-green-500">
          <CheckCircle className="h-3 w-3" />
          Completed
        </Badge>
      )
    default:
      return null
  }
}

function TypeBadge({ type }: { type: string }) {
  switch (type) {
    case "coding":
      return (
        <Badge variant="secondary" className="flex items-center gap-1">
          <Code className="h-3 w-3" />
          Coding
        </Badge>
      )
    case "search":
      return (
        <Badge variant="secondary" className="flex items-center gap-1">
          <Search className="h-3 w-3" />
          Search
        </Badge>
      )
    case "idea":
      return (
        <Badge variant="secondary" className="flex items-center gap-1">
          <Lightbulb className="h-3 w-3" />
          Idea
        </Badge>
      )
    default:
      return null
  }
}
