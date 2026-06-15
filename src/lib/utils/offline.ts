import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

interface FarmPaddyDB extends DBSchema {
	'cached-data': {
		key: string;
		value: {
			id: string;
			data: unknown;
			updatedAt: number;
		};
	};
}

let dbInstance: IDBPDatabase<FarmPaddyDB> | null = null;

export async function getDB(): Promise<IDBPDatabase<FarmPaddyDB>> {
	if (dbInstance) return dbInstance;

	dbInstance = await openDB<FarmPaddyDB>('farmtrack-offline', 2, {
		upgrade(db) {
			if (db.objectStoreNames.contains('pending-records')) {
				db.deleteObjectStore('pending-records');
			}
			if (!db.objectStoreNames.contains('cached-data')) {
				db.createObjectStore('cached-data', { keyPath: 'id' });
			}
		}
	});

	return dbInstance;
}

export async function cacheData(key: string, data: unknown) {
	const db = await getDB();
	await db.put('cached-data', { id: key, data, updatedAt: Date.now() });
}

export async function getCachedData<T>(key: string): Promise<T | undefined> {
	const db = await getDB();
	const result = await db.get('cached-data', key);
	return result?.data as T | undefined;
}
