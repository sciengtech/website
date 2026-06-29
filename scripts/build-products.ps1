# Generates data/products.json with precomputed _search blobs for fast client-side lookup.
$ErrorActionPreference = 'Stop'
$root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
if (-not (Test-Path (Join-Path $root 'index.html'))) { $root = Split-Path $PSScriptRoot -Parent }

function Title-Case([string]$s) {
  ($s -replace '-', ' ' -split ' ' | ForEach-Object {
    if ($_ -match '^\d') { $_ } else { $_.Substring(0,1).ToUpper() + $_.Substring(1).ToLower() }
  }) -join ' '
}

function Make-Search([hashtable]$p) {
  @(
    $p.id, $p.sku, $p.name, $p.category, $p.subcategory, $p.categoryLabel,
    $p.summary, $p.specHighlight,
    ($p.tags -join ' '),
    (($p.specs | ForEach-Object { "$($_.label) $($_.value)" }) -join ' ')
  ) -join ' ' | ForEach-Object { $_.ToLower() }
}

$shopSlugs = @(
  'pedestal-fork','collars','post-base','cotton-tipped-applicators','optics-cleaning-tissues',
  'lens-mount','post-holder','pedestal-post-holder','translation-stage','rotation-mount',
  'precision-kinematic-mirror-mount','kinematic-mirror-mount','breadboards','angle-clamps',
  '12-7-mm-posts','plano-convex','plano-convex-2','plano-convex-6','plano-convex-5','plano-convex-4',
  'plano-convex-3','plano-convex-34','plano-convex-44','plano-convex-43','plano-convex-42',
  'plano-convex-41','plano-convex-40','plano-convex-39','plano-convex-38','plano-convex-37',
  'plano-convex-36','plano-convex-35','plano-convex-45','plano-convex-7','plano-convex-8',
  'plano-convex-9','plano-convex-10','plano-convex-11','plano-convex-13','plano-convex-14',
  'plano-convex-15','plano-convex-16','plano-convex-17','plano-convex-18','plano-convex-19',
  'plano-convex-20','plano-convex-22','plano-convex-23','plano-convex-24','plano-convex-25',
  'plano-convex-26','plano-convex-27','plano-convex-28','plano-convex-29','plano-convex-30',
  'plano-convex-31','plano-convex-32','plano-convex-12','plano-convex-33',
  '16-mm-posts','12-mm-posts','8-mm-posts','allen-bolts','spring-washers',
  'hex-nut-din-934-is-1363','plain-flat-washers','optics-cleaning-cloth'
)

$categoryMap = @{
  'translation-stage' = @{ cat = 'optomechanics'; sub = 'translation-stages'; label = 'Optomechanics' }
  'rotation-mount' = @{ cat = 'optomechanics'; sub = 'kinematic-mounts'; label = 'Optomechanics' }
  'precision-kinematic-mirror-mount' = @{ cat = 'optomechanics'; sub = 'kinematic-mounts'; label = 'Optomechanics' }
  'kinematic-mirror-mount' = @{ cat = 'optomechanics'; sub = 'kinematic-mounts'; label = 'Optomechanics' }
  'breadboards' = @{ cat = 'optomechanics'; sub = 'breadboards-tables'; label = 'Optomechanics' }
  'lens-mount' = @{ cat = 'optomechanics'; sub = 'kinematic-mounts'; label = 'Optomechanics' }
  'angle-clamps' = @{ cat = 'optomechanics'; sub = 'posts-rails-hardware'; label = 'Optomechanics' }
  'post-holder' = @{ cat = 'optomechanics'; sub = 'posts-rails-hardware'; label = 'Optomechanics' }
  'pedestal-post-holder' = @{ cat = 'optomechanics'; sub = 'posts-rails-hardware'; label = 'Optomechanics' }
  'pedestal-fork' = @{ cat = 'optomechanics'; sub = 'posts-rails-hardware'; label = 'Optomechanics' }
  'post-base' = @{ cat = 'optomechanics'; sub = 'posts-rails-hardware'; label = 'Optomechanics' }
  'collars' = @{ cat = 'optomechanics'; sub = 'posts-rails-hardware'; label = 'Optomechanics' }
  '12-7-mm-posts' = @{ cat = 'optomechanics'; sub = 'posts-rails-hardware'; label = 'Optomechanics' }
  '12-mm-posts' = @{ cat = 'optomechanics'; sub = 'posts-rails-hardware'; label = 'Optomechanics' }
  '16-mm-posts' = @{ cat = 'optomechanics'; sub = 'posts-rails-hardware'; label = 'Optomechanics' }
  '8-mm-posts' = @{ cat = 'optomechanics'; sub = 'posts-rails-hardware'; label = 'Optomechanics' }
  'allen-bolts' = @{ cat = 'optomechanics'; sub = 'posts-rails-hardware'; label = 'Optomechanics' }
  'spring-washers' = @{ cat = 'optomechanics'; sub = 'posts-rails-hardware'; label = 'Optomechanics' }
  'hex-nut-din-934-is-1363' = @{ cat = 'optomechanics'; sub = 'posts-rails-hardware'; label = 'Optomechanics' }
  'plain-flat-washers' = @{ cat = 'optomechanics'; sub = 'posts-rails-hardware'; label = 'Optomechanics' }
  'cotton-tipped-applicators' = @{ cat = 'utilities'; sub = 'cleanroom-cleaning'; label = 'Lab Utilities' }
  'optics-cleaning-tissues' = @{ cat = 'utilities'; sub = 'cleanroom-cleaning'; label = 'Lab Utilities' }
  'optics-cleaning-cloth' = @{ cat = 'utilities'; sub = 'cleanroom-cleaning'; label = 'Lab Utilities' }
}

