#!/usr/bin/env node

/**
 * Generate README.md and category files from db/resources.json
 *
 * Reads the API data from the database and generates:
 * 1. Main README.md with index linking to category files
 * 2. Individual category files in categories/ directory
 */

import * as fs from "fs";
import * as path from "path";

const DB_PATH = path.join(process.cwd(), "db", "resources.json");
const README_PATH = path.join(process.cwd(), "README.md");
const CATEGORIES_DIR = path.join(process.cwd(), "categories");

/**
 * Generate a URL-friendly slug from a category name
 */
function categoryToSlug(category) {
  return category
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/--+/g, "-");
}

/**
 * Format auth value for display
 */
function formatAuth(auth) {
  if (!auth || auth === "") return "No";
  if (auth === "apiKey") return "`apiKey`";
  if (auth === "OAuth") return "`OAuth`";
  return `\`${auth}\``;
}

/**
 * Format boolean/string for Yes/No/Unknown display
 */
function formatYesNo(value) {
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "string") {
    const lower = value.toLowerCase();
    if (lower === "yes" || lower === "true") return "Yes";
    if (lower === "no" || lower === "false") return "No";
    if (lower === "unknown") return "Unknown";
    return value;
  }
  return "Unknown";
}

/**
 * Escape pipe characters and newlines in markdown table cells
 */
function escapeMarkdown(text) {
  if (!text) return "";
  return text
    .replace(/\|/g, "\\|")
    .replace(/\n/g, " ")
    .replace(/\r/g, "")
    .replace(/<[^>]*>/g, ""); // Remove HTML tags
}

/**
 * Truncate description to max length, ending at last complete sentence
 */
function truncateDescription(text, maxLength = 100) {
  if (!text) return "";

  // Clean the text first
  let cleaned = text.trim();

  // If already short enough, return as-is
  if (cleaned.length <= maxLength) return cleaned;

  // Try to find the last sentence boundary before maxLength
  const truncated = cleaned.substring(0, maxLength);

  // Look for sentence endings (. ! ?)
  const lastPeriod = truncated.lastIndexOf(".");
  const lastExclaim = truncated.lastIndexOf("!");
  const lastQuestion = truncated.lastIndexOf("?");

  const lastSentence = Math.max(lastPeriod, lastExclaim, lastQuestion);

  // If we found a sentence boundary after at least 40 chars, use it
  if (lastSentence > 40) {
    return cleaned.substring(0, lastSentence + 1);
  }

  // Otherwise, truncate at last space and add ellipsis
  const lastSpace = truncated.lastIndexOf(" ");
  if (lastSpace > 40) {
    return cleaned.substring(0, lastSpace) + "...";
  }

  // Fallback: hard truncate
  return truncated + "...";
}

/**
 * Format pricing value for display
 */
function formatPricing(pricing) {
  if (!pricing || pricing === "" || pricing === "unknown") return "Unknown";
  if (pricing === "free") return "Free";
  if (pricing === "freemium") return "Freemium";
  if (pricing === "paid") return "Paid";
  return pricing;
}

/**
 * Generate API table rows
 */
function generateApiTable(apis) {
  let content = `| API | Description | Auth | HTTPS | CORS | Pricing |\n`;
  content += `|---|---|---|---|---|---|\n`;

  for (const api of apis) {
    const name = escapeMarkdown(api["API Name"] || "");
    const description = escapeMarkdown(
      truncateDescription(api.Description || "", 100),
    );
    const link = api["Documentation Link"] || "";
    const auth = formatAuth(api.Auth);
    const https = formatYesNo(api.HTTPS);
    const cors = formatYesNo(api.Cors);
    const pricing = formatPricing(api.Pricing);

    const nameCell = link ? `[${name}](${link})` : name;
    content += `| ${nameCell} | ${description} | ${auth} | ${https} | ${cors} | ${pricing} |\n`;
  }

  return content;
}

/**
 * Generate a category file
 */
function generateCategoryFile(category, apis, sortedCategories) {
  const slug = categoryToSlug(category);

  // Find prev/next categories for navigation
  const currentIndex = sortedCategories.indexOf(category);
  const prevCategory =
    currentIndex > 0 ? sortedCategories[currentIndex - 1] : null;
  const nextCategory =
    currentIndex < sortedCategories.length - 1
      ? sortedCategories[currentIndex + 1]
      : null;

  let content = `# ${category}\n\n`;
  content += `${apis.length} APIs in this category.\n\n`;
  content += `[Back to Main Index](../README.md)\n\n`;

  // Navigation
  content += `---\n\n`;
  if (prevCategory) {
    content += `← [${prevCategory}](./${categoryToSlug(prevCategory)}.md) | `;
  } else {
    content += `← Previous | `;
  }
  if (nextCategory) {
    content += `[${nextCategory}](./${categoryToSlug(nextCategory)}.md) →\n\n`;
  } else {
    content += `Next →\n\n`;
  }
  content += `---\n\n`;

  content += generateApiTable(apis);

  content += `\n---\n\n`;
  content += `[Back to Main Index](../README.md)\n`;

  return { slug, content };
}

