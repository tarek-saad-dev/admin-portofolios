import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { normalizeVideoProjects } from '@/lib/video-project-normalizer';
import { getDbUriForPortfolio } from '@/lib/portfolio-config';

// Define the Video Project schema
const videoProjectSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true
    },
    title: {
      type: String,
      required: true
    },
    category: {
      type: String,
      required: true,
      default: ''
    },
    year: {
      type: String,
      required: true,
      default: new Date().getFullYear().toString()
    },
    duration: {
      type: String,
      required: true,
      default: '00:00'
    },
    tools: {
      type: [String],
      default: []
    },
    description: {
      type: String,
      required: true,
      default: ''
    },
    youtubeUrl: {
      type: String,
      required: true
    },
    thumbnail: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Track connections by URI
const connections: { [key: string]: mongoose.Connection } = {};

// Connect to MongoDB with a specific URI
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
    console.log(`Connected to MongoDB: ${dbUri}`);
    
    return connection;
  } catch (error) {
    console.error('Failed to connect to MongoDB', error);
    throw error;
  }
}

// GET - Fetch all video projects
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const portfolioId = searchParams.get('portfolioId') || 'video';
    
    const dbUri = getDbUriForPortfolio(portfolioId);
    
    if (!dbUri) {
      return NextResponse.json({ error: 'Database URI not found for portfolio' }, { status: 400 });
    }
    
    const connection = await connectToDatabase(dbUri);
    const VideoProject = connection.model('VideoProject', videoProjectSchema);
    
    const projects = await VideoProject.find({}).lean().sort({ createdAt: -1 });
    
    const normalizedProjects = normalizeVideoProjects(projects);
    
    return NextResponse.json(normalizedProjects);
  } catch (error: any) {
    console.error('Error fetching video projects:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create a new video project
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { project, portfolioId = 'video' } = body;
    
    if (!project) {
      return NextResponse.json({ error: 'Project data is required' }, { status: 400 });
    }
    
    const dbUri = getDbUriForPortfolio(portfolioId);
    
    if (!dbUri) {
      return NextResponse.json({ error: 'Database URI not found for portfolio' }, { status: 400 });
    }
    
    const connection = await connectToDatabase(dbUri);
    const VideoProject = connection.model('VideoProject', videoProjectSchema);
    
    // Generate ID if not provided
    if (!project.id) {
      project.id = `video-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    
    const newProject = new VideoProject(project);
    await newProject.save();
    
    const normalizedProject = normalizeVideoProjects([newProject.toObject()])[0];
    
    return NextResponse.json({ 
      success: true, 
      message: 'Video project created successfully',
      project: normalizedProject
    });
  } catch (error: any) {
    console.error('Error creating video project:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

