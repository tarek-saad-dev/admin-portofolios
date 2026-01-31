"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState, useEffect } from "react"
import { getPortfolioConfigs, getDbUriForPortfolio as getDbUri } from "@/lib/portfolio-config"
import { normalizeProjects } from "@/lib/project-normalizer"

// Define the Portfolio type
export interface Portfolio {
  id: string;
  name: string;
  dbUri: string;
}

// Define Project interface
export interface Project {
  id: number | string; // Can be number or string, and may come from _id
  title: string;
  description: string;
  imgPath: string;
  imagePaths?: string[];
  ghLink: string;
  demoLink?: string;
  skills?: string[];
  technologies?: string[];
  tools?: string[];
  keyFeatures?: string[];
  date: string;
  views?: number;
  // New schema fields (optional for backward compatibility)
  category?: string;
  thumbnail?: string;
  year?: string;
  duration?: string;
  youtubeUrl?: string;
  // MongoDB _id field (may be present in API responses)
  _id?: string;
}

// Define Skill interface
export interface Skill {
  _id: string;
  name: string;
  category: string;
  iconType: string;
  iconName: string;
}

// Define Experience interface
export interface Experience {
  _id: string;
  title: string;
  company: string;
  duration: string;
  type: string;
  role: string[];
  order: number;
  createdAt?: string;
  updatedAt?: string;
}

// Define Certificate interface
export interface Certificate {
  _id: string;
  title: string;
  description: string;
  imgPath: string;
  orgLogos: string[];
  liveLink?: string;
  order: number;
  createdAt?: string;
  updatedAt?: string;
}

// Define Tool interface
export interface Tool {
  _id: string;
  name: string;
  category: string;
  iconType: string;
  iconName: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function PortfolioSelector({
  onChange,
  value,
  onProjectsLoaded,
  onSkillsLoaded,
  onExperiencesLoaded,
  onCertificatesLoaded,
  onToolsLoaded
}: {
  onChange: (value: string) => void;
  value: string;
  onProjectsLoaded?: (projects: Project[]) => void;
  onSkillsLoaded?: (skills: Skill[]) => void;
  onExperiencesLoaded?: (experiences: Experience[]) => void;
  onCertificatesLoaded?: (certificates: Certificate[]) => void;
  onToolsLoaded?: (tools: Tool[]) => void;
}) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Array of portfolio objects with title and database URI from environment variables
  const portfolios: Portfolio[] = getPortfolioConfigs();

  // Function to get the database URI for the selected portfolio
  const getDbUriForPortfolio = (portfolioId: string): string => {
    const dbUri = getDbUri(portfolioId);
    console.log("Selected portfolio URI:", dbUri);
    return dbUri;
  }

