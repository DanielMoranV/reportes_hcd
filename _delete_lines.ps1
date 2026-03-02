$file = 'dashboard_farmacia.js'
$lines = Get-Content $file -Encoding UTF8
$keep = $lines[0..117] + $lines[701..($lines.Count-1)]
$keep | Set-Content $file -Encoding UTF8
Write-Host "Done. Lines remaining: $($keep.Count)"
