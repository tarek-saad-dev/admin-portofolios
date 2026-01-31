"use client"

import { useState } from "react"
import { ArrowLeft, Plus } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import PortfolioSelector, { Project, Skill, Portfolio, Experience, Certificate, Tool } from "@/components/portfolio-selector"
import { ProjectsList } from "@/components/projects/projects-list"
import { SkillsList } from "@/components/skills/skills-list"
import { ExperiencesList } from "@/components/experiences/experiences-list"
import { CertificatesList } from "@/components/certificates/certificates-list"
import { ToolsList } from "@/components/tools/tools-list"
import { getDbUriForPortfolio } from "@/lib/portfolio-config"

export default function PortfolioCluster() {
  const [selectedPortfolio, setSelectedPortfolio] = useState("")
  const [projects, setProjects] = useState<Project[]>([])
  const [skills, setSkills] = useState<Skill[]>([])
  const [experiences, setExperiences] = useState<Experience[]>([])
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [tools, setTools] = useState<Tool[]>([])
  const [isLoadingProjects, setIsLoadingProjects] = useState(false)
  const [isLoadingSkills, setIsLoadingSkills] = useState(false)
  const [isLoadingExperiences, setIsLoadingExperiences] = useState(false)
  const [isLoadingCertificates, setIsLoadingCertificates] = useState(false)
  const [isLoadingTools, setIsLoadingTools] = useState(false)
  const [currentTab, setCurrentTab] = useState("projects")

  const handlePortfolioChange = ({ value }: { value: string }) => {
    // Reset states when portfolio changes
    setSelectedPortfolio(value)
    setProjects([])
    setSkills([])
    setExperiences([])
    setCertificates([])
    setTools([])
    setIsLoadingProjects(true)
    setIsLoadingSkills(true)
    setIsLoadingExperiences(true)
    setIsLoadingCertificates(true)
    setIsLoadingTools(true)
  }

  const handleProjectsLoaded = (loadedProjects: Project[]) => {
    console.log("Projects loaded in page component:", loadedProjects.length)
    setProjects(loadedProjects)
    setIsLoadingProjects(false)
  }

  const handleSkillsLoaded = (loadedSkills: Skill[]) => {
    console.log("Skills loaded in page component:", loadedSkills.length)
    setSkills(loadedSkills)
    setIsLoadingSkills(false)
  }

  const handleProjectAdded = (newProject: Project) => {
    setProjects(prev => [...prev, newProject])
  }

  const handleProjectDeleted = (projectId: number | string) => {
    setProjects(prev => prev.filter(p => {
      const pid = String(p.id ?? '');
      const deleteId = String(projectId ?? '');
      return pid !== deleteId;
    }))
  }

  const handleSkillAdded = (newSkill: Skill) => {
    setSkills(prev => [...prev, newSkill])
  }

  const handleSkillDeleted = (skillId: string) => {
    setSkills(prev => prev.filter(skill => skill._id !== skillId))
  }

  const handleExperiencesLoaded = (loadedExperiences: Experience[]) => {
    console.log("Experiences loaded in page component:", loadedExperiences.length)
    setExperiences(loadedExperiences)
    setIsLoadingExperiences(false)
  }

  const handleExperienceAdded = (newExperience: Experience) => {
    setExperiences(prev => [...prev, newExperience])
  }

  const handleExperienceEdited = (editedExperience: Experience) => {
    setExperiences(prev => prev.map(experience =>
      experience._id === editedExperience._id ? editedExperience : experience
    ))
  }

  const handleExperienceDeleted = (experienceId: string) => {
    setExperiences(prev => prev.filter(experience => experience._id !== experienceId))
  }

  const handleCertificatesLoaded = (loadedCertificates: Certificate[]) => {
    console.log("Certificates loaded in page component:", loadedCertificates.length)
    setCertificates(loadedCertificates)
    setIsLoadingCertificates(false)
  }

  const handleCertificateAdded = (newCertificate: Certificate) => {
    setCertificates(prev => [...prev, newCertificate])
  }

  const handleCertificateEdited = (editedCertificate: Certificate) => {
    setCertificates(prev => prev.map(certificate =>
      certificate._id === editedCertificate._id ? editedCertificate : certificate
    ))
  }

  const handleCertificateDeleted = (certificateId: string) => {
    setCertificates(prev => prev.filter(certificate => certificate._id !== certificateId))
  }

  const handleToolsLoaded = (loadedTools: Tool[]) => {
    console.log("Tools loaded in page component:", loadedTools.length)
    setTools(loadedTools)
    setIsLoadingTools(false)
  }

  const handleToolAdded = (newTool: Tool) => {
    setTools(prev => [...prev, newTool])
  }

  const handleToolEdited = (editedTool: Tool) => {
    setTools(prev => prev.map(tool =>
      tool._id === editedTool._id ? editedTool : tool
    ))
  }

  const handleToolDeleted = (toolId: string) => {
    setTools(prev => prev.filter(tool => tool._id !== toolId))
  }

  // Handle tab change
  const handleTabChange = (value: string) => {
    setCurrentTab(value)
  }

  // Function to get the database URI for the selected portfolio from environment variables
  const getDbUri = (portfolioId: string): string => {
    return getDbUriForPortfolio(portfolioId);
  }

  return (
    <div className="container mx-auto px-4 py-8">

      {/* Header section with a back button */}
      <div className="flex items-center mb-8">
        <Button variant="ghost" size="icon" asChild className="mr-4">
          <Link href="/">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Portfolio Cluster</h1>
          <p className="text-muted-foreground">Manage your portfolios and projects</p>
        </div>
      </div>

      {/* Portfolio selection dropdown */}
      <div className="mb-8">
        <PortfolioSelector
          onChange={(value) => handlePortfolioChange({ value })}
          value={selectedPortfolio}
          onProjectsLoaded={handleProjectsLoaded}
          onSkillsLoaded={handleSkillsLoaded}
          onExperiencesLoaded={handleExperiencesLoaded}
          onCertificatesLoaded={handleCertificatesLoaded}
          onToolsLoaded={handleToolsLoaded}
        />
      </div>

      {/* Displaying tabs only if a portfolio is selected */}
      {selectedPortfolio && (
        <Tabs defaultValue="projects" className="w-full" onValueChange={handleTabChange}>
          <TabsList className="grid grid-cols-5 mb-8">
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="skills">Skills</TabsTrigger>
            <TabsTrigger value="tools">Tools</TabsTrigger>
            <TabsTrigger value="experience">Experience</TabsTrigger>
            <TabsTrigger value="certifications">Certifications</TabsTrigger>
          </TabsList>

          {/* Content for the "Projects" tab */}
          <TabsContent value="projects">
            {isLoadingProjects ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : (
              <ProjectsList
                projects={projects}
                selectedPortfolio={selectedPortfolio}
                onProjectAdded={handleProjectAdded}
                onProjectDeleted={handleProjectDeleted}
              />
            )}
          </TabsContent>

          {/* Content for the "Skills" tab */}
          <TabsContent value="skills">
            <SkillsList
              onSkillEdited={(editedSkill) => {
                setSkills(prev => prev.map(skill =>
                  skill._id === editedSkill._id ? editedSkill : skill
                ))
              }}
              skills={skills}
              isLoading={isLoadingSkills}
              selectedPortfolio={selectedPortfolio}
              getDbUriForPortfolio={getDbUri}
              onSkillAdded={handleSkillAdded}
              onSkillDeleted={handleSkillDeleted}
            />
          </TabsContent>

          {/* Content for the "Experience" tab */}
          <TabsContent value="experience">
            <ExperiencesList
              experiences={experiences}
              isLoading={isLoadingExperiences}
              selectedPortfolio={selectedPortfolio}
              getDbUriForPortfolio={getDbUri}
              onExperienceAdded={handleExperienceAdded}
              onExperienceEdited={handleExperienceEdited}
              onExperienceDeleted={handleExperienceDeleted}
            />
          </TabsContent>

          {/* Content for the "Certifications" tab */}
          <TabsContent value="certifications">
            <CertificatesList
              certificates={certificates}
              isLoading={isLoadingCertificates}
              selectedPortfolio={selectedPortfolio}
              getDbUriForPortfolio={getDbUri}
              onCertificateAdded={handleCertificateAdded}
              onCertificateEdited={handleCertificateEdited}
              onCertificateDeleted={handleCertificateDeleted}
            />
          </TabsContent>

          {/* Content for the "Tools" tab */}
          <TabsContent value="tools">
            <ToolsList
              tools={tools}
              isLoading={isLoadingTools}
              selectedPortfolio={selectedPortfolio}
              getDbUriForPortfolio={getDbUri}
              onToolAdded={handleToolAdded}
              onToolEdited={handleToolEdited}
              onToolDeleted={handleToolDeleted}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
