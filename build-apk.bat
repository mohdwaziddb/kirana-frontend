@echo off
echo Building React Native APK...
echo.

echo Step 1: Installing Expo CLI...
call npx @expo/cli install

echo.
echo Step 2: Building APK...
call npx @expo/cli build:android --type apk

echo.
echo APK Build Complete!
echo Check your Expo dashboard for the APK download link.
pause
