const base = require('@jupyter-widgets/base');
const jupyterMaterialui = require('./index');

module.exports = {
    id: 'jupyter-materialui',
    requires: [base.IJupyterWidgetRegistry],
    activate(app, widgets) {
        widgets.registerWidget({
            name: 'jupyter-materialui',
            version: jupyterMaterialui.version,
            exports: jupyterMaterialui,
        });
    },
    autoStart: true,
};
