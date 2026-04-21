import * as fs from "fs";
import * as path from "path";

export function ensureDirectoryExists(relativePath: string): string {
  const absolutePath: string = path.resolve(relativePath);
  if (!fs.existsSync(absolutePath)) {
    fs.mkdirSync(absolutePath, { recursive: true });
  }
  return absolutePath;
}

export function timestampForFileName(): string {
  const now: Date = new Date();
  const date: string = now.toISOString().split("T")[0];
  const time: string = now.toTimeString().split(" ")[0].replace(/:/g, "-");
  return `${date}_${time}`;
}
