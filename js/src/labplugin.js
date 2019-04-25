var jupyter_materialui = require('./index');
var base = require('@jupyter-widgets/base');

module.exports = {
    id: 'jupyter-materialui',
    requires: [base.IJupyterWidgetRegistry],
    activate: function (app, widgets) {
        widgets.registerWidget({
            name: 'jupyter-materialui',
            version: jupyter_materialui.version,
            exports: jupyter_materialui
        });
    },
    autoStart: true
};

