declare const CURRENT_VERSION: any;
type MigrationFunction = (data: any) => any;
declare const MIGRATIONS: Record<string, MigrationFunction>;
declare function migrateData(data: any): any;
declare function compareVersions(v1: string, v2: string): number;
//# sourceMappingURL=version-migration.d.ts.map