var express = require('express');
var ParseServer = require('parse-server').ParseServer;
var ParseDashboard = require('parse-dashboard');
var appConfig = require('./secrets/orchestraConfig.json');
var SimpleSendGridAdapter = require('parse-server-sendgrid-adapter');

// Start Express
var app = express();

// Create Parse Server instance
var api = new ParseServer({
    databaseURI: appConfig.DB_URI,
    appId: appConfig.APP_ID,
    masterKey: appConfig.MASTER_KEY,
    clientKey: appConfig.CLIENT_KEY,
    javascriptKey: appConfig.JS_KEY,
    restAPIKey: appConfig.REST_KEY,
    cloud: './cloud/main.js',
    serverURL: appConfig.SERVER_URL,
    allowClientClassCreation: true,
    enableAnonymousUsers: true,
    maxUploadSize: '80mb',
    // filesAdapter: new S3Adapter(
    //     quartoConfig.AWS_ACCESS_KEY_ID,
    //     quartoConfig.AWS_SECRET_ACCESS_KEY,
    //     quartoConfig.BUCKET_NAME,
    //     { directAccess: true }
    // ),
    sessionLength: 31536000 * 5, // 5 years
    accountLockout: {
        duration: 15, // minutes that a locked account remains locked. Set in range: 0 < 100000.
        threshold: 5 // # of failed sign-in's that will get you locked out. Set in range: 0 < 1000.
    },

    // Enable email verification
    verifyUserEmails: true,
    emailVerifyTokenValidityDuration: 8 * 60 * 60, // in seconds (8 hours). Default = never expires
    preventLoginWithUnverifiedEmail: false, // defaults to false

    // See https://www.npmjs.com/package/parse-server-sendgrid-adapter
    // See https://github.com/ParsePlatform/parse-server/blob/28bd37884d0da131f69a46c3a118995131294055/README.md
    // See https://github.com/ParsePlatform/parse-server/issues/1063
    publicServerURL: appConfig.EXTERNAL_ACCESS_URL,
    emailAdapter: SimpleSendGridAdapter({
        apiKey: appConfig.SENDGRID_API_KEY,
        fromAddress: 'info@Orchestra3d.io'
    }),
    appName: "Orchestra3d"

    //customPages: {
    //    invalidLink: 'http://URL/invalid_link.html',
    //    verifyEmailSuccess: 'http://URL/email_verification.html',
    //    choosePassword: 'http://URL/choose_password.html',
    //    passwordResetSuccess: 'http://URL/password_updated.html'
    //}

});

app.use('/', api);

var httpServer = require('http').createServer(app);
httpServer.listen(appConfig.PORT);


// make the Parse Dashboard available at /dashboard
var allowInsecureHTTP = false;
var dashboard = new ParseDashboard({
  "apps": [
    {
      "serverURL": appConfig.SERVER_URL,
      "appId": appConfig.APP_ID,
      "masterKey": appConfig.MASTER_KEY,
      "appName": "Orchestra3d"
    }
  ],
  "users": [
   {
     "user": appConfig.DASHBOARD_USER,
     "pass": appConfig.DASHBOARD_PASS
   }
  ]
},allowInsecureHTTP);

var dash=express();
dash.use('/',dashboard);

var httpDashboard = require('http').createServer(dash);
httpDashboard.listen(appConfig.DASHBOARD_PORT);