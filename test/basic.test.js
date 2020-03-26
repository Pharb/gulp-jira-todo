var nock = require('nock'),
    fixtures = require('./fixtures/testing'),
    JiraTodo = require('../lib/jira-todo-lib');

describe('gulp-jira-todo', function () {
    it('extracts issues for a custom regex', function () {
        var gjt = new JiraTodo({
            issueRegex: '<<(?<key>(?<project>[A-Z][_A-Z0-9]*)-(?<number>\\d+))>>',
            projects: []
        });

        expect(gjt.parseTodoItem(fixtures[2])).toEqual([
            {
                key: 'ABC-99',
                project: 'ABC',
                number: 99,
                file: 'other/test.xy',
                line: 22
            },
            {
                key: 'FOOBAR-1337',
                project: 'FOOBAR',
                number: 1337,
                file: 'other/test.xy',
                line: 22
            }
        ]);
    });

    describe('extracts issues from TODO texts', function () {
        it('and handles issueless texts', function () {
            var gjt = new JiraTodo({
                    projects: ['FOO']
                }),
                issues = gjt.getIssuesForTodo(fixtures[5]);

            expect(issues).toEqual({
                withoutTicket: [{
                    file: 'test/file1.less',
                    line: 1337
                }],
                issues: []
            });
        });

        it('for one project with multiple issues', function () {
            var gjt = new JiraTodo({
                    projects: ['PM']
                }),
                issues = gjt.getIssuesForTodo(fixtures[0]);

            expect(issues).toEqual({
                withoutTicket: [],
                issues: [{
                    key: 'PM-1234',
                    project: 'PM',
                    number: 1234,
                    file: 'test/file1.js',
                    line: 13
                }, {
                    key: 'PM-42',
                    project: 'PM',
                    number: 42,
                    file: 'test/file1.js',
                    line: 13
                }]
            });
        });

        it('for multiple projects', function () {
            var gjt = new JiraTodo({
                    projects: ['PM', 'ABC']
                }),
                issues = gjt.getIssuesForTodo(fixtures[3]);

            expect(issues).toEqual({
                withoutTicket: [],
                issues: [{
                    key: 'PM-1245',
                    project: 'PM',
                    number: 1245,
                    file: 'test/file4.jsx',
                    line: 50
                },
                    {
                        key: 'ABC-13',
                        project: 'ABC',
                        number: 13,
                        file: 'test/file4.jsx',
                        line: 50
                    }]
            });
        });
    });

    it('generates the right requests', function () {
        var authHeader = 'Basic ' + Buffer.from('jiraUser:jiraPass').toString('base64'),
            gjt = new JiraTodo({
                projects: ['ABC'],
                jira: {
                    username: 'jiraUser',
                    password: 'jiraPass',
                    url: 'http://www.example.com'
                }
            });

        nock('http://www.example.com')
            .get('/rest/api/2/issue/ABC-99').matchHeader('Authorization', authHeader)
            .reply(200, { fields: {
                status: { id: '1', name: 'Open' },
                issuetype: { id: '1', name: 'Bug' } }
            })
            .get('/rest/api/2/issue/XY-42').matchHeader('Authorization', authHeader)
            .reply(200, { fields: {
                status: { id: '3', name: 'In Progress' },
                issuetype: { id: '1', name: 'Bug' } }
            });

        return gjt.getJiraStatusForIssues(['ABC-99', 'XY-42', 'ABC-99'])
            .then(function (result) {
                expect(result).toEqual({
                    'ABC-99': { id: 1, type: 1, statusName: 'Open', typeName: 'Bug' },
                    'XY-42': { id: 3, type: 1, statusName: 'In Progress', typeName: 'Bug' }
                });
            });
    });

    it('reports problems correctly', function () {
        var gjt = new JiraTodo({
            projects: ['ABC'],
            allowedStatuses: [1],
            allowedIssueTypes: [1],
            jira: {
                url: 'http://www.example.com',
                username: 'user',
                password: 'pass'
            }
        });

        nock('http://www.example.com')
            .get('/rest/api/2/issue/ABC-13').reply(200, { fields: {
                status: { id: '6', name: 'Closed' },
                issuetype: { id: '1', name: 'Bug' }
            }})
            .get('/rest/api/2/issue/ABC-99').reply(200, { fields: {
                status: { id: '1', name: 'Open' },
                issuetype: { id: '1', name: 'Bug' }
            }})
            .get('/rest/api/2/issue/ABC-1000').reply(200, { fields: {
                status: { id: '1', name: 'Open' },
                issuetype: { id: '2', name: 'Bug' }
            }});

        return gjt.processTODOs(fixtures).then(function (problems) {
            expect(problems).toEqual([{
                kind: 'withoutTicket',
                issue: {
                    file: 'test/file1.less',
                    line: 1337
                }
            }, {
                kind: 'statusForbidden',
                issue: {
                    key: 'ABC-13',
                    project: 'ABC',
                    number: 13,
                    file: 'test/file4.jsx',
                    line: 50
                },
                status: {
                    id: 6,
                    statusName: 'Closed',
                    type: 1,
                    typeName: 'Bug'
                }
            }, {
                kind: 'typeForbidden',
                issue: {
                    key: 'ABC-1000',
                    project: 'ABC',
                    number: 1000,
                    file: 'test/file4.py',
                    line: 10000
                },
                status: {
                    id: 1,
                    statusName: 'Open',
                    type: 2,
                    typeName: 'Bug'
                }
            }]);
        });
    });
});
