#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID="titlenote"
OUTDIR="$(pwd)/project-export"
GCS_BUCKET="${PROJECT_ID}-backup"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FS_EXPORT_DIR="firestore-export-${TIMESTAMP}"

echo "Output directory: $OUTDIR"
mkdir -p "$OUTDIR/firebase-exports" "$OUTDIR/metadata" "$OUTDIR/functions"

echo "Checking firebase & gcloud auth..."
firebase projects:list | grep -q "$PROJECT_ID" || true

echo "Setting gcloud project to $PROJECT_ID"
gcloud config set project "$PROJECT_ID"

# Create GCS bucket if not exists
if ! gsutil ls -b "gs://$GCS_BUCKET" >/dev/null 2>&1; then
  echo "Creating GCS bucket gs://$GCS_BUCKET"
  gsutil mb -p "$PROJECT_ID" "gs://$GCS_BUCKET" || echo "Bucket creation failed (may exist or no permission)"
else
  echo "GCS bucket gs://$GCS_BUCKET already exists"
fi

# Firestore export (requires billing + permission)
echo "Starting Firestore export..."
gcloud firestore export "gs://$GCS_BUCKET/$FS_EXPORT_DIR" --project "$PROJECT_ID" || echo "Firestore export failed (billing/permission?)"

# Download Firestore export if it exists
echo "Downloading Firestore export..."
mkdir -p "$OUTDIR/firebase-exports/firestore"
gsutil -m cp -r "gs://$GCS_BUCKET/$FS_EXPORT_DIR" "$OUTDIR/firebase-exports/firestore/" || echo "Firestore download failed or not present"

# Realtime DB (best-effort)
RTDB_INSTANCE=""  # set to your RTDB instance name if you use RTDB
if command -v firebase >/dev/null 2>&1; then
  echo "Attempting Realtime Database export..."
  if [ -z "$RTDB_INSTANCE" ]; then
    set +e
    firebase database:get / --project "$PROJECT_ID" > "$OUTDIR/firebase-exports/rtdb.json"
    if [ $? -ne 0 ]; then
      echo "Realtime DB export failed or not used. Skipping rtdb.json"
      rm -f "$OUTDIR/firebase-exports/rtdb.json" || true
    else
      echo "Saved Realtime DB to $OUTDIR/firebase-exports/rtdb.json"
    fi
    set -e
  else
    firebase database:get / --project "$PROJECT_ID" --instance "$RTDB_INSTANCE" > "$OUTDIR/firebase-exports/rtdb.json" || echo "RTDB export failed for instance $RTDB_INSTANCE"
  fi
else
  echo "firebase CLI not found; skipping Realtime DB export"
fi

# Storage sync (default bucket PROJECT_ID.appspot.com)
STORAGE_BUCKET="${PROJECT_ID}.appspot.com"
echo "Syncing storage bucket gs://$STORAGE_BUCKET to local folder..."
mkdir -p "$OUTDIR/firebase-exports/storage"
gsutil -m rsync -r "gs://$STORAGE_BUCKET" "$OUTDIR/firebase-exports/storage" || echo "Storage sync may have failed (check bucket name/permissions)."

# Auth export (best-effort)
echo "Exporting Auth users..."
firebase auth:export "$OUTDIR/firebase-exports/users.json" --project "$PROJECT_ID" --format=json || echo "Auth export failed or no users."

# Rules & Indexes
echo "Exporting rules & indexes..."
firebase firestore:rules:get --project "$PROJECT_ID" > "$OUTDIR/metadata/firestore.rules" || echo "No firestore rules fetched."
firebase database:rules:get --project "$PROJECT_ID" > "$OUTDIR/metadata/database.rules.json" || echo "No realtime DB rules fetched or not used."
firebase storage:rules:get --project "$PROJECT_ID" > "$OUTDIR/metadata/storage.rules" || echo "No storage rules fetched."
firebase firestore:indexes > "$OUTDIR/metadata/firestore.indexes.json" || echo "No indexes exported or CLI not available."

# Hosting attempt (common bucket names)
for hb in "${PROJECT_ID}.web.app" "${PROJECT_ID}.appspot.com"; do
  if gsutil ls -b "gs://$hb" >/dev/null 2>&1; then
    mkdir -p "$OUTDIR/firebase-exports/hosting"
    gsutil -m cp -r "gs://$hb" "$OUTDIR/firebase-exports/hosting/" || echo "Hosting copy failed for $hb"
    break
  fi
done

# Functions list (source should be copied from repo)
gcloud functions list --project "$PROJECT_ID" > "$OUTDIR/metadata/functions_list.txt" || echo "gcloud functions list failed."

# Zip results
cd "$OUTDIR"
zip -r "../${PROJECT_ID}_export_${TIMESTAMP}.zip" . || echo "zip failed"
cd - >/dev/null

echo "All done. Export ZIP: ${OUTDIR}/../${PROJECT_ID}_export_${TIMESTAMP}.zip"
