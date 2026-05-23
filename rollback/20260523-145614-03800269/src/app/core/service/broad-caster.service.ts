import { Injectable } from '@angular/core';
import { Subject, Observable, BehaviorSubject } from 'rxjs';
import { filter, map } from 'rxjs/operators';
export class BroadcasterModel {
    key: string=''
    data: any;
}
@Injectable({
    providedIn: 'root'
})
export class BroadCasterService {
    public title = new BehaviorSubject('');
    private subject = new Subject<BroadcasterModel>();
    public sideNavToggleSubject: BehaviorSubject<any> = new BehaviorSubject(null);
    broadcast(key:string, data:any) {
        this.subject.next({ key: key, data: data });
    }
    on(key:string): Observable<any> {
        return this.subject.pipe(filter(m => m.key == key), map(m => m.data));
    }
    setTitle(title: string) {
        this.title.next(title);
    }
    public toggle(data:any) {
        return this.sideNavToggleSubject.next(data);
      } 
}
