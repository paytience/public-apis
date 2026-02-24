# Contributing to public-apis

## Adding a New API

The easiest way to add a new API is through our website:

1. Visit [findapis.com](https://findapis.com)
2. Click **"Suggest an API"**
3. Fill in the API details
4. Submit for review

Your submission will be reviewed and if approved, the API will appear in the directory within 1 minute.

<div align="center">
    <img src="./assets/add-api-screenshot.jpg" alt="Suggest an API on findapis.com" width="600">
</div>

---

## Alternative: Pull Request

If you prefer, you can also submit a pull request directly to this repository.

### Important: Source of Truth

> ⚠️ **`db/resources.json` is the source of truth** for this repository.
>
> - `README.md` and `categories/*.md` files are **auto-generated** from `resources.json`
> - To add or modify an API via PR, edit `db/resources.json` directly
> - Do NOT edit `README.md` or files in the `categories/` folder - your changes will be overwritten

### Guidelines

> While the masses of pull requests and community involvement are appreciated, some pull requests have been specifically
> opened to market company APIs that offer paid solutions. This API list is not a marketing tool, but a tool to help the
> community build applications and use free, public APIs quickly and easily. Pull requests that are identified as marketing attempts will not be accepted.
>
> Please make sure the API you want to add has full, free access or at least a free tier and does not depend on the purchase of a device/service before submitting. An example that would be rejected is an API that is used to control a smart outlet - the API is free, but you must purchase the smart device.
>
> Thanks for understanding! :)

## API Entry Format

Each API entry in `db/resources.json` has the following fields:

```json
{
  "API Name": "NASA",
  "Description": "NASA data, including imagery",
  "Auth": "apiKey",
  "HTTPS": true,
  "Cors": "yes",
  "Documentation Link": "https://api.nasa.gov",
  "Category": "Science & Math",
  "Pricing": "free"
}
```

### Field Descriptions

| Field | Description | Valid Values |
|-------|-------------|--------------|
| `API Name` | Name of the API (do NOT end with "API") | Any string |
| `Description` | Brief description (max 100 characters) | Any string |
| `Auth` | Authentication method | `apiKey`, `OAuth`, `Bearer`, `No`, or empty |
| `HTTPS` | Supports HTTPS? | `true` or `false` |
| `Cors` | Supports [CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)? | `yes`, `no`, or `unknown` |
| `Documentation Link` | URL to API documentation | Must start with `http://` or `https://` |
| `Category` | Category for the API | See [categories list](#categories) |
| `Pricing` | Pricing model | `free`, `freemium`, `paid`, or `unknown` |

### Categories

Valid categories are:
- Animals, Anime, Anti-Malware, Art & Design
- Authentication & Authorization, Blockchain, Books, Business
- Calendar, Cloud Storage & File Sharing, Continuous Integration
- Cryptocurrency, Currency Exchange, Data Validation
- Development, Dictionaries, Documents & Productivity
- Email, Entertainment, Environment, Events
- Finance, Food & Drink, Games & Comics, Geocoding
- Government, Health, Jobs, Machine Learning
- Music, News, Open Data, Open Source Projects
- Other, Patent, Personality, Phone
- Photography, Podcasts, Programming, Science & Math
- Security, Shopping, Social, Sports & Fitness
- Test Data, Text Analysis, Tracking, Transportation
- URL Shorteners, Vehicle, Video, Weather

## Pull Request Guidelines

- Search previous Pull Requests or Issues before making a new one, as yours may be a duplicate
- Add one API per Pull Request
- Make sure the PR title is in the format of `Add Api-name API` _for e.g._: `Add NASA API`
- Use a short descriptive commit message. _for e.g._: `Add NASA API to Science & Math`
- Don't mention the TLD (Top Level Domain) in the name of the API. _for e.g._: ❌ Gmail.com ✔ Gmail
- Please make sure the API name does not end with `API`. _for e.g._: ❌ Gmail API ✔ Gmail
- Please make sure the API has proper documentation
- Target your Pull Request to the `main` branch

### How to Add an API via Pull Request

1. Fork and clone the repository
2. Edit `db/resources.json` - add your API entry in alphabetical order within the `entries` array
3. Update the `count` field at the top of the file
4. Commit with a descriptive message: `Add [API Name] to [Category]`
5. Open a pull request

### Pull Request Pro Tips

- [Fork][fork-link] the repository and [clone][clone-link] it locally.
  Connect your local repository to the original `upstream` repository by adding it as a [remote][remote-link].
  Pull in changes from `upstream` often so that you stay up to date and so when you submit your pull request,
  merge conflicts will be less likely. See more detailed instructions [here][syncing-link].
- Create a [branch][branch-link] for your edits.
- Contribute in the style of the project as outlined above. This makes it easier for the collaborators to merge
  and for others to understand and maintain in the future.

### Open Pull Requests

Once you've opened a pull request, a discussion will start around your proposed changes.

Other contributors and users may chime in, but ultimately the decision is made by the collaborators.

During the discussion, you may be asked to make some changes to your pull request.

If so, add more commits to your branch and push them – they will automatically go into the existing pull request.

Opening a pull request will trigger a build to check the validity of all links in the project. After the build completes, **please ensure that the build has passed**. If the build did not pass, please view the build logs and correct any errors that were found in your contribution.

_Thanks for being a part of this project, and we look forward to hearing from you soon!_

[branch-link]: http://guides.github.com/introduction/flow/
[clone-link]: https://help.github.com/articles/cloning-a-repository/
[fork-link]: http://guides.github.com/activities/forking/
[remote-link]: https://help.github.com/articles/configuring-a-remote-for-a-fork/
[syncing-link]: https://help.github.com/articles/syncing-a-fork
