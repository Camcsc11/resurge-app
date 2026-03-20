import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

type AssignmentStatus =
  | 'pending'
  | 'in_creation'
  | 'submitted'
  | 'approved_for_editing'
  | 'in_editing'
  | 'pending_review'
  | 'ready_for_posting'
  | 'posted';

interface ContentAssignment {
  id: string;
  reel_id: string;
  model_id: string;
  status: AssignmentStatus;
  assigned_by: string;
  assigned_at: string;
  completed_at: string | null;
  submission_url: string | null;
  submission_notes: string | null;
  edited_url: string | null;
  editor_id: string | null;
  review_notes: string | null;
  posted_at: string | null;
  ofm_reels: any;
  ofm_creators: any;
}

// Valid status transitions
const VALID_TRANSITIONS: Record<AssignmentStatus, AssignmentStatus[]> = {
  pending: ['in_creation'],
  in_creation: ['submitted', 'pending'],
  submitted: ['approved_for_editing', 'in_creation'],
  approved_for_editing: ['in_editing', 'pending_review'],
  in_editing: ['pending_review'],
  pending_review: ['ready_for_posting', 'in_editing'],
  ready_for_posting: ['posted'],
  posted: [],
};

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const modelId = searchParams.get('model_id');

    let query = supabase
      .from('content_assignments')
      .select(
        `
        id,
        reel_id,
        model_id,
        status,
        assigned_by,
        assigned_at,
        completed_at,
        submission_url,
        submission_notes,
        edited_url,
        editor_id,
        review_notes,
        posted_at,
        ofm_reels!reel_id (id, title, description, source_url),
        ofm_creators!model_id (id, name, email)
        `
      );

    if (modelId) {
      query = query.eq('model_id', modelId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch assignments', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ assignments: data || [] }, { status: 200 });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const body = await request.json();

    const {
      assignment_id,
      new_status,
      submission_url,
      submission_notes,
      edited_url,
      editor_id,
      review_notes,
      posted_at,
    } = body;

    if (!assignment_id) {
      return NextResponse.json(
        { error: 'Assignment ID is required' },
        { status: 400 }
      );
    }

    // Fetch current assignment
    const { data: currentAssignment, error: fetchError } = await supabase
      .from('content_assignments')
      .select('*')
      .eq('id', assignment_id)
      .single();

    if (fetchError || !currentAssignment) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      );
    }

    const currentStatus = currentAssignment.status as AssignmentStatus;

    // Validate status transition if new_status is provided
    if (new_status) {
      if (!VALID_TRANSITIONS[currentStatus].includes(new_status)) {
        return NextResponse.json(
          {
            error: `Invalid status transition from "${currentStatus}" to "${new_status}"`,
            valid_transitions: VALID_TRANSITIONS[currentStatus],
          },
          { status: 400 }
        );
      }

      // Validate required fields for certain transitions
      if (new_status === 'submitted' && !submission_url) {
        return NextResponse.json(
          { error: 'submission_url is required for "submitted" status' },
          { status: 400 }
        );
      }

      if (new_status === 'in_editing' && !editor_id) {
        return NextResponse.json(
          { error: 'editor_id is required for "in_editing" status' },
          { status: 400 }
        );
      }

      if (new_status === 'pending_review' && !edited_url) {
        return NextResponse.json(
          { error: 'edited_url is required for "pending_review" status' },
          { status: 400 }
        );
      }
    }

    // Build update payload
    const updateData: Record<string, any> = {};

    if (new_status) {
      updateData.status = new_status;
    }

    if (submission_url !== undefined) {
      updateData.submission_url = submission_url;
    }

    if (submission_notes !== undefined) {
      updateData.submission_notes = submission_notes;
    }

    if (edited_url !== undefined) {
      updateData.edited_url = edited_url;
    }

    if (editor_id !== undefined) {
      updateData.editor_id = editor_id;
    }

    if (review_notes !== undefined) {
      updateData.review_notes = review_notes;
    }

    if (posted_at !== undefined) {
      updateData.posted_at = posted_at;
    }

    if (new_status === 'posted' || posted_at) {
      updateData.completed_at = new Date().toISOString();
    }

    // Perform update
    const { data: updated, error: updateError } = await supabase
      .from('content_assignments')
      .update(updateData)
      .eq('id', assignment_id)
      .select('*')
      .single();

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update assignment', details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ assignment: updated }, { status: 200 });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
