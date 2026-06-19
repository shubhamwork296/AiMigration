import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})

export class HttpClientService {
  constructor(private readonly httpClient: HttpClient) { }

  public HttpPostRequest(requestModel: any, apiServicePath: string){
    return this.httpClient.post( environment.apiUrl + apiServicePath,JSON.stringify(requestModel));
  }
  
  public HttpPostRequestPormise(requestModel: any, apiServicePath: string){
    return this.httpClient.post( environment.apiUrl + apiServicePath,JSON.stringify(requestModel)).toPromise();
  }

  public HttpGetRequest(apiServicePath: string){
    return this.httpClient.get( environment.apiUrl + apiServicePath );
  }

  // Start PICO-1171 HTTP Method for fortress Request 
  public HttpPostRequestFortress(requestModel: any, apiServicePath: string, httpOptions){
    return this.httpClient.post(environment.fortressapiUrl + apiServicePath, JSON.stringify(requestModel), httpOptions);
  }
  // End
  
}
