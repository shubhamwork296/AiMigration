import { NgModule } from '@angular/core';
import { ArticleMasterRoutingModule } from './article-master.routing.module';

import { RouterModule } from '@angular/router';

import { SharedModule } from 'src/app/shared/shared.module';
import { ArticleMasterComponent } from './article-master.component'
import { AddArticleComponent } from './add-article/add-article.component';

@NgModule({
  declarations: [
    ArticleMasterComponent,
    AddArticleComponent
  ],
  imports: [
    ArticleMasterRoutingModule,
    SharedModule, 
    RouterModule,
    
  ],exports:[ 

  ]
}) 
export class ArticleMasterModule { }
