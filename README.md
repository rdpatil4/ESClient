Elastic Search query client
=========

Elastic search client tool for easy search, edit and delete Index documents.
The search results are presented in tabular format instead of JSON for easy reading through the results.
Routing key support is now added to the tool. Enter the routing key value when updating and deleting the records
that use routing key.

###Configuration:

Configuraiton is done in the file **config.js** found in the root folder.
Default configuration looks like below:

```js
var Config = {
   'CLUSTER_URL':'http://localhost:9200', 
   'THEME':'Smoothness',
   'EXPAND_LOWERCASE_TERMS':true,
   'ANALYZE_WILDCARD':false,
   'SEARCH_TYPE':'query_then_fetch',
   'FROM':0,
   'SIZE':100,
   'DEFAULT_OPERATOR':'OR',
   'USE_LUCENE_QUERY_TYPE':true,
   'ENABLE_INDEX_DROP':false,
   'SHOW_JSON_RESULS':false
}
```
Just change the location of your Elasticsearch cluster, port and you are good to go.

![alt tag] (https://raw.githubusercontent.com/rdpatil4/Elastic-Search-Client/master/media/ESClient.png)

I really hope the tool is very intutive to use, if not, below steps should get you started.

After configuration is done follow below steps:

1. Click connect to connect to your elastic search cluster
2. Select the Index, Type you want to search on
3. Select the fields you want to be displayed in the result table.
   By default all the fields would be displayed in the result table. So if you have lot of
   fields for your selected type, then you may want to select only fields of your interest.
   Irrespective, double click on the row in the table, shows the whole json anyways. 
4. Enter the Lucene query you want to use for searching.
5. Hit search to see the results displayed in tabular format. 

![alt tag] (https://raw.githubusercontent.com/rdpatil4/Elastic-Search-Client/master/media/searchresults.png)

###Editing documents:

- Double click the row you want to edit. You should see the raw json in the window. Click the edit
  button to edit the document.
![alt tag] (https://raw.githubusercontent.com/rdpatil4/Elastic-Search-Client/master/media/edit.png) 

###Deleting documents:
- Two ways to delete data:

1. Delete by ID
2. Delete by Query

Care is taken for not allowing any accidental deletes. You would be asked to confirm, before deleting any 
data. Also care is taken to not accidentally drop the whole Index with mappings.

#####Delete by ID:

- Single click on the row(s) you want to delete and hit delete button. No accidental deletes, you would be asked to confirm 
  your selection to delete rows.
  
![alt tag] (https://raw.githubusercontent.com/rdpatil4/Elastic-Search-Client/master/media/delete.png)

#####Delete by Query:

You can delete multiple rows by query using the "Delete By Query" button. The query entered in the search box would be used for deleting the rows.
Again no accidental deletes, you would be asked to confirm your selection before deleting the rows.


###Sorting documents:

- Select the field you want to sort and click search. Default sorting is on _score.


###Known Limitation:

- No Index alias use supported

Author
----
Rajesh Patil (rdpatil4@yahoo.com)

License
----
I dont think too much about licence, feel free to do anything you want... :-)
   








