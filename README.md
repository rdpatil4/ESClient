Elastic Search query client
=========

Elastic search client tool for easy search, edit and delete Index documents.

This tool works with Lucene queries and not Query DSL.
The resuls are presented in tabular format instead of JSON for easy reading.

###Configuration:

Configuraiton is done in the file **config.js** found in the root folder
Default config. looks like below

```js
{
   *'SERVER_URL':'http://localhost:9200',*</br>
   *'Theme':'Blitzer'*</br>
}
```
You can change the location of your Elastic Search node and port and you are good to go.
The value for Theme is just the jQuery theme roller theme name.

The tool is built using several other wonderful open source projects like Datatable and Multiselect etc.

I really hope the tool is very intutive to use, if not, below steps should get you started.

After configuration follow below steps

1. Click connect to connect to your elastic search cluster
2. Select the Index, Type you want to search on
3. Select the fields you want in the resultset
4. Enter the Lucene query (Not DSL) you want to use for searching.
5. Hit search to see the results. 

###Sorting documents:

- Select the field you want to sort and click search

###Deleting documents:

- click on the row(s) you want to delete and hit delete button and confirm your selection to delete rows.

###Delete by Query:

You can delete multiple rows by query using the "Delete By Query" button. The query entered in the search box would be used for deleting the rows.

###Editing documents:

- Double click the row you want to edit. You should see the raw json in the window. Click the edit
  button to edit the document.
  
###Known Limitation:

The tool does not use routing and if you are using routing keys, you cannot use editing features of this tool.

Author
----
Rajesh Patil (rdpatil4@yahoo.com)

License
----

   








