/**
 * File Download Utilities
 * Handles downloading SOPs as various file formats
 */

import type { SOPData } from '../types/sop';

/**
 * Convert HTML to plain Markdown
 */
function htmlToMarkdown(html: string): string {
  // Simple HTML to Markdown conversion
  let markdown = html;

  // Headers
  markdown = markdown.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n');
  markdown = markdown.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n');
  markdown = markdown.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n');

  // Lists
  markdown = markdown.replace(/<ul[^>]*>/gi, '\n');
  markdown = markdown.replace(/<\/ul>/gi, '\n');
  markdown = markdown.replace(/<ol[^>]*>/gi, '\n');
  markdown = markdown.replace(/<\/ol>/gi, '\n');
  markdown = markdown.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n');

  // Paragraphs
  markdown = markdown.replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n');

  // Strong/Bold
  markdown = markdown.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**');
  markdown = markdown.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**');

  // Emphasis/Italic
  markdown = markdown.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*');
  markdown = markdown.replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*');

  // Code
  markdown = markdown.replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`');
  markdown = markdown.replace(/<pre[^>]*>(.*?)<\/pre>/gi, '```\n$1\n```\n');

  // Remove remaining HTML tags
  markdown = markdown.replace(/<[^>]+>/g, '');

  // Clean up excessive newlines
  markdown = markdown.replace(/\n{3,}/g, '\n\n');

  return markdown.trim();
}

/**
 * Download SOP as Markdown file (.md)
 */
export function downloadAsMarkdown(sop: SOPData): void {
  const markdown = htmlToMarkdown(sop.content_md);

  const content = `---
title: ${sop.title}
sop_id: ${sop.sop_id}
yacht_id: ${sop.yacht_id}
user_id: ${sop.user_id}
created: ${new Date().toISOString()}
---

# ${sop.title}

${markdown}
`;

  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${sanitizeFilename(sop.title)}.md`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);

  console.log(`✅ Downloaded SOP as Markdown: ${link.download}`);
}

/**
 * Download SOP as HTML file (.html)
 */
export function downloadAsHtml(sop: SOPData): void {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${sop.title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
      line-height: 1.6;
      color: #1f2937;
    }
    h1 { color: #111827; font-size: 2rem; margin-bottom: 1rem; }
    h2 { color: #374151; font-size: 1.5rem; margin-top: 2rem; }
    h3 { color: #4b5563; font-size: 1.25rem; margin-top: 1.5rem; }
    code {
      background: rgba(0, 0, 0, 0.05);
      padding: 0.2rem 0.4rem;
      border-radius: 4px;
      font-family: 'Monaco', 'Courier New', monospace;
    }
    pre {
      background: rgba(0, 0, 0, 0.05);
      padding: 1rem;
      border-radius: 8px;
      overflow-x: auto;
    }
    .metadata {
      background: #f3f4f6;
      padding: 1rem;
      border-radius: 8px;
      margin-bottom: 2rem;
      font-size: 0.875rem;
      color: #6b7280;
    }
  </style>
</head>
<body>
  <div class="metadata">
    <strong>SOP ID:</strong> ${sop.sop_id}<br>
    <strong>Yacht ID:</strong> ${sop.yacht_id}<br>
    <strong>Created:</strong> ${new Date().toLocaleString()}
  </div>

  ${sop.content_md}
</body>
</html>
`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${sanitizeFilename(sop.title)}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);

  console.log(`✅ Downloaded SOP as HTML: ${link.download}`);
}

/**
 * Download SOP as plain text file (.txt)
 */
export function downloadAsText(sop: SOPData): void {
  const markdown = htmlToMarkdown(sop.content_md);

  const content = `${sop.title}
${'='.repeat(sop.title.length)}

SOP ID: ${sop.sop_id}
Yacht ID: ${sop.yacht_id}
Created: ${new Date().toLocaleString()}

${markdown}
`;

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${sanitizeFilename(sop.title)}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);

  console.log(`✅ Downloaded SOP as Text: ${link.download}`);
}

/**
 * Sanitize filename for safe downloads
 */
function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-z0-9]/gi, '_')
    .replace(/_+/g, '_')
    .toLowerCase();
}

/**
 * Download SOP with format selection
 */
export function downloadSOP(sop: SOPData, format: 'md' | 'html' | 'txt' = 'md'): void {
  switch (format) {
    case 'md':
      downloadAsMarkdown(sop);
      break;
    case 'html':
      downloadAsHtml(sop);
      break;
    case 'txt':
      downloadAsText(sop);
      break;
    default:
      downloadAsMarkdown(sop);
  }
}
