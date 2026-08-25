#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';

import { generateMicrosite, MicrositeInputError } from './generator';
import { createPasswordGate } from './generator/passwordGate';
import { extractThemeFromHtml } from './generator/theme';
import type { MicrositeInput } from './generator/types';

const USAGE = `Usage: generate-microsite <input.json> [--out page.html] [--password <password>]
                          [--theme-from <homepage.html> [--theme-source-url <url>]]

Renders a research payload into a single self-contained microsite HTML file.
Reads stdin when <input.json> is "-". Writes to stdout when --out is omitted.
--password attaches a client-side gate (overrides passwordGate in the payload).
--theme-from derives the palette, type, and layout from a saved copy of the
prospect's homepage (overrides theme in the payload).`;

interface Args {
  inputPath: string;
  outPath?: string;
  password?: string;
  themeFrom?: string;
  themeSourceUrl?: string;
}

function parseArgs(argv: string[]): Args {
  const positional: string[] = [];
  let outPath: string | undefined;
  let password: string | undefined;
  let themeFrom: string | undefined;
  let themeSourceUrl: string | undefined;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--out' || arg === '-o') {
      outPath = argv[(i += 1)];
    } else if (arg === '--password' || arg === '-p') {
      password = argv[(i += 1)];
    } else if (arg === '--theme-from') {
      themeFrom = argv[(i += 1)];
    } else if (arg === '--theme-source-url') {
      themeSourceUrl = argv[(i += 1)];
    } else if (arg === '--help' || arg === '-h') {
      console.log(USAGE);
      process.exit(0);
    } else {
      positional.push(arg);
    }
  }

  if (positional.length !== 1) {
    console.error(USAGE);
    process.exit(1);
  }
  return { inputPath: positional[0], outPath, password, themeFrom, themeSourceUrl };
}

function main(): void {
  const { inputPath, outPath, password, themeFrom, themeSourceUrl } = parseArgs(
    process.argv.slice(2),
  );
  const raw = readFileSync(inputPath === '-' ? 0 : inputPath, 'utf8');
  const input = JSON.parse(raw) as MicrositeInput;

  if (password) {
    input.passwordGate = createPasswordGate(password);
  }

  if (themeFrom) {
    input.theme = extractThemeFromHtml(
      readFileSync(themeFrom, 'utf8'),
      themeSourceUrl ?? input.company?.websiteUrl,
    );
  }

  try {
    const html = generateMicrosite(input);
    if (outPath) {
      writeFileSync(outPath, html, 'utf8');
      console.error(`Wrote ${outPath} (${html.length} bytes)`);
    } else {
      process.stdout.write(html);
    }
  } catch (error) {
    if (error instanceof MicrositeInputError) {
      console.error(error.message);
      process.exit(2);
    }
    throw error;
  }
}

main();
