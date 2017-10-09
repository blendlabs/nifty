import { ColumnInfo } from "./column_info";

export class Columns {
	public All: Array<ColumnInfo>;
	public Lookup: Map<string, ColumnInfo>;

	constructor() {
		this.All = new Array<ColumnInfo>();
		this.Lookup = new Map<string, ColumnInfo>();
	}

	// Add adds a column to the collection.
	public Add(col: ColumnInfo): Columns {
		this.All.push(col);
		this.Lookup.set(col.Name, col);
		return this;
	}

	// AddMany adds an array of columns to the collection.
	public AddMany(cols: Array<ColumnInfo>): Columns {
		this.All = cols;
		for (var i = 0; i < cols.length; i++) {
			this.Lookup.set(cols[i].Name, cols[i]);
		}
		return this;
	}

	// First returns the first column in the collection.
	public First(): ColumnInfo {
		if (this.All.length == 0) {
			return new ColumnInfo();
		}
		return this.All[0];
	}

	// Len returns the number of columns.
	public Len(): number {
		if (!!this.All) {
			return this.All.length;
		}
		return 0
	}

	public ColumnNames(): Array<string> {
		let names = new Array<string>();
		for (var col of this.All) {
			names.push(col.Name);
		}
		return names;
	}

	// ColumnValues returns the value for each column on a given object.
	public ColumnValues(instance: any): Array<any> {
		let values = new Array<any>();
		for (var col of this.All) {
			values.push(col.Get(instance));
		}
		return values;
	}

	public Tokens(): Array<string> {
		let tokens = new Array<string>();
		for (var i = 0; i < this.All.length; i++) {
			tokens.push(`$${i + 1}`);
		}
		return tokens;
	}

	public PrimaryKey(): Columns {
		var filtered = new Array<ColumnInfo>();
		for (var i = 0; i < this.All.length; i++) {
			if (this.All[i].IsPrimaryKey) {
				filtered.push(this.All[i]);
			}
		}
		return new Columns().AddMany(filtered);
	}

	public NotPrimaryKey(): Columns {
		var filtered = new Array<ColumnInfo>();
		for (var i = 0; i < this.All.length; i++) {
			if (!this.All[i].IsPrimaryKey) {
				filtered.push(this.All[i]);
			}
		}
		return new Columns().AddMany(filtered);
	}

	public Serial(): Columns {
		var filtered = new Array<ColumnInfo>();
		for (var i = 0; i < this.All.length; i++) {
			if (this.All[i].IsSerial) {
				filtered.push(this.All[i]);
			}
		}
		return new Columns().AddMany(filtered);
	}

	public NotSerial(): Columns {
		var filtered = new Array<ColumnInfo>();
		for (var i = 0; i < this.All.length; i++) {
			if (!this.All[i].IsSerial) {
				filtered.push(this.All[i]);
			}
		}
		return new Columns().AddMany(filtered);
	}

	public ReadOnly(): Columns {
		var filtered = new Array<ColumnInfo>();
		for (var i = 0; i < this.All.length; i++) {
			if (this.All[i].IsReadOnly) {
				filtered.push(this.All[i]);
			}
		}
		return new Columns().AddMany(filtered);
	}

	public NotReadOnly(): Columns {
		var filtered = new Array<ColumnInfo>();
		for (var i = 0; i < this.All.length; i++) {
			if (!this.All[i].IsReadOnly) {
				filtered.push(this.All[i]);
			}
		}
		return new Columns().AddMany(filtered);
	}

	// InsertCols returns the columns that will be set during an insert.
	public InsertCols(): Columns {
		return this.NotReadOnly().NotSerial();
	}

	// UpdateCols returns the columns that will be set during an update.
	public UpdateCols(): Columns {
		return this.NotReadOnly()
			.NotSerial()
			.NotPrimaryKey();
	}
}
