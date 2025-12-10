import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

// CORS headers helper
function getCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*', // Allow all origins (change to specific domain in production)
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400', // 24 hours
  };
}

// Handle OPTIONS request for CORS preflight
export async function OPTIONS() {
  return NextResponse.json({}, { headers: getCorsHeaders() });
}

// PUT endpoint to save/update talent data
export async function PUT(request: NextRequest) {
  let talentData;
  
  try {
    talentData = await request.json();
    
    if (!talentData || !talentData.id) {
      return NextResponse.json(
        { error: 'Invalid talent data. ID is required.' },
        { 
          status: 400,
          headers: getCorsHeaders()
        }
      );
    }

    const db = await getDatabase();
    const collection = db.collection('talents');

    // Ensure id is a number, not null or undefined
    const talentId = Number(talentData.id);
    if (!talentId || isNaN(talentId)) {
      return NextResponse.json(
        { error: 'Invalid talent ID. Must be a valid number.' },
        { 
          status: 400,
          headers: getCorsHeaders()
        }
      );
    }

    // Prepare data with both id and talent_id (for the unique index)
    // The unique index is on talent_id, so we must set it
    const dataToSave: any = {
      ...talentData,
      id: talentId,
      talent_id: talentId, // Set talent_id for the unique index
      updatedAt: new Date()
    };

    // Remove any null/undefined values that might conflict with unique indexes
    // But keep talent_id as it's required for the index
    Object.keys(dataToSave).forEach(key => {
      if (key !== 'talent_id' && (dataToSave[key] === null || dataToSave[key] === undefined)) {
        delete dataToSave[key];
      }
    });

    // Ensure talent_id is never null/undefined
    if (!dataToSave.talent_id) {
      dataToSave.talent_id = talentId;
    }

    // Upsert: update if exists, insert if not
    // Use talent_id for the query since that's what the unique index is on
    const result = await collection.updateOne(
      { talent_id: talentId },
      { $set: dataToSave },
      { upsert: true }
    );

    return NextResponse.json(
      { 
        success: true, 
        message: 'Talent saved successfully',
        id: talentId,
        matched: result.matchedCount,
        modified: result.modifiedCount,
        upserted: result.upsertedCount
      },
      { 
        status: 200,
        headers: getCorsHeaders()
      }
    );
  } catch (error: any) {
    console.error('Error saving talent:', error);
    
    // Handle duplicate key error specifically
    if (error.code === 11000 && talentData) {
      // Duplicate key error - try to update existing document using talent_id
      try {
        const db = await getDatabase();
        const collection = db.collection('talents');
        const talentId = Number(talentData.id);
        
        if (talentId && !isNaN(talentId)) {
          const dataToSave: any = {
            ...talentData,
            id: talentId,
            talent_id: talentId, // Ensure talent_id is set
            updatedAt: new Date()
          };
          
          // Remove null/undefined values but keep talent_id
          Object.keys(dataToSave).forEach(key => {
            if (key !== 'talent_id' && (dataToSave[key] === null || dataToSave[key] === undefined)) {
              delete dataToSave[key];
            }
          });
          
          // Ensure talent_id is never null
          if (!dataToSave.talent_id) {
            dataToSave.talent_id = talentId;
          }
          
          // Try to find and update by talent_id first
          let result = await collection.updateOne(
            { talent_id: talentId },
            { $set: dataToSave }
          );
          
          // If not found, try by id
          if (result.matchedCount === 0) {
            result = await collection.updateOne(
              { id: talentId },
              { $set: dataToSave }
            );
          }
          
          return NextResponse.json(
            { 
              success: true, 
              message: 'Talent updated successfully (duplicate key resolved)',
              id: talentId,
              matched: result.matchedCount,
              modified: result.modifiedCount
            },
            { 
              status: 200,
              headers: getCorsHeaders()
            }
          );
        }
      } catch (retryError: any) {
        console.error('Error retrying save after duplicate key error:', retryError);
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to save talent', details: error.message },
      { 
        status: 500,
        headers: getCorsHeaders()
      }
    );
  }
}

// GET endpoint to fetch talents with pagination, search, and filters
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';
    const skip = (page - 1) * limit;

    const db = await getDatabase();
    const collection = db.collection('talents');

    // Build query
    const query: any = {};
    
    if (search) {
      query.$or = [
        { 'user.first_name': { $regex: search, $options: 'i' } },
        { 'user.last_name': { $regex: search, $options: 'i' } },
        { 'user.public_name': { $regex: search, $options: 'i' } },
        { 'user.title': { $regex: search, $options: 'i' } },
        { 'user.introduction_headline': { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
      ];
    }

    if (role) {
      query['role.name'] = role;
    }

    // Get total count
    const totalCount = await collection.countDocuments(query);

    // Fetch talents
    const talents = await collection
      .find(query)
      .sort({ 'personal_rank': -1, id: 1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    // Get unique roles for filter
    const roles = await collection.distinct('role.name');

    return NextResponse.json({
      talents,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
      filters: {
        roles: roles.filter(Boolean),
      },
    }, {
      headers: getCorsHeaders()
    });
  } catch (error: any) {
    console.error('Error fetching talents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch talents', details: error.message },
      { 
        status: 500,
        headers: getCorsHeaders()
      }
    );
  }
}