/**
 * Generate the main README content
 */
function generateReadme(sortedCategories, byCategory) {
  // Calculate total APIs
  const totalApis = Object.values(byCategory).reduce(
    (sum, apis) => sum + apis.length,
    0,
  );

  let content = `# Public APIs

<div align="center">
    <a href="https://findapis.com">
        <img src="./assets/findapis-logo.svg" alt="findapis.com" width="64" height="64">
    </a>
    <p>The largest collection of public APIs for developers. Includes free, freemium, and paid APIs.</p>
    <p>
        <a href="https://findapis.com">findapis.com</a> •
        <a href="CONTRIBUTING.md">Contributing Guide</a> •
        <a href="https://github.com/paytience/public-apis/issues">Issues</a> •
        <a href="https://github.com/paytience/public-apis/pulls">Pull Requests</a> •
        <a href="LICENSE">License</a>
    </p>
</div>

## Categories

**${totalApis} APIs** across **${sortedCategories.length} categories**

| Category | APIs |
|----------|------|
`;

  // Generate index with API counts
  for (const category of sortedCategories) {
    const slug = categoryToSlug(category);
    const count = byCategory[category].length;
    content += `| [${category}](./categories/${slug}.md) | ${count} |\n`;
  }

  content += `
---

## Want to add an API?

### Option 1: Pull Request

Edit [\`db/resources.json\`](./db/resources.json) and submit a pull request. See the [Contributing Guide](CONTRIBUTING.md).

**Required fields:**
- \`API Name\` - Name of the API (don't end with "API")
- \`Documentation Link\` - URL to API documentation

**Optional fields:**
- \`Description\` - What the API does
- \`Category\` - One of the categories above
- \`Auth\` - Authentication type: \`apiKey\`, \`OAuth\`, \`Bearer\`, or empty
- \`HTTPS\` - \`true\` or \`false\`
- \`Cors\` - \`yes\`, \`no\`, or empty
- \`Pricing\` - \`free\`, \`freemium\`, \`paid\`, or empty

### Option 2: Via Website

Visit [findapis.com](https://findapis.com) and click **"Suggest an API"**.

<div align="center">
    <img src="./assets/add-api-screenshot.jpg" alt="Suggest an API on findapis.com" width="600">
</div>

---

*Source of truth: [\`db/resources.json\`](./db/resources.json). Syncs bidirectionally with [Supabase](https://supabase.com).*
`;

  return content;
}

/**
 * Ensure the categories directory exists and is clean
 */
function ensureCategoriesDirectory() {
  if (fs.existsSync(CATEGORIES_DIR)) {
    // Remove existing category files
    const files = fs.readdirSync(CATEGORIES_DIR);
    for (const file of files) {
      if (file.endsWith(".md")) {
        fs.unlinkSync(path.join(CATEGORIES_DIR, file));
      }
    }
  } else {
    fs.mkdirSync(CATEGORIES_DIR, { recursive: true });
  }
}

/**
 * Main function
 */
function main() {
  console.log(
    "Generating README.md and category files from db/resources.json...\n",
  );

  // Check if db file exists
  if (!fs.existsSync(DB_PATH)) {
    console.error(`Error: ${DB_PATH} not found`);
    console.error("Run the sync-from-supabase script first.");
    process.exit(1);
  }

  // Read and parse the database
  const rawData = fs.readFileSync(DB_PATH, "utf-8");
  const data = JSON.parse(rawData);

  // Group APIs by category
  const byCategory = {};
  for (const api of data.entries) {
    const category = api.Category || "Other";
    if (!byCategory[category]) {
      byCategory[category] = [];
    }
    byCategory[category].push(api);
  }

  // Sort categories alphabetically
  const sortedCategories = Object.keys(byCategory).sort();

  // Sort APIs within each category alphabetically
  for (const category of sortedCategories) {
    byCategory[category].sort((a, b) =>
      (a["API Name"] || "").localeCompare(b["API Name"] || ""),
    );
  }

  console.log(
    `Found ${data.count} APIs in ${sortedCategories.length} categories`,
  );

  // Ensure categories directory exists
  ensureCategoriesDirectory();

  // Generate category files
  console.log("\nGenerating category files...");
  for (const category of sortedCategories) {
    const { slug, content } = generateCategoryFile(
      category,
      byCategory[category],
      sortedCategories,
    );
    const filePath = path.join(CATEGORIES_DIR, `${slug}.md`);
    fs.writeFileSync(filePath, content, "utf-8");
    console.log(`  ✓ ${slug}.md (${byCategory[category].length} APIs)`);
  }

  // Generate main README
  console.log("\nGenerating main README.md...");
  const readmeContent = generateReadme(sortedCategories, byCategory);
  fs.writeFileSync(README_PATH, readmeContent, "utf-8");

  console.log(`\n✓ Successfully generated:`);
  console.log(
    `  - README.md (index with ${sortedCategories.length} categories)`,
  );
  console.log(`  - ${sortedCategories.length} category files in categories/`);
  console.log(`  - ${data.count} total APIs`);
}

main();
