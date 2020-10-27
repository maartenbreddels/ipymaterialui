import { DOMWidgetView, JupyterPhosphorWidget, WidgetModel } from '@jupyter-widgets/base';
import React from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { styleWrapper } from './style_wrap';
import {ReactWidgetModel, RadioGroupModel, FormControlLabelModel, TabsModel, RadioModel} from './generated';
import {ToggleButtonGroupModel, ToggleButtonModel} from "./generated_lab";

class WidgetComponent extends React.Component {
    constructor(props) {
        super(props);
        this.el = React.createRef();
    }

    async componentDidMount() {
        const { model, view } = this.props;
        const childView = await view.create_child_view(model);
        /* JupyterPhosphorWidget.attach() expects this.el.current to be attached to the DOM. This
         * requires the view to be attached to the DOM. This is the case after view.displayed is
         * resolved.
         */
        await view.displayed;
        JupyterPhosphorWidget.attach(childView.pWidget, this.el.current);
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
    constructor(props) {
        super(props);

        /* Use an arrow function instead of a method to maintain a reference to this */
        this.updateCallback = () => this.forceUpdate();
    }

    componentWillUnmount() {
        (this.allModels || []).forEach(model => model.off('change', this.updateCallback));
    }

    makeProps(model, ancestors) {
        const convertPropertyName = (s) => {
            /* remove trailing underscore (previously added to prevent keyword or naming collisions) */
            let result = s.replace(/_$/, '');
            /* Properties starting with aria have kebab case */
            if (result.startsWith('aria')) {
                return result.replace('_', '-');
            }
            /* Convert from snake to camel case without changing the case of the first character.
             * Some properties start with an uppercase.
             */
            return result.replace(/_\w/g, m => m[1].toUpperCase());
        };

        const { view } = this.props;

        /* Recursively convert relevant backbone model properties to a props object */
        const childProps = model.keys()
            .filter(key => !key.startsWith('_') && key !== 'layout' && model.get(key) != null)
            .reduce((props, key) => {
                let propValue;
                if (key === 'anchor_el') {
                    /* anchor_el prop is an DOM element. Find the DOM element rendered for this model and use is as prop */
                    propValue = document.querySelector(`[cid=${view.cid}${model.get(key).cid}]`);
                } else if (key === 'value') {
                    /* value can be a widgetModel, we don't want to convert it to a react component */
                    propValue = model.get(key);
                } else {
                    /* Recursive step */
                    propValue = this.convertModels(model.get(key), ancestors.concat(model));
                }
                return { ...props, [convertPropertyName(key)]: propValue };
            }, {});

        /* We want Material UI widgets to change the state of properties that are changed internally, like e.g
         * Slider.value, this is not automatically done by these widgets. This property has to be set using an onChange
         * callback and is not always named value but also checked or selected. In some cases an ancestor widget takes
         * over the event handling and this widget should do nothing.
         */
        if (model.keys().includes('checked')) {
            /* This widget uses checked as main property which should be changed in the onChange callback if it doesn't
             * have an ancestor which should handle the event.
             */
            const ancestorHandlesEvent = (model instanceof RadioModel || model instanceof FormControlLabelModel)
                && ancestors.some(m => m instanceof RadioGroupModel);
            if (!ancestorHandlesEvent) {
                childProps.onChange = (e, checked) => {
                    model.set('checked', checked);
                    model.save_changes(model.callbacks(view));
                };
            }
        } else if (model.keys().includes('selected')) {
            /* This widget uses selected as main property which should be changed in the onChange callback if it doesn't
             * have an ancestor which should handle the event.
             */
            const ancestorHandlesEvent = model instanceof ToggleButtonModel
                && ancestors.some(m => m instanceof ToggleButtonGroupModel);
            if (!ancestorHandlesEvent) {
                childProps.onChange = () => {
                    model.set('selected', !model.get('selected'));
                    model.save_changes(model.callbacks(view));
                };
            }
        } else if (model.keys().includes('value')) {
            /* This widget uses value as main property which should be changed in the onChange callback. The new value
             * is, depending on the widget, stored in the event or value argument of the onChange callback.
             */
            childProps.onChange = (e, value) => {
                if (model instanceof ToggleButtonGroupModel || model instanceof TabsModel) {
                    model.set('value', value);
                } else if (e.target && e.target.value !== undefined) {
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
            return React.createElement(value.getReactComponent(), this.makeProps(value, ancestors));
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
        /* When any property of any backbone model this model hierarchy changes, re render the whole React virtual DOM.
         * First unregister all change callbacks from models previously rendered, then add change callbacks to all
         * models currently in the model hierarchy.
         */
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
                this._render(this.model, this),
            ),
            this.el,
        );
    }

    _render(model, view) {
        return React.createElement(TopComponent, { model, view });
    }

    remove() {
        ReactDOM.unmountComponentAtNode(this.el);
        return super.remove();
    }
}
