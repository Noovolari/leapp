#!/usr/bin/env bash

KEY_CHAIN=build.keychain
CERTIFICATE_P12=certificate.p12
CERTIFICATE_APPLICATION_P12=certificate-application.p12
echo "Recreate the certificate from the secure environment variable"
echo "security create-keychain"
echo "${{ env.CERTIFICATE_OSX_P12 }}" | base64 --decode > $CERTIFICATE_P12
echo "${{ env.CERTIFICATE_APPLICATION_OSX_P12 }}" | base64 --decode > $CERTIFICATE_APPLICATION_P12
security create-keychain -p ${{ env.KEYCHAIN_PASSWORD }} $KEY_CHAIN
echo "security list-keychains"
security list-keychains -s login.keychain build.keychain
echo "security default-keychain"
security default-keychain -s $KEY_CHAIN
echo "security unlock-keychain"
security unlock-keychain -p ${{ env.KEYCHAIN_PASSWORD }} $KEY_CHAIN
echo "security import"
security import $CERTIFICATE_P12 -k $KEY_CHAIN -P '${{ env.DECODE_PASSWORD }}' -T /usr/bin/codesign;
security import $CERTIFICATE_APPLICATION_P12 -k $KEY_CHAIN -P '${{ env.DECODE_PASSWORD }}' -T /usr/bin/codesign;
echo "security find-identity"
security find-identity -v
echo "security set-key-partition-list"
security set-key-partition-list -S apple-tool:,apple:,codesign:, -s -k ${{ env.KEYCHAIN_PASSWORD }} $KEY_CHAIN
rm -fr *.p12
npm install
npm run set-target-x64
npm run release-mac
rm -Rf ./release/mac
rm -Rf ./release/mac-unpacked
rm -Rf ./release/.cache
rm -Rf ./release/builder-debug.yml
rm -Rf ./release/builder-effective-config.yaml
TAG_VERSION=${{ needs.tag-validation.outputs.tag-version }}
TAG_VERSION=${TAG_VERSION:1}
rm "./release/Leapp-$TAG_VERSION-mac.zip"
rm "./release/Leapp-$TAG_VERSION-mac.zip.blockmap"
zip "./release/Leapp-$TAG_VERSION-mac.zip" "./release/Leapp-$TAG_VERSION.dmg"
