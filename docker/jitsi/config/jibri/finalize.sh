#!/bin/bash
# TrueLern Jibri Recording Finalize Script
# Called by Jibri when a recording directory finalizes

RECORDING_DIR="$1"
echo "TrueLern Finalizing Recording in: $RECORDING_DIR"

if [ -z "$RECORDING_DIR" ]; then
    echo "No recording directory provided."
    exit 0
fi

# Find the mp4 file
MP4_FILE=$(find "$RECORDING_DIR" -type f -name "*.mp4" | head -n 1)

if [ -n "$MP4_FILE" ]; then
    echo "Found finalized recording file: $MP4_FILE"
    chmod 644 "$MP4_FILE"
fi

exit 0
