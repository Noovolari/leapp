#!/usr/bin/env bash

KEY_CHAIN=build.keychain
CERTIFICATE_P12=certificate.p12
CERTIFICATE_APPLICATION_P12=certificate-application.p12
echo "Recreate the certificate from the secure environment variable"
echo "security create-keychain"
echo $CERTIFICATE_OSX_P12 | base64 --decode > $CERTIFICATE_P12
echo $CERTIFICATE_APPLICATION_OSX_P12 | base64 --decode > $CERTIFICATE_APPLICATION_P12
security create-keychain -p $KEYCHAIN_PASSWORD $KEY_CHAIN
echo "security list-keychains"
security list-keychains -s login.keychain build.keychain
echo "security default-keychain"
security default-keychain -s $KEY_CHAIN
echo "security unlock-keychain"
security unlock-keychain -p $KEYCHAIN_PASSWORD $KEY_CHAIN
echo "security import"
security import $CERTIFICATE_P12 -k $KEY_CHAIN -P '$DECODE_PASSWORD' -T /usr/bin/codesign;
security import $CERTIFICATE_APPLICATION_P12 -k $KEY_CHAIN -P '$DECODE_PASSWORD' -T /usr/bin/codesign;
echo "security find-identity"
security find-identity -v
echo "security set-key-partition-list"
security set-key-partition-list -S apple-tool:,apple:,codesign:, -s -k $KEYCHAIN_PASSWORD $KEY_CHAIN
rm -fr *.p12
npm install
npm run $1
npm run release-mac

