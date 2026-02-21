import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { auth } from '@/lib/auth';
import { openai } from '@/lib/openai';
import { JOB_URL_PARSE_PROMPT } from '@/constants/prompts';

interface ParsedJobData {
  job_title: string | null;
  company: string | null;
  location: string | null;
  salary_range: string | null;
  job_description: string | null;
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { url } = await req.json();
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'Missing url' }, { status: 400 });
    }

    // Validate URL format
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        return NextResponse.json({ error: 'Invalid URL protocol' }, { status: 400 });
      }
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    // Fetch the page content
    let html: string;
    try {
      const response = await fetch(parsedUrl.toString(), {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Jobapp/1.0)',
          'Accept': 'text/html,application/xhtml+xml',
        },
        redirect: 'follow',
        signal: AbortSignal.timeout(15000),
      });

      if (!response.ok) {
        return NextResponse.json(
          { error: `Failed to fetch URL: ${response.status}` },
          { status: 422 }
        );
      }

      html = await response.text();
    } catch (error) {
      const message = error instanceof Error && error.name === 'TimeoutError'
        ? 'Request timed out'
        : 'Failed to fetch URL';
      return NextResponse.json({ error: message }, { status: 422 });
    }

    // Extract meaningful text from the HTML, preserving structure
    const $ = cheerio.load(html);

    // Remove non-content elements
    $('script, style, nav, footer, header, iframe, noscript, svg, form, [role="navigation"], [role="banner"], [role="contentinfo"]').remove();

    // Convert list items first — flatten inner whitespace and prefix with "- "
    $('li').each((_, el) => {
      const text = $(el).text().replace(/\s+/g, ' ').trim();
      $(el).replaceWith(`\n- ${text}\n`);
    });

    // Insert newlines around block-level elements to preserve structure
    $('br').replaceWith('\n');
    $('p, div, section, h1, h2, h3, h4, h5, h6, tr, blockquote').each((_, el) => {
      $(el).prepend('\n').append('\n');
    });

    // Try to find the main content area
    const mainContent = $('main, [role="main"], article, .job-description, .job-details, #job-description, #job-details, .posting-page, .job-posting').first();

    let extractedText: string;
    if (mainContent.length > 0) {
      extractedText = mainContent.text();
    } else {
      extractedText = $('body').text();
    }

    // Clean up whitespace while preserving intentional newlines
    extractedText = extractedText
      .replace(/[^\S\n]+/g, ' ')       // collapse horizontal whitespace only
      .replace(/\n[ \t]+/g, '\n')      // trim leading whitespace after newlines
      .replace(/[ \t]+\n/g, '\n')      // trim trailing whitespace before newlines
      .replace(/\n{3,}/g, '\n\n')      // cap consecutive newlines at 2
      .trim();

    // Limit text length to avoid token limits
    const maxLength = 8000;
    if (extractedText.length > maxLength) {
      extractedText = extractedText.substring(0, maxLength);
    }

    if (!extractedText || extractedText.length < 50) {
      return NextResponse.json(
        { error: 'Could not extract meaningful content from the page' },
        { status: 422 }
      );
    }

    // Send to OpenAI for structured extraction
    const prompt = JOB_URL_PARSE_PROMPT.replace('{{extracted_text}}', extractedText);

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

    const parsed: ParsedJobData = JSON.parse(rawContent);

    return NextResponse.json({
      job_title: parsed.job_title ?? null,
      company: parsed.company ?? null,
      location: parsed.location ?? null,
      salary_range: parsed.salary_range ?? null,
      job_description: parsed.job_description ?? null,
    });
  } catch (error) {
    console.error('Parse job URL error:', error);
    return NextResponse.json(
      { error: 'Failed to parse job posting' },
      { status: 500 }
    );
  }
}
