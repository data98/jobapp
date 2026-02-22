import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { openai } from '@/lib/openai';
import { RESUME_PARSE_PROMPT } from '@/constants/prompts';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Only PDF files are supported' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 });
    }

    // Extract text from PDF using pdf-parse v1
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let pdfText: string;
    try {
      // Import from inner path to bypass pdf-parse's test file loader
      // that crashes in Next.js (tries to read ./test/data/05-versions-space.pdf)
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require('pdf-parse/lib/pdf-parse.js');
      const result = await pdfParse(buffer);
      pdfText = result.text;
    } catch (err) {
      console.error('PDF text extraction failed:', err);
      return NextResponse.json(
        { error: 'Failed to read PDF content' },
        { status: 422 }
      );
    }

    // Clean up extracted text
    pdfText = pdfText
      .replace(/[^\S\n]+/g, ' ')
      .replace(/\n[ \t]+/g, '\n')
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    if (!pdfText || pdfText.length < 20) {
      return NextResponse.json(
        { error: 'Could not extract text from PDF' },
        { status: 422 }
      );
    }

    // Limit text to avoid token limits
    if (pdfText.length > 10000) {
      pdfText = pdfText.substring(0, 10000);
    }

    // Send to OpenAI for structured extraction
    const prompt = RESUME_PARSE_PROMPT.replace('{{resume_text}}', pdfText);

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    });

    const rawContent = completion.choices[0]?.message?.content;
    if (!rawContent) {
      return NextResponse.json(
        { error: 'No response from AI' },
        { status: 500 }
      );
    }

    const parsed = JSON.parse(rawContent);

    return NextResponse.json(parsed);
  } catch (error) {
    console.error('Resume parse error:', error);
    return NextResponse.json(
      { error: 'Failed to parse resume' },
      { status: 500 }
    );
  }
}
