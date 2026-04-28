$files = @(
  "app\page.module.css",
  "app\components\DriveExplorer.module.css",
  "app\dashboard\dashboard.module.css",
  "app\dashboard\painel.module.css",
  "app\dashboard\atestados\atestados.module.css",
  "app\dashboard\clientes\clientes.module.css",
  "app\dashboard\equipe\equipe.module.css",
  "app\dashboard\financeiro\financeiro.module.css",
  "app\dashboard\projetos\projetos.module.css"
)

foreach ($f in $files) {
  $content = Get-Content $f -Raw
  
  # Carbon -> Sage
  $content = $content -replace '--carbon-950', '--sage-950'
  $content = $content -replace '--carbon-900', '--sage-900'
  $content = $content -replace '--carbon-800', '--sage-800'
  $content = $content -replace '--carbon-700', '--sage-700'
  $content = $content -replace '--carbon-600', '--sage-600'
  $content = $content -replace '--carbon-500', '--sage-500'
  $content = $content -replace '--carbon-400', '--sage-400'
  $content = $content -replace '--carbon-300', '--sage-300'
  $content = $content -replace '--carbon-200', '--sage-200'
  $content = $content -replace '--carbon-100', '--sage-100'
  
  # Emerald -> Gold
  $content = $content -replace '--emerald-900', '--gold-700'
  $content = $content -replace '--emerald-700', '--gold-700'
  $content = $content -replace '--emerald-600', '--gold-600'
  $content = $content -replace '--emerald-500', '--gold-500'
  $content = $content -replace '--emerald-400', '--gold-400'
  $content = $content -replace '--emerald-300', '--gold-300'
  
  # Raw rgba emerald -> gold
  $content = $content -replace 'rgba\(16,\s*185,\s*129,', 'rgba(201, 169, 110,'
  $content = $content -replace 'rgba\(5,\s*150,\s*105,', 'rgba(184, 150, 46,'
  
  # Hex emerald -> gold  
  $content = $content -replace '#10B981', '#C9A96E'
  $content = $content -replace '#059669', '#B8962E'
  $content = $content -replace '#34D399', '#D4B896'
  $content = $content -replace '#6EE7B7', '#E2CEAF'
  
  Set-Content $f -Value $content -NoNewline
  Write-Host "Updated: $f"
}

Write-Host "`nDone! All files migrated."
