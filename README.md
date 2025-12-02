## Shaper Deploy GitHub Action

Deploy [Shaper](https://github.com/taleshape-com/shaper) dashboards from configuration files in your repository using the `shaper` CLI.

This action uses `npx` to run the `@taleshape/shaper` package and execute `shaper deploy` in your repository.

### Usage

```yaml
name: Deploy and Validate Shaper Dashboards

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  validate:
    name: Validate on PRs
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Validate Shaper Dashboards
        uses: taleshape-com/shaper-deploy-action@v1
        with:
          validate-only: true
          api-key: ${{ secrets.SHAPER_DEPLOY_API_KEY }}

  deploy:
    name: Deploy on main
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy Shaper Dashboards
        uses: taleshape-com/shaper-deploy-action@v1
        with:
          api-key: ${{ secrets.SHAPER_DEPLOY_API_KEY }}
```

### Inputs

- **api-key**:
  - API key used to authenticate with the Shaper deploy API.

- **shaper-version** (optional, default: `latest`):
  - Version of `@taleshape/shaper` npm package to use
  - If not provided, `latest` is used.

- **config-file** (optional, default: `./shaper.json`):
  - Path to the Shaper configuration file.
  - If set to a non-empty value, it will be passed as `--config <value>` to `shaper deploy`.

- **validate-only** (optional, default: `false`):
  - If `true`, the action runs:
    - `shaper deploy --config <config> --validate-only`
  - This validates your configuration without performing a deployment. Useful for pull requests.

- **working-directory** (optional, default: `.`):
  - Directory (relative to the repository root) where the `shaper deploy` command should be executed.

### License

This project is licensed under the MIT License. See `LICENSE` for details.
