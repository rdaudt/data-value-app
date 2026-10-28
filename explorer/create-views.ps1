$views = @(
    "PortfolioOverview",
    "DecisionQuadrant",
    "DomainHeatmap",
    "ProductList",
    "Trends",
    "Compare",
    "CostSummary",
    "ProductDetail",
    "ScoreBreakdown",
    "AssetDrilldown",
    "AssetDetail"
)

# Ensure the views directory exists
New-Item -ItemType Directory -Force -Path "src\views" | Out-Null

foreach ($v in $views) {
    $content = "export default function $v() { return <div>$v - coming soon</div>; }"
    Set-Content -Path "src\views\$v.tsx" -Value $content -Encoding UTF8
}

Write-Host "Successfully created $($views.Count) view files."