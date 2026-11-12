const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { load } = require('js-yaml');

const repo = path.join(__dirname, '../..');
const workflow = load(fs.readFileSync(path.join(repo, '.github/workflows/ci.yml'), 'utf8'));
const stepUsing = (job, action) => job.steps.find(step => step.uses?.startsWith(action + '@'));

test('N10: Pages veröffentlicht genau das per Smoke-Test geprüfte Build-Artefakt', () => {
    const { build, 'smoke-test': smoke, deploy } = workflow.jobs;
    expect(deploy.needs).toContain('smoke-test');
    expect(deploy.steps.filter(step => step.run)).toEqual([]);

    const uploaded = stepUsing(build, 'actions/upload-artifact');
    expect(build.outputs.artifact_id).toBe('${{ steps.' + uploaded.id + '.outputs.artifact-id }}');
    expect(smoke.needs).toContain('build');

    const checked = stepUsing(smoke, 'actions/download-artifact');
    expect(checked.with).toMatchObject({
        'artifact-ids': '${{ needs.build.outputs.artifact_id }}',
        'digest-mismatch': 'error',
        path: uploaded.with.path
    });
    expect(smoke.steps.indexOf(checked)).toBeLessThan(
        smoke.steps.findIndex(step => step.run?.includes('playwright.smoke.config.js'))
    );
    expect(smoke.outputs.artifact_id).toBe(checked.with['artifact-ids']);

    const downloaded = stepUsing(deploy, 'actions/download-artifact');
    const published = stepUsing(deploy, 'actions/upload-pages-artifact');
    expect(downloaded.with).toMatchObject({
        'artifact-ids': '${{ needs.smoke-test.outputs.artifact_id }}',
        'digest-mismatch': 'error',
        path: checked.with.path
    });
    expect(published.with.path).toBe(downloaded.with.path);
    expect(deploy.steps.indexOf(downloaded)).toBeLessThan(deploy.steps.indexOf(published));
});

test('N24: Die Pages-Startseite verweist auf das direkte Bundle mit unveränderten PWA-Dateien', () => {
    const { build, 'smoke-test': smoke } = workflow.jobs;
    const paketSchritt = build.steps.find(
        step => step.name === 'Bereite vollstaendiges Artefakt vor'
    );
    const upload = stepUsing(build, 'actions/upload-artifact');
    expect(build.steps.indexOf(paketSchritt)).toBeLessThan(build.steps.indexOf(upload));
    const [, skript] = /^node (\S+\.cjs)$/.exec(paketSchritt.run.trim());
    const { packagePages } = require(path.join(repo, skript));
    const wurzel = fs.mkdtempSync(path.join(os.tmpdir(), 'dnd-pages-test-'));
    const dist = path.join(wurzel, upload.with.path);
    const bundle = 'dnd-tracker-optimized.html';
    try {
        fs.mkdirSync(dist);
        fs.writeFileSync(path.join(dist, bundle), '<!doctype html><title>Tracker</title>');
        fs.writeFileSync(path.join(dist, 'sw.js'), '// Test-Bundle');
        fs.copyFileSync(
            path.join(repo, 'manifest.webmanifest'),
            path.join(wurzel, 'manifest.webmanifest')
        );
        fs.cpSync(path.join(repo, 'icons'), path.join(wurzel, 'icons'), { recursive: true });

        packagePages(wurzel);

        expect(fs.readFileSync(path.join(dist, bundle), 'utf8')).toBe(
            '<!doctype html><title>Tracker</title>'
        );
        expect(fs.readFileSync(path.join(dist, 'sw.js'), 'utf8')).toBe('// Test-Bundle');
        const manifest = JSON.parse(
            fs.readFileSync(path.join(dist, 'manifest.webmanifest'), 'utf8')
        );
        expect(manifest.start_url).toBe('./' + bundle);
        expect(manifest.id).toBe('./' + bundle);
        for (const { src } of manifest.icons) {
            expect(fs.readFileSync(path.join(dist, src))).toEqual(
                fs.readFileSync(path.join(repo, src))
            );
        }

        expect(fs.existsSync(path.join(dist, 'index.html'))).toBe(true);
        const index = new window.DOMParser().parseFromString(
            fs.readFileSync(path.join(dist, 'index.html'), 'utf8'),
            'text/html'
        );
        expect(index.querySelector('meta[http-equiv="refresh"]')?.content).toBe(
            '0; url=./' + bundle
        );
        expect(index.querySelector('a')?.getAttribute('href')).toBe('./' + bundle);
        const smokeSchritt = smoke.steps.find(step =>
            step.run?.includes('playwright.smoke.config.js')
        );
        expect(smokeSchritt.env.SMOKE_BASE_URL).toBe('http://localhost:8000/');
    } finally {
        fs.rmSync(wurzel, { recursive: true, force: true });
    }
});
