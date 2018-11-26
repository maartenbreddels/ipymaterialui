import * as React from 'react';
import * as widgets from '@jupyter-widgets/base';
import {ReactModel} from './react-widget';

class BackboneWidget extends React.Component {
    constructor(props) {
        super(props)
        this.model = props.model;
    }
    stateProps() {
        return {...this.props, ...this.model.getProps()}
        
    }
    componentDidMount() {
        this.updateCallback = () => {
            this.forceUpdate()
        }
        this.props.model.on('change', this.updateCallback)
    }
    
    componentWillUnmount() {
        this.props.model.off('change', this.updateCallback)
    }
}

function BasicWidget(Component) {
    return class extends BackboneWidget {
        render() {
            let {model, ...props } = this.stateProps();
            return <Component {...props}>{props.children}</Component>
        }   
    }
}

function ClickHandler(Component) {
    return class extends React.Component {
        onClickHandler = (event) => {
            this.props.model.send({event: 'click'})
            if(this.props.onClick)
                this.props.onClick(event)
        }
        render() {
            return <Component {...this.props} onClick={this.onClickHandler}></Component>
        }   
    }
}

function CheckedHandler(Component, attributeName='checked') {
    return class extends React.Component {
        onChangeHandler = (event, value) => {
            this.props.model.set(attributeName, event.target.checked);
            this.props.model.save_changes()
            if(this.props.onChange)
               this.props.onChange(event, value)
        }
        render() {
            return <Component {...this.props} onChange={this.onChangeHandler}></Component>
        }   
    }
}

function ToggleHandler(Component, attributeName='selected') {
    return class extends React.Component {
        onChangeHandler = (event, value) => {
            // only handle if the value is true/false
            // meaning None/null can be used for interal control
            if((this.props.model.get(attributeName) === true) || (this.props.model.get(attributeName) === false)) {
                this.props.model.set(attributeName, !this.props.model.get(attributeName))
                this.props.model.save_changes();
            }
            if(this.props.onChange)
                this.props.onChange(event, value)
        }
        render() {
            return <Component {...this.props} onChange={this.onChangeHandler}></Component>
        }   
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
                React.cloneElement(child, {key: index, onClick: (event) => {
                    this.handleClickListItem(event)
                }})
            )}
            <Menu
                id="lock-menu"
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={this.handleClose}
            >
            {this.props.items.map((item, index) => {
                return item.createWrappedReactElement({
                    onClick: event => this.handleMenuItemClick(event, index),
                    key: item.cid
                })
            })}
          </Menu>
        </div>
      );
    }
}

function MenuHandler(Component) {
    return class extends React.Component {
        render() {
            let {menu, ...props } = this.props;
            let component = <Component {...this.props}></Component>;
            // let menu = this.model.get('menu')
            if(menu) {
                return <MenuDecorator items={menu.get('children')}>{[component]}</MenuDecorator>
            } else {
                return component;
            }
        }   
    }
}

function ToggleButtonGroupHandler(Component, attributeName='selected') {
    return class extends React.Component {
        onChangeHandler = (event, value) => {
            if(value.props && value.props)
                value = value.props.value; // sometimes values is the widget
            let exclusive = this.props.model.get('exclusive')
            this.props.model.set('value', value)
            this.props.model.save_changes()
            // MUI's ToggleButtonGroup's behaviour doesn't play well with how we do things
            // with the widgets. So we control the children ourselves
            let children = this.props.model.get('children') || [];
            children.forEach((child) => {
                if(child instanceof ToggleButtonModel) {
                    if(exclusive) {
                        child.set('selected', value === child.get('value'))
                    } else {
                        child.set('selected', value && value.indexOf(child.get('value')) !== -1)
                    }
                }
            })
        }
        render() {
            return <Component {...this.props} onChange={this.onChangeHandler}></Component>
        }   
    }
}

const ClickWidget = (c) => ClickHandler(BasicWidget(c))
const CheckedWidget = (c) => CheckedHandler(ClickWidget(c))
// for some reason if we do ToggleHandler(ClickWidget(c)) it does not toggle
const ToggleWidget = (c) => ToggleHandler(BasicWidget(c))
const ToggleButtonGroupWidget = (c) => ToggleButtonGroupHandler(BasicWidget(c))

// Button
import Button from '@material-ui/core/Button';
export
class ButtonModel extends ReactModel {
    defaults = () => { return {...super.defaults(), value: null, exclusive: false} };
    autoProps = ['value', 'exclusive']
    reactComponent = () => ClickWidget(Button)
}

