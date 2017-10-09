import { ColumnInfo } from "./column_info";
import { DatabaseMapped } from "./interfaces";
export declare class Columns {
    All: Array<ColumnInfo>;
    Lookup: Map<string, ColumnInfo>;
    constructor();
    Add(col: ColumnInfo): Columns;
    AddMany(cols: Array<ColumnInfo>): Columns;
    First(): ColumnInfo;
    Len(): number;
    ColumnNames(): Array<string>;
    ColumnValues(instance: DatabaseMapped): Array<any>;
    Tokens(): Array<string>;
    PrimaryKey(): Columns;
    NotPrimaryKey(): Columns;
    Serial(): Columns;
    NotSerial(): Columns;
    ReadOnly(): Columns;
    NotReadOnly(): Columns;
    InsertCols(): Columns;
    UpdateCols(): Columns;
}
