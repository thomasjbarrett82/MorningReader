setlocal
set root=%~dp0

if exist "%root%\release\MorningReader.zip" del "%root%\release\MorningReader.zip"

if not exist "%root%\release\MorningReader" mkdir "%root%\release\MorningReader"
if not exist "%root%\release\MorningReader\css" mkdir "%root%\release\MorningReader\css"
if not exist "%root%\release\MorningReader\images" mkdir "%root%\release\MorningReader\images"
if not exist "%root%\release\MorningReader\scripts" mkdir "%root%\release\MorningReader\scripts"

xcopy "%root%manifest.json" "%root%\release\MorningReader" /Y
xcopy "%root%options.html" "%root%\release\MorningReader" /Y
xcopy "%root%README.md" "%root%\release\MorningReader" /Y

xcopy "%root%css %root%\release\MorningReader\css" /E /Y
xcopy "%root%images" "%root%\release\MorningReader\images" /E /Y
xcopy "%root%scripts" "%root%\release\MorningReader\scripts" /E /Y

"C:\Program Files\7-Zip\7z.exe" a "%root%\release\MorningReader.zip" "%root%\release\MorningReader"