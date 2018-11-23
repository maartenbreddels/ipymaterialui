var widgets = require('@jupyter-widgets/base');
import {camelCase, snakeCase} from 'lodash';
import {
    unpack_models
} from '@jupyter-widgets/base';

var _ = require('lodash');
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import IconButton from '@material-ui/core/IconButton';
import Button from '@material-ui/core/Button';
import Icon from '@material-ui/core/Icon';


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

// this is a blackbox for react, but renders a jupyter widget
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

class BackboneWrapper extends React.Component {
    componentDidMount() {
        this.updateCallback = () => {
            this.forceUpdate()
        }
        this.props.model.on('change', this.updateCallback)
    }
    
    componentWillUnmount() {
        this.props.model.off('change', this.updateCallback)
    }
    
    render() {
        return this.props.model.createReactComponent();
    }   
}
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
    genProps() {
        let props = {};
        this.autoProps.forEach((key) => props[key] = this.get(snakeCase(key)))
        return props
    }
    createWrappedReactComponent(props) {
        return <BackboneWrapper model={this}></BackboneWrapper>
    }
    createReactComponent(props) {
        return React.createElement("h1", {}, "Just an empty React component view")
    }
    comp(name) {
        return this.getChildWidgetComponent(name)
    }
    getChildWidgetComponent(name) {
        let widget = this.get(name);
        if(!widget) return null;
        if(widget instanceof ReactModel) {
            return widget.createWrappedReactComponent()
        } else {
            console.log('no react widget, using blackbox')
            return <BlackboxWidget widget={widget}></BlackboxWidget>
        }
    }
    getChildWidgetComponentList(name) {
        let widgetList = this.get(name);
        return widgetList.map((widget) => {
            if(widget instanceof ReactModel) {
                return widget.createWrappedReactComponent()
            } else {
                console.error('not a react')
            }
        });
    }
}

ReactModel.serializers = {
    ...widgets.DOMWidgetModel.serializers,
    children: {deserialize: unpack_models},
};


var ReactView = widgets.DOMWidgetView.extend({
    render: function() {
        // this.model.on('change', this.react_render, this);
        this.app_element = document.createElement("div")
        this.react_render();
        this.el.appendChild(this.app_element)
    },

    react_render: function() {
        this.app = this.model.createWrappedReactComponent()
        ReactDOM.render(<FontSizeTheme>{this.app}</FontSizeTheme>, this.app_element);
    },

 });


 class ButtonModel extends ReactModel {
    createReactComponent() {
        return  <Button onClick={() => this.send({event: 'click'})}>
                    {[this.get('description'), ...this.getChildWidgetComponentList('children')]}
                </Button>
    }
}

class IconButtonModel extends ReactModel {
    createReactComponent() {
        return <IconButton onClick={() => this.send({event: 'click'})}>{this.getChildWidgetComponent('icon')}</IconButton> 
     }
}
IconButtonModel.serializers = {
    ...ReactModel.serializers,
    icon: {deserialize: unpack_models},
};

import ToggleButton from '@material-ui/lab/ToggleButton';
export
class ToggleButtonModel extends ReactModel {
    defaults = () => { return {...super.defaults(), value: null, selected: false} };
    autoProps = ['value', 'selected']
    createReactComponent() {
        return <ToggleButton {...this.genProps()}>
                {[this.getChildWidgetComponent('icon'), this.get('description'), ...this.getChildWidgetComponentList('children')]}
        </ToggleButton> 
     }
}
ToggleButtonModel.serializers = {
    ...ReactModel.serializers,
    icon: {deserialize: unpack_models},
};


import Checkbox from '@material-ui/core/Checkbox';
export
class CheckboxModel extends ReactModel {
    autoProps = ['value', 'checked']
    createReactComponent() {
        let handler = (event) => {
            this.set('checked', event.target.checked);
            this.save_changes()
        }
        handler = handler.bind(this)
        return <Checkbox {...this.genProps()}
                    onChange={handler}
                    color="default"
                >
                    {[this.get('description'), ...this.getChildWidgetComponentList('children')]}
               </Checkbox> 
     }
}

