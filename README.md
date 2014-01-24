# [LocalData](http://localdata.com)
The admin dashboard for [LocalData](http://localdata.com)

Displays data from the [LocalData Survey API](https://github.com/LocalData/localdata-api)

The app is static HTML + javascript. It does assume that it's being
served by the same host as the LocalData API. To run locally, clone this repo
into a directory hosted by a web server (such as Apache). Set the
`REMOTE_ADMIN_PREFIX` environment variable of the API app to
`http://localhost/~prashant/dev/dashboard/src`.

Things get kicked off from `src/js/main.js`.

## Installation & development

Install SASS:

`gem install sass`

Watch the directory for style changes:

`sass --watch src/css/sass/styles.scss:src/css/app.css`


## Building  & deploying

We use Grunt to prepare the app for deployment. Run `grunt` or `grunt build` to build the minified, deployable package. You can configure locations in a `dev-settings.json` file, after which `grunt deploy` or `grunt deploy:mylocation` will sync the built package to an S3 location. Deployment requires [s3cmd](http://s3tools.org/s3cmd).

Sample `dev-settings.json`:

```
{
  "deploy" : {
    "default" : "s3://mybucket/web/my-dashboard-dev/",
    "dev" : "s3://mybucket/web/my-dashboard-dev/",
    "production" : "s3://mybucket/production-web/dashboard"
  }
}
```

## Miscellany
Some coding standards:

* Follow [Douglas Crockford's conventions](http://javascript.crockford.com/code.html)
* Err on the side of long, descriptive variable names
  * Name the target of the function -- for example, `renderForm` rather than `render`.
  * `referencesToAnswersForQuestion` rather than `answerRefs`
  * `function (event)` rather than `function (e)`

More specific Backbone standards:

* Every view should accept an `options` object.
* Every view's initialize function should honor `options.el`, a string of the
selector for the container the to use. (`$el` is a reference to the Jquery object)
* A view may provide its own, default `el`.
* Views should pass on models to their children. For example, a settings view
should recieve the current `survey` object instead of calling the API it.
