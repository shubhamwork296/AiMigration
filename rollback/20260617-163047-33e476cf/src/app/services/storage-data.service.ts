import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class StorageDataService {

  setStorageData(storageName: string, data: any, isJson: boolean) {
    if (isJson)
      localStorage.setItem(storageName, JSON.stringify(data));
    else
      localStorage.setItem(storageName, data);
  }
  setSessionStorageData(storageName: string, data: any, isJson: boolean) {
       if (isJson)
        sessionStorage.setItem(storageName, JSON.stringify(data));
      else
       sessionStorage.setItem(storageName, data);
     }

  getStorageData(storageName: string, isJson: boolean) {
    let data = localStorage.getItem(storageName);
    if (isJson)
      return JSON.parse(data);
   else
      return data;
  }
  getSessionStorageData(storageName: string, isJson: boolean) {
    let data = sessionStorage.getItem(storageName);
    if (isJson)
      return JSON.parse(data);
   else
      return data;
  }

  getStorageDataModel(storageName: string, isJson: boolean, model: any) {
    let data = localStorage.getItem(storageName);
    if (isJson)
      return JSON.parse(data,model);
    else
      return data;
  }

  clearStorageData(storageName: string) {
    localStorage.removeItem(storageName);
  }
  clearSessionStorageData(storageName: string) {
        sessionStorage.removeItem(storageName);
      }

  cleanAll() {
    localStorage.clear();
  }

  setLocalStorageData(storageName: string, data: any, isJson: boolean) {
   this.setStorageData(storageName,data,isJson);
  }

  getLocalStorageData(storageName: string, isJson: boolean) {
    return this.getStorageData(storageName,isJson);
  }

  clearLocalStorageData(storageName: string) {
    localStorage.removeItem(storageName);
  }

  cleanLocalStorageAll() {
    localStorage.clear();
  }
}