$defaultOptics = @{ cat = 'precision-optics'; sub = 'lenses'; label = 'Precision Optics' }
$defaultMech = @{ cat = 'optomechanics'; sub = 'posts-rails-hardware'; label = 'Optomechanics' }

$products = [System.Collections.Generic.List[object]]::new()

$overrides = @{
  'translation-stage' = @{
    name = '25mm Translation Stage'
    sku = 'SET-TS-25'
    summary = 'Manual micrometer-driven translation stage for precision optical alignment.'
    specHighlight = 'TRAVEL: 25mm | RESOLUTION: 10 um | LOAD: 5kgf'
    image = 'assets/slides/01-translation-stage.png'
    featured = $true
    specs = @(
      @{ label = 'Travel'; value = '25 mm' }
      @{ label = 'Resolution'; value = '10 um' }
      @{ label = 'Load capacity'; value = '5 kgf' }
    )
    tags = @('translation','stage','micrometer','25mm','optomechanics')
  }
  'precision-kinematic-mirror-mount' = @{
    name = 'Precision Kinematic Mirror Mount'
    sku = 'SET-KMM-25'
    summary = 'High-stability kinematic mirror mount with fine adjustment screws.'
    specHighlight = 'APERTURE: 25mm | ADJUST: +/-4 deg | MAT: ANODIZED AL'
    image = 'assets/slides/02-kinematic-mirror-mount.png'
    featured = $true
    specs = @(
      @{ label = 'Clear aperture'; value = '25 mm' }
      @{ label = 'Adjustment range'; value = '+/-4 deg' }
      @{ label = 'Material'; value = 'Anodized aluminum' }
    )
    tags = @('kinematic','mirror','mount','25mm')
  }
  'kinematic-mirror-mount' = @{
    name = 'Kinematic Mirror Mount'
    sku = 'SET-KM-25'
    summary = 'Standard kinematic mirror mount for lab optical benches.'
    specHighlight = 'APERTURE: 25mm | ADJUST: +/-4 deg'
    image = 'assets/slides/02-kinematic-mirror-mount.png'
    tags = @('kinematic','mirror','mount')
  }
  'breadboards' = @{
    name = 'Optical Breadboard'
    sku = 'SET-BB-M6'
    summary = 'Aluminum optical breadboard with M6 tapped grid.'
    specHighlight = 'GRID: M6 | FLATNESS: +/-0.1mm | MAT: ALUMINUM'
    image = 'assets/slides/06-optical-breadboard.png'
    featured = $true
    specs = @(
      @{ label = 'Hole grid'; value = 'M6' }
      @{ label = 'Flatness'; value = '+/-0.1 mm' }
      @{ label = 'Material'; value = 'Aluminum' }
    )
    tags = @('breadboard','optical','table','M6')
  }
}

