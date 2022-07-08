#!/bin/bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
rm -rf $DIR/layer
mkdir -p $DIR/layer/nodejs
cp $DIR/package.json $DIR/package-lock.json $DIR/layer/nodejs
npm install --only=prod --prefix=$DIR/layer/nodejs
cd $DIR/layer && zip -r ./nodejs.zip ./nodejs
rm -rf $DIR/layer/nodejs
