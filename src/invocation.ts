import { Client, QueryResult } from 'pg';
import { Columns } from './columns';
import { Query } from './query';
import { TableNameFor, ColumnsFor } from './metacache';
import { Populatable } from './interfaces';

export interface InvocationConfig {
	client: Client;
}

export class Invocation {
  connection: Client;

  constructor(config?: InvocationConfig) {
    if (config) this.connection = config.client;
  }

	// Exec runs a given statement. Throws an error if a sql error occurs.
	public async exec(statement: string, ...args: any[]): Promise<null> {
    await this.connection.query(statement, ...args);
		return null;
	}

  // Query runs a given query with a given set of arguments, and returns a bound result.
	public async query(statement: string, ...args: any[]): Promise<Query> {
    let res = await this.connection.query(statement, ...args);
    let q = new Query()
    q.results = res
    return q;
	}

	public async begin(): Promise<null> {
    await this.connection.query('BEGIN');
    return null;
	}

	public async commit(): Promise<null> {
    await this.connection.query('COMMIT');
		return null;
	}

	public async rollback(): Promise<null> {
    await this.connection.query('ROLLBACK');
		return null;
	}

	// Close closes the connection.
	public async close(): Promise<null> {
    await this.connection.release()
    return null;
	}

	public async get<T>(typeDef: { new(): T; }, ...ids: any[]): Promise<T> {
		let ref: T = new typeDef()
		const className = ref.constructor.name
		let tableName = TableNameFor(className);
		let cols = ColumnsFor(className);
		let readCols = cols.NotReadOnly(); // these actually exist on the table.
		let pks = cols.PrimaryKey();

		if (pks.Len() == 0) {
			throw new Error('invalid type; no primary keys');
		}

		if (pks.Len() !== ids.length) {
			throw new Error('insufficient argument value count for type primary keys');
		}

		let tokens = pks.Tokens();

		let columnNames = readCols.ColumnNames().join(',');

		let queryBody = `SELECT ${columnNames} FROM ${tableName} WHERE `;

		// loop over the pks, add the tokens etc.
		for (var i = 0; i < pks.Len(); i++) {
			var pk = pks.All[i];

			queryBody = queryBody + pk.Name + ' = ' + `$${i + 1}`;

			if (i < pks.Len() - 1) {
				queryBody = queryBody + ' AND ';
			}
		}

    let res = await this.connection.query(queryBody, ids);
    for (var col of readCols.All) {
      col.Set(ref, res.rows[0][col.Name]);
    }
		return ref;
	}

	// GetAll returns all instances of T in it's respective table as an array.
	public async getAll<T>(typeDef: { new(): T; }): Promise<Array<T>> {
		// build query
		// execute query
		// loop over results, bind each to a new object, add to the array.
		// hope whoever created T knew to implement populate.
		return new Array<T>();
	}

	// Create inserts the object into the db.
	public async create(obj: any): Promise<null> {
		const className = obj.constructor.name
		const tableName = TableNameFor(className)
		const cols = ColumnsFor(className)
		const writeCols = cols.NotReadOnly().NotSerial()
		const serials = cols.Serial()

		const colNames = writeCols.ColumnNames().join(',');
		const colValues = writeCols.ColumnValues(obj);
		const tokens = writeCols.Tokens().join(',');

		let queryBody = `INSERT INTO ${tableName} (${colNames}) VALUES (${tokens})`;

		if (serials.Len() > 0) {
			queryBody = queryBody + ` RETURNING ${serials.First().Name}`;
		}

    let res = await this.connection.query(queryBody, colValues);
    if (serials.Len() > 0) {
      let serial = serials.First();
      serial.Set(obj, res.rows[0][serial.Name]);
    }

		return null;
	}

	// CreateMany inserts multiple objects at once.
	public async createMany(...objs: any[]): Promise<null> { return null }

	// Update updates an object by primary key; it does not re-assign the pk value(s).
	public async update<T>(obj: T): Promise<null> { return null }

	// Upsert creates an object if it doesn't exit, otherwise it updates it.
	public async upsert<T>(obj: T): Promise<null> { return null }

	// Delete deletes a given object.
	public async delete(obj: any) {
		const className = obj.constructor.name
		const tableName = TableNameFor(className)
		const cols = ColumnsFor(className)
		const pks = cols.PrimaryKey()

		if (pks.Len() == 0) {
			throw new Error('invalid type; no primary keys');
		}

		let ids = new Array<any>()
		let queryBody = `DELETE FROM ${tableName} WHERE`
		// loop over the pks, add the tokens etc.
		for (var i = 0; i < pks.Len(); i++) {
			var pk = pks.All[i];

			queryBody = queryBody + pk.Name + ' = ' + `${i + 1}`;

			if (i < pks.Len() - 1) {
				queryBody = queryBody + ' AND ';
			}

			ids.push(pk.Get(obj))
		}

    await this.connection.query(queryBody, ids);

		return null;
	}

	// Truncate deletes *all* rows of a table using the truncate command.
	// If the type implements a `serial` column it will restart the identity.
	public async truncate<T>(typeDef: { new(): T; }): Promise<null> {
		let ref: T = new typeDef()
		const className = ref.constructor.name
		const tableName = TableNameFor(className)
		const cols = ColumnsFor(className)
		const serials = cols.Serial()

		let queryBody = `TRUNCATE ${tableName}`

		if (serials.Len() > 0) {
			queryBody = queryBody + ' RESTART IDENTITY'
		}

    await this.connection.query(queryBody);
		return null
	}
}
