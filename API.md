# API

The `db/` folder contains the source of truth for all API data in this repository:

- `resources.json` - All APIs with their metadata
- `categories.json` - All categories

These files sync bidirectionally with Supabase. The `README.md` and `categories/*.md` files are auto-generated from `resources.json`.

## Fetching the Data

You can use [Octokit](https://github.com/octokit) to fetch the data from the `db` folder.

Here's a minimal snippet on how to accomplish that:

```ts
import { Octokit } from 'octokit'

async function fetchResources(file: string) {
    const octokit = new Octokit({ auth: process.env.GITHUB_ACCESS_TOKEN })

    const { data } = await octokit.rest.repos.getContent({
        owner: 'paytience',
        repo: 'public-apis',
        path: `/db/${file}.json`,
    })

    if (data.download_url) {
        const result = await fetch(data.download_url)

        if (!result.ok) {
            throw new Error(`Unexpected response ${result.statusText}`)
        }

        return await result.json()
    } else {
        throw new Error('Download URL not found')
    }
}
```

## Data Structure

`categories.json`:

```ts
{
    "count": number,
    "entries": [
        {
            "name": string,
            "slug": string
        }
    ]
}
```

`resources.json`:

```ts
{
    "count": number,
    "entries": [
        {
            "API Name": string,
            "Description": string,
            "Auth": string,
            "HTTPS": boolean,
            "Cors": string,
            "Documentation Link": string,
            "Category": string,
            "Pricing": string
        }
    ]
}
```

## Direct URL Access

You can also access the raw JSON files directly:

- **resources.json**: `https://raw.githubusercontent.com/paytience/public-apis/main/db/resources.json`
- **categories.json**: `https://raw.githubusercontent.com/paytience/public-apis/main/db/categories.json`
