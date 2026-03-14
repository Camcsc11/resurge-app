import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { createGoogleDriveClient } from 'A/lib/google-drive/client';
import { deleteGoogleDriveFile } from '@/lib/google-drive/helpers';

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { clipId } = body;

    const supabase = await createServerSupabaseClient();
    const session = await supabase.auth.getSession();

    if (!session?.data.session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all submissions for the clip
    const { data: submissions, error: submissionError } = await supabase
      .from('submissions')
      .select('id, drive_file_id')
      .eq('clip_id', clipId);

    if (submissionError) {
      return NextResponse.json(
        { error: 'Failed to fetch submissions' },
        { status: 500 }
      );
    }

    const driveClient = createGoogleDriveClient();

    // Delete Google Drive files for each submission
    if (submissions && submissions.length > 0) {
      for (const submission of submissions) {
        if (submission.drive_file_id) {
          try {
            await deleteGoogleDriveFile(driveClient, submission.drive_file_id);
          } catch (error) {
            console.error(
              `Error deleting Drive file ${submission.drive_file_id}:`,
              error
            );
          }
        }
      }
    }

    // Delete finished_clips records (cascade handled by DB)
    const { error: finishedError } = await supabase
      .from('finished_clips')
      .delete()
      .eq('clip_id', clipId);

    if (finishedError) {
      console.error('Error deleting finished clips:', finishedError);
    }

    // Delete qa_reviews records (cascade handled by DB)
    const { error: reviewError } = await supabase
      .from('qa_reviews')
      .delete()
      .in(
        'submission_id',
        submissions?.map((s) => s.id) || []
      );

    if (reviewError) {
      console.error('Error deleting QA reviews:', reviewError);
    }

    // Delete submissions records
    const { error: deleteSubmissionError } = await supabase
      .from('submissions')
      .delete()
      .eq('clip_id', clipId);

    if (deleteSubmissionError) {
      return NextResponse.json(
        { error: 'Failed to delete submissions' },
        { status: 500 }
      );
    }

    // Delete clip record
    const { error: deleteClipError } = await supabase
      .from('clips')
      .delete()
      .eq('id', clipId);

    if (deleteClipError) {
      return NextResponse.json(
        { error: 'Failed to delete clip' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Clip and all related records deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete clip error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
