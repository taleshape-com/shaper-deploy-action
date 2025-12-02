## Shaper Deploy GitHub Action

Deploy Shaper dashboards from configuration files in your repository using the `@taleshape/shaper` CLI.

This action uses `npx` to run the `@taleshape/shaper` package and execute `shaper deploy` in your repository.

### Usage

```yaml
name: Deploy Shaper Dashboards

on:
  push:
    branches: [ main ]

jobs:
  deploy-shaper:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Deploy Shaper Dashboards
        uses: taleshape-com/shaper-deploy-action@v1
        with:
          api-key: ${{ secrets.SHAPER_DEPLOY_API_KEY }}
          shaper-version: "0.12.0"
          config-file: "./shaper.json"
          validate-only: false
```

### Inputs

- **api-key** (optional):
  - API key used to authenticate with the Shaper deploy API.
  - If omitted, `SHAPER_DEPLOY_API_KEY` will not be set. Whether this is required depends on your Shaper configuration.

- **shaper-version** (optional, default: `latest`):
  - Version of `@taleshape/shaper` to use, e.g. `0.12.0`.
  - If not provided, `latest` is used.

- **config-file** (optional, default: `./shaper.json`):
  - Path to the Shaper configuration file.
  - If set to a non-empty value, it will be passed as `--config <value>` to `shaper deploy`.
  - If set to an empty string, the `--config` flag is omitted entirely (Shaper will then use its own default behavior).

- **validate-only** (optional, default: `false`):
  - If `true`, the action runs:
    - `shaper deploy --config <config> --validate-only`
  - This validates your configuration without performing a deployment. Useful for pull requests.

- **working-directory** (optional, default: `.`):
  - Directory (relative to the repository root) where the `shaper deploy` command should be executed.
  - Use this for monorepos where the Shaper config lives in a subdirectory.

### How it works

- The action determines the working directory (default is the GitHub workspace root or `working-directory` if provided).
- If `api-key` is provided, it is exported as `SHAPER_DEPLOY_API_KEY` for the `shaper` CLI.
- It then runs:
  - `npx --yes @taleshape/shaper@<shaper-version> deploy [--config <config-file>] [--validate-only]`
- Any non-zero exit code from `shaper deploy` will fail the action.

### Example: validate only in pull requests

```yaml
name: Validate Shaper Dashboards

on:
  pull_request:
    branches: [ main ]

jobs:
  validate-shaper:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Validate Shaper Dashboards
        uses: taleshape-com/shaper-deploy-action@v1
        with:
          api-key: ${{ secrets.SHAPER_DEPLOY_API_KEY }}
          shaper-version: "0.12.0"
          config-file: "./shaper.json"
          validate-only: true
```

### License

This project is licensed under the MIT License. See `LICENSE` for details.
