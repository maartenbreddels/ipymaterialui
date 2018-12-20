import * as React from 'react';
import * as widgets from '@jupyter-widgets/base';
import { ReactModel } from './react-widget';
import IconCircle from '@material-ui/icons/Brightness1'
import IconCircleBorder from '@material-ui/icons/Brightness1Outlined'

const icons = { 'circle': { 'filled': IconCircle, 'outlined': IconCircleBorder } }

class BackboneWidget extends React.Component {
    constructor(props) {
        super(props)
        this.model = props.model;
    }
    stateProps() {
        return { ...this.props, ...this.model.getProps(), children: this.model.getChildren() }

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

// using higher-order component pattern
function BasicWidget(Component) {
    return class extends BackboneWidget {
        render() {
            let { model, ...props } = this.stateProps();
            return <Component {...props}>{props.children}</Component>
        }
    }
}

function RemoveNull(Component, attributes) {
    return class extends BackboneWidget {
        render() {
            let { ...cleanProps } = this.props;
            attributes.forEach((attribute) => {
                if (cleanProps[attribute] === null)
                    delete cleanProps[attribute]
            })
            return <Component {...cleanProps}>{cleanProps.children}</Component>
        }
    }
}


function ClickHandler(Component) {
    return class extends BackboneWidget {
        onClickHandler = (event) => {
            this.props.model.send({ event: 'click' })
            if (this.props.onClick)
                this.props.onClick(event)
        }
        render() {
            return <Component {...this.props} onClick={this.onClickHandler}></Component>
        }
    }
}

function CheckedHandler(Component, attributeName = 'checked') {
    return class extends BackboneWidget {
        onChangeHandler = (event, value) => {
            this.props.model.set(attributeName, event.target.checked);
            this.props.model.save_changes()
            if (this.props.onChange)
                this.props.onChange(event, value)
        }
        render() {
            return <Component {...this.props} onChange={this.onChangeHandler}></Component>
        }
    }
}

function FixClickCapture(Component, attributeName = 'checked') {
    return class extends BackboneWidget {
        onClickHandler = (event, value) => {
            if (this.props.onClick)
                this.props.onClick(event, value)
        }
        onClickCaptureHandler = (event, value) => {
            if (this.props.clickFix)
                event.stopPropagation()
            // if(this.props.onClickCapture)
            //    this.props.onClickCapture(event, value)
        }
        render() {
            const { clickFix, ...props } = this.props;
            if (clickFix)
                return <div onClick={this.onClickHandler} onClickCapture={this.onClickCaptureHandler}><Component {...props} ></Component></div>
            else
                return <Component {...props} ></Component>
        }
    }
}


function ToggleHandler(Component, attributeName = 'selected') {
    return class extends BackboneWidget {
        onChangeHandler = (event, value) => {
            // only handle if the value is true/false
            // meaning None/null can be used for interal control
            if ((this.props.model.get(attributeName) === true) || (this.props.model.get(attributeName) === false)) {
                this.props.model.set(attributeName, !this.props.model.get(attributeName))
                this.props.model.save_changes();
            }
            if (this.props.onChange)
                this.props.onChange(event, value)
        }
        render() {
            return <Component {...this.props} onChange={this.onChangeHandler}></Component>
        }
    }
}

function ValueHandler(Component, attributeName = 'value') {
    return class extends BackboneWidget {
        onChangeHandler = (event, value) => {
            this.props.model.set(attributeName, value)
            this.props.model.save_changes()
            if (this.props.onChange)
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
    componentDidMount() {
        this.updateCallback = () => {
            this.forceUpdate()
        }
        this.props.menu.on('change', this.updateCallback)
    }

    componentWillUnmount() {
        this.props.menu.off('change', this.updateCallback)
    }

    render() {
        const { anchorEl } = this.state;
        const menuItems = this.props.menu.get('children').map((item, index) => {
            return item.createWrappedReactElement({
                onClick: event => this.handleMenuItemClick(event, index),
                key: item.cid
            })
        })
        // if we use this, instead of the JSX below, the onClick does not get passed through
        // const menu = this.props.menu.createWrappedReactElement(
        //     {children:menuItems, anchorEl:anchorEl, open: Boolean(anchorEl), onClose: this.handleClose, id: "lock-menu"}
        // )
        return (
            <div>
                {this.props.children.map((child, index) =>
                    React.cloneElement(child, {
                        key: index, onClick: (event) => {
                            this.handleClickListItem(event)
                        }
                    })
                )}
                {/* {menu} */}
                <Menu
                    model={this.props.menu}
                    id="lock-menu"
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={this.handleClose}
                >{menuItems
                    }</Menu>
            </div>
            /*
                */
        );
    }
}

function MenuHandler(Component) {
    return class extends BackboneWidget {
        render() {
            let { menu, ...props } = this.props;
            let component = <Component {...this.props}></Component>;
            // let menu = this.model.get('menu')
            if (menu) {
                return <MenuDecorator menu={menu}>{[component]}</MenuDecorator>
            } else {
                return component;
            }
        }
    }
}

function ToggleButtonGroupHandler(Component, attributeName = 'selected') {
    return class extends BackboneWidget {
        onChangeHandler = (event, value) => {
            if (value && value.props && value.props)
                value = value.props.value; // sometimes values is the widget
            this.props.model.set('value', value)
            this.props.model.save_changes()
            // MUI's ToggleButtonGroup's behaviour doesn't play well with how we do things
            // with the widgets. So we control the children ourselves
        }
        render() {
            let exclusive = this.props.model.get('exclusive')
            let value = this.props.model.get('value')
            let children = this.props.model.get('children') || [];
            children.forEach((child) => {
                if (child instanceof ToggleButtonModel) {
                    if (exclusive) {
                        child.set('selected', value === child.get('value'))
                    } else {
                        child.set('selected', value && value.indexOf(child.get('value')) !== -1)
                    }
                }
            })
            return <Component {...this.props} onChange={this.onChangeHandler}></Component>
        }
    }
}

function SelectHandler(Component) {
    return class extends BackboneWidget {
        onChangeHandler = (event, element) => {
            // if(value && value.props && value.props)
            //     value = value.props.value; // sometimes values is the widget
            this.props.model.set('value', event.target.value)
            this.props.model.save_changes()
        }
        render() {
            let multiple = this.props.model.get('multiple')
            let value = this.props.model.get('value')
            let children = this.props.model.get('children') || [];
            children.forEach((child) => {
                // if(child instanceof ToggleButtonModel) {
                if (multiple) {
                    child.set('selected', value && value.indexOf(child.get('value')) !== -1)
                } else {
                    child.set('selected', value === child.get('value'))
                }
                // }
            })
            return <Component {...this.props} onChange={this.onChangeHandler}></Component>
        }
    }
}
// function IndexValueHandler(Component, attributeName='value') {
//     return class extends BackboneWidget {
//         onChangeHandler = (event, value) => {
//             // if(value.props && value.props)
//             //     value = value.props.value; // sometimes values is the widget
//             // let exclusive = this.props.model.get('exclusive')
//             // let children = this.props.model.get('children');
//             // this.props.model.set('index', index)
//             this.props.model.set('value', value);//children[index].get('value'))
//             this.props.model.save_changes()
//             //  || [];
//             // children.forEach((child, childIndex) => {
//             //     const visible = index == childIndex;
//             //     child.set('visible', visible)
//             // })
//         }
//         render() {
//             return <Component {...this.props} onChange={this.onChangeHandler}></Component>
//         }   
//     }
// }


const ClickWidget = (c) => ClickHandler(BasicWidget(c))
const CheckedWidget = (c) => CheckedHandler(ClickWidget(c))
const ValueWidget = (c) => ValueHandler(BasicWidget(c))
// for some reason if we do ToggleHandler(ClickWidget(c)) it does not toggle
const ToggleWidget = (c) => ToggleHandler(BasicWidget(c))
const ToggleButtonGroupWidget = (c) => ToggleButtonGroupHandler(BasicWidget(c))

import Typography from '@material-ui/core/Typography';
class DivWithStyle extends React.Component {
    render() {
        return <Typography component="div"  {...this.props} />
    }
}

export
    class DivModel extends ReactModel {
    defaults = () => { return { ...super.defaults(), value: null, exclusive: false } };
    autoProps = ['value', 'exclusive']
    reactComponent = () => ClickWidget(DivWithStyle)
}


// Button
import Button from '@material-ui/core/Button';
export
    class ButtonModel extends ReactModel {
    defaults = () => { return { ...super.defaults(), value: null, exclusive: false } };
    autoProps = ['value', 'exclusive']
    reactComponent = () => ClickWidget(Button)
}

// Checkbox
import Checkbox from '@material-ui/core/Checkbox';
export
    class CheckboxModel extends ReactModel {
    autoProps = ['value', 'checked'];//, 'icon', 'checkedIcon']
    reactComponent = () => RemoveNull(CheckedWidget(Checkbox), ['icon', 'checkedIcon'])
}

// Chip
import Chip from '@material-ui/core/Chip';
export
    class ChipModel extends ReactModel {
    defaults = () => { return { ...super.defaults(), value: null } };
    autoProps = ['label']
    reactComponent = () => BasicWidget(Chip)
}

// ToggleButton
import ToggleButton from '@material-ui/lab/ToggleButton';
export
    class ToggleButtonModel extends ReactModel {
    defaults = () => { return { ...super.defaults(), value: null, selected: false } };
    autoProps = ['value', 'selected']
    reactComponent = () => ToggleWidget(ToggleButton)
}

// ToggleButtonGroup
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup';
export
    class ToggleButtonGroupModel extends ReactModel {
    defaults = () => { return { ...super.defaults(), value: null, exclusive: false } };
    autoProps = ['value', 'exclusive']
    reactComponent = () => ToggleButtonGroupWidget(ToggleButtonGroup)
}

// Radio
import Radio from '@material-ui/core/Radio';
export
    class RadioModel extends ReactModel {
    defaults = () => { return { ...super.defaults(), value: null, selected: false } };
    autoProps = ['value', 'selected']
    reactComponent = () => ToggleWidget(Radio)
}

// RadioGroup
import RadioGroup from '@material-ui/core/RadioGroup';
export
    class RadioGroupModel extends ReactModel {
    defaults = () => { return { ...super.defaults(), value: null, exclusive: false } };
    autoProps = ['value', 'exclusive']
    reactComponent = () => ToggleButtonGroupWidget(RadioGroup)
}

// Switch
import Switch from '@material-ui/core/Switch';
export
    class SwitchModel extends ReactModel {
    defaults = () => { return { ...super.defaults(), value: null, selected: false } };
    autoProps = ['value', 'checked']
    reactComponent = () => FixClickCapture(CheckedWidget(Switch))
}

// FormControlLabel
import FormControlLabel from '@material-ui/core/FormControlLabel';
export
    class FormControlLabelModel extends ReactModel {
    defaults = () => { return { ...super.defaults(), value: null, exclusive: false } };
    autoProps = ['control', 'label']
    widgetProps = ['control']
    // getProps() { 
    //     let props = super.getProps()
    //     props.control = props.control.createWrappedReactElement()
    // }
    reactComponent = () => BasicWidget(FormControlLabel)

}
FormControlLabelModel.serializers = {
    ...ReactModel.serializers,
    control: { deserialize: widgets.unpack_models },
};

// Menu
import Menu from '@material-ui/core/Menu';
export
    class MenuModel extends ReactModel {
    defaults = () => { return { ...super.defaults(), value: null, exclusive: false } };
    autoProps = []
    reactComponent = () => ClickWidget(Menu)
}
MenuModel.serializers = {
    ...ReactModel.serializers,
    items: { deserialize: widgets.unpack_models },
};

// MenuItem
import MenuItem from '@material-ui/core/MenuItem';
export
    class MenuItemModel extends ReactModel {
    defaults = () => { return { ...super.defaults(), value: null, click_fix: false } };
    autoProps = ['selected', 'value', 'clickFix']
    reactComponent = () => FixClickCapture(ClickHandler(ToggleHandler(BasicWidget(MenuItem))))
}

// List
import List from '@material-ui/core/List';
export
    class ListModel extends ReactModel {
    defaults = () => { return { ...super.defaults(), value: null, exclusive: false } };
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
    menu: { deserialize: widgets.unpack_models },
};

// ListItemText
import ListItemText from '@material-ui/core/ListItemText';
export
    class ListItemTextModel extends ReactModel {
    defaults = () => { return { ...super.defaults(), value: null, exclusive: false } };
    autoProps = ['primary', 'secondary']
    reactComponent = () => BasicWidget(ListItemText)
}

// Select
import Select from '@material-ui/core/Select';
export
    class SelectModel extends ReactModel {
    defaults = () => { return { ...super.defaults(), value: null, exclusive: false, autoWidth: true } };
    autoProps = ['value', 'multiple', 'autoWidth']
    reactComponent = () => SelectHandler(BasicWidget(Select))
}

// FormControl
import FormControl from '@material-ui/core/FormControl';
export
    class FormControlModel extends ReactModel {
    defaults = () => { return { ...super.defaults(), value: null, exclusive: false, fullWidth: true } };
    autoProps = ['fullWidth', 'required', 'label']
    reactComponent = () => BasicWidget(FormControl)
}

// InputLabel
import InputLabel from '@material-ui/core/InputLabel';
export
    class InputLabelModel extends ReactModel {
    defaults = () => { return { ...super.defaults(), value: null, exclusive: false } };
    autoProps = []
    reactComponent = () => BasicWidget(InputLabel)
}

// TextField
import TextField from '@material-ui/core/TextField';
export
    class TextFieldModel extends ReactModel {
    defaults = () => {
        return {
            ...super.defaults(), value: null, helperText: null, label: 'label', multiline: false,
            placeholder: null, required: false, rows: null, rowsMax: null, variant: 'standard'
        }
    };
    autoProps = ['value', 'helperText', 'label', 'multiline', 'placeholder', 'required', 'rows', 'rowsMax', 'variant']
    widgetProps = ['helperText']
    reactComponent = () => ValueWidget(TextField)
}

// Tabs
import Tabs from '@material-ui/core/Tabs';
export
    class TabsModel extends ReactModel {
    defaults = () => { return { ...super.defaults(), value: null, exclusive: false, autoWidth: true } };
    autoProps = ['value', 'multiple', 'autoWidth', 'scrollable']
    reactComponent = () => ValueWidget(Tabs)
}

import Tab from '@material-ui/core/Tab';
export
    class TabModel extends ReactModel {
    defaults = () => { return { ...super.defaults(), value: null, exclusive: false, autoWidth: true } };
    autoProps = ['label', 'value']
    reactComponent = () => BasicWidget(Tab)
}

// import SvgIcon from '@material-ui/core/SvgIcon';
// export
// class SvgIconModel extends ReactModel {
//     defaults = () => { return {...super.defaults(), value: null, exclusive: false, autoWidth: true} };
//     autoProps = ['width', 'height']
//     reactComponent = () => ClickWidget(SvgIcon)
// }


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


// import Icon from '@material-ui/core/Icon';

class IconWidget extends BackboneWidget {
    render() {
        let { name, type, ...props } = this.stateProps();
        const Component = icons[name][type];
        return <Component {...props}>{props.children}</Component>
    }
}
export
    class IconModel extends ReactModel {
    defaults = () => { return { ...super.defaults(), value: null, exclusive: false } };
    autoProps = ['name', 'type']
    reactComponent = () => IconWidget
}

