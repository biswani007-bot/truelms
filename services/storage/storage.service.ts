import fs from "fs";
import path from "path";
import { logger } from "../../utils/logger";

export interface IStorageAdapter {
  uploadFile(filePath: string, buffer: Buffer): Promise<{ url: string; size: number }>;
  downloadFile(filePath: string): Promise<Buffer>;
  deleteFile(filePath: string): Promise<boolean>;
  exists(filePath: string): Promise<boolean>;
}

export class LocalStorageAdapter implements IStorageAdapter {
  private baseDir: string;

  constructor(baseDir?: string) {
    this.baseDir = baseDir || path.join(process.cwd(), "storage");
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  async uploadFile(filePath: string, buffer: Buffer): Promise<{ url: string; size: number }> {
    const fullPath = path.join(this.baseDir, filePath);
    const parentDir = path.dirname(fullPath);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }

    fs.writeFileSync(fullPath, buffer);
    logger.info(`[StorageService] Uploaded local file: ${filePath} (${buffer.length} bytes)`);

    return {
      url: `/storage/${filePath.replace(/\\/g, "/")}`,
      size: buffer.length,
    };
  }

  async downloadFile(filePath: string): Promise<Buffer> {
    const fullPath = path.join(this.baseDir, filePath);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    return fs.readFileSync(fullPath);
  }

  async deleteFile(filePath: string): Promise<boolean> {
    const fullPath = path.join(this.baseDir, filePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      return true;
    }
    return false;
  }

  async exists(filePath: string): Promise<boolean> {
    const fullPath = path.join(this.baseDir, filePath);
    return fs.existsSync(fullPath);
  }
}

export class StorageService {
  private static adapter: IStorageAdapter = new LocalStorageAdapter();

  static setAdapter(adapter: IStorageAdapter) {
    this.adapter = adapter;
  }

  static getAdapter(): IStorageAdapter {
    return this.adapter;
  }
}
