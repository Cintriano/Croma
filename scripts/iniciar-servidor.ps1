# Sobe o servidor Jellyfin v12.4 portátil com a interface do croma-web.
# Pré-requisitos (veja CROMA.md):
#   - servidor\jellyfin\  : zip oficial jellyfin_12.4-amd64.zip extraído aqui
#   - repos\croma-web\dist : build de produção (npm run build:production)
# Os dados (banco, configuração, cache e logs) ficam em servidor\dados\.

$raiz = Split-Path -Parent $PSScriptRoot
$bin = Join-Path $raiz 'servidor\jellyfin'
$dados = Join-Path $raiz 'servidor\dados'
$web = Join-Path $raiz 'repos\croma-web\dist'

if (-not (Test-Path (Join-Path $bin 'jellyfin.exe'))) { throw "Servidor não encontrado em $bin" }
if (-not (Test-Path (Join-Path $web 'index.html'))) { throw "Build do croma-web não encontrado em $web" }

& (Join-Path $bin 'jellyfin.exe') `
    --datadir (Join-Path $dados 'data') `
    --configdir (Join-Path $dados 'config') `
    --cachedir (Join-Path $dados 'cache') `
    --logdir (Join-Path $dados 'log') `
    --ffmpeg (Join-Path $bin 'ffmpeg.exe') `
    --webdir $web
