import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { normalizeVideoProject } from '@/lib/video-project-normalizer';
import { getDbUriForPortfolio } from '@/lib/portfolio-config';

// Define the Video Project schema (same as in route.ts)
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

// PUT - Update a video project
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
    
    const updatedProject = await VideoProject.findOneAndUpdate(
      { id: id },
      project,
      { new: true }
    );
    
    if (!updatedProject) {
      return NextResponse.json({ error: 'Video project not found' }, { status: 404 });
    }
    
    const normalizedProject = normalizeVideoProject(updatedProject.toObject());
    
    return NextResponse.json({ 
      success: true, 
      message: 'Video project updated successfully',
      project: normalizedProject
    });
  } catch (error: any) {
    console.error('Error updating video project:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Delete a video project
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const portfolioId = searchParams.get('portfolioId') || 'video';
    
    const dbUri = getDbUriForPortfolio(portfolioId);
    
    if (!dbUri) {
      return NextResponse.json({ error: 'Database URI not found for portfolio' }, { status: 400 });
    }
    
    const connection = await connectToDatabase(dbUri);
    const VideoProject = connection.model('VideoProject', videoProjectSchema);
    
    const deletedProject = await VideoProject.findOneAndDelete({ id: id });
    
    if (!deletedProject) {
      return NextResponse.json({ error: 'Video project not found' }, { status: 404 });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Video project deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting video project:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

