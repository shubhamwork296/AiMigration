import { Injectable } from "@angular/core";
import * as LZString from 'lz-string';

@Injectable({ providedIn: 'root' })
export class SearchStateService {
  private travelData: any = null;

  set(data: any): void {
    this.travelData = data;
    let compressed = LZString.compressToUTF16(JSON.stringify(data));
    localStorage.removeItem('travelData');
    localStorage.setItem('travelData', compressed); // sync with localStorage
  }

  get(): any {
    if (this.travelData) return this.travelData;

    // fallback to localStorage on page refresh
    const fromStorage = localStorage.getItem('travelData');     
    if (fromStorage) {
      this.travelData = JSON.parse(LZString.decompressFromUTF16(fromStorage));
      return this.travelData;
    }

    return null;
  }

  clear(): void {
    this.travelData = null;
    localStorage.removeItem('travelData');
  }
}