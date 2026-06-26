#!/usr/bin/env sh
set -eu

ANDROID_JAR="${ANDROID_HOME:-$HOME/Library/Android/sdk}/platforms/android-36.1/android.jar"
JAVAC="/Applications/Android Studio.app/Contents/jbr/Contents/Home/bin/javac"

"$JAVAC" -cp "$ANDROID_JAR" -d /tmp/inversiones-android-check \
  app/src/main/java/com/inversioneswilliansmarte/app/MainActivity.java
xmllint --noout app/src/main/AndroidManifest.xml app/src/main/res/values/styles.xml
