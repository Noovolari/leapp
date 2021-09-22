#!/bin/bash

echo "creating temp folder"
mkdir -p temp/

echo "npm run dist-mac-prod"
npm run dist-mac-prod
rm -Rf ./release/mac
rm -Rf ./release/mac-unpacked
rm -Rf ./release/.cache
rm -Rf ./release/builder-debug.yml
rm -Rf ./release/builder-effective-config.yaml
cp -r ./release/ ./temp/

rm "./temp/Leapp-$NEW_PACKAGE_VERSION-mac.zip"
zip "./temp/Leapp-$NEW_PACKAGE_VERSION-mac.zip" "./temp/Leapp-$NEW_PACKAGE_VERSION.dmg"

echo "npm run dist-deb-prod"
npm run dist-deb-prod
rm -Rf ./release/linux-unpacked
rm -Rf ./release/.cache
rm -Rf ./release/builder-debug.yml
rm -Rf ./release/builder-effective-config.yaml
cp -r ./release/ ./temp/

echo "npm run dist-win-prod"
export WIN_CSC_KEY_PASSWORD=123456
npm run dist-win-prod
rm -Rf ./release/win-unpacked
rm -Rf ./release/.cache
rm -Rf ./release/builder-debug.yml
rm -Rf ./release/builder-effective-config.yaml
cp -r ./release/ ./temp/
