import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

const toolSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      enum: ['design', 'development', 'video', 'audio', 'productivity', 'other'],
      default: 'other'
    },
    iconType: {
      type: String,
      enum: ['react-icon', 'custom-svg', 'none'],
      default: 'none'
    },
    iconName: {
      type: String,
      default: ''
    },
    description: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

const connections: { [key: string]: mongoose.Connection } = {};

async function connectToDatabase(dbUri: string, portfolioId: string) {
  try {
    const connectionKey = `${portfolioId}:${dbUri}`;
    
    if (connections[connectionKey]) {
      console.log(`Reusing existing connection for ${portfolioId} (tools)`);
      return connections[connectionKey];
    }
    
    console.log(`Creating new connection for ${portfolioId} (tools)`);
    const connection = await mongoose.createConnection(dbUri);
    connections[connectionKey] = connection;
    
    return connection;
  } catch (error) {
    console.error('Failed to connect to MongoDB for tools', error);
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { dbUri, portfolioId, action, toolData, toolId } = body;
    
    if (!dbUri) {
      return NextResponse.json({ error: 'Database URI is required' }, { status: 400 });
    }
    
    if (!portfolioId) {
      return NextResponse.json({ error: 'Portfolio ID is required' }, { status: 400 });
    }
    
    const connection = await connectToDatabase(dbUri, portfolioId);
    
    const Tool = connection.model('Tool', toolSchema);
    
    if (action === 'add' && toolData) {
      console.log(`Adding new tool for portfolio ${portfolioId}:`, toolData);
      const newTool = new Tool(toolData);
      const savedTool = await newTool.save();
      return NextResponse.json(savedTool);
    } else if (action === 'edit' && toolId && toolData) {
      console.log(`Editing tool ${toolId} in portfolio ${portfolioId}:`, toolData);
      const updatedTool = await Tool.findByIdAndUpdate(
        toolId, 
        toolData, 
        { new: true, runValidators: true }
      );
      
      if (!updatedTool) {
        return NextResponse.json({ error: 'Tool not found' }, { status: 404 });
      }
      
      return NextResponse.json(updatedTool);
    } else if (action === 'delete' && toolId) {
      console.log(`Deleting tool ${toolId} from portfolio ${portfolioId}`);
      const result = await Tool.findByIdAndDelete(toolId);
      
      if (!result) {
        return NextResponse.json({ error: 'Tool not found' }, { status: 404 });
      }
      
      return NextResponse.json({ success: true, deletedId: toolId });
    } else {
      const tools = await Tool.find({});
      console.log(`Found ${tools.length} tools for portfolio ${portfolioId}`);
      return NextResponse.json(tools);
    }
  } catch (error: any) {
    console.error('Error in tools API route:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
