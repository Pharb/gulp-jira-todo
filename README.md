[![NPM version](http://img.shields.io/npm/v/gulp-jira-todo.svg?style=flat-square)](http://badge.fury.io/js/gulp-jira-todo)
[![Dependency Status](https://david-dm.org/pharb/gulp-jira-todo.svg?style=flat-square)](https://david-dm.org/pharb/gulp-jira-todo)
[![devDependency Status](https://david-dm.org/pharb/gulp-jira-todo/dev-status.svg?style=flat-square)](https://david-dm.org/pharb/gulp-jira-todo#info=devDependencies)

# gulp-jira-todo

> Check your JavaScript source files for comments containing TODOs that reference Jira issues. Causes warnings if the status of a referenced issue is "Open" (or any other number of configurable statuses).

## Example Output
![Example Output](https://raw.githubusercontent.com/pharb/gulp-jira-todo/master/screenshot.png)

## Getting Started
This package is intended to be used with [gulp](https://github.com/gulpjs/gulp).

Install it with:
```shell
npm install gulp-jira-todo --save-dev
```

You also need an external TODO parser like [gulp-todo](https://github.com/pgilad/gulp-todo):

```shell
npm install gulp-todo --save-dev
```

You can integrate it in your gulp setup like this:

```js
var gulp = require('gulp'),
    todo = require('gulp-todo'),
    jiraTodo = require('gulp-jira-todo');

gulp.task('todo', function () {
    return gulp.src('mySources/**/*.js')
        .pipe(todo())
        .pipe(jiraTodo({
            issueRequired: true,
            projects: ['ABC'],
            allowedStatuses: [1, 3],
            allowedIssueTypes: [1, 3, 4, 5],
            jiraUrl: 'https://jira.example.com',
            jiraUsername: 'myJiraAccount',
            jiraPassword: 'secretJiraPassword' // (see Security Notes below!)
        }));
});
```

### Options

#### options.projects
Type: `Array`  
Default value: `[]`

An array of strings specifying the keys of Jira projects you want to check against. For example, if your application is referencing the issues `MA-123` and `PT-99`, set this to `['MA', 'PT']`. Any other issue keys (e.g. `ABC-42`) will be ignored.

#### options.allowedStatuses
Type: `Array`  
Default value: `[1]`

An array of ids that specifies which statuses are allowed for issues that are referenced from a todo. The default `1` corresponds to the standard Jira issue status `Open`.

#### options.allowedIssueTypes
Type: `Array`  
Default value: `[1, 3, 4, 5]`

An array of ids that specifies which issue types are allowed to be referenced from a todo. The default corresponds to the standard Jira issue types `Bug`, `Task`, `Improvement` and `Sub-task`.

#### options.issueRequired
Type: `boolean`
Default value: `false`

If enabled, all comments that match `opts.todoRegex` *must* contain at least one issue key matching the specified project(s).

#### options.issueRegex
Type: `String`  
Default value: `'(?<key>(?<project>[A-Z][_A-Z0-9]*)-(?<number>\\d+))'`

The regular expression used to identify issue keys. By default this plugin matches strings that starts with a letter, followed by any number of alphanumeric characters, a dash and at least one digit (ignoring case). You can tweak this expression as needed, as long as you keep the named groups `key`, `project` and `number`.  The flags `g` (global) and `i` (ignore case) are added automatically. Please refer to the [XRegExp](http://xregexp.com/) documentation for further details.

#### options.jiraUrl
Type: `String`  
Default value: _none_

The URL of the Jira server, e.g. `'https://jira.example.com'`. The path for the REST endpoint (i.e. `'/rest/api/2'`) will be added automatically.

#### options.jiraUsername
Type: `String`  
Default value: _none_

The username used for HTTP basic access authentication.

#### options.jiraPassword
Type: `String`  
Default value: _none_

The password used for HTTP basic access authentication.


## Security Notes
It is strongly recommended not to put your Jira credentials in your repository. Instead, create a separate JSON file, add it to your `.gitignore` and read the username and password from there.

For help, please read this: https://help.github.com/articles/remove-sensitive-data/

Also, make sure you use a secure connection (i.e. https) to protect your username and password.  

## Contributing
In lieu of a formal style guide, take care to maintain the existing coding style.
Add unit tests for any new or changed functionality.
Lint and test your code using `npm run lint` and `npm test`.

## Release History
See [Changelog.md](./Changelog.md)
