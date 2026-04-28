$files = @(
  "app\dashboard\painel.module.css",
  "app\dashboard\projetos\projetos.module.css",
  "app\dashboard\clientes\clientes.module.css",
  "app\dashboard\equipe\equipe.module.css",
  "app\dashboard\financeiro\financeiro.module.css",
  "app\dashboard\atestados\atestados.module.css",
  "app\components\DriveExplorer.module.css"
)

foreach ($f in $files) {
  $content = Get-Content $f -Raw
  
  # Card hover borders: gold -> verde
  $content = $content -replace 'border-color:\s*rgba\(201, 169, 110,\s*0\.2\)', 'border-color: var(--verde-border)'
  $content = $content -replace 'border-color:\s*rgba\(201, 169, 110,\s*0\.3\)', 'border-color: var(--verde-border)'
  $content = $content -replace 'border-color:\s*rgba\(201, 169, 110,\s*0\.35\)', 'border-color: var(--verde-border)'
  
  # Progress bar fills: gold gradient -> verde gradient
  $content = $content -replace 'linear-gradient\(90deg, var\(--gold-600\), var\(--gold-400\)\)', 'linear-gradient(90deg, var(--verde-600), var(--verde-400))'
  
  # Active filter buttons: gold -> verde
  $content = $content -replace 'background:\s*rgba\(201, 169, 110,\s*0\.12\)\s*!important', 'background: var(--verde-bg-strong) !important'
  $content = $content -replace 'border-color:\s*rgba\(201, 169, 110,\s*0\.3\)\s*!important', 'border-color: var(--verde-border) !important'
  $content = $content -replace 'color:\s*var\(--gold-400\)\s*!important', 'color: var(--verde-200) !important'
  
  # Active client card borders
  $content = $content -replace 'border-color:\s*rgba\(201, 169, 110,\s*0\.35\)\s*!important;\s*background:\s*rgba\(201, 169, 110,\s*0\.05\)\s*!important', 'border-color: var(--verde-border) !important; background: var(--verde-bg) !important'
  
  # Project type tags
  $content = $content -replace 'color:\s*var\(--gold-400\);\s*\n\s*font-weight:\s*500;\s*\n\s*background:\s*rgba\(201, 169, 110,\s*0\.1\)', 'color: var(--verde-200);`n  font-weight: 500;`n  background: var(--verde-bg-strong)'
  
  # Info boxes: gold -> verde
  $content = $content -replace 'background:\s*rgba\(201, 169, 110,\s*0\.07\)', 'background: var(--verde-bg)'
  $content = $content -replace 'border:\s*1px solid rgba\(201, 169, 110,\s*0\.15\)', 'border: 1px solid var(--verde-border)'
  $content = $content -replace 'color:\s*var\(--gold-400\);\s*\}', 'color: var(--verde-200); }'
  
  # Input focus: gold -> verde
  $content = $content -replace 'border-color:\s*var\(--gold-500\)', 'border-color: var(--verde-500)'
  
  # Active tags: gold -> verde
  $content = $content -replace 'color:\s*var\(--gold-400\);\s*background:\s*rgba\(201, 169, 110,\s*0\.1\)', 'color: var(--verde-200); background: var(--verde-bg-strong)'
  
  # Admin card border
  $content = $content -replace 'border-color:\s*rgba\(201, 169, 110,\s*0\.15\)', 'border-color: rgba(63, 85, 83, 0.3)'
  $content = $content -replace 'background:\s*rgba\(201, 169, 110,\s*0\.02\)', 'background: var(--verde-bg)'
  
  # Section title icon color
  $content = $content -replace 'color:\s*var\(--gold-400\);\s*\n\}', 'color: var(--verde-400);`n}'
  
  # Avatar gradient for admin: gold -> verde  
  $content = $content -replace 'linear-gradient\(135deg, var\(--gold-600\), var\(--gold-500\)\)', 'linear-gradient(135deg, var(--verde-600), var(--verde-400))'
  
  # Approve/file buttons: gold -> verde
  $content = $content -replace 'color:\s*var\(--gold-400\);\s*\n\s*text-decoration', 'color: var(--verde-300);`n  text-decoration'
  
  # Upload box hover: gold -> verde
  $content = $content -replace 'border-color:\s*var\(--gold-500\);\s*\n\s*color:\s*var\(--gold-400\)', 'border-color: var(--verde-500);`n  color: var(--verde-300)'
  
  # Phase in progress / completed uses verde
  $content = $content -replace 'background:\s*rgba\(201, 169, 110,\s*0\.08\);\s*color:\s*var\(--gold-400\)', 'background: var(--verde-bg); color: var(--verde-200)'
  $content = $content -replace 'background:\s*rgba\(201, 169, 110,\s*0\.1\);\s*color:\s*var\(--gold-400\)', 'background: var(--verde-bg-strong); color: var(--verde-200)'
  
  # Folder/file selected state
  $content = $content -replace 'background:\s*rgba\(201, 169, 110,\s*0\.1\)', 'background: var(--verde-bg-strong)'
  $content = $content -replace 'background:\s*rgba\(201, 169, 110,\s*0\.15\)', 'background: var(--verde-bg-strong)'
  $content = $content -replace 'outline:\s*2px dashed var\(--gold-400\)', 'outline: 2px dashed var(--verde-400)'
  
  # Crumb hover
  $content = $content -replace 'color:\s*var\(--gold-400\);\s*background:\s*rgba\(201, 169, 110,\s*0\.08\)', 'color: var(--verde-300); background: var(--verde-bg)'
  
  # Dot approved
  $content = $content -replace 'background:\s*var\(--gold-400\);\s*box-shadow:\s*0 0 6px var\(--gold-400\)', 'background: var(--verde-400); box-shadow: 0 0 6px var(--verde-400)'
  
  # BtnNewFolder
  $content = $content -replace 'background:\s*rgba\(201, 169, 110,\s*0\.08\);\s*\n\s*border:\s*1px solid rgba\(201, 169, 110,\s*0\.2\)', 'background: var(--verde-bg);`n  border: 1px solid var(--verde-border)'
  $content = $content -replace 'color:\s*var\(--gold-400\);\s*\n\s*font-size:\s*0\.78rem', 'color: var(--verde-300);`n  font-size: 0.78rem'
  
  # Tab active: gold -> verde
  $content = $content -replace 'background:\s*var\(--gold-500\)', 'background: var(--verde-500)'
  
  # Profit positive border
  $content = $content -replace 'border-left:\s*4px solid var\(--gold-500\)', 'border-left: 4px solid var(--verde-500)'
  
  # Income color
  $content = $content -replace '\.income\s*\{\s*color:\s*var\(--gold-400\)', '.income { color: var(--verde-300)'
  
  # Role active admin
  $content = $content -replace 'background:\s*rgba\(201, 169, 110,\s*0\.1\);\s*\n\s*color:\s*var\(--gold-400\)', 'background: var(--verde-bg-strong);`n  color: var(--verde-200)'
  
  Set-Content $f -Value $content -NoNewline
  Write-Host "Updated: $f"
}

Write-Host "`nDone! Verde green applied across all modules."
