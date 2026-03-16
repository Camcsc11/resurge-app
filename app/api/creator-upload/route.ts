import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyCreatorToken } from '@/lib/creator-auth';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('creator_session')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyCreatorToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const url = formData.get('url') as string | null;
    const reelId = formData.get('reel_id') as string;
    const notes = formData.get('notes') as string;

    if (!reelId) {
      return NextResponse.json(
        { error: 'Reel ID required' },
        { status: 400 }
      );
    }

    if (!file && !url) {
      return NextResponse.json(
        { error: 'File or URL required' },
        { status: 400 }
      );
    }

    let uploadPath = null;
    let submissionData: Record<string, any> = {};

    if (file) {
      const fileName = `${payload.creator_id}/${reelId}/${Date.now()}_${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from('creator-uploads')
        .upload(fileName, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        return NextResponse.json(
          { error: 'File upload failed' },
          { status: 500 }
        );
      }

      uploadPath = fileName;
      submissionData.file_path = fileName;
      submissionData.file_name = file.name;
      submissionData.file_size = file.size;
    }

    if (url) {
      submissionData.url = url;
    }

    submissionData.submitted_at = new Date().toISOString();

    const { error: updateError } = await supabase
      .from('ofm_reels')
      .update({
        status: 'submitted',
        submission_data: submissionData,
        creator_notes: notes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', reelId)
      .eq('creator_id', payload.creator_id);

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update reel' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Submission successful',
        upload_path: uploadPath,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    );
  }
}
