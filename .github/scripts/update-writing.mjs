// Refreshes the "Latest writing" block of README.md from Dev Community (devcommunity.io).
// Run by .github/workflows/writing.yml every Monday, or by hand: node .github/scripts/update-writing.mjs
import { readFile, writeFile } from "node:fs/promises";

const USER = "danamphred";
const README = new URL("../../README.md", import.meta.url);

const res = await fetch(`https://api.devcommunity.io/api/users/${USER}/posts?limit=20`);
if (!res.ok) throw new Error(`devcommunity.io answered ${res.status}`);
const { data = [] } = await res.json();

const date = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
const items = data
  .filter((post) => post.id && post.title && (!post.status || post.status === "published"))
  .sort((a, b) => String(b.publishedAt).localeCompare(String(a.publishedAt)))
  .slice(0, 5)
  .map((post) => `- [${post.title.trim().replace(/[[\]]/g, "")}](https://devcommunity.io/post/${post.id}) <sub>${date.format(new Date(post.publishedAt))}</sub>`);

if (items.length === 0) {
  console.log("No posts returned, README left unchanged.");
  process.exit(0);
}

const block = ["<!-- WRITING:START -->", ...items, "", "<sub>[All articles on baruka.me](https://baruka.me/en/writing)</sub>", "<!-- WRITING:END -->"].join("\n");
const readme = await readFile(README, "utf8");
const next = readme.replace(/<!-- WRITING:START -->[\s\S]*?<!-- WRITING:END -->/, block);
if (next !== readme) {
  await writeFile(README, next);
  console.log(`Updated with ${items.length} posts.`);
} else {
  console.log("Already up to date.");
}