// Checkbox
import Checkbox from '@material-ui/core/Checkbox';
export
class CheckboxModel extends ReactModel {
    autoProps = ['value', 'checked']
    reactComponent = () => CheckedWidget(Checkbox)
}

// Chip
import Chip from '@material-ui/core/Chip';
export
class ChipModel extends ReactModel {
    defaults = () => { return {...super.defaults(), value: null} };
    autoProps = ['label']
    reactComponent = () => BasicWidget(Chip)
}

// ToggleButton
import ToggleButton from '@material-ui/lab/ToggleButton';
export
class ToggleButtonModel extends ReactModel {
    defaults = () => { return {...super.defaults(), value: null, selected: false} };
    autoProps = ['value', 'selected']
    reactComponent = () => ToggleWidget(ToggleButton)
}
ToggleButtonModel.serializers = {
    ...ReactModel.serializers,
    icon: {deserialize: widgets.unpack_models},
};


// ToggleButtonGroup
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup';
export
class ToggleButtonGroupModel extends ReactModel {
    defaults = () => { return {...super.defaults(), value: null, exclusive: false} };
    autoProps = ['value', 'exclusive']
    reactComponent = () => ToggleButtonGroupWidget(ToggleButtonGroup)
}

// Menu
import Menu from '@material-ui/core/Menu';
export 
class MenuModel extends ReactModel {
    defaults = () => { return {...super.defaults(), value: null, exclusive: false} };
    autoProps = ['open']
    reactComponent = () => ClickWidget(Menu)
}
MenuModel.serializers = {
    ...ReactModel.serializers,
    items: {deserialize: widgets.unpack_models},
};

// MenuItem
import MenuItem from '@material-ui/core/MenuItem';
export
class MenuItemModel extends ReactModel {
    autoProps = ['selected', 'value']
    reactComponent = () => ClickWidget(MenuItem)
}

// List
import List from '@material-ui/core/List';
export
class ListModel extends ReactModel {
    defaults = () => { return {...super.defaults(), value: null, exclusive: false} };
    autoProps = ['primary', 'secondary']
    reactComponent = () => BasicWidget(List)
}

// ListItem
import ListItem from '@material-ui/core/ListItem';
export
class ListItemModel extends ReactModel {
    autoProps = ['label', 'button', 'selected', 'menu']
    reactComponent = () => MenuHandler(BasicWidget(ListItem))
}
ListItemModel.serializers = {
    ...ReactModel.serializers,
    menu: {deserialize: widgets.unpack_models},
};

// ListItemText
import ListItemText from '@material-ui/core/ListItemText';
export
class ListItemTextModel extends ReactModel {
    defaults = () => { return {...super.defaults(), value: null, exclusive: false} };
    autoProps = ['primary', 'secondary']
    reactComponent = () => BasicWidget(ListItemText)
}

// Select
import Select from '@material-ui/core/Select';
export
class SelectModel extends ReactModel {
    defaults = () => { return {...super.defaults(), value: null, exclusive: false, autoWidth: true} };
    autoProps = ['value', 'multiple', 'autoWidth']
    reactComponent = () => ToggleButtonGroupHandler(BasicWidget(Select))
}

// FormControl
import FormControl from '@material-ui/core/FormControl';
export
class FormControlModel extends ReactModel {
    defaults = () => { return {...super.defaults(), value: null, exclusive: false, fullWidth: true} };
    autoProps = ['fullWidth', 'required', 'label']
    reactComponent = () => BasicWidget(FormControl)
}

// InputLabel
import InputLabel from '@material-ui/core/InputLabel';
export
class InputLabelModel extends ReactModel {
    defaults = () => { return {...super.defaults(), value: null, exclusive: false} };
    autoProps = []
    reactComponent = () => BasicWidget(InputLabel)
}


// // import IconButton from '@material-ui/core/IconButton';
// class IconButtonModel extends ReactModel {
//     createReactComponent() {
//         return <IconButton onClick={() => this.send({event: 'click'})}>{this.getChildWidgetComponent('icon')}</IconButton> 
//      }
// }
// IconButtonModel.serializers = {
//     ...ReactModel.serializers,
//     icon: {deserialize: widgets.unpack_models},
// };


// // import Icon from '@material-ui/core/Icon';
// class IconModel extends ReactModel {
//     defaults = () => { return {...super.defaults(), value: null, exclusive: false} };
//     autoProps = ['value', 'exclusive']
//     reactComponent = () => BasicWidget(Icon)
// }

