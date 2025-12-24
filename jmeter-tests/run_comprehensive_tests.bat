@echo off
REM =====================================================
REM SILAPOR JMeter Test Runner - Updated Version
REM Script untuk menjalankan test JMeter dengan mudah
REM =====================================================

setlocal enabledelayedexpansion

REM Set JMeter path - Path JMeter Anda
set JMETER_HOME=C:\Program Files\apache-jmeter-5.6.3

REM Set test files directory
set TEST_DIR=%~dp0

REM Create output directory
set OUTPUT_DIR=%TEST_DIR%results
if not exist "%OUTPUT_DIR%" mkdir "%OUTPUT_DIR%"

REM Timestamp untuk nama file hasil
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set dt=%%a
set TIMESTAMP=%dt:~0,8%_%dt:~8,6%

echo.
echo =====================================================
echo   SILAPOR JMeter Test Runner - Comprehensive
echo   URL: https://silapor.neotelemetri.id/
echo   Tanggal: %date% %time%
echo =====================================================
echo.

REM Check if JMeter exists
if not exist "%JMETER_HOME%\bin\jmeter.bat" (
    echo [ERROR] JMeter tidak ditemukan di: %JMETER_HOME%
    echo.
    echo Silakan edit file ini dan ubah JMETER_HOME ke lokasi JMeter Anda.
    echo Contoh: set JMETER_HOME=C:\apache-jmeter-5.6.3
    echo.
    pause
    exit /b 1
)

echo Pilih test yang ingin dijalankan:
echo.
echo   1. Load Test (500 users - sesuai NFR)
echo   2. Stress Test Progressive (100-1000 users)
echo   3. Volume Test (500 users - Large Data)
echo   4. Semua Test (Sequential)
echo   5. Buka JMeter GUI
echo   0. Keluar
echo.
set /p choice="Pilih [0-5]: "

if "%choice%"=="1" goto load_test_500
if "%choice%"=="2" goto stress_test
if "%choice%"=="3" goto volume_test
if "%choice%"=="4" goto all_tests
if "%choice%"=="5" goto open_gui
if "%choice%"=="0" goto end

echo Pilihan tidak valid!
pause
goto end

:load_test_500
echo.
echo =====================================================
echo   Menjalankan Load Test (500 Users)...
echo   Sesuai NFR: 500 concurrent users, response < 2 detik
echo   Durasi estimasi: ~5-7 menit
echo =====================================================
echo.
set /p confirm="Yakin ingin melanjutkan? (y/n): "
if /i not "%confirm%"=="y" goto end
echo.
set RESULT_FILE=%OUTPUT_DIR%\load_test_500_%TIMESTAMP%.jtl
set REPORT_DIR=%OUTPUT_DIR%\load_test_500_report_%TIMESTAMP%
"%JMETER_HOME%\bin\jmeter.bat" -n -t "%TEST_DIR%SILAPOR_LoadTest_500Users.jmx" -l "%RESULT_FILE%" -e -o "%REPORT_DIR%"
echo.
echo Test selesai! Report tersedia di: %REPORT_DIR%\index.html
start "" "%REPORT_DIR%\index.html"
goto end

