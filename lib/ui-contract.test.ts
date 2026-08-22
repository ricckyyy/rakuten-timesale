import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';

function source(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

test('qualifies every affiliate product link as sponsored and protects new tabs', () => {
  assert.match(
    source('components/ProductCard.tsx'),
    /rel="sponsored noopener noreferrer"/,
  );
});

test('renders the homepage featured CTA as a blog link', () => {
  assert.match(
    source('app/page.tsx'),
    /<Link\s+href=\{`\/blog\/\$\{post\.slug\}`\}\s+className="mt-3[^"]*"\s*>\s*\{post\.cta \?\? '記事を読む'\}\s*<\/Link>/s,
  );
});
