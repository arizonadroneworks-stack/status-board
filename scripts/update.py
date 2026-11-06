name: Update status board

on:
  schedule:
    - cron: '0 13 * * *'   # 0600 Arizona (MST, UTC-7)
    - cron: '0 0 * * *'    # 1700 Arizona
  workflow_dispatch: {}      # "Run workflow" button for an instant update

permissions:
  contents: write

concurrency:
  group: board-update
  cancel-in-progress: false

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.12'
      - run: pip install cryptography==43.0.3 openpyxl==3.1.5
      - name: Pull brief and encrypt
        env:
          BOARD_PASSWORD: ${{ secrets.BOARD_PASSWORD }}
          GMAIL_USER: ${{ secrets.GMAIL_USER }}
          GMAIL_APP_PASSWORD: ${{ secrets.GMAIL_APP_PASSWORD }}
          BRIEF_SENDER: ${{ vars.BRIEF_SENDER }}
        run: python scripts/update.py
      - name: Commit if changed
        run: |
          if [ -n "$(git status --porcelain data.enc.json)" ]; then
            git config user.name "status-board-bot"
            git config user.email "actions@users.noreply.github.com"
            git add data.enc.json
            git commit -m "Board update $(date -u +%Y-%m-%dT%H:%MZ)"
            git push
          else
            echo "No change."
          fi