foreach ($slug in $shopSlugs) {
  $meta = if ($categoryMap[$slug]) { $categoryMap[$slug] }
           elseif ($slug -like 'plano-convex*') { $defaultOptics }
           else { $defaultMech }

  $o = if ($overrides[$slug]) { $overrides[$slug] } else { @{} }
  $name = if ($o.name) { $o.name }
          elseif ($slug -like 'plano-convex*') {
            $n = $slug -replace '^plano-convex-?',''
            if ($n) { "Plano-Convex Lens ($n mm)" } else { 'Plano-Convex Lens' }
          } else { Title-Case $slug }

  $p = [ordered]@{
    id = $slug
    sku = if ($o.sku) { $o.sku } else { "SET-$($slug.ToUpper() -replace '[^A-Z0-9]','-')" }
    name = $name
    category = $meta.cat
    categoryLabel = $meta.label
    subcategory = $meta.sub
    categoryPath = "/components/$($meta.cat)/$($meta.sub)/"
    summary = if ($o.summary) { $o.summary } else { "$name - specify dimensions and coating for RFQ." }
    specHighlight = if ($o.specHighlight) { $o.specHighlight } else { 'RFQ | Full spec sheet on request' }
    specs = if ($o.specs) { ,@($o.specs) } else { ,@(@{ label = 'Procurement'; value = 'Request Technical Quote' }) }
    tags = if ($o.tags) { $o.tags } else { @($meta.cat, $meta.sub, ($slug -replace '-',' ')) }
    image = if ($o.image) { $o.image } else { $null }
    featured = [bool]($o.featured)
    legacyUrl = "https://sciengtech.in/product/$slug/"
  }
  $p['_search'] = Make-Search $p
  $products.Add($p)
}

