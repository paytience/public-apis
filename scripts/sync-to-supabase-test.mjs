#!/usr/bin/env node

/**
 * TEST VERSION - Syncs to apis_test table instead of apis
 *
 * Use this to test the sync without affecting production data.
 * Create the apis_test table first with the same schema as apis.
 *
 * Required environment variables:
 * - SUPABASE_URL: Your Supabase project URL
 * - SUPABASE_SERVICE_ROLE_KEY: Service role key for write access
 */

import * as fs from "fs";
import * as path from "path";

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TARGET_TABLE = "apis_test"; // Change this to test different tables

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing environment variables");
  console.error("Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

console.log(`\n⚠️  TEST MODE - Syncing to "${TARGET_TABLE}" table\n`);

/**
 * Make a request to Supabase REST API
 */
async function supabaseRequest(endpoint, options = {}) {
  const url = `${SUPABASE_URL}/rest/v1/${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      Prefer: options.prefer || "return=representation",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Supabase API error: ${response.status} ${response.statusText} - ${errorText}`
    );
  }

  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

/**
 * Fetch all items from Supabase with pagination
 */
async function fetchAllPaginated(table, select, filters = {}) {
  const pageSize = 1000;
  let allData = [];
  let offset = 0;

  while (true) {
    const params = new URLSearchParams();
    params.set("select", select);
    params.set("limit", pageSize.toString());
    params.set("offset", offset.toString());

    for (const [key, value] of Object.entries(filters)) {
      params.set(key, value);
    }

    const data = await supabaseRequest(`${table}?${params.toString()}`);
    allData = allData.concat(data);

    if (data.length < pageSize) {
      break;
    }

    offset += pageSize;
  }

  return allData;
}

/**
 * Fetch all categories from Supabase
 */
async function fetchCategories() {
  console.log("Fetching categories from Supabase...");
  const categories = await fetchAllPaginated("categories", "id,name,slug");
  console.log(`Fetched ${categories.length} categories`);
  return categories;
}

/**
 * Fetch all existing API documentation links from test table
 */
async function fetchExistingApiLinks() {
  console.log(`Fetching existing API links from ${TARGET_TABLE}...`);
  try {
    const apis = await fetchAllPaginated(TARGET_TABLE, "documentation_link");
    const links = new Set(apis.map((api) => api.documentation_link).filter(Boolean));
    console.log(`Found ${links.size} existing APIs in ${TARGET_TABLE}`);
    return links;
  } catch (err) {
    if (err.message.includes("404") || err.message.includes("does not exist")) {
      console.log(`Table ${TARGET_TABLE} is empty or doesn't exist yet`);
      return new Set();
    }
    throw err;
  }
}

/**
 * Read resources.json
 */
function readResources() {
  const filePath = path.join(process.cwd(), "db", "resources.json");

  if (!fs.existsSync(filePath)) {
    console.error(`Error: ${filePath} not found`);
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  console.log(`Read ${data.count} APIs from resources.json`);
  return data.entries;
}

/**
 * Map resources.json auth values to Supabase format
 */
function mapAuth(auth) {
  if (!auth || auth === "No" || auth === "unknown") return "";
  return auth;
}

/**
 * Map resources.json cors values to Supabase format
 */
function mapCors(cors) {
  if (typeof cors === "string") {
    const lower = cors.toLowerCase();
    if (lower === "yes") return "yes";
    if (lower === "no") return "no";
  }
  return "";
}

/**
 * Map resources.json pricing values to Supabase format
 */
function mapPricing(pricing) {
  if (!pricing) return null;
  const lower = pricing.toLowerCase();
  if (["free", "freemium", "paid"].includes(lower)) return lower;
  return null;
}

/**
 * Insert new APIs into test table
 */
async function insertApis(apis) {
  if (apis.length === 0) {
    console.log("No new APIs to insert");
    return [];
  }

  console.log(`Inserting ${apis.length} new APIs into ${TARGET_TABLE}...`);

  // Insert in batches to avoid timeout
  const batchSize = 100;
  const inserted = [];

  for (let i = 0; i < apis.length; i += batchSize) {
    const batch = apis.slice(i, i + batchSize);
    console.log(
      `  Inserting batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(apis.length / batchSize)}...`
    );

    const result = await supabaseRequest(TARGET_TABLE, {
      method: "POST",
      body: JSON.stringify(batch),
    });

    inserted.push(...(result || []));
  }

  return inserted;
}

/**
 * Main sync function
 */
async function sync() {
  try {
    console.log(`Starting resources.json → ${TARGET_TABLE} sync...\n`);

    // Read local resources
    const localApis = readResources();

    // Fetch categories for mapping
    const categories = await fetchCategories();
    const categoryMap = new Map();
    for (const cat of categories) {
      categoryMap.set(cat.name, cat.id);
    }

    // Get "Other" category ID for fallback
    const otherCategoryId = categoryMap.get("Other");
    if (!otherCategoryId) {
      console.error("Error: 'Other' category not found in Supabase");
      process.exit(1);
    }

    // Fetch existing API links from test table
    const existingLinks = await fetchExistingApiLinks();

    // Find new APIs (not in test table)
    const newApis = [];
    const skippedNoLink = [];
    const skippedExists = [];

    for (const api of localApis) {
      const docLink = api["Documentation Link"];

      if (!docLink) {
        skippedNoLink.push(api["API Name"]);
        continue;
      }

      if (existingLinks.has(docLink)) {
        skippedExists.push(api["API Name"]);
        continue;
      }

      // Map category to category_id
      const categoryId = categoryMap.get(api.Category) || otherCategoryId;

      newApis.push({
        api_name: api["API Name"],
        description: api.Description || "",
        auth: mapAuth(api.Auth),
        https: api.HTTPS ?? true,
        cors: mapCors(api.Cors),
        documentation_link: docLink,
        category_id: categoryId,
        pricing_model: mapPricing(api.Pricing),
        status: "active",
      });
    }

    console.log(`\nSync analysis:`);
    console.log(`  - Total in resources.json: ${localApis.length}`);
    console.log(`  - Already in ${TARGET_TABLE}: ${skippedExists.length}`);
    console.log(`  - Skipped (no doc link): ${skippedNoLink.length}`);
    console.log(`  - New APIs to insert: ${newApis.length}`);

    // Insert new APIs
    if (newApis.length > 0) {
      const inserted = await insertApis(newApis);
      console.log(`\n✓ Successfully inserted ${inserted.length} new APIs into ${TARGET_TABLE}`);

      // Log the new APIs
      console.log("\nNew APIs added:");
      for (const api of newApis.slice(0, 20)) {
        console.log(`  - ${api.api_name}`);
      }
      if (newApis.length > 20) {
        console.log(`  ... and ${newApis.length - 20} more`);
      }
    } else {
      console.log("\n✓ No new APIs to sync");
    }

    console.log(`\n✓ Test sync to ${TARGET_TABLE} completed successfully!`);
  } catch (err) {
    console.error("\n✗ Sync failed:", err);
    process.exit(1);
  }
}

// Run the sync
sync();
