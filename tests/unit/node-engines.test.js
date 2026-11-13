const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const { load } = require('js-yaml');

// ts-jest depends on SemVer 7, which provides subset(). The hoisted copy is SemVer 6.
const { minVersion, subset } = createRequire(require.resolve('ts-jest'))('semver');
const root = path.join(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const packageManifest = JSON.parse(read('package.json'));
const lockfile = JSON.parse(read('package-lock.json'));
const ci = load(read('.github/workflows/ci.yml'));
const nodeRange = packageManifest.engines.node;

test('Paket und Lockfile deklarieren denselben Node-Bereich', () => {
    expect(lockfile.packages[''].engines.node).toBe(nodeRange);
});

test('jede deklarierte Node-Version erfüllt die Vorgaben aller gesperrten Pakete', () => {
    const incompatible = Object.entries(lockfile.packages)
        .filter(([key, dep]) => key && dep.engines?.node && !subset(nodeRange, dep.engines.node))
        .map(([key, dep]) => ({ package: key, engine: dep.engines.node }));

    expect(incompatible).toEqual([]);
});

test('die Node-Untergrenze liegt auf derselben Linie wie CI', () => {
    const setupNode = Object.values(ci.jobs)
        .flatMap(job => job.steps ?? [])
        .filter(step => step.uses?.startsWith('actions/setup-node@'));
    const ciVersions = [...new Set(setupNode.map(step => String(step.with['node-version'])))];

    expect(ciVersions).toEqual([String(minVersion(nodeRange).major)]);
});
