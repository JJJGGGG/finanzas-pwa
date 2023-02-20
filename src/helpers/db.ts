const VERSION = 3;

export type Spending = {
    id: number;
    name: string;
    value: number;
    timestamp: number;
}

export type Income = {
    id: number;
    name: string;
    value: number;
    timestamp: number;
}

export async function createDbConnection() {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = window.indexedDB.open("SpendingDatabase", VERSION);
        request.onsuccess = (event) => {
            resolve((event.target as IDBOpenDBRequest).result);
        };

        request.onerror = (event) => {
            reject(`Database error: ${(event.target as any).errorCode}`);
        };

        request.onupgradeneeded = (event) => {
            // Save the IDBDatabase interface
            const db = (event.target as IDBOpenDBRequest).result;
        
            // Create an objectStore for this database

            if( !db.objectStoreNames.contains("spendings") ) {
                const objectStore = db.createObjectStore("spendings", { keyPath: "id", autoIncrement: true });

                objectStore.createIndex("name", "name", { unique: false });
                objectStore.createIndex("value", "value", { unique: false });
                objectStore.createIndex("timestamp", "timestamp", { unique: false });
            }
            if(!db.objectStoreNames.contains("incomes")) {
                const objectStore = db.createObjectStore("incomes", { keyPath: "id", autoIncrement: true });
    
                objectStore.createIndex("name", "name", { unique: false });
                objectStore.createIndex("value", "value", { unique: false });
                objectStore.createIndex("timestamp", "timestamp", { unique: false });
            }

        };
    })

    return db;
}

export async function addSpendingToDatabase(db: IDBDatabase, name: string, value: number) {
    return new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(["spendings"], "readwrite");

        transaction.oncomplete = (event) => {
            resolve()
        };
        
        transaction.onerror = (event) => {
            // Don't forget to handle errors!
            reject();
        };
        
        const objectStore = transaction.objectStore("spendings");
        
        const request = objectStore.add({
            name,
            value,
            timestamp: Date.now()
        });
        // request.onsuccess = (event) => {
        // // event.target.result === customer.ssn;
        // };
    })
}

export async function deleteSpendingFromDatabase(db: IDBDatabase, id: number) {
    return new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(["spendings"], "readwrite");

        transaction.oncomplete = (event) => {
            resolve()
        };
        
        transaction.onerror = (event) => {
            // Don't forget to handle errors!
            reject();
        };
        
        const objectStore = transaction.objectStore("spendings");
        
        const request = objectStore.delete(id);
        // request.onsuccess = (event) => {
        // // event.target.result === customer.ssn;
        // };
    })
}

export async function getSpendingsFromDatabase(db: IDBDatabase) {
    return new Promise<Spending[]>((resolve, reject) => {
        const transaction = db.transaction(["spendings"], "readwrite");

        const spendings: Spending[] = [];

        transaction.oncomplete = (event) => {
            resolve(spendings);
        };
        
        transaction.onerror = (event) => {
            // Don't forget to handle errors!
            reject();
        };
        
        const index = transaction.objectStore("spendings").index("timestamp");
        
        index.openCursor().onsuccess = (event) => {
            const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
            if (cursor) {
              spendings.push(cursor.value);
              cursor.continue();
            }
        };
    });
}

export async function addIncomeToDatabase(db: IDBDatabase, name: string, value: number) {
    return new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(["incomes"], "readwrite");

        transaction.oncomplete = (event) => {
            resolve()
        };
        
        transaction.onerror = (event) => {
            // Don't forget to handle errors!
            reject();
        };
        
        const objectStore = transaction.objectStore("incomes");
        
        const request = objectStore.add({
            name,
            value,
            timestamp: Date.now()
        });
        // request.onsuccess = (event) => {
        // // event.target.result === customer.ssn;
        // };
    })
}

export async function deleteIncomeFromDatabase(db: IDBDatabase, id: number) {
    return new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(["incomes"], "readwrite");

        transaction.oncomplete = (event) => {
            resolve()
        };
        
        transaction.onerror = (event) => {
            // Don't forget to handle errors!
            reject();
        };
        
        const objectStore = transaction.objectStore("incomes");
        
        const request = objectStore.delete(id);
        // request.onsuccess = (event) => {
        // // event.target.result === customer.ssn;
        // };
    })
}

export async function getIncomesFromDatabase(db: IDBDatabase) {
    return new Promise<Income[]>((resolve, reject) => {
        const transaction = db.transaction(["incomes"], "readwrite");

        const spendings: Income[] = [];

        transaction.oncomplete = (event) => {
            resolve(spendings);
        };
        
        transaction.onerror = (event) => {
            // Don't forget to handle errors!
            reject();
        };
        
        const index = transaction.objectStore("incomes").index("timestamp");
        
        index.openCursor().onsuccess = (event) => {
            const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
            if (cursor) {
              spendings.push(cursor.value);
              cursor.continue();
            }
        };
    });
}