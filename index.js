/*
 * gulp-jira-todo
 * https://github.com/Pharb/gulp-jira-todo
 *
 * Copyright (c) 2014-2015 Raphael Pigulla
 * Licensed under the MIT license.
 */

'use strict';

var _ = require('lodash'),
    through = require('through2'),
    JiraTodo = require('./lib/jira-todo-lib'),
    util = require('./lib/util');


function validateOptions(options) {
    if (typeof options.issueRequired !== 'boolean') {
        util.throwPluginError('Configuration option "issueRequired" must be of type boolean.');
    }

    ['issueRegex'].forEach(function (key) {
        if (options.hasOwnProperty(key) && typeof options[key] !== 'string') {
            util.throwPluginError('Configuration option "' + key + '" must be of type string.');
        }
    });

    ['allowedStatuses', 'allowedIssueTypes', 'projects'].forEach(function (name) {
        if (!Array.isArray(options.projects)) {
            util.throwPluginError('Configuration option "' + name + '" is missing or not an array.');
        }
    });

    if (options.projects.length === 0) {
        util.throwPluginError('You have not specified any projects.');
    }

    ['jiraUrl', 'jiraUsername', 'jiraPassword'].forEach(function (name) {
        if (!options.hasOwnProperty(name)) {
            util.throwPluginError('Configuration option "' + name + '" is missing.');
        }
    });
}

module.exports = function (options) {
        var opts = _.assign({
                projects: [],
                allowedStatuses: [1],
                allowedIssueTypes: [1, 3, 4, 5],
                issueRequired: false
            }, options),
            gjt;

        validateOptions(opts);

        gjt = new JiraTodo({
            projects: opts.projects,
            issueRegex: opts.issueRegex,
            allowedStatuses: opts.allowedStatuses,
            allowedIssueTypes: opts.allowedIssueTypes,
            jira: {
                url: opts.jiraUrl,
                username: opts.jiraUsername,
                password: opts.jiraPassword
            }
        });

    return through.obj(function (input, enc, cb) {
        var todos;

        if (!Array.isArray(input.todos || input)) {
            throw util.throwPluginError('Expected input to be an array of TODO objects!');
        }

        todos = (input.todos || input).map(function (todo) {
            return {
                text: todo.text,
                file: todo.file,
                line: todo.line
            };
        });

        gjt.processTODOs(todos)
            .then(function (problems) {
                problems.forEach(function (problem) {
                    if (problem.kind === 'statusForbidden') {
                        util.throwPluginError(
                            'File "' + problem.issue.file + '" has a todo for issue ' + problem.issue.key +
                            ' in line ' + problem.issue.line + ' (issue status: "' + problem.status.statusName + '").'
                        );
                    } else if (problem.kind === 'withoutTicket' && options.issueRequired) {
                        util.throwPluginError(
                            'File "' + problem.issue.file + '" has a todo without a specified issue in line ' +
                            '' +  problem.issue.line + '.'
                        );
                    } else if (problem.kind === 'typeForbidden') {
                        util.throwPluginError(
                            'File "' + problem.issue.file + '" has a todo for an issue of disallowed type ' +
                            '"' + problem.status.typeName + '" in line: ' + problem.issue.line + '.'
                        );
                    }
                });

                cb(null, input);
            })
            .catch(function (err) {
                cb(err, input);
            });
    });
};
