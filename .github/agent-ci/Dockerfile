FROM ghcr.io/actions/actions-runner:latest

USER root

# Install Node.js (needed for Playwright CLI) and Chromium system dependencies
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
 && apt-get install -y -qq nodejs \
 && npx -y playwright install-deps chromium \
 && rm -rf /var/lib/apt/lists/*

USER runner
