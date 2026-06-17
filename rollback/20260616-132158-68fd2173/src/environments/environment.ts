import { NgxLoggerLevel } from 'ngx-logger';
// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  // apiUrl: 'http://localhost:62706/',
  //apiUrl: 'https://picoapi.avantiwestcoast.co.uk/',

//  apiUrl: 'http://192.168.12.12:9000/',
  //apiUrl: 'https://picouat.avantiwestcoast.co.uk/picoapi/', // UAT
//apiUrl: 'http://192.168.12.12:8060/',
 //apiUrl: 'https://picoapi-uat.avantiwestcoast.co.uk/', // UAT
 apiUrl: 'http://localhost:62706/', 
 fortressapiUrl: 'https://fortressone.fortressgb.com/',
//apiUrl: 'http://cd-alb-1006097910.eu-west-1.elb.amazonaws.com/picoapi/',
  //apiUrl: 'http://localhost:80/',
  //apiUrl: 'http://192.168.10.161/SamsungEWaste_Phase2/',
  logPath:'https://localhost:44396/api/log',
  //qttUrl: 'http://192.168.12.12:81/',
  qttUrl: 'http://localhost:4200/',
// qttUrl: 'http://192.168.12.12/beta/',
  //qttUrl: 'http://cd-alb-1006097910.eu-west-1.elb.amazonaws.com/beta/',
  logLevel: NgxLoggerLevel.DEBUG,
  serverLogLevel: NgxLoggerLevel.OFF,
  disableConsoleLog: false,
  sessionTimeout: 300,//In sec
  domainPrefix: 'tickets',
  gtmCode: 'GTM-TJ559WZ',
  cancelPaymentStatus : 'NOT_AUTHORIZED',
  cardExistStatus: 'ALREADY_EXIST',
  gtmEnvironment: 'dev',
  gaTrackingID: 'UA-152623638-5',
  qttDomain: 'http://localhost:4200/',
  reciteUrl: "//hotsub.reciteme.com/asset/js?key=",
  reciteKey: "83c2229999559bfb694c9f12c30a3d7d9f529dc2",
  xapikey: "bbf5436c5230042be0ff2c52437e62fff9f4ca71703859606adb42a1394ca78f",
  paypalClientId: "AaTUFIypdc2yJ3izo1srHn4vQvcPJ0l6mquAJqMKGNYvn5soBx8MyFEU0mOQvnx4GMYWFCMfwnnJGbQl",
  paypalMessageUrl: "https://www.paypal.com/sdk/js?client-id=" ,
  googlePayMerchantID : 'BCR2DN6TWOKLJ7DK',
  googlePayMerchantName : 'Avanti West Coast',
  googlePayGateway : 'netsgroup',
  googlePaygatewayMerchantId : '16764775548323115255',
  googlePayEnviroment : 'TEST',
  googlePayApiVersion: 2,
  googlePayApiVersionMinor: 0,
  aesEncriptionKey : 'picoawc1picoawc1',
  clientstamp: '11LpNINROSEpXIHpPPF9FtLSusee9gzkusOHQzN9JpU=',
  noncestamp: 'zc5GWrqH5oLklBRgm8BC4RmXKMauSOYuyWRPADer8OszdUm/xg2SF3gUra3SqCqPNRo5L1G5Wp6Mawm72TEJglnUUj7fRmqMOgtMtblkPoE=',
  addToCalendarFileName: 'Add_to_calendar',
  maxDateByMonth: true,
  MaxDateByCount: 3,
  verison: 1,
  seasonQttUrl : 'tickets-and-savings/ticket-types/season-tickets',
  applePayScriptUrl: 'https://applepay.cdn-apple.com/jsapi/v1/apple-pay-sdk.js',
  applePayLabel: 'DemoPayment',
  idleTimeout: 1500,
  keepaliveInterval: 15,
  NreOjpNationalRail_URL: 'https://nreojp.staging.nationalrail.co.uk/',
  monetateScriptUrl: '//se.monetate.net/js/2/a-813174c4/d/dev.avantiwestcoast.co.uk/entry.js',
  glassboxScriptID: 'ec001404-e245-4981-d088-359ae8c3f3f0',
  glassboxSrc: 'https://cdn2.gbqofs.com/avanti-west-coast/u/detector-dom.min.js'
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
