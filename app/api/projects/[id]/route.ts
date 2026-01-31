import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { normalizeProject } from '@/lib/project-normalizer';

// Define the Project schema
const projectSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      required: true,
      unique: true
    },
    imgPath: {
      type: String,
      required: true
    },
    imagePaths: {
      type: [String],
      default: []
    },
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    ghLink: {
      type: String,
      required: true
    },
    demoLink: {
      type: String,
      default: ''
    },
    skills: {
      type: [String],
      default: []
    },
    technologies: {
      type: [String],
      default: []
    },
    tools: {
      type: [String],
      default: []
    },
    keyFeatures: {
      type: [String],
      default: []
    },
    date: {
      type: String,
      required: true
    },
    views: {
      type: Number,
      default: 0
    },
    category: {
      type: String,
      default: ''
    },
    thumbnail: {
      type: String,
      default: ''
    },
    year: {
      type: String,
      default: ''
    },
    duration: {
      type: String,
      default: ''
    },
    youtubeUrl: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

// Track connections by URI
const connections: { [key: string]: mongoose.Connection } = {};

async function connectToDatabase(dbUri: string) {
  try {
    if (connections[dbUri]) {
      return connections[dbUri];
    }
    
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    
    const connection = await mongoose.createConnection(dbUri);
    connections[dbUri] = connection;
    
    return connection;
  } catch (error) {
    console.error('Failed to connect to MongoDB', error);
    throw error;
  }
}

// DELETE - Delete a project
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const portfolioId = searchParams.get('portfolioId') || 'fullstack';
    
    // Get database URI from portfolio config
    const { getDbUriForPortfolio } = await import('@/lib/portfolio-config');
    const dbUri = getDbUriForPortfolio(portfolioId);
    
    if (!dbUri) {
      return NextResponse.json({ error: 'Database URI not found for portfolio' }, { status: 400 });
    }
    
    const connection = await connectToDatabase(dbUri);
    const Project = connection.model('Project', projectSchema);
    
    // Convert id to number if it's a string
    const projectId = typeof id === 'string' && /^\d+$/.test(id) ? parseInt(id, 10) : id;
    
    const deletedProject = await Project.findOneAndDelete({ id: projectId });
    
    if (!deletedProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Project deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting project:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

