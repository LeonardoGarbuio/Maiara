$files = @(
  "app\dashboard\page.js",
  "app\dashboard\projetos\page.js",
  "app\dashboard\financeiro\page.js",
  "app\dashboard\atestados\page.js"
)

foreach ($f in $files) {
  $content = Get-Content $f -Raw
  
  # Emerald hex -> Gold hex
  $content = $content -replace '#10B981', '#C9A96E'
  $content = $content -replace '#059669', '#B8962E'
  $content = $content -replace '#34D399', '#D4B896'
  
  # Emerald rgba -> Gold rgba
  $content = $content -replace 'rgba\(16,\s*185,\s*129,', 'rgba(201, 169, 110,'
  $content = $content -replace 'rgba\(16, 185, 129,', 'rgba(201, 169, 110,'
  
  Set-Content $f -Value $content -NoNewline
  Write-Host "Updated: $f"
}

Write-Host "`nDone!"