import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup';
export
class ToggleButtonGroupModel extends ReactModel {
    autoProps = ['value', 'exclusive']
    createReactComponent() {
        let value = this.get('value');
        return <ToggleButtonGroup {...this.genProps()} onChange={(event, value) => this.set('value', value)}>
                {[...this.getChildWidgetComponentList('children')]}
            </ToggleButtonGroup> 
     }
}
ToggleButtonGroupModel.serializers = {
    ...ReactModel.serializers,
    children: {deserialize: unpack_models},
};


class IconModel extends ReactModel {
    createReactComponent() {
       return React.createElement(Icon, {}, this.get('name')) 
    }
}


import Menu from '@material-ui/core/Menu';
export 
class MenuModel extends ReactModel {
    createReactComponent() {
        // const { anchorEl } = this.state;
        let children = this.getChildWidgetComponentList('children');
        return <Menu open={false} anchorEl={null}>
            {children}
        </Menu>
    //    return React.createElement(Menu, {}, this.get('name')) 
    }
}
MenuModel.serializers = {
    ...ReactModel.serializers,
    items: {deserialize: unpack_models},
};

import MenuItem from '@material-ui/core/MenuItem';
export
class MenuItemModel extends ReactModel {
    createReactComponent(props) {
        return <MenuItem selected={this.get('selected')} value={this.get('value')} {...props}>
                    {[...this.getChildWidgetComponentList('children'), this.get('description')]}
               </MenuItem>
    }
}


import List from '@material-ui/core/List';
export
class ListModel extends ReactModel {
    createReactComponent() {
        let value = this.get('value');
        console.log('value', value)
        return <List value={value} onChange={(event, value) => this.set('value', value)}>{
                this.getChildWidgetComponentList('children')}
                </List> 
     }
}


class MenuDecorator extends React.Component {
    state = {
      anchorEl: null,
      selectedIndex: 1,
    };
  
    handleClickListItem = event => {
      this.setState({ anchorEl: event.currentTarget });
    };
  
    handleMenuItemClick = (event, index) => {
      this.setState({ selectedIndex: index, anchorEl: null });
    };
  
    handleClose = () => {
      this.setState({ anchorEl: null });
    };
  
    render() {
      const { anchorEl } = this.state;
  
      return (
        <div>
            {this.props.children.map((child, index) => 
                React.cloneElement(child, {onClick: this.handleClickListItem})
            )}
            <Menu
                id="lock-menu"
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={this.handleClose}
            >
            {this.props.items.map((item, index) => {
                return item.createWrappedReactComponent({
                    onClick: event => this.handleMenuItemClick(event, index),
                    key: item.cid
                })
            })}
          </Menu>
        </div>
      );
    }
}

import ListItem from '@material-ui/core/ListItem';
export
class ListItemModel extends ReactModel {
    createReactComponent() {
        let listItem = <ListItem button={this.get('button')} selected={this.get('selected')} dense
                                 divider={this.get('divider')}
                            onClick={(event) => {
                                this.set('selected', !this.get('selected'))
                                this.save_changes()
                            }}
                        >
                            {[this.get('description'), ...this.getChildWidgetComponentList('children')]}
                        </ListItem> 
        let menu = this.get('menu');
        if(menu) {
            return <MenuDecorator items={menu.get('children')}>{[listItem]}</MenuDecorator>
        } else {
            return listItem;
        }
        
    
    }
}
ListItemModel.serializers = {
    ...ReactModel.serializers,
    menu: {deserialize: unpack_models},
};


import ListItemText from '@material-ui/core/ListItemText';
export
class ListItemTextModel extends ReactModel {
    createReactComponent() {
        return <ListItemText primary={this.get('primary')} secondary={this.get('secondary')} >{
                    this.getChildWidgetComponentList('children')}
                </ListItemText> 
    
    }
}
ListItemTextModel.serializers = {
    ...ReactModel.serializers,
    // primary: {deserialize: unpack_models},
    // secondary: {deserialize: unpack_models},
};

import Select from '@material-ui/core/Select';
export
class SelectModel extends ReactModel {
    autoProps = ['multiple', 'autoWidth']
    genProps() {
        let props = {};
        this.autoProps.forEach((key) => props[key] = this.get(snakeCase(key)))
        return props
    }
    createReactComponent() {
        let props = this.genProps()
        return <Select {...props} value={["1"]}>{
                    this.getChildWidgetComponentList('children')}
                </Select> 
    
    }
}


