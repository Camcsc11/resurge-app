import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const assignmentId = formData.get('assignment_id') as string;
    const uploadType = formData.get('upload_type') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'Video file is required' },
        { status: 400 }
      );
    }

    if (!assignmentId) {
      return NextResponse.json(
        { error: 'Assignment ID is required' },
        { status: 400 }
      );
    }

    if (uploadType !== 'submission' && uploadType !== 'edited') {
      return NextResponse.json(
        { error: 'Upload type must be "submission" or "edited"' },
        { status: 400 }
      );
    }

    // Determine the file path: {assignment_id}/submission.mp4 or {assignment_id}/edited.mp4
    const fileName = uploadType === 'submission' ? 'submission.mp4' : 'edited.mp4';
    const filePath = `${assignmentId}/${fileName}`;

    // Upload to Supabase Storage
    const { error: uploadError, data } = await supabase.storage
      .from('content-submissions')
      .upload(filePath, file, {
        upsert: true, // Overwrite if file exists
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json(
        { error: 'File upload failed', details: uploadError.message },
        { status: 500 }
      );
    }

    // Generate public URL
    const {
      data: { publicUrl },
    } = supabase.storage
      .from('content-submissions')
      .getPublicUrl(filePath);

    return NextResponse.json(
      {
        success: true,
        url: publicUrl,
        path: filePath,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
