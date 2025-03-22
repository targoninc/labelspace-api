import {MediaFileType} from "../../models/enums/MediaFileType.js";

export interface IStorage {
    save(fileType: MediaFileType, entityId: number, fileName: string, data: Buffer): Promise<void>;
    deleteEntity(fileType: MediaFileType, entityId: number): Promise<void>;
}