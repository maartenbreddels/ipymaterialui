var widgets = require('@jupyter-widgets/base');
var _ = require('lodash');
import * as React from 'react';
import * as ReactDOM from 'react-dom';
// import 'typeface-roboto';
import Button from '@material-ui/core/Button';


class Hello extends React.Component {
    constructor(props) {
      super(props);
      let model = props.model;
      this.state = model.attributes;
      model.on('change', () => {
          this.setState(model.attributes)
      })
    //   this.state = JSON.parse(JSON.stringify(props))
    //   this.setState(this.state)
      // this.state = {
      //   value: backbone.model.get("value")
      // };
    }
  
    // onChange(model) {
    //   this.setState(model.changed);
    // }
  
    componentDidMount() {
      // backbone.listenTo(backbone.model, "change", this.onChange.bind(this));
      this.setState(this.state)
    }
  
    render() {
      return React.createElement("h1", {}, `Hello ${this.state.value}`);
    }
  }

// Custom Model. Custom widgets models must at least provide default values
// for model attributes, including
//
//  - `_view_name`
//  - `_view_module`
//  - `_view_module_version`
//
//  - `_model_name`
//  - `_model_module`
//  - `_model_module_version`
//
//  when different from the base class.

/*
    <Button variant="contained" color="primary">
      Hello World
    </Button>
    */

// When serialiazing the entire widget state for embedding, only values that
// differ from the defaults will be specified.
var HelloModel = widgets.DOMWidgetModel.extend({
    defaults: _.extend(widgets.DOMWidgetModel.prototype.defaults(), {
        _model_name : 'HelloModel',
        _view_name : 'HelloView',
        _model_module : 'jupyter-materialui',
        _view_module : 'jupyter-materialui',
        _model_module_version : '0.1.0',
        _view_module_version : '0.1.0',
        value : 'Hello World'
    })
});


// Custom View. Renders the widget model.
var HelloView = widgets.DOMWidgetView.extend({
    render: function() {
        this.el.style.fontSize = '40px'
        this.model.on('change:value', this.value_changed, this);
        // this.model.on('change:value', this.on_change, this);
        this.app_element = document.createElement("div")
        // this.app = React.createElement(Button, {model: this.model})
        this.value_changed();
        // this.app = React.createElement(Button, {}, this.model.get('value'))
        // ReactDOM.render(this.app, this.app_element);
        this.el.appendChild(this.app_element)
    },

    // on_change: function() {
    //     this.app.setState(this.model.attributes);
    // },

    value_changed: function() {
        this.app = React.createElement(Button, {}, this.model.get('value'))
        ReactDOM.render(this.app, this.app_element);
        // this.el.textContent = this.model.get('value');
    }
});




export {
    HelloModel,
    HelloView
};
