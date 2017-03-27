# orchestra3d
WebGL-Powered Parametric Modeling Interface. Includes a JavaScript Port of SISL NURBS Kernel and a visual programming interface inspired by Grasshopper, but which runs in the browser.

## Configuration
- Create a file: ```secrets/orchestraConfig.json```
- Insert this configuartion (substituting your values for all the secrets below):
```javascript
{
    "MASTER_KEY": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "REST_KEY": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "APP_ID": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "DB_URI": "mongodb://database-user:database-pass@ip.address.of.database.server:mongo-port/database-name",
    "CLIENT_KEY": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "JS_KEY": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",

    "SENDGRID_API_KEY": "SG.euurxRxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx", // SendGrid Secret Key
    "REDIRECT_LOCATION": "http://localhost/Quarto/web/account", // when users click the link in their verification email, they should be taken here
    "EXTERNAL_ACCESS_URL": "http://localhost:####",

    "SERVER_URL": "http://localhost:####",
    "PORT": ####,
    "DASHBOARD_PORT": ####,
    "DASHBOARD_USER": "dashboard-username",
    "DASHBOARD_PASS": "password-for-dashboard-user"
}
```
