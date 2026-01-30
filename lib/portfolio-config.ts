import { Portfolio } from "@/components/portfolio-selector";

/**
 * Get portfolio configurations from environment variables
 * This function reads database URIs from .env.local file
 */
export function getPortfolioConfigs(): Portfolio[] {
  return [
    {
      id: "fullstack",
      name: "Full Stack Portfolio",
      dbUri: process.env.NEXT_PUBLIC_FULLSTACK_DB_URI || "",
    },
    {
      id: "graphics",
      name: "Graphic Design Portfolio",
      dbUri: process.env.NEXT_PUBLIC_GRAPHICS_DB_URI || "",
    },
    {
      id: "video",
      name: "Video Editing Portfolio",
      dbUri: process.env.NEXT_PUBLIC_VIDEO_DB_URI || "",
    },
    {
      id: "professional",
      name: "Professional Portfolio",
      dbUri: process.env.NEXT_PUBLIC_PROFESSIONAL_DB_URI || "",
    },
    {
      id: "creative",
      name: "Creative Portfolio",
      dbUri: process.env.NEXT_PUBLIC_CREATIVE_DB_URI || "",
    },
    {
      id: "technical",
      name: "Technical Portfolio",
      dbUri: process.env.NEXT_PUBLIC_TECHNICAL_DB_URI || "",
    },
  ];
}

/**
 * Get database URI for a specific portfolio
 */
export function getDbUriForPortfolio(portfolioId: string): string {
  const portfolios = getPortfolioConfigs();
  const portfolio = portfolios.find((p) => p.id === portfolioId);
  return portfolio?.dbUri || "";
}


