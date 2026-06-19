import { NgxLoggerLevel } from 'ngx-logger';
 
export const environment = {
production: true,
 apiUrl: 'https://pre-picoapi-uat.avantiwestcoast.co.uk/', // UAT
 fortressapiUrl: 'https://fortressone.fortressgb.com/',
 // apiUrl: 'http://cd-alb-779300576.eu-west-1.elb.amazonaws.com/picoapi/', // PROD
 // qttUrl: 'http://192.168.12.12:81/',
//  qttUrl: 'https://www.avantiwestcoast.co.uk/',
 qttUrl: 'https://pre-picouat.avantiwestcoast.co.uk/', // UAT
  //qttUrl: 'http://cd-alb-779300576.eu-west-1.elb.amazonaws.com/beta/', //UAT
  //apiUrl: 'http://192.168.10.161/SamsungEWaste_Phase2/',
  logPath:'https://localhost:44396/api/log',
  logLevel: NgxLoggerLevel.DEBUG,
  serverLogLevel: NgxLoggerLevel.OFF,
  disableConsoleLog: false,
  sessionTimeout: 300,//In sec
  //sessionTimeout: 900,//In sec
  domainPrefix: '',
  gtmCode: 'GTM-TJ559WZ',
  // gtmCode: 'GTM-WB2ZTJ8', // for production 'GTM-WB2ZTJ8'
  cancelPaymentStatus : 'NOT_AUTHORIZED',
  cardExistStatus: 'ALREADY_EXIST',
  gtmEnvironment: 'uat',
  gaTrackingID: 'UA-152623638-5', // for production 'UA-152623638-1'
  qttDomain: 'https://pre-picouat.avantiwestcoast.co.uk/',
  reciteUrl: "//hotsub.reciteme.com/asset/js?key=",
  reciteKey: "83c2229999559bfb694c9f12c30a3d7d9f529dc2",
  xapikey: "bbf5436c5230042be0ff2c52437e62fff9f4ca71703859606adb42a1394ca78f",
  paypalClientId: "AaTUFIypdc2yJ3izo1srHn4vQvcPJ0l6mquAJqMKGNYvn5soBx8MyFEU0mOQvnx4GMYWFCMfwnnJGbQl",
  paypalMessageUrl: "https://www.paypal.com/sdk/js?client-id=",
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
  NreOjpNationalRail_URL: 'https://ojp.nationalrail.co.uk/',
  monetateScriptUrl: '//se.monetate.net/js/2/a-813174c4/d/avantiwestcoast.co.uk/entry.js',
  glassboxScriptID: '59f4a805-a7f1-d903-3518-d8d21dcb35b6',
  glassboxSrc: 'https://cdn2.gbqofs.com/avanti-west-coast/p/detector-dom.min.js'
};