# OEM / catalog extensions not in WooCommerce shop
$extras = @(
  [ordered]@{
    id = 'dielectric-laser-mirror-800nm'
    sku = 'SET-MIR-HR800'
    name = 'Dielectric Laser Mirror'
    category = 'precision-optics'
    categoryLabel = 'Precision Optics'
    subcategory = 'mirrors'
    categoryPath = '/components/precision-optics/mirrors/'
    summary = 'High-reflectivity dielectric mirror optimized for ultrafast laser systems at 800 nm.'
    specHighlight = 'COATING: HR @ 800nm | SURFACE: lambda/10 | DIA: 25mm'
    specs = @(
      @{ label = 'Coating'; value = 'HR @ 800 nm' }
      @{ label = 'Surface quality'; value = 'lambda/10' }
      @{ label = 'Diameter'; value = '25 mm' }
    )
    tags = @('mirror','dielectric','800nm','HR','laser')
    image = 'assets/slides/03-dielectric-mirror.png'
    featured = $true
    legacyUrl = 'https://sciengtech.in/optics/'
  },
  [ordered]@{
    id = 'cf-vacuum-flange-cf63'
    sku = 'SET-VAC-CF63'
    name = 'CF Vacuum Flange'
    category = 'vacuum-hv'
    categoryLabel = 'Vacuum & HV'
    subcategory = 'chambers-flanges'
    categoryPath = '/components/vacuum-hv/chambers-flanges/'
    summary = 'ConFlat vacuum flange assembly for UHV beamlines and experimental chambers.'
    specHighlight = 'FLANGE: CF63 | LEAK: <1e-9 Torr | MAT: 304L SS'
    specs = @(
      @{ label = 'Flange type'; value = 'CF63' }
      @{ label = 'Leak rate'; value = '<1e-9 Torr L/s' }
      @{ label = 'Material'; value = '304L stainless steel' }
    )
    tags = @('vacuum','CF','flange','UHV','CF63')
    image = 'assets/slides/04-vacuum-flange.png'
    featured = $true
    legacyUrl = 'https://sciengtech.in/vacuum/'
  },
  [ordered]@{
    id = 'photodetector-ultrafast-1ghz'
    sku = 'SET-PD-1GHZ'
    name = 'Ultrafast Photodetector Module'
    category = 'lasers-photonics'
    categoryLabel = 'Lasers & Photonics'
    subcategory = 'metrology-diagnostics'
    categoryPath = '/components/lasers-photonics/metrology-diagnostics/'
    summary = '1 GHz bandwidth photodetector module with SMA output for pulse diagnostics.'
    specHighlight = 'BW: 1 GHz | RESP: 0.8 A/W | CONNECTOR: SMA'
    specs = @(
      @{ label = 'Bandwidth'; value = '1 GHz' }
      @{ label = 'Responsivity'; value = '0.8 A/W' }
      @{ label = 'Connector'; value = 'SMA' }
    )
    tags = @('photodetector','1GHz','ultrafast','SMA','diagnostics')
    image = 'assets/slides/05-photodetector-module.png'
    featured = $true
    legacyUrl = 'https://sciengtech.in/our-oem-products-photodetector-modules-ultrafast-photodetector-modules-1ghz/'
  },
  [ordered]@{
    id = 'laser-diode-module-5mw'
    sku = 'SET-LD-5MW'
    name = '5 mW Laser Diode Module'
    category = 'lasers-photonics'
    categoryLabel = 'Lasers & Photonics'
    subcategory = 'active-sources-diodes'
    categoryPath = '/components/lasers-photonics/active-sources-diodes/'
    summary = 'Compact laser diode module with integrated driver for alignment and metrology.'
    specHighlight = 'POWER: 5 mW | WAVELENGTH: Specify on RFQ'
    specs = @(@{ label = 'Output power'; value = '5 mW' })
    tags = @('laser','diode','5mW','alignment')
    legacyUrl = 'https://sciengtech.in/our-oem-products-laser-diode-module-5mw-laser-diode-module/'
  },
  [ordered]@{
    id = 'photodetector-slow-10mhz'
    sku = 'SET-PD-10MHZ'
    name = 'Photodetector Module - 10 MHz'
    category = 'lasers-photonics'
    categoryLabel = 'Lasers & Photonics'
    subcategory = 'metrology-diagnostics'
    categoryPath = '/components/lasers-photonics/metrology-diagnostics/'
    summary = 'Low-bandwidth photodetector for CW and low-repetition-rate laser monitoring.'
    specHighlight = 'BW: 10 MHz'
    specs = @(@{ label = 'Bandwidth'; value = '10 MHz' })
    tags = @('photodetector','10MHz','CW')
    legacyUrl = 'https://sciengtech.in/our-oem-products-photodetector-modules-slow-photodetector-modules-10mhz/'
  },
  [ordered]@{
    id = 'photodetector-ultrafast-2ghz'
    sku = 'SET-PD-2GHZ'
    name = 'Ultrafast Photodetector Module - 2 GHz'
    category = 'lasers-photonics'
    categoryLabel = 'Lasers & Photonics'
    subcategory = 'metrology-diagnostics'
    categoryPath = '/components/lasers-photonics/metrology-diagnostics/'
    summary = '2 GHz bandwidth photodetector for ultrafast pulse characterization.'
    specHighlight = 'BW: 2 GHz'
    specs = @(@{ label = 'Bandwidth'; value = '2 GHz' })
    tags = @('photodetector','2GHz','ultrafast')
    legacyUrl = 'https://sciengtech.in/our-oem-products-photodetector-modules-ultrafast-photodetector-modules-2ghz/'
  },
  [ordered]@{
    id = 'entangled-photon-source-kit'
    sku = 'SET-TK-EPS'
    name = 'Entangled Photon Source Training Kit'
    category = 'solutions'
    categoryLabel = 'Solutions'
    subcategory = 'quantum-optical-research'
    categoryPath = '/solutions/quantum-optical-research/'
    summary = 'Classroom-ready entangled photon demonstration system for quantum optics education.'
    specHighlight = 'SYSTEM | RFQ | Training kit'
    specs = ,@(@{ label = 'Type'; value = 'Training / demonstration system' })
    tags = @('quantum','training','entangled','photon','education')
    legacyUrl = 'https://sciengtech.in/our-oem-products-training-kits-entangled-photon-source/'
  }
)

foreach ($e in $extras) {
  $e['featured'] = [bool]($e.featured)
  $e['_search'] = Make-Search $e
  $products.Add($e)
}

$out = [ordered]@{
  version = 1
  updated = (Get-Date -Format 'yyyy-MM-dd')
  count = $products.Count
  products = $products
}

$outPath = Join-Path $root 'data\products.json'
New-Item -ItemType Directory -Force -Path (Split-Path $outPath) | Out-Null
$json = $out | ConvertTo-Json -Depth 6
[System.IO.File]::WriteAllText($outPath, $json, (New-Object System.Text.UTF8Encoding $false))
node -e "const fs=require('fs');const p=process.argv[1];let t=fs.readFileSync(p,'utf8');if(t.charCodeAt(0)===0xFEFF)t=t.slice(1);const d=JSON.parse(t);d.products.forEach(x=>{if(x.specs&&!Array.isArray(x.specs))x.specs=[x.specs];});fs.writeFileSync(p,JSON.stringify(d,null,2));" "$outPath"
Write-Host "Wrote $($products.Count) products to $outPath"
