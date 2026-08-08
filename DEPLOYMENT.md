# Deployment Guide

Follow this guide to run the Autonomous Competitive Pricing & E-Commerce Agent application either locally for development or deployed on an AWS EC2 instance.

---

## 1. Environment Configuration

Create a `.env` file in both the `/Server` and `/AI-Service` directories (or define them in the system environment when running via Docker Compose).

### Server Env Configuration (`/Server/.env`):
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/competitive_pricing
REDIS_URL=redis://localhost:6379
FASTAPI_SERVICE_URL=http://localhost:8000
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
CRON_SCHEDULE=0 */6 * * *
```

### Python Service Env Configuration (`/AI-Service/.env`):
```env
GEMINI_API_KEY=AIzaSyYourGeminiApiKeyFromGoogleAIStudio
MONGODB_URI=mongodb://localhost:27017/competitive_pricing
CHROMA_DB_PATH=./chroma_db
```

---

## 2. Local Setup (Without Docker)

### Run MongoDB & Redis:
Make sure local instances of MongoDB (port `27017`) and Redis (port `6379`) are running on your host machine.

### Run Python AI Service:
1. Navigate to `/AI-Service`
2. Create virtual environment and activate:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   playwright install chromium
   ```
4. Run server:
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

### Run Express Backend:
1. Navigate to `/Server`
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run in development mode:
   ```bash
   npm run dev
   ```

### Run React Frontend:
1. Navigate to `/Frontend`
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run dev server:
   ```bash
   npm run dev
   ```
4. Open browser at `http://localhost:3000`

---

## 3. Running with Docker Compose (Recommended)

To orchestrate the complete multi-service stack with a single command:

1. Create a root `.env` file containing your configurations:
   ```env
   GEMINI_API_KEY=AIzaSyYourKeyHere
   SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
   ```
2. Build and launch containers:
   ```bash
   docker compose up -d --build
   ```
3. Verify running containers:
   ```bash
   docker compose ps
   ```
4. access panels:
   - Frontend Panel: `http://localhost`
   - Express backend check: `http://localhost:5000/health`
   - Python FastAPI documentation check: `http://localhost:8000/docs`

---

## 4. Deploying to AWS EC2

### Step A: Launch and Configure EC2 Instance
1. Launch an EC2 instance running Ubuntu 22.04 LTS (t3.medium or larger recommended).
2. Configure security groups to expose incoming ports:
   - Port `80` (HTTP) and Port `443` (HTTPS)
   - Port `22` (SSH from your IP)

### Step B: Install Docker & Docker Compose on EC2
Run the following commands on the EC2 shell:
```bash
sudo apt-get update
sudo apt-get install -y apt-transport-https ca-certificates curl software-properties-common
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
sudo usermod -aG docker $USER
newgrp docker
```

### Step C: Setup GitHub Actions CI/CD Secrets
To enable automated deployments via our `deploy.yml` workflow:
1. Go to your GitHub repository Settings ➔ Secrets and Variables ➔ Actions.
2. Add the following secrets:
   - `EC2_HOST`: The Public IP or DNS of your EC2 instance.
   - `EC2_USER`: Usually `ubuntu`.
   - `EC2_SSH_KEY`: The private key (.pem) file content used to log in.
   - `GEMINI_API_KEY`: Google Generative AI API access key.
   - `SLACK_WEBHOOK_URL`: Slack webhook endpoint.
