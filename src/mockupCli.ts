#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

import { generateMicrosite } from './generator';
import { createPasswordGate } from './generator/passwordGate';
import { extractThemeFromHtml } from './generator/theme';
import type { MicrositeInput } from './generator/types';
import { renderIntakeApp } from './intake';

const USAGE = `Usage: build-mockup [--out-dir examples/mockup] [--password <password>]
                   [--input examples/ferrari-input.json]
                   [--homepage examples/ferrari-homepage.html]

Writes a clickable, offline mockup of the whole flow: the cognition.com-styled intake
form and waiting game, plus the prospect-themed page it hands off to. The form
runs in demo mode (no backend) and links to the generated page on disk.`;

interface Args {
  outDir: string;
  password: string;
  inputPath: string;
  homepagePath: string;
  demoDurationSeconds: number;
}

function parseArgs(argv: string[]): Args {
  const args: Args = {
    outDir: 'examples/mockup',
    password: 'ferrari123',
    inputPath: 'examples/ferrari-input.json',
    homepagePath: 'examples/ferrari-homepage.html',
    demoDurationSeconds: 24,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--out-dir') args.outDir = argv[(i += 1)];
    else if (arg === '--password') args.password = argv[(i += 1)];
    else if (arg === '--input') args.inputPath = argv[(i += 1)];
    else if (arg === '--homepage') args.homepagePath = argv[(i += 1)];
    else if (arg === '--demo-seconds') args.demoDurationSeconds = Number(argv[(i += 1)]);
    else if (arg === '--help' || arg === '-h') {
      console.log(USAGE);
      process.exit(0);
    } else {
      console.error(USAGE);
      process.exit(1);
    }
  }

  return args;
}

function main(): void {
  const { outDir, password, inputPath, homepagePath, demoDurationSeconds } = parseArgs(
    process.argv.slice(2),
  );

  const input = JSON.parse(readFileSync(inputPath, 'utf8')) as MicrositeInput;
  input.passwordGate = createPasswordGate(password);
  input.theme = extractThemeFromHtml(
    readFileSync(homepagePath, 'utf8'),
    input.company?.websiteUrl,
  );

  const micrositeName = 'generated-page.html';
  const microsite = generateMicrosite(input);
  const intake = renderIntakeApp({
    endpoint: 'https://cognition.ai/api/microsite',
    demo: true,
    demoResultUrl: `./${micrositeName}`,
    demoDurationSeconds,
  });

  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, micrositeName), microsite, 'utf8');
  writeFileSync(join(outDir, 'index.html'), intake, 'utf8');

  console.error(`Wrote ${join(outDir, 'index.html')} and ${join(outDir, micrositeName)}`);
  console.error(`Open the form, submit anything, and unlock the page with: ${password}`);
  console.error(`Mockup root: ${dirname(join(outDir, 'index.html'))}`);
}

main();
