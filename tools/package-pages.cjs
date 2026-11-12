const fs = require('node:fs');
const path = require('node:path');

function packagePages(root = process.cwd()) {
    const dist = path.join(root, 'dist');
    const bundle = './dnd-tracker-optimized.html';
    fs.copyFileSync(
        path.join(root, 'manifest.webmanifest'),
        path.join(dist, 'manifest.webmanifest')
    );
    fs.cpSync(path.join(root, 'icons'), path.join(dist, 'icons'), { recursive: true });
    fs.writeFileSync(
        path.join(dist, 'index.html'),
        `<!doctype html>
<html lang="de">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta http-equiv="refresh" content="0; url=${bundle}">
        <link rel="icon" href="./icons/icon.svg">
        <title>D&amp;D Kampagnen-Tracker Pro</title>
    </head>
    <body>
        <p><a href="${bundle}">D&amp;D Kampagnen-Tracker Pro öffnen</a></p>
    </body>
</html>
`
    );
}

if (require.main === module) packagePages();

module.exports = { packagePages };