  // Use an API route instead of direct Mongoose connection for projects
  const fetchProjects = async (portfolioId: string) => {
    console.log("Fetching projects for portfolio:", portfolioId);
    try {
      setLoading(true);
      setError(null);

      const dbUri = getDbUriForPortfolio(portfolioId);
      if (!dbUri) {
        setError("No database URI found for the selected portfolio");
        return [];
      }

      // Use an API route instead of direct database access
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ dbUri, portfolioId }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      console.log("Projects loaded:", data.length);

      // Normalize projects to ensure consistent structure
      const normalizedProjects = normalizeProjects(data);

      setProjects(normalizedProjects);

      // Pass the normalized projects data to the parent component
      if (onProjectsLoaded) {
        onProjectsLoaded(normalizedProjects);
      }

      return normalizedProjects;
    } catch (error: any) {
      setError(`Error fetching projects: ${error.message}`);
      console.error("Error fetching projects:", error);
      return [];
    } finally {
      setLoading(false);
    }
  }

  // Use an API route for skills
  const fetchSkills = async (portfolioId: string) => {
    console.log("Fetching skills for portfolio:", portfolioId);
    try {
      setLoading(true);
      setError(null);

      const dbUri = getDbUriForPortfolio(portfolioId);
      if (!dbUri) {
        setError("No database URI found for the selected portfolio");
        return [];
      }

      // Use an API route for skills
      const response = await fetch('/api/skills', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ dbUri, portfolioId }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      console.log("Skills loaded:", data.length);
      setSkills(data);

      // Pass the skills data to the parent component
      if (onSkillsLoaded) {
        onSkillsLoaded(data);
      }

      return data;
    } catch (error: any) {
      setError(`Error fetching skills: ${error.message}`);
      console.error("Error fetching skills:", error);
      return [];
    } finally {
      setLoading(false);
    }
  }

  // Use an API route for experiences
  const fetchExperiences = async (portfolioId: string) => {
    console.log("Fetching experiences for portfolio:", portfolioId);
    try {
      setLoading(true);
      setError(null);

      const dbUri = getDbUriForPortfolio(portfolioId);
      if (!dbUri) {
        setError("No database URI found for the selected portfolio");
        return [];
      }

      // Use an API route for experiences
      const response = await fetch('/api/experiences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ dbUri, portfolioId }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      console.log("Experiences loaded:", data.length);
      setExperiences(data);

      // Pass the experiences data to the parent component
      if (onExperiencesLoaded) {
        onExperiencesLoaded(data);
      }

      return data;
    } catch (error: any) {
      setError(`Error fetching experiences: ${error.message}`);
      console.error("Error fetching experiences:", error);
      return [];
    } finally {
      setLoading(false);
    }
  }

  // Use an API route for certificates
  const fetchCertificates = async (portfolioId: string) => {
    console.log("Fetching certificates for portfolio:", portfolioId);
    try {
      setLoading(true);
      setError(null);

      const dbUri = getDbUriForPortfolio(portfolioId);
      if (!dbUri) {
        setError("No database URI found for the selected portfolio");
        return [];
      }

      // Use an API route for certificates
      const response = await fetch('/api/certificates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ dbUri, portfolioId }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      console.log("Certificates loaded:", data.length);
      setCertificates(data);

      // Pass the certificates data to the parent component
      if (onCertificatesLoaded) {
        onCertificatesLoaded(data);
      }

      return data;
    } catch (error: any) {
      setError(`Error fetching certificates: ${error.message}`);
      console.error("Error fetching certificates:", error);
      return [];
    } finally {
      setLoading(false);
    }
  }

  // Use an API route for tools
  const fetchTools = async (portfolioId: string) => {
    console.log("Fetching tools for portfolio:", portfolioId);
    try {
      setLoading(true);
      setError(null);

      const dbUri = getDbUriForPortfolio(portfolioId);
      if (!dbUri) {
        setError("No database URI found for the selected portfolio");
        return [];
      }

      // Use an API route for tools
      const response = await fetch('/api/tools', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ dbUri, portfolioId }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      console.log("Tools loaded:", data.length);
      setTools(data);

      // Pass the tools data to the parent component
      if (onToolsLoaded) {
        onToolsLoaded(data);
      }

      return data;
    } catch (error: any) {
      setError(`Error fetching tools: ${error.message}`);
      console.error("Error fetching tools:", error);
      return [];
    } finally {
      setLoading(false);
    }
  }

  // Fetch data when the selected portfolio changes
  useEffect(() => {
    let isMounted = true;

    if (value) {
      // Fetch projects
      fetchProjects(value).then(data => {
        if (isMounted && onProjectsLoaded) {
          onProjectsLoaded(data);
        }
      });

      // Fetch skills
      fetchSkills(value).then(data => {
        if (isMounted && onSkillsLoaded) {
          onSkillsLoaded(data);
        }
      });

      // Fetch experiences
      fetchExperiences(value).then(data => {
        if (isMounted && onExperiencesLoaded) {
          onExperiencesLoaded(data);
        }
      });

      // Fetch certificates
      fetchCertificates(value).then(data => {
        if (isMounted && onCertificatesLoaded) {
          onCertificatesLoaded(data);
        }
      });

      // Fetch tools
      fetchTools(value).then(data => {
        if (isMounted && onToolsLoaded) {
          onToolsLoaded(data);
        }
      });
    }

    // Cleanup function to prevent state updates if component unmounts
    return () => {
      isMounted = false;
    };
  }, [value]); // Only depend on value

  return (
    <div className="flex flex-col space-y-2">

      <label htmlFor="portfolio-select" className="text-sm font-medium">
        Select Portfolio
      </label>

      <Select value={value} onValueChange={onChange}>

        <SelectTrigger id="portfolio-select" className="w-full md:w-[300px]">
          <SelectValue placeholder="Select a portfolio" />
        </SelectTrigger>

        <SelectContent>
          {portfolios.map((portfolio) => (
            <SelectItem key={portfolio.id} value={portfolio.id}>
              {portfolio.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {loading && <p className="text-sm text-gray-500">Loading data...</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  )
}
