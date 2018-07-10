import { Observable, Subject } from 'rxjs';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthData } from '../models/auth-data.model';

@Injectable()
export class AuthenticationService {

  private token: string;
  public authenticationStatus: Subject<boolean> = new Subject<boolean>();

  constructor(private http: HttpClient) { }

  private serverUrl = "https://www.mashboard.app";

  getToken(){
    return this.token;
  }

  registerUser(authdata: AuthData): Observable<Object>{
    const authData: AuthData = { email: authdata.email, password: authdata.password }
    return this.http.post(this.serverUrl + "/api/authentication/register", authData)
  }

  authenticateUser(authData: AuthData) {
    let response = { message: '', data: null }; 
    return this.http.post(this.serverUrl + "/api/authentication/authenticate", authData)
      .subscribe((response: {message: string, data: string}) =>{
        const token = response.data;
        this.token = token;
        localStorage.setItem("token",this.token);
        this.authenticationStatus.next(true);
      }, (error) => {
        console.log(error); 
        this.authenticationStatus.next(false);

      })

  }

  checkForExistingAccount(email: string): Observable<Object>{
    return this.http.get(this.serverUrl + "/api/authentication/validateNewEmail/" + email)
  }

  logout(){
    this.token = null;
    localStorage.clear();
    this.authenticationStatus.next(false);
  }

  checkLocalStorage(){
    if(localStorage.getItem("token")){
      this.token = localStorage.getItem("token");
      this.authenticationStatus.next(true);
    }
  }


  
}