:stress_test
echo.
echo ==Ramp-up: 60 detik
echo   Duration: Hingga semua user diuji
echo   Durasi estimasi: ~3-5 menit
echo =====================================================
echo.
set /p confirm="Yakin ingin melanjutkan? (y/n): "
if /i not "%confirm%"=="y" goto end
echo.
set RESULT_FILE=%OUTPUT_DIR%\load_test_500_%TIMESTAMP%.jtl
set REPORT_DIR=%OUTPUT_DIR%\load_test_500_report_%TIMESTAMP%
"%JMETER_HOME%\bin\jmeter.bat" -n -t "%TEST_DIR%SILAPOR_LoadTest_Fixed
echo   WARNING: Test ini akan membebani server dengan load tinggi!
echo =====================================================
echo.
set /p confirm="Yakin ingin melanjutkan? (y/n): "
if /i not "%confirm%"=="y" goto end
echo.
set RESULT_FILE=%OUTPUT_DIR%\stress_test_progressive_%TIMESTAMP%.jtl
set REPORT_DIR=%OUTPUT_DIR%\stress_test_progressive_report_%TIMESTAMP%
"%JMETER_HOME%\bin\jmeter.bat" -n -t "%TEST_DIR%SILAPOR_StressTest_Progressive.jmx" -l "%RESULT_FILE%" -e -o "%REPORT_DIR%"
echo.
echo Test selesai! Report tersedia di: %REPORT_DIR%\index.html
start "" "%REPORT_DIR%\index.html"
gvolume_test
echo.
echo =====================================================
echo   Menjalankan Volume Test (500 Users - Large Data)...
echo   Test performance dengan data volume besar
echo   Fokus: Pagination, Query Performance, Filtering
echo   Users: 500 concurrent
echo   Duration: 5 menit
echo   Durasi estimasi: ~5-7 menit
echo =====================================================
echo.
set /p confirm="Yakin ingin melanjutkan? (y/n): "
if /i not "%confirm%"=="y" goto end
echo.
set RESULT_FILE=%OUTPUT_DIR%\volume_test_%TIMESTAMP%.jtl
set REPORT_DIR=%OUTPUT_DIR%\volume_test_report_%TIMESTAMP%
"%JMETER_HOME%\bin\jmeter.bat" -n -t "%TEST_DIR%SILAPOR_Volume
set REPORT_DIR=%OUTPUT_DIR%\quSecara Berurutan...
echo   1. Load Test (500 users)
echo   2. Stress Test (100-1000 users)
echo   3. Volume Test (500 users - Large Data)
echo   Total durasi: ~18-22 menit
echo.
echo   WARNING: Test ini akan berjalan sangat lama!
echo =====================================================
echo.
set /p confirm="Yakin ingin melanjutkan? (y/n): "
if /i not "%confirm%"=="y" goto end
echo.

echo [1/3] Load Test (500 users)...
set RESULT_FILE=%OUTPUT_DIR%\load_test_500_%TIMESTAMP%.jtl
set REPORT_DIR=%OUTPUT_DIR%\load_test_500_report_%TIMESTAMP%
"%JMETER_HOME%\bin\jmeter.bat" -n -t "%TEST_DIR%SILAPOR_LoadTest_Fixed.jmx" -l "%RESULT_FILE%" -e -o "%REPORT_DIR%"
echo Load Test selesai!
echo.

echo [2/3] Stress Test Progressive (100-1000 users)...
set RESULT_FILE=%OUTPUT_DIR%\stress_test_progressive_%TIMESTAMP%.jtl
set REPORT_DIR=%OUTPUT_DIR%\stress_test_progressive_report_%TIMESTAMP%
"%JMETER_HOME%\bin\jmeter.bat" -n -t "%TEST_DIR%SILAPOR_StressTest_Progressive.jmx" -l "%RESULT_FILE%" -e -o "%REPORT_DIR%"
echo Stress Test selesai!
echo.

echo [3/3] Volume Test (500 users - Large Data)...
set RESULT_FILE=%OUTPUT_DIR%\volume_test_%TIMESTAMP%.jtl
set REPORT_DIR=%OUTPUT_DIR%\volume_test_report_%TIMESTAMP%
"%JMETER_HOME%\bin\jmeter.bat" -n -t "%TEST_DIR%SILAPOR_VolumeTest.jmx" -l "%RESULT_FILE%" -e -o "%REPORT_DIR%"
echo VolumeFILE=%OUTPUT_DIR%\load_test_500_%TIMESTAMP%.jtl
set REPORT_DIR=%OUTPUT_DIR%\load_test_500_report_%TIMESTAMP%
"%JMETER_HOME%\bin\jmeter.bat" -n -t "%TEST_DIR%SILAPOR_LoadTest_500Users.jmx" -l "%RESULT_FILE%" -e -o "%REPORT_DIR%"
echo Load Test selesai!
echo.

echo [3/3] Stress Test Progressive (100-1000 users)...
set RESULT_FILE=%OUTPUT_DIR%\stress_test_progressive_%TIMESTAMP%.jtl
set REPORT_DIR=%OUTPUT_DIR%\stress_test_progressive_report_%TIMESTAMP%
"%JMETER_HOME%\bin\jmeter.bat" -n -t "%TEST_DIR%SILAPOR_StressTest_Progressive.jmx" -l "%RESULT_FILE%" -e -o "%REPORT_DIR%"
echo Stress Test selesai!
echo.

echo =====================================================
echo   Semua test selesai!
echo   Reports tersedia di folder: %OUTPUT_DIR%
echo =====================================================
start "" "%OUTPUT_DIR%"
goto end

:open_gui
echo.
echo Membuka JMeter GUI...
start "" "%JMETER_HOME%\bin\jmeter.bat"
goto end

:end
echo.
pause
