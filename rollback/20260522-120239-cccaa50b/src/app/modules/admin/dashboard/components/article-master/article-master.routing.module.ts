import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ArticleMasterComponent } from './article-master.component';
import { AddArticleComponent } from './add-article/add-article.component';
import { permissionTask } from 'src/app/core/constants/permission-enum';
const routes: Routes = [
    { 
       path : '',
       component : ArticleMasterComponent,
       data: {
        data : [permissionTask.articleView],
        title: 'Article Master', breadcrumb: [
          {
            label: 'Dashboard',
            url: '/admin/dashboard'
          },
          {
            label: 'Article Master',
            url: ''
          }
        ]
      }
    },
    {
        path : 'add-article',
        component : AddArticleComponent,
        data: {
          data : [permissionTask.articleAdd],
         title: 'Add Article', breadcrumb: [
           {
             label: 'Dashboard',
             url: '/admin/dashboard'
           },
           {
             label: 'Article Master',
             url: '/admin/article-master'
           },
           {
             label: 'Add Article',
             url: ''
           }
         ]
       }
    },
    {
      path : 'edit-article',
      component : AddArticleComponent,
      data: {
        data : [permissionTask.articleEdit],
       title: 'Edit Article', breadcrumb: [
         {
           label: 'Dashboard',
           url: '/admin/dashboard'
         },
         {
           label: 'Article Master',
           url: '/admin/article-master'
         },
         {
           label: 'Edit Article',
           url: ''
         }
       ]
     }
  }
  
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ArticleMasterRoutingModule { }
