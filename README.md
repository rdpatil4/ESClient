Elasticsearch query client
=========
```js
For Elasticsearch 1.4 users:
You need to enable CORS in elasticsearch.yml by setting below line:
http.cors.enabled: true or 
http.cors.allow-origin value accordingly for this tool to work
``` 
Elasticsearch client tool for easy search, edit and delete Index documents.

##Key features
- Works with Lucene as well as DSL query syntax, as per configuration.
- Search results are presented in tabular format for easy reading through the results. 
- Easy updating of documents.
- Easy delete of documents with simple button clicks.
- Protection against accidental dropping index/mappings when trying to delete documents.
- Easy configuration of advanced Elasticsearch search params in configuration tab.
- JSON results view available, if configured.
- Dropping index/mapping supported, if configured.

###Configuration:

Configuration is done in the file **config.js** found in the root folder.
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
   'SHOW_JSON_RESULS':false,
   'SHOW_MAPPING_INFO':true
}
```
Just point to the location of your Elasticsearch cluster (CLUSTER_URL) and you are good to go.

![alt tag] (https://raw.githubusercontent.com/rdpatil4/Elastic-Search-Client/master/media/ESClient.png)

After configuration is done follow below steps:

1. Click connect to connect to your Elasticsearch cluster
2. Select the Index, Type you want to search on
3. Select the fields you want to be displayed in the result table.
   By default all the fields would be displayed in the result table. So if you have lot of
   fields for your selected type, then you may want to select only fields of your interest.
   Irrespective, double click on the row in the table, shows the whole json anyways. 
4. Enter the Lucene/DSL query you want to use for searching.
5. Hit search to see the results displayed in tabular format. 

![alt tag] (https://raw.githubusercontent.com/rdpatil4/Elastic-Search-Client/master/media/searchresults.png)

###Editing documents:

- Double click the row you want to edit. You should see the raw JSON in the window. Click the edit
  button to edit the document. If you are using routing while Indexing, then routing key value is 
  required for updating the documents.    
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

- No Index alias supported

Author
----
Rajesh Patil (rdpatil4@yahoo.com)

Special Thanks 
----
- @warfares for JSON formatter
- @DataTables for Datatables
- @ehynds for Multiselect

License
----

Licensed under the [MIT license][mit].
[mit]: http://www.opensource.org/licenses/mit-license.php
   