import Chip from '@material-ui/core/Chip';
export
class ChipModel extends ReactModel {
    defaults = () => { return {...super.defaults(), value: null} };
    autoProps = ['label']
    createReactComponent() {
        let props = this.genProps()
        return <Chip {...props}/>
    }
}

import FormControl from '@material-ui/core/FormControl';
export
class FormControlModel extends ReactModel {
    defaults = {...ReactModel.defaults, fullWidth:false, required: false}
    autoProps = ['fullWidth', 'required', 'label']
    genProps() {
        let props = {};
        this.autoProps.forEach((key) => props[key] = this.get(snakeCase(key)))
        return props
    }
    createReactComponent() {
        let props = this.genProps()
        return <FormControl {...props}>{
                    this.getChildWidgetComponentList('children')}
                </FormControl> 
    
    }
}

import InputLabel from '@material-ui/core/InputLabel';
export
class InputLabelModel extends ReactModel {
    defaults = {...ReactModel.defaults, fullWidth:false, required: false}
    autoProps = ['fullWidth', 'required', 'label']
    genProps() {
        let props = {};
        this.autoProps.forEach((key) => props[key] = this.get(snakeCase(key)))
        return props
    }
    createReactComponent() {
        let props = this.genProps()
        return <InputLabel {...props}>
                    {[this.get('description'), ...this.getChildWidgetComponentList('children')]}
                </InputLabel> 
    
    }
}


import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
    root: {
      width: '100%',
      maxWidth: 360,
      backgroundColor: theme.palette.background.paper,
    },
  });
  
class SimpleListMenu extends React.Component {
    state = {
      anchorEl: null,
      selectedIndex: 1,
    };
  
    handleClickListItem = event => {
      this.setState({ anchorEl: event.currentTarget });
    };
  
    handleMenuItemClick = (event, index) => {
      this.setState({ selectedIndex: index, anchorEl: null });
    };
  
    handleClose = () => {
      this.setState({ anchorEl: null });
    };
  
    render() {
      const { classes } = this.props;
      const { anchorEl } = this.state;
  
      return (
        <span>
          <List component="nav">
            <ListItem
              button
              aria-haspopup="true"
              aria-controls="lock-menu"
              aria-label={this.props.description}
              onClick={this.handleClickListItem}
            >
              <ListItemText
                primary={this.props.description}
                secondary={this.props.children[this.state.selectedIndex]}
              />
            </ListItem>
            <Menu
            id="lock-menu"
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={this.handleClose}
          >
            {this.props.items.map((item, index) => {
            //   <MenuItem
                // key={item}
                // disabled={index === 0}
                // selected={item.get()}
                // onClick={event => item.}
                // >
                return item.createWrappedReactComponent({
                    onClick: event => this.handleMenuItemClick(event, index),
                    key: item.cid
                })
            //   </MenuItem>
            })}
          </Menu>

          </List>
        </span>
      );
    }
}

SimpleListMenu.propTypes = {
    classes: PropTypes.object.isRequired,
};
let SimpleListMenuStyled = withStyles(styles)(SimpleListMenu);

class SimpleListMenuModel extends ReactModel {
    createReactComponent() {
        // const { anchorEl } = this.state;
        let menuItems = this.getChildWidgetComponentList('items');
        let options = this.get('items').map((item => item.get('description')))
        return <SimpleListMenu description={this.get('description')} items={this.get('items')}>
            {options}
        </SimpleListMenu>
    //    return React.createElement(Menu, {}, this.get('name')) 
    }
}
SimpleListMenuModel.serializers = {
    ...ReactModel.serializers,
    items: {deserialize: unpack_models},
    list_item: {deserialize: unpack_models},
};


// function() {
    let root_div = document.createElement('div')
    document.body.appendChild(root_div)
    ReactDOM.render(<FontSizeTheme/>, root_div);
// }

export {
    ReactModel, ReactView,
    ButtonModel, IconButtonModel, IconModel,
    SimpleListMenuModel,
    // ToggleButtonModel, ToggleButtonGroupModel
};
