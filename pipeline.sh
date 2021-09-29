#!/bin/bash

DISTRIBUTION_ID=E26VMV2Y7MSACB
S3_BUCKET=s3://noovolari-leapp-website-distribution
OLD_PACKAGE_VERSION=$(node -p -e "require('./package.json').version")

aws s3 ls $S3_BUCKET
if [ $? != 0 ]; then
    echo "error: wrong credentials or not Noovolari ones"
    exit
fi

echo "npm run release -- --release-as $1"
npm run release -- --release-as $1

echo "Please review the auto-generated CHANGELOG.md"
echo "You can modify it and issue a 'git commit --amend' in another shell to amend the last commit. If you amend, remember to create the tag again."
read -p "Type any character once you have completed the review" -n 1 -s;
echo ""

echo "git push --follow-tags origin master"
git push --follow-tags origin master

NEW_PACKAGE_VERSION=$(node -p -e "require('./package.json').version")

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
#export WIN_CSC_KEY_PASSWORD=""
npm run dist-win-prod
rm -Rf ./release/win-unpacked
rm -Rf ./release/.cache
rm -Rf ./release/builder-debug.yml
rm -Rf ./release/builder-effective-config.yaml
cp -r ./release/ ./temp/

echo "move $S3_BUCKET/latest/'s content to $OLD_PACKAGE_VERSION folder"
aws s3 --recursive mv "$S3_BUCKET/latest/" "$S3_BUCKET/$OLD_PACKAGE_VERSION/"

echo "move temp folder's content to $S3_BUCKET/latest/"
aws s3 cp ./temp/ "$S3_BUCKET/latest/" --recursive

echo "upload CHANGELOG.md to $S3_BUCKET"
aws s3 cp CHANGELOG.md "$S3_BUCKET"

echo "invalidate $DISTRIBUTION_ID distribution"
aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths "/*"

echo "deleting temp folder"
rm -rf ./temp
