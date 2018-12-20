import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as _ from 'lodash';
import {camelCase, snakeCase} from 'lodash';
import * as widgets from '@jupyter-widgets/base';

// TODO: this part should be notebook only, since its fontsize is non-16
// jupyter notebook (classical) fontfix
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';

const theme = createMuiTheme({
  typography: {
    // Tell Material-UI what the font-size on the html element is.
    htmlFontSize: 10,
    useNextVariants: true,
  },
});

function FontSizeTheme(props) {
  return (
    <MuiThemeProvider theme={theme}>
      <Typography component="span">{props.children}</Typography>
    </MuiThemeProvider>
  );
}

// TODO: move Material-UI specific parts (such as style) to subclass
export
class ReactModel extends widgets.DOMWidgetModel {
    // defaults: _.extend(widgets.DOMWidgetModel.prototype.defaults(), {
    defaults() {
        return _.extend(super.defaults(), {
            _model_name : 'ReactModel',
            _view_name : 'ReactView',
            _model_module : 'jupyter-materialui',
            _view_module : 'jupyter-materialui',
            _model_module_version : '0.1.0',
            _view_module_version : '0.1.0',
        })
    }
    autoProps = []
    reactComponent = () => Dummy
    getProps = () => { return {model:this, ...this.genProps()} }
    genProps(props) {
        let newProps = {};
        if(props)
            newProps = {...props};
        if(this.props) {
            this.props.forEach((key) => {
                if(!(key in this.autoProps)) {
                    console.console.warn('Property \"', key, '\" found in (React) props, but not marked as widget property');
                }
            })
        }
        const autoProps = ['style', ...this.autoProps]
        autoProps.forEach((key) => {
                let attribute_key = snakeCase(key);
            if(props && key in props) // sync back to backbone/widget
                this.set(attribute_key, props[key])
            newProps[key] = this.get(attribute_key)
            if(newProps[key] && this.widgetProps && this.widgetProps.indexOf(key) !== -1)
                newProps[key] = newProps[key].createWrappedReactElement()
        })
        return newProps
    }
    createWrappedReactElement(props) {
        // let comp = this.createReactComponent(props);
        // let usedProps = comp.props;
        // return <BackboneWrapper model={this} {...usedProps}></BackboneWrapper>
        return this.createReactElement(props)
    }
    createReactElement(baseProps) {
        // return React.createElement("h1", {}, "Just an empty React component view")
        let props = {...this.getProps(), ...baseProps}
        return React.createElement(this.reactComponent(), props, ...this.getChildren())
    }
    getChildren() {
        let children = [];
        // if(this.get('icon'))
        //     children.push(this.getChildWidgetComponent('icon'))
        if(this.get('description'))
            children.push(this.get('description'))
        if(this.get('content'))
            children.push(this.get('content'))
        if(this.get('child'))
            children.push(this.get('child').createWrappedReactElement())
        if(this.get('children'))
            children = children.concat(...this.getChildWidgetComponentList('children'))
        return children;
    }
    comp(name) {
        return this.getChildWidgetComponent(name)
    }
    getChildWidgetComponent(name) {
        let widget = this.get(name);
        if(!widget) return null;
        if(widget instanceof ReactModel) {
            return widget.createWrappedReactElement()
        } else {
            console.log('no react widget, using blackbox')
            return <BlackboxWidget widget={widget}></BlackboxWidget>
        }
    }
    getChildWidgetComponentList(name) {
        let widgetList = this.get(name);
        return widgetList.map((widget) => {
            if(widget instanceof ReactModel) {
                return widget.createWrappedReactElement({key: widget.cid})
            } else {
                return <BlackboxWidget widget={widget}></BlackboxWidget>
            }
        });
    }
}

ReactModel.serializers = {
    ...widgets.DOMWidgetModel.serializers,
    children: {deserialize: widgets.unpack_models},
    child: {deserialize: widgets.unpack_models},
    // icon: {deserialize: widgets.unpack_models},
    value: {deserialize: widgets.unpack_models},
    control: {deserialize: widgets.unpack_models},
};

export
var ReactView = widgets.DOMWidgetView.extend({
    render: function() {
        // this.model.on('change', this.react_render, this);
        this.root_element = document.createElement("div")
        this.react_render();
        this.el.appendChild(this.root_element)
    },

    react_render: function() {
        this.react_element = this.model.createWrappedReactElement({})
        ReactDOM.render(<FontSizeTheme>{this.react_element}</FontSizeTheme>, this.root_element);
        // this.app = this.model.createWrappedReactComponent()
        // ReactDOM.render(this.app, this.app_element);
    },

 });

// this is a black box for React, but renders a plain Jupyter DOMWidget
class BlackboxWidget extends React.Component {
    componentDidMount() {
        let widget = this.props.widget;
        let manager = widget.widget_manager;
        manager.create_view(widget).then((view) => {
            this.view = view;
            this.el.appendChild(this.view.el)
        });
    }
    
    componentWillUnmount() {
        // TODO: destroy the view?
    }
    
    render() {
        return <div ref={el => this.el = el} />;
    }   
}


