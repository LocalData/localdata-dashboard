The admin dashboard for [LocalData](http://golocaldata.com)

Displays data from the [LocalData Surey API](https://github.com/codeforamerica/survey-api)

To start, clone into a local directory and set the path of your LocalData survey
and geodata APIs in `js/settings.js`. 

Things get kicked off from `js/main.js`.

Some coding standards:
* Follow [Douglas Crawford's conventions](http://javascript.crockford.com/code.html)
* Err on the side of long, descriptive variable names
** Name the target of the function -- for example, `renderForm` rather than `render`.
** `referencesToAnswersForQuestion` rather than `answerRefs` 
** `function(event)` rather than `function(e)` 

More specific Backbon standards:
* Every view should accept an `options` object.
* Every view's initialize function should honor `options.elId`, a string of the 
selector for the container the to use. 
* A view may provide its own, default `elId`. 
* Views should pass on models to their children. For example, a settings view 
shoud recieve the current `survey` object instead of calling the API it.
