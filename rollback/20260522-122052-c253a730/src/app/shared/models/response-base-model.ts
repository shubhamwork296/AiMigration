export interface ResponseBaseModel<T> {
  data: T;
  total: 0;
  success: boolean;
  message: string;
  error:string;
  rescode:string;
  type:string

}

