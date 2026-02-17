import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

interface FarmTrackDB extends DBSchema {
	'pending-records': {
		key: string;
		value: {
			id: string;
			table: string;
			data: Record<string, unknown>;
			action: 'insert' | 'update' | 'delete';
			createdAt: number;
		};
		indexes: { 'by-table': string };
	};
	'cached-data': {
		key: string;
		value: {
			id: string;
			data: unknown;
			updatedAt: number;
		};
	};
}

let dbInstance: IDBPDatabase<FarmTrackDB> | null = null;

export async function getDB(): Promise<IDBPDatabase<FarmTrackDB>> {
	if (dbInstance) return dbInstance;

	dbInstance = await openDB<FarmTrackDB>('farmtrack-offline', 1, {
		upgrade(db) {
			const pendingStore = db.createObjectStore('pending-records', { keyPath: 'id' });
			pendingStore.createIndex('by-table', 'table');
			db.createObjectStore('cached-data', { keyPath: 'id' });
		}
	});

	return dbInstance;
}

export async function queueOfflineAction(
	table: string,
	data: Record<string, unknown>,
	action: 'insert' | 'update' | 'delete' = 'insert'
): Promise<void> {
	const db = await getDB();
	const id = crypto.randomUUID();
	await db.put('pending-records', {
		id,
		table,
		data,
		action,
		createdAt: Date.now()
	});
}

export async function getPendingActions() {
	const db = await getDB();
	return db.getAll('pending-records');
}

export async function clearPendingAction(id: string) {
	const db = await getDB();
	await db.delete('pending-records', id);
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
