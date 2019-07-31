import { DOMWidgetView, JupyterPhosphorWidget, WidgetModel } from '@jupyter-widgets/base';
import React from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { styleWrapper } from './style_wrap';
import { ReactWidgetModel } from './generated/ReactWidget';

class WidgetComponent extends React.Component {
    constructor(props) {
        super(props);
        this.el = React.createRef();
    }

    async componentDidMount() {
        const { model, view } = this.props;
        const childView = await view.create_child_view(model);
        setTimeout(
            () => JupyterPhosphorWidget.attach(childView.pWidget, this.el.current),
            0,
        );
    }

    render() {
        return React.createElement('div', { ref: this.el });
    }
}

WidgetComponent.propTypes = {
    model: PropTypes.PropTypes.instanceOf(WidgetModel).isRequired,
    view: PropTypes.PropTypes.instanceOf(DOMWidgetView).isRequired,
};

class TopComponent extends React.Component {
    componentWillUnmount() {
        (this.allModels || []).forEach(model => model.off('change', this.updateCallback));
    }

    makeProps(model, ancestors) {
        const snakeToCamel = (s) => {
            let result = s.replace(/_$/, '');
            if (result.startsWith('aria')) {
                return result.replace('_', '-');
            }
            result = result.replace(/_\w/g, m => m[1].toUpperCase());
            return result;
        };

        const hasAncestor = name => ancestors.map(m => m.name).some(n => n === name);

        const { view } = this.props;

        const childProps = model.keys()
            .filter(k => !k.startsWith('_') && k !== 'layout' && model.get(k) != null)
            .reduce((accumulator, key) => {
                let v;
                if (key === 'anchor_el') {
                    v = document.querySelector(`[cid=${view.cid}${model.get(key).cid}]`);
                } else if (key === 'value') { // value can be a widgetModel, we don't want to convert it to a react component
                    v = model.get(key);
                } else {
                    v = this.convertModels(model.get(key), ancestors.concat(model));
                }
                return { ...accumulator, [snakeToCamel(key)]: v };
            }, {});

        if (model.keys().includes('checked')) {
            const dontUseChecked = (model.name === 'RadioModel' && hasAncestor('RadioGroupModel'))
                || (model.name === 'FormControlLabelModel' && hasAncestor('RadioGroupModel'));
            if (!dontUseChecked) {
                childProps.onChange = (e, checked) => {
                    model.set('checked', checked);
                    model.save_changes(model.callbacks(view));
                };
            }
        } else if (model.keys().includes('selected')) {
            const dontUseSelected = model.name === 'ToggleButtonModel' && hasAncestor('ToggleButtonGroupModel');
            if (!dontUseSelected) {
                childProps.onChange = () => {
                    model.set('selected', !model.get('selected'));
                    model.save_changes(model.callbacks(view));
                };
            }
        } else if (model.keys().includes('value')) {
            childProps.onChange = (e, value) => {
                if (e.target && e.target.value !== undefined && !['ToggleButtonGroupModel', 'TabsModel'].includes(model.name)) {
                    model.set('value', e.target.value);
                } else if (value !== undefined) {
                    model.set('value', value);
                }
                model.save_changes(model.callbacks(view));
            };
        }

        (model.get('_events') || [])
            .forEach((eventStr) => {
                const [event, ...modifiers] = eventStr.split('|').map(s => s.trim());
                const existingFn = childProps[event];
                childProps[event] = (e, ...args) => {
                    if (modifiers.includes('preventDefault')) {
                        e.preventDefault();
                    }
                    if (existingFn) {
                        existingFn(e, ...args);
                    }
                    model.send({ event, data: args }, model.callbacks(view));
                };
            });
        childProps.key = model.cid;
        childProps.cid = view.cid + model.cid;

        return childProps;
    }

    convertModels(value, ancestors) {
        if (value instanceof ReactWidgetModel) {
            const comp = value.getReactComponent ? value.getReactComponent() : value.get('tag');
            return React.createElement(comp, this.makeProps(value, ancestors));
        }
        const { view } = this.props;
        if (value instanceof WidgetModel) {
            return React.createElement(WidgetComponent, {
                model: value,
                key: value.cid,
                view,
            });
        }
        if (Array.isArray(value)) {
            return value.map(e => this.convertModels(e, ancestors));
        }
        return value;
    }

    listModels(value) {
        if (value instanceof ReactWidgetModel) {
            const childModels = _.flatten(value.values().map(v => this.listModels(v)))
                .filter(_.identity);
            return [value].concat(childModels);
        }
        if (Array.isArray(value)) {
            return _.flatten(value.map(v => this.listModels(v))).filter(_.identity);
        }
        return false;
    }

    render() {
        if (!this.updateCallback) {
            this.updateCallback = () => this.forceUpdate();
        }
        (this.allModels || []).forEach(m => m.off('change', this.updateCallback));
        const { model } = this.props;
        this.allModels = this.listModels(model);
        this.allModels.forEach(m => m.on('change', this.updateCallback));

        return this.convertModels(model, []);
    }
}

TopComponent.propTypes = {
    model: PropTypes.PropTypes.instanceOf(WidgetModel).isRequired,
    view: PropTypes.PropTypes.instanceOf(DOMWidgetView).isRequired,
};

export class ReactView extends DOMWidgetView {
    render() {
        super.render();
        ReactDOM.render(
            styleWrapper(
                React.createElement(TopComponent, { model: this.model, view: this }),
            ),
            this.el,
        );
    }
}
