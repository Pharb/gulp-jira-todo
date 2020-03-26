var PluginError = require('plugin-error');

module.exports = {
    throwPluginError: function pluginError(message) {
        throw new PluginError('gulp-jira-todo', message);
    },
};
