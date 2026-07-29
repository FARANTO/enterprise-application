$ErrorActionPreference = 'SilentlyContinue'
$BASE = 'http://localhost:5000'
$script:TOKEN = $null
$script:STORE_ID = $null
$script:BRANCH_ID = $null
$script:PRODUCT_ID = $null
$script:CATEGORY_ID = $null
$script:CUSTOMER_ID = $null
$script:ORDER_ID = $null
$script:pass = 0
$script:fail = 0

function Show-Result {
    param([string]$label, [bool]$ok, [string]$extra)
    if ($ok) {
        Write-Host "  [PASS] $label $extra" -ForegroundColor Green
        $script:pass++
    } else {
        Write-Host "  [FAIL] $label $extra" -ForegroundColor Red
        $script:fail++
    }
}

function Call-API {
    param([string]$method, [string]$path, $body, [bool]$useAuth)
    $headers = @{ 'Content-Type' = 'application/json' }
    if ($useAuth -and $script:TOKEN) { $headers['Authorization'] = "Bearer $($script:TOKEN)" }
    $params = @{ Uri = "$BASE$path"; Method = $method; Headers = $headers; ErrorAction = 'Stop' }
    if ($body) { $params['Body'] = ($body | ConvertTo-Json -Depth 10) }
    try {
        return Invoke-RestMethod @params
    } catch {
        $statusCode = $null
        $responseBody = $null
        try {
            $statusCode = [int]$_.Exception.Response.StatusCode
            $stream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($stream)
            $text = $reader.ReadToEnd()
            $responseBody = $text | ConvertFrom-Json
        } catch {}
        return [PSCustomObject]@{ __error=$true; __status=$statusCode; __msg=$_.Exception.Message; __body=$responseBody }
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ENTERPRISE POS/ERP - API TEST SUITE   " -ForegroundColor Cyan
Write-Host "  Backend: $BASE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "`n--- AUTH ---" -ForegroundColor Yellow

# TEST 1: SIGNUP - try a unique non-admin test user (non-admin so no conflict)
Write-Host "TEST 1: POST /auth/signup (ROLE_STORE_ADMIN)"
$testEmail = "kirotestuser_$(Get-Random -Maximum 9999)@test.com"
$r = Call-API -method POST -path '/auth/signup' -body @{ fullName='Kiro Tester'; email=$testEmail; password='Pass1234!'; role='ROLE_STORE_ADMIN' } -useAuth $false
if ($r.jwt) {
    $script:TOKEN = $r.jwt
    Show-Result -label 'POST /auth/signup' -ok $true -extra "jwt received, user=$testEmail"
} else {
    Show-Result -label 'POST /auth/signup' -ok $false -extra "$($r.__msg)"
}

# TEST 2: LOGIN with newly created user
Write-Host "TEST 2: POST /auth/login"
$r = Call-API -method POST -path '/auth/login' -body @{ email=$testEmail; password='Pass1234!' } -useAuth $false
if ($r.jwt) {
    $script:TOKEN = $r.jwt
    Show-Result -label 'POST /auth/login' -ok $true -extra "jwt received"
    # Decode JWT - note: JwtProvider uses claim key "authorities"
    $parts = $r.jwt.Split('.')
    if ($parts.Length -ge 2) {
        $seg = $parts[1]; $pad = 4 - ($seg.Length % 4); if ($pad -ne 4) { $seg += '=' * $pad }
        try {
            $payload = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($seg)) | ConvertFrom-Json
            $authorities = $payload.authorities
            Show-Result -label 'JWT contains authorities claim (Bug13 fix)' -ok ($null -ne $authorities -and $authorities -ne '') -extra "authorities=$authorities"
        } catch { Show-Result -label 'JWT decode' -ok $false -extra $_.Exception.Message }
    }
} else {
    Show-Result -label 'POST /auth/login' -ok $false -extra $r.__msg
}

if (-not $script:TOKEN) { Write-Host "  No token - stopping" -ForegroundColor Red; exit 1 }
