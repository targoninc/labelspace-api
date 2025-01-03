import {ProtectionSchema, ProtectionSchemas} from "./enums/ProtectionSchema.js";

export class ColumnProtector {
    /**
     * Protects the columns of an object according to the protection schema.
     * @param obj The object to protect.
     * @param protectionSchema The protection schema to use.
     * @returns The protected object.
     */
    static protect<T>(obj: T|null|undefined, protectionSchema: ProtectionSchema<T>): T {
        if (!obj) {
            return obj as T;
        }

        // @ts-ignore
        if (obj.constructor === Array) {
            // @ts-ignore
            return obj.map((obj: any) => ColumnProtector.protect(obj, protectionSchema));
        }

        if (protectionSchema.self) {
            for (let column of protectionSchema.self) {
                obj = ColumnProtector.protectColumn(obj, column);
            }
        }

        if (protectionSchema.children) {
            for (let childColumn of protectionSchema.children) {
                // @ts-ignore
                let protectionSchema: ProtectionSchema<T> | undefined = ProtectionSchemas[childColumn];
                let isArray = false;
                if (!protectionSchema) {
                    protectionSchema = Object.values(ProtectionSchemas).find(schema => schema.arrayForm === childColumn);
                    if (!protectionSchema) {
                        throw new Error(`Could not find protection schema for column ${String(childColumn)}`);
                    }
                    isArray = true;
                }

                // @ts-ignore
                if (!obj[childColumn]) {
                    continue;
                }

                if (isArray) {
                    // @ts-ignore
                    obj[childColumn] = obj[childColumn].map((childObj: any) => ColumnProtector.protect(childObj, protectionSchema));
                } else {
                    // @ts-ignore
                    obj[childColumn] = ColumnProtector.protect(obj[childColumn], protectionSchema);
                }
            }
        }

        return obj as T;
    }

    static protectColumn(obj: any, column: string) {
        if (obj[column]) {
            delete obj[column];
        }
        return obj;
    }
}