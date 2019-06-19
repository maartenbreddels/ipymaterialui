import { DOMWidgetView} from '@jupyter-widgets/base';
import * as ReactDOM from "react-dom";
import {styleWrapper} from "../style_wrap_notebook";
import {ReactWidgetModel} from './generated/ReactWidget'
import _ from 'lodash'

import * as React from 'react';
import Icon from "@material-ui/core/Icon";
import * as icons from "@material-ui/icons";

class BackboneWidget extends React.Component {
    constructor(props) {
        super(props);
        console.log('got props', props.model.get('_model_name'), props, props.model.attributes);
        const model = this.props.model;
        console.log('constructror', model.get('_model_name'));
    }

    componentDidMount() {
        this.updateCallback = (...args) => {
            this.forceUpdate();
        };
        this.props.model.on('change', this.updateCallback)
    }

    componentWillUnmount() {
        this.props.model.off('change', this.updateCallback)
    }

    render() {
        const model = this.props.model;
        console.log(`rendering model: ${model.get('_model_name')}`);

        const snakeToCamel = (s) => {
            let result = s.replace(/_$/, '');
            if (result.startsWith('aria')) {
                return result.replace('_', '-');
            }
            result = result.replace(/_\w/g, (m) => m[1].toUpperCase() );
            return result;
        };

        const childProps = model.keys()
            .filter(k => !k.startsWith('_') && k !== 'layout' && model.get(k) != null)
            .reduce((accumulator, key) => {
                const v = (key === 'anchor_el')
                    ? document.querySelector(`[cid=${model.get(key).cid}]`)
                    : replaceModels(model.get(key));
                return {...accumulator, [snakeToCamel(key)]: v}
            }, {});

        if (model.keys().includes('checked')) {
            childProps['onChange'] = (e, checked) => {
                model.set('checked', checked);
                model.save_changes();
            }
        } else if (model.keys().includes('value')) {
            childProps['onChange'] = (e, value) => {
                console.log("value", value, e);
                if (React.isValidElement(value) || value === undefined) {
                    console.log('target', e.target.value);
                    model.set('value', e.target.value);
                } else {
                    model.set('value', value);
                }
                model.save_changes();
            }
        }

        (model.get('_events') || [])
            .forEach(eventStr => {
                console.log('adding events', eventStr);
                const [event, ...modifiers] = eventStr.split('|').map(s => s.trim());
                const existingFn = childProps[event];
                childProps[event] = (e, ...args) => {
                    console.log(e, args);
                    if (modifiers.includes('preventDefault')) {
                        e.preventDefault();
                    }
                    if (existingFn) {
                        existingFn(e, ...args)
                    }
                    model.send({ event, data: args});
                }
            });

        const newProps = _.merge(childProps, _.omit(this.props, 'model'));
        console.log('newProps', newProps);

        let comp = model.getReactComponent ? model.getReactComponent() : model.get('tag');
        if (comp === Icon) {
            comp = icons[model.get('children')];
        }

        return React.createElement(
            comp,
            newProps)
    }
}

function replaceModels(value) {
    if (Array.isArray(value)) {
        return value.map(e => replaceModels(e));
    } else if (value instanceof ReactWidgetModel) {
        return wrapBackbone(value);
    }
    return value;
}

function wrapBackbone(model) {
    return React.createElement(BackboneWidget, {
        model,
        key: model.cid,
        cid: model.cid,
        ...['ToggleButtonModel', 'MenuItemModel'].includes(model.name) && {value: model.get('value')},
        ...['MenuItemModel'].includes(model.name) && {children: replaceModels(model.get('children'))},
    });
}

export class ReactView extends DOMWidgetView {
    render() {
        super.render();
        console.log('render2', this.model.get('_model_name'));
        const el = document.createElement('div');
        const model = this.model;
        ReactDOM.render(
            styleWrapper(wrapBackbone(model)),
            el);
        this.el.appendChild(el);
    }
}
