"use client"

import { useState } from "react"
import { ArrowLeft, Mic, ImageIcon, Video, FileText } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"

export default function IdeaCluster() {
  const [recording, setRecording] = useState(false)

  const toggleRecording = () => {
    setRecording(!recording)
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
          <h1 className="text-3xl font-bold tracking-tight">Idea Cluster</h1>
          <p className="text-muted-foreground">Capture and organize your ideas</p>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Capture New Idea</CardTitle>
            <CardDescription>Add a new idea using text, voice, image, or video</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="text" className="w-full">
              <TabsList className="grid grid-cols-4 mb-4">
                <TabsTrigger value="text">Text</TabsTrigger>
                <TabsTrigger value="voice">Voice</TabsTrigger>
                <TabsTrigger value="image">Image</TabsTrigger>
                <TabsTrigger value="video">Video</TabsTrigger>
              </TabsList>

              <TabsContent value="text">
                <Textarea placeholder="Describe your idea here..." className="min-h-[200px]" />
              </TabsContent>

              <TabsContent value="voice" className="flex flex-col items-center justify-center min-h-[200px]">
                <Button
                  size="lg"
                  className={`rounded-full p-8 ${recording ? "bg-red-500 hover:bg-red-600" : ""}`}
                  onClick={toggleRecording}
                >
                  <Mic className="h-8 w-8" />
                </Button>
                <p className="mt-4">{recording ? "Recording... Click to stop" : "Click to start recording"}</p>
              </TabsContent>

              <TabsContent value="image" className="flex flex-col items-center justify-center min-h-[200px]">
                <Button variant="outline" size="lg" className="border-dashed border-2 p-8">
                  <ImageIcon className="h-8 w-8 mr-2" />
                  Upload Image
                </Button>
              </TabsContent>

              <TabsContent value="video" className="flex flex-col items-center justify-center min-h-[200px]">
                <Button variant="outline" size="lg" className="border-dashed border-2 p-8">
                  <Video className="h-8 w-8 mr-2" />
                  Upload Video
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter>
            <Button className="ml-auto">Save Idea</Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Ideas</CardTitle>
            <CardDescription>Your most recently added ideas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <IdeaItem
                title="Mobile App Concept"
                type="text"
                date="2 days ago"
                preview="A mobile app that helps users track their daily water intake..."
              />
              <IdeaItem title="Website Redesign" type="voice" date="1 week ago" preview="Voice note (1:24)" />
              <IdeaItem title="Logo Design" type="image" date="2 weeks ago" preview="Image preview" />
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full">
              View All Ideas
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AI-Generated Insights</CardTitle>
            <CardDescription>LLM-generated summaries and implementation steps</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <h3 className="font-medium mb-2">Mobile App Concept - Summary</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  A health-focused mobile application that tracks water intake, sends reminders, and provides insights
                  on hydration habits.
                </p>
                <h4 className="font-medium mb-2">Implementation Steps:</h4>
                <ol className="list-decimal list-inside text-sm text-muted-foreground">
                  <li>Create wireframes for user interface</li>
                  <li>Design database schema for user data</li>
                  <li>Implement notification system</li>
                  <li>Develop analytics dashboard</li>
                </ol>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full">
              Generate More Insights
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

function IdeaItem({ title, type, date, preview }: {
  title: string;
  type: string;
  date: string;
  preview: string;
}) {
  return (
    <div className="p-4 border rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium">{title}</h3>
        <span className="text-xs text-muted-foreground">{date}</span>
      </div>
      <div className="flex items-center gap-2 mb-2">
        {type === "text" && <FileText className="h-4 w-4 text-muted-foreground" />}
        {type === "voice" && <Mic className="h-4 w-4 text-muted-foreground" />}
        {type === "image" && <ImageIcon className="h-4 w-4 text-muted-foreground" />}
        {type === "video" && <Video className="h-4 w-4 text-muted-foreground" />}
        <span className="text-xs text-muted-foreground capitalize">{type}</span>
      </div>
      <p className="text-sm">{preview}</p>
    </div>
  )
}
