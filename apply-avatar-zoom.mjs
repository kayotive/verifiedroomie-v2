// Adds click-to-enlarge to the profile photos on three pages.
// Run from the project folder:   node apply-avatar-zoom.mjs
// It only changes the photo line and adds one import. It never touches anything else,
// and it leaves a file alone if it cannot find the exact spot.

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const IMPORT_ANCHOR = 'import { createClient } from "@/lib/supabase/server";';
const IMPORT_LINE = 'import AvatarZoom from "@/components/AvatarZoom";';

const jobs = [
  {
    label: "Listing details page (host photo)",
    file: join("src", "app", "listings", "[id]", "page.tsx"),
    pattern:
      /\/\/ eslint-disable-next-line @next\/next\/no-img-element\s*<img\s+src=\{p\.avatar_url\}\s+alt=\{firstName\}\s+className="h-16 w-16 rounded-full object-cover"\s*\/>/,
    replacement: "<AvatarZoom src={p.avatar_url} name={p.full_name} size={64} />",
  },
  {
    label: "Person profile page (large photo)",
    file: join("src", "app", "people", "[id]", "page.tsx"),
    pattern:
      /\/\/ eslint-disable-next-line @next\/next\/no-img-element\s*<img\s+src=\{person\.avatar_url\}\s+alt=\{firstName\}\s+className="h-32 w-32 rounded-full object-cover"\s*\/>/,
    replacement:
      "<AvatarZoom src={person.avatar_url} name={person.full_name} size={128} />",
  },
  {
    label: "My profile page (preview photo)",
    file: join("src", "app", "profile", "page.tsx"),
    pattern:
      /\/\/ eslint-disable-next-line @next\/next\/no-img-element\s*<img\s+src=\{p\.avatar_url\}\s+alt="Your photo"\s+className="h-20 w-20 rounded-full object-cover"\s*\/>/,
    replacement: "<AvatarZoom src={p.avatar_url} name={p.full_name} size={80} />",
  },
];

let problems = 0;

for (const job of jobs) {
  if (!existsSync(job.file)) {
    console.log(`SKIPPED   ${job.file}  (file not found)`);
    problems++;
    continue;
  }

  const original = readFileSync(job.file, "utf8");

  if (original.includes("AvatarZoom")) {
    console.log(`ALREADY   ${job.file}  (nothing to do)`);
    continue;
  }
  if (!job.pattern.test(original)) {
    console.log(`NOT FOUND ${job.file}  (could not find the photo code, file left unchanged)`);
    problems++;
    continue;
  }
  if (!original.includes(IMPORT_ANCHOR)) {
    console.log(`NOT FOUND ${job.file}  (could not find the import spot, file left unchanged)`);
    problems++;
    continue;
  }

  const eol = original.includes("\r\n") ? "\r\n" : "\n";
  let updated = original.replace(job.pattern, job.replacement);
  updated = updated.replace(IMPORT_ANCHOR, IMPORT_ANCHOR + eol + IMPORT_LINE);
  writeFileSync(job.file, updated, "utf8");
  console.log(`UPDATED   ${job.file}  (${job.label})`);
}

console.log(
  problems
    ? `\nFinished with ${problems} file(s) not changed. Tell me which one and I will give you the exact lines to change by hand.`
    : "\nDone. Photos on these pages now open larger when clicked."
);
