var buster = require('buster'),
    path = require('path'),
    fs = require('fs'),
    sinon = require('sinon'),
    nock = require('nock'),
    JiraTodo = require('../tasks/lib/jira-todo-lib');

buster.spec.expose();
expect = buster.expect;

describe('grunt-jira-todo', function () {
    var gruntMock = {
        log: { warn: sinon.spy() },
        verbose: { writeln: sinon.spy() },
        fail: { warn: sinon.spy() },
        file: {
            read: sinon.stub()
        }
    };

    it('extracts issues for a custom regex', function () {
        var gjt = new JiraTodo(gruntMock, {
                regex: '<<(?<key>(?<project>[A-Z][_A-Z0-9]*)-(?<number>\\d+))>>'
            }),
            source = 'foo <<ABC-99>> bar <XY-0> baz <<FOOBAR-1337>>';

        expect(gjt.parseString(source)).toEqual([
            { key: 'ABC-99', project: 'ABC', number: 99 },
            { key: 'FOOBAR-1337', project: 'FOOBAR', number: 1337 }
        ]);
    });

    describe('extracts issues from a file', function () {
        var sourceFile = 'mysource.js',
            actualSource = fs.readFileSync(path.join(__dirname, 'fixtures', 'testing.js')).toString();

        before(function () {
            gruntMock.file.read.withArgs(sourceFile).returns(actualSource);
        });

        it('for one project', function () {
            var gjt = new JiraTodo(gruntMock, {
                    projects: ['PM']
                }),
                issues = gjt.getIssuesForFile(sourceFile);

            expect(issues).toEqual([{
                key: 'PM-1234',
                project: 'PM',
                number: 1234,
                file: sourceFile
            }]);
        });


        it('for multiple project', function () {
            var gjt = new JiraTodo(gruntMock, {
                    projects: ['PM', 'ABC']
                }),
                issues = gjt.getIssuesForFile(sourceFile);

            expect(issues).toEqual([
                {
                    key: 'PM-1234',
                    project: 'PM',
                    number: 1234,
                    file: sourceFile
                },
                {
                    key: 'ABC-13',
                    project: 'ABC',
                    number: 13,
                    file: sourceFile
                },
                {
                    key: 'ABC-99',
                    project: 'ABC',
                    number: 99,
                    file: sourceFile
                },
                {
                    key: 'ABC-99',
                    project: 'ABC',
                    number: 99,
                    file: sourceFile
                }
            ]);
        });
    });

    it('generates the right requests', function (done) {
        var authHeader = 'Basic ' + new Buffer('jiraUser:jiraPass').toString('base64'),
            gjt = new JiraTodo(gruntMock, {
                projects: ['ABC'],
                jira: {
                    username: 'jiraUser',
                    password: 'jiraPass',
                    url: 'http://www.example.com'
                }
            });

        nock('http://www.example.com')
            .get('/rest/api/2/issue/ABC-99').matchHeader('Authorization', authHeader)
            .reply(200, { fields: { status: { id: '1', name: 'Open' } } })
            .get('/rest/api/2/issue/XY-42').matchHeader('Authorization', authHeader)
            .reply(200, { fields: { status: { id: '3', name: 'In Progress' } } });

        gjt.getJiraStatusForIssues(['ABC-99', 'XY-42', 'ABC-99'], function (err, result) {
            expect(err).toBe(null);
            expect(result).toEqual({
                'ABC-99': { id: 1, name: 'Open' },
                'XY-42': { id: 3, name: 'In Progress' }
            });
            done();
        });
    });

    it('reports problems correctly', function (done) {
        var sourceFile = 'mysource.js',
            actualSource = fs.readFileSync(path.join(__dirname, 'fixtures', 'testing.js')).toString(),
            gjt;

        gruntMock.file.read.withArgs(sourceFile).returns(actualSource);
        gjt = new JiraTodo(gruntMock, {
            projects: ['ABC'],
            allowedStatuses: [1],
            jira: {
                url: 'http://www.example.com',
                username: 'user',
                password: 'pass'
            }
        });

        nock('http://www.example.com')
            .get('/rest/api/2/issue/ABC-13').reply(200, { fields: { status: { id: '6', name: 'Closed' } } })
            .get('/rest/api/2/issue/ABC-99').reply(200, { fields: { status: { id: '1', name: 'Open' } } });

        gjt.processFiles([sourceFile], function (problems) {
            expect(problems.length).toBe(1);
            expect(problems[0]).toEqual({
                issue: { key: 'ABC-13', project: 'ABC', number: 13, file: sourceFile },
                status: { id: 6, name: 'Closed' }
            });
            done();
        });
    });
});
