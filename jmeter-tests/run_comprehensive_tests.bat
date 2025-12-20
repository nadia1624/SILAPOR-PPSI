@echo off
REM =====================================================
REM SILAPOR JMeter Test Runner - Updated Version
REM Script untuk menjalankan test JMeter dengan mudah
REM =====================================================

setlocal enabledelayedexpansion

REM Set JMeter path - Path JMeter Anda
set JMETER_HOME=C:\Users\andre\Downloads\apache-jmeter-5.6.3\apache-jmeter-5.6.3

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
echo   1. Comprehensive Test (20 users - Smoke Test + Auth Flow)
echo   2. Load Test 500 Users (sesuai NFR)
echo   3. Stress Test Progressive (100-1000 users)
echo   4. Quick Smoke Test Original (5 users)
echo   5. Semua Test Baru (Sequential)
echo   6. Buka JMeter GUI
echo   0. Keluar
echo.
set /p choice="Pilih [0-6]: "

if "%choice%"=="1" goto comprehensive_test
if "%choice%"=="2" goto load_test_500
if "%choice%"=="3" goto stress_test
if "%choice%"=="4" goto quick_test
if "%choice%"=="5" goto all_tests
if "%choice%"=="6" goto open_gui
if "%choice%"=="0" goto end

echo Pilihan tidak valid!
pause
goto end

:comprehensive_test
echo.
echo =====================================================
echo   Menjalankan Comprehensive Test (20 Users)...
echo   Public Pages + Authenticated User Flow
echo   Durasi estimasi: ~1-2 menit
echo =====================================================
echo.
set RESULT_FILE=%OUTPUT_DIR%\comprehensive_test_%TIMESTAMP%.jtl
set REPORT_DIR=%OUTPUT_DIR%\comprehensive_test_report_%TIMESTAMP%
"%JMETER_HOME%\bin\jmeter.bat" -n -t "%TEST_DIR%SILAPOR_ComprehensiveTest.jmx" -l "%RESULT_FILE%" -e -o "%REPORT_DIR%"
echo.
echo Test selesai! Report tersedia di: %REPORT_DIR%\index.html
start "" "%REPORT_DIR%\index.html"
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
echo =====================================================
echo   Menjalankan Stress Test Progressive...
echo   Stage 1: 100 users (1 menit)
echo   Stage 2: 300 users (1 menit)
echo   Stage 3: 500 users (2 menit) - TARGET NFR
echo   Stage 4: 750 users (2 menit)
echo   Stage 5: 1000 users (2 menit) - STRESS
echo   Total durasi: ~8-10 menit
echo.
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
goto end

:quick_test
echo.
echo =====================================================
echo   Menjalankan Quick Smoke Test Original (5 Users)...
echo =====================================================
echo.
set RESULT_FILE=%OUTPUT_DIR%\quick_test_%TIMESTAMP%.jtl
set REPORT_DIR=%OUTPUT_DIR%\quick_test_report_%TIMESTAMP%
"%JMETER_HOME%\bin\jmeter.bat" -n -t "%TEST_DIR%SILAPOR_QuickTest.jmx" -l "%RESULT_FILE%" -e -o "%REPORT_DIR%"
echo.
echo Test selesai! Report tersedia di: %REPORT_DIR%\index.html
start "" "%REPORT_DIR%\index.html"
goto end

:all_tests
echo.
echo =====================================================
echo   Menjalankan Semua Test Baru Secara Berurutan...
echo   1. Comprehensive Test (20 users)
echo   2. Load Test (500 users)
echo   3. Stress Test (100-1000 users)
echo   Total durasi: ~15-20 menit
echo =====================================================
echo.
set /p confirm="Yakin ingin melanjutkan? (y/n): "
if /i not "%confirm%"=="y" goto end
echo.

echo [1/3] Comprehensive Test (20 users)...
set RESULT_FILE=%OUTPUT_DIR%\comprehensive_test_%TIMESTAMP%.jtl
set REPORT_DIR=%OUTPUT_DIR%\comprehensive_test_report_%TIMESTAMP%
"%JMETER_HOME%\bin\jmeter.bat" -n -t "%TEST_DIR%SILAPOR_ComprehensiveTest.jmx" -l "%RESULT_FILE%" -e -o "%REPORT_DIR%"
echo Comprehensive Test selesai!
echo.

echo [2/3] Load Test (500 users)...
set RESULT_FILE=%OUTPUT_DIR%\load_test_500_%TIMESTAMP%.jtl
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
