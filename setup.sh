#!/bin/bash
# 가상환경 생성 및 의존성 설치, 기본 데이터 폴더 준비
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
mkdir -p data/uploads
[ -f data/records.json ] || echo "[]" > data/records.json
[ -f data/videos.json ] || echo "[]" > data/videos.json
echo "setup complete"
