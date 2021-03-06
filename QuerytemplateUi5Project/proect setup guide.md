
# Project Set up guide 
### deploying
1. Download the Project or clone the project
2. Deploy the App in the MII workbench in web folder
3. Deploy the MII Qurery(testQry.tqsq) to all the MII workbenches in the same path. find this Query in the folder [MII-Query-Template-project/QuerytemplateUi5Project/MII queries/testQry.tqsq](https://github.com/subrahmanyam-pampana/MII-Query-Template-project/tree/main/QuerytemplateUi5Project/MII%20queries)
4. Deploy the BLS Transaction(QueryTemplate.trx) to only dev MII work bench from the folder [MII-Query-Template-project/QuerytemplateUi5Project/MII queries/QueryTemplate.trx](https://github.com/subrahmanyam-pampana/MII-Query-Template-project/blob/main/QuerytemplateUi5Project/MII%20queries/QueryTemplate.trx)

### Configuration
1. Go to [QuerytemplateUi5Project/controller/App.controller.js](QuerytemplateUi5Project/controller/App.controller.js) file and add your server configurations as shown in the image below

![image](https://user-images.githubusercontent.com/79074273/170458381-64921d03-52bd-4a2f-9402-9bcf14e6ad35.png)

Example:
```js
 this.serversList = {
          servers: [
            { name: "my development server", url: "https://myDevserver:50010" },
            { name: "my Quality server", url: "https://myQaserver:50010" }
          ],
        };

```
2.set up the default server in the same file at below shown image

![image](https://user-images.githubusercontent.com/79074273/170459288-98cb450b-53a5-4149-8392-862af31480e1.png)

example:
```js
this.server = {
          serverName: that.serversList.servers[0].url,  //here first server selected as default server
          Alias: "my dev server", //specify the custom name for your server that will apear in the ui or set it as  that.serversList.servers[0].name
        };
```
3.Configure the BLS Query path to execute the Query at below part in the code

![image](https://user-images.githubusercontent.com/79074273/170461398-ab14c35d-74bb-4543-ae7b-d7b425f5870d.png)
example:
```js
this.BLSTransactions = {
          executeQueryPath: "DefaultProject/myQuery", //put your Query path here
          devTransactionPath:"devProject/queryExecuteTrx"
        };
```
*Note:* Mainatain same executeQuery in all the servers with same path and 
devTransaction only need to be maintained in dev server



