import { Tool } from "@/types/tool";

export async function fetchTools(dbUri: string, portfolioId: string): Promise<Tool[]> {
  try {
    const response = await fetch('/api/tools', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        dbUri,
        portfolioId,
      }),
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error("Error fetching tools:", error);
    throw error;
  }
}

export async function addTool(
  dbUri: string, 
  portfolioId: string, 
  toolData: { name: string; category: string; iconType: string; iconName: string; description?: string; }
): Promise<Tool> {
  try {
    const response = await fetch('/api/tools', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        dbUri,
        portfolioId,
        action: 'add',
        toolData
      }),
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error("Error adding tool:", error);
    throw error;
  }
}

export async function editTool(
  dbUri: string, 
  portfolioId: string, 
  toolId: string,
  toolData: { name: string; category: string; iconType: string; iconName: string; description?: string; }
): Promise<Tool> {
  try {
    const response = await fetch('/api/tools', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        dbUri,
        portfolioId,
        action: 'edit',
        toolId,
        toolData
      }),
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error("Error editing tool:", error);
    throw error;
  }
}

export async function deleteTool(dbUri: string, portfolioId: string, toolId: string): Promise<{ success: boolean; deletedId: string }> {
  try {
    const response = await fetch('/api/tools', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        dbUri,
        portfolioId,
        action: 'delete',
        toolId
      }),
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error("Error deleting tool:", error);
    throw error;
  }
}
