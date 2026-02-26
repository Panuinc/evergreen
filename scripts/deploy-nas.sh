#!/bin/sh
# ============================================================
# Deploy Evergreen to Synology NAS
# ============================================================
#
# SSH เข้า NAS:
#   ssh Panuwat.Ja@192.168.1.120
#
# Run script:
#   sh /volume1/docker/evergreen/scripts/deploy-nas.sh
#
# ============================================================

PROJECT_DIR="/volume1/docker/evergreen"
REPO_URL="https://github.com/Panuinc/evergreen/archive/refs/heads/main.tar.gz"

echo "============================================================"
echo " Evergreen NAS Deploy"
echo "============================================================"
echo ""

# ------ Step 1: Go to project directory ------
echo "[1/5] Entering project directory..."
cd "$PROJECT_DIR" || {
  echo "ERROR: Directory $PROJECT_DIR not found"
  echo "Creating directory..."
  mkdir -p "$PROJECT_DIR"
  cd "$PROJECT_DIR"
}
echo "  OK: $(pwd)"
echo ""

# ------ Step 2: Download latest code ------
echo "[2/5] Downloading latest code from GitHub..."
curl -L "$REPO_URL" | tar xz --strip-components=1
if [ $? -eq 0 ]; then
  echo "  OK: Code downloaded"
else
  echo "  ERROR: Download failed"
  exit 1
fi
echo ""

# ------ Step 3: Check .env.local exists ------
echo "[3/5] Checking .env.local..."
if [ -f .env.local ]; then
  echo "  OK: .env.local exists"
else
  echo "  ERROR: .env.local not found!"
  echo "  Please create .env.local first with the required environment variables"
  exit 1
fi
echo ""

# ------ Step 4: Stop old containers ------
echo "[4/5] Stopping old containers..."
sudo docker compose down 2>/dev/null
echo "  OK: Old containers stopped"
echo ""

# ------ Step 5: Build & Start ------
echo "[5/5] Building and starting containers..."
echo "  This may take 5-10 minutes on first build..."
echo ""
sudo docker compose up -d --build

if [ $? -eq 0 ]; then
  echo ""
  echo "============================================================"
  echo " Deploy SUCCESS!"
  echo "============================================================"
  echo ""
  echo "Containers:"
  sudo docker compose ps
  echo ""
  echo "App:      http://192.168.1.120:3000"
  echo "BC Sync:  Every 1 hour (automatic)"
  echo ""
  echo "Useful commands:"
  echo "  sudo docker logs evergreen --tail 50        # App logs"
  echo "  sudo docker logs evergreen-bc-sync --tail 20 # BC sync logs"
  echo "  sudo docker compose restart                  # Restart all"
  echo "  sudo docker compose down                     # Stop all"
  echo "============================================================"
else
  echo ""
  echo "ERROR: Build failed! Check logs above."
  exit 1
fi
