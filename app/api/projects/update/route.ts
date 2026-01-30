import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { normalizeProject } from '@/lib/project-normalizer';

// Define the Project schema (same as in add route)
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
    // New schema fields (optional for backward compatibility)
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

// Track connections by URI (reusing the same approach as in add route)
const connections: { [key: string]: mongoose.Connection } = {};

// Connect to MongoDB with a specific URI
async function connectToDatabase(dbUri: string) {
  try {
    // If we already have a connection for this URI, return it
    if (connections[dbUri]) {
      return connections[dbUri];
    }
    
    // Close any existing default connection
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    
    // Create a new connection
    const connection = await mongoose.createConnection(dbUri);
    connections[dbUri] = connection;
    console.log(`Connected to MongoDB: ${dbUri}`);
    
    return connection;
  } catch (error) {
    console.error('Failed to connect to MongoDB', error);
    throw error;
  }
}

export async function PUT(request: Request) {
  try {
    const { project, dbUri } = await request.json();
    
    if (!project || !dbUri) {
      return NextResponse.json({ 
        error: 'Project data and database URI are required' 
      }, { status: 400 });
    }
    
    // Connect to the specific database
    const connection = await connectToDatabase(dbUri);
    
    // Create a model using this specific connection
    const Project = connection.model('Project', projectSchema);
    
    // Find and update the project
    const updatedProject = await Project.findOneAndUpdate(
      { id: project.id },
      project,
      { new: true } // Return the updated document
    );
    
    if (!updatedProject) {
      return NextResponse.json({ 
        error: 'Project not found' 
      }, { status: 404 });
    }
    
    // Normalize the project before returning
    const normalizedProject = normalizeProject(updatedProject.toObject());
    
    return NextResponse.json({ 
      success: true, 
      message: 'Project updated successfully',
      project: normalizedProject
    });
  } catch (error: any) {
    console.error('Error updating project:', error);
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 });
  }
}