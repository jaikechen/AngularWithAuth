import { Store, select } from '@ngrx/store';

import { CollectionViewer, DataSource } from '@angular/cdk/collections';
import { Observable, BehaviorSubject, combineLatest, Subscription, of } from 'rxjs';
import { skip, distinctUntilChanged } from 'rxjs/operators';
import { QueryResultsModel } from './query-results.model';
import { QueryParamsModel } from './query-params.model';
import { BaseModel } from './base.model';
import { AppState } from '../_store/app.reducer';
import {  selectInitWaitingMessage, selectPageLoading, selectInStore } from './model.selectors';

export class ModelDataSource implements DataSource<BaseModel> {
	entitySubject = new BehaviorSubject<any[]>([]);
	hasItems = true; 

	loading$: Observable<boolean>;
	isPreloadTextViewed$: Observable<boolean> = of(true);

	paginatorTotalSubject = new BehaviorSubject<number>(0);
	paginatorTotal$: Observable<number>;
	subscriptions: Subscription[] = [];

  constructor(
    private type: string,
    private store: Store<AppState>
  ) {
		this.paginatorTotal$ = this.paginatorTotalSubject.asObservable();
		const hasItemsSubscription = this.paginatorTotal$.pipe(
			distinctUntilChanged(),
			skip(1)
		).subscribe(res => this.hasItems = res > 0);
		this.subscriptions.push(hasItemsSubscription);
    this.loading$ = this.store.pipe(
      select(selectPageLoading(this.type)),
		);
		this.isPreloadTextViewed$ = this.store.pipe(
			select(selectInitWaitingMessage(this.type))
		);
    this.store.pipe(
      select(selectInStore(this.type)),
		).subscribe((response: QueryResultsModel) => {
			this.paginatorTotalSubject.next(response.totalCount);
			this.entitySubject.next(response.items);
		});
	}
	connect(collectionViewer: CollectionViewer): Observable<any[]> {
        return this.entitySubject.asObservable();
    }

	disconnect(collectionViewer: CollectionViewer): void {
        this.entitySubject.complete();
		      this.paginatorTotalSubject.complete();
		      this.subscriptions.forEach(sb => sb.unsubscribe());
	}
}